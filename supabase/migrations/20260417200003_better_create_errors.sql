-- ════════════════════════════════════════════════════════════════════════════
-- Better error messages for admin_create_trainee/trainer
-- ────────────────────────────────────────────────────────────────────────────
-- المشكلة: إذا كان username موجود مسبقاً، الدالة تُولّد {username}@serene.local
-- الذي يتصادم أيضاً مع email موجود — فتظهر رسالة "البريد مسجّل" المُربكة.
-- الأصح: الفحص في الترتيب (1) username أولاً — لأنه المُدخَل الوحيد الذي
-- يتحكم به المستخدم مباشرة، (2) email فعلي صريح (إن أُدخل)، (3) email وهمي.
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.admin_create_trainee(
  p_name      text,
  p_username  text,
  p_password  text,
  p_phone     text DEFAULT NULL,
  p_email     text DEFAULT NULL,
  p_gender    gender_kind DEFAULT 'female',
  p_branch_id uuid DEFAULT NULL,
  p_level     skill_level DEFAULT 'beginner'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id  uuid := gen_random_uuid();
  v_username text := trim(p_username);
  v_email    text;
  v_email_provided boolean := (NULLIF(trim(p_email), '') IS NOT NULL);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مسموح' USING errcode = 'P0001';
  END IF;
  IF v_username IS NULL OR length(v_username) < 3 THEN
    RAISE EXCEPTION 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' USING errcode = 'P0001';
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'كلمة المرور يجب ألا تقل عن 6 أحرف' USING errcode = 'P0001';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'الاسم مطلوب' USING errcode = 'P0001';
  END IF;

  -- (1) فحص username أولاً — الحالة الأكثر شيوعاً
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username::citext) THEN
    RAISE EXCEPTION 'اسم المستخدم "%" مُستخدَم مسبقاً — اختر اسماً آخر', v_username USING errcode = 'P0001';
  END IF;

  -- توليد أو استخدام الـ email
  v_email := COALESCE(NULLIF(trim(p_email), ''), v_username || '@serene.local');

  -- (2) إذا أُدخل email صريح وموجود مسبقاً
  IF v_email_provided AND EXISTS (SELECT 1 FROM auth.users WHERE email = v_email::citext) THEN
    RAISE EXCEPTION 'البريد "%" مسجّل مسبقاً — استخدم بريداً آخر أو اترك الحقل فارغاً', v_email USING errcode = 'P0001';
  END IF;

  -- (3) إذا email وهمي مُولّد من username وكان موجود (حالة نادرة — تعني أن
  -- username متعارض لكن profiles ربما حُذف مع بقاء auth.users)
  IF NOT v_email_provided AND EXISTS (SELECT 1 FROM auth.users WHERE email = v_email::citext) THEN
    RAISE EXCEPTION 'اسم المستخدم "%" استُخدم سابقاً وبقي أثره في النظام — اختر اسماً آخر', v_username USING errcode = 'P0001';
  END IF;

  PERFORM public._create_auth_user(v_user_id, v_email, p_password, v_username);

  INSERT INTO public.profiles (id, role, name, email, phone, username)
  VALUES (v_user_id, 'trainee', trim(p_name), v_email, p_phone, v_username);

  INSERT INTO public.trainees (id, gender, branch_id, level)
  VALUES (v_user_id, p_gender, p_branch_id, p_level);

  RETURN v_user_id;
END;
$$;

-- Same treatment for admin_create_trainer
CREATE OR REPLACE FUNCTION public.admin_create_trainer(
  p_name      text,
  p_username  text,
  p_password  text,
  p_phone     text DEFAULT NULL,
  p_email     text DEFAULT NULL,
  p_specialty text DEFAULT NULL,
  p_branch_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id  uuid := gen_random_uuid();
  v_username text := trim(p_username);
  v_email    text;
  v_email_provided boolean := (NULLIF(trim(p_email), '') IS NOT NULL);
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مسموح' USING errcode = 'P0001';
  END IF;
  IF v_username IS NULL OR length(v_username) < 3 THEN
    RAISE EXCEPTION 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' USING errcode = 'P0001';
  END IF;
  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'كلمة المرور يجب ألا تقل عن 6 أحرف' USING errcode = 'P0001';
  END IF;
  IF p_name IS NULL OR length(trim(p_name)) < 2 THEN
    RAISE EXCEPTION 'الاسم مطلوب' USING errcode = 'P0001';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username::citext) THEN
    RAISE EXCEPTION 'اسم المستخدم "%" مُستخدَم مسبقاً — اختر اسماً آخر', v_username USING errcode = 'P0001';
  END IF;

  v_email := COALESCE(NULLIF(trim(p_email), ''), v_username || '@serene.local');

  IF v_email_provided AND EXISTS (SELECT 1 FROM auth.users WHERE email = v_email::citext) THEN
    RAISE EXCEPTION 'البريد "%" مسجّل مسبقاً — استخدم بريداً آخر أو اترك الحقل فارغاً', v_email USING errcode = 'P0001';
  END IF;

  IF NOT v_email_provided AND EXISTS (SELECT 1 FROM auth.users WHERE email = v_email::citext) THEN
    RAISE EXCEPTION 'اسم المستخدم "%" استُخدم سابقاً وبقي أثره في النظام — اختر اسماً آخر', v_username USING errcode = 'P0001';
  END IF;

  PERFORM public._create_auth_user(v_user_id, v_email, p_password, v_username);

  INSERT INTO public.profiles (id, role, name, email, phone, username)
  VALUES (v_user_id, 'trainer', trim(p_name), v_email, p_phone, v_username);

  INSERT INTO public.trainers (id, specialty, branch_id)
  VALUES (v_user_id, p_specialty, p_branch_id);

  RETURN v_user_id;
END;
$$;
