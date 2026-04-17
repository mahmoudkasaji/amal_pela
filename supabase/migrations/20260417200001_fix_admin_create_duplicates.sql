-- ════════════════════════════════════════════════════════════════════════════
-- Fix: duplicate `admin_create_trainee` / `admin_create_trainer` overloads
-- ────────────────────────────────────────────────────────────────────────────
-- المشكلة: بعد عدة migrations إصلاحية، بقيت نسختان من كل دالة بنفس أسماء
-- المعاملات لكن بترتيب مختلف. Supabase يرسل المعاملات بالاسم (named JSON)،
-- فيعجز Postgres عن اختيار overload واحدة ويرمي:
-- "Could not choose the best candidate function between: ..."
--
-- الحل: DROP كل الـ overloads الموجودة (القديمة + الجديدة) ثم CREATE نسخة
-- واحدة نهائية بالترتيب الذي يستخدمه rpc.ts حالياً.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1) Drop all admin_create_trainee overloads ────────────────────────────
-- OLD signature: (p_name, p_username, p_password, p_phone, p_email, p_gender, p_branch_id, p_level)
DROP FUNCTION IF EXISTS public.admin_create_trainee(text, text, text, text, text, gender_kind, uuid, skill_level);
-- NEW (post-fix) signature: (p_username, p_password, p_name, p_phone, p_gender, p_branch_id, p_level, p_email)
DROP FUNCTION IF EXISTS public.admin_create_trainee(text, text, text, text, gender_kind, uuid, skill_level, text);

-- ─── 2) Drop all admin_create_trainer overloads ────────────────────────────
-- OLD: (p_name, p_username, p_password, p_phone, p_email, p_specialty, p_branch_id)
DROP FUNCTION IF EXISTS public.admin_create_trainer(text, text, text, text, text, text, uuid);
-- NEW: (p_username, p_password, p_name, p_phone, p_specialty, p_branch_id, p_email)
DROP FUNCTION IF EXISTS public.admin_create_trainer(text, text, text, text, text, uuid, text);

-- ─── 3) Recreate admin_create_trainee — single canonical version ───────────
-- Parameter order matches what src/app/api/trainees.api.ts sends (by name,
-- so order is cosmetic but we keep it consistent with the NEW fix signature).
CREATE FUNCTION public.admin_create_trainee(
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

  -- Email اختياري — يُولَّد من username إن لم يُعطَ
  v_email := COALESCE(NULLIF(trim(p_email), ''), v_username || '@serene.local');

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email::citext) THEN
    RAISE EXCEPTION 'البريد الإلكتروني مسجّل بالفعل' USING errcode = 'P0001';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username::citext) THEN
    RAISE EXCEPTION 'اسم المستخدم مُستخدَم بالفعل' USING errcode = 'P0001';
  END IF;

  PERFORM public._create_auth_user(v_user_id, v_email, p_password, v_username);

  INSERT INTO public.profiles (id, role, name, email, phone, username)
  VALUES (v_user_id, 'trainee', trim(p_name), v_email, p_phone, v_username);

  INSERT INTO public.trainees (id, gender, branch_id, level)
  VALUES (v_user_id, p_gender, p_branch_id, p_level);

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_trainee(text, text, text, text, text, gender_kind, uuid, skill_level) TO authenticated;

-- ─── 4) Recreate admin_create_trainer — single canonical version ───────────
CREATE FUNCTION public.admin_create_trainer(
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

  v_email := COALESCE(NULLIF(trim(p_email), ''), v_username || '@serene.local');

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email::citext) THEN
    RAISE EXCEPTION 'البريد الإلكتروني مسجّل بالفعل' USING errcode = 'P0001';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username::citext) THEN
    RAISE EXCEPTION 'اسم المستخدم مُستخدَم بالفعل' USING errcode = 'P0001';
  END IF;

  PERFORM public._create_auth_user(v_user_id, v_email, p_password, v_username);

  INSERT INTO public.profiles (id, role, name, email, phone, username)
  VALUES (v_user_id, 'trainer', trim(p_name), v_email, p_phone, v_username);

  INSERT INTO public.trainers (id, specialty, branch_id)
  VALUES (v_user_id, p_specialty, p_branch_id);

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_trainer(text, text, text, text, text, text, uuid) TO authenticated;
