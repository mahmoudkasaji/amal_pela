-- ════════════════════════════════════════════════════════════════════════════
-- Fix: email اختياري (يُولَّد من username إن لم يُعطَ)
--      username مطلوب (أساس تسجيل الدخول)
--      password مطلوب (≥6 أحرف)
--      pgcrypto في extensions schema
-- ════════════════════════════════════════════════════════════════════════════

-- أولاً: نُسقط الدوال القديمة لأن توقيع المعاملات تغيّر
DROP FUNCTION IF EXISTS public.admin_create_trainee(text, text, text, text, gender_kind, uuid, skill_level, text);
DROP FUNCTION IF EXISTS public.admin_create_trainer(text, text, text, text, text, uuid, text);

-- ─── Helper: إنشاء auth user ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public._create_auth_user(
  p_id       uuid,
  p_email    text,
  p_password text,
  p_username text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, extensions
AS $$
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_sso_user,
    confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current, reauthentication_token,
    phone, phone_confirmed_at
  ) VALUES (
    p_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('username', p_username),
    false,
    '', '', '', '', '', '',
    '', NULL
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    created_at, updated_at, last_sign_in_at
  ) VALUES (
    gen_random_uuid(),
    p_id,
    jsonb_build_object(
      'sub', p_id::text,
      'email', p_email,
      'email_verified', false,
      'phone_verified', false
    ),
    'email',
    p_id::text,
    now(), now(), now()
  );
END;
$$;

-- ─── admin_create_trainee ─────────────────────────────────────────────────
-- p_username: مطلوب (أساس الدخول)
-- p_password: مطلوب
-- p_email: اختياري (null = يُولَّد {username}@serene.local)
CREATE OR REPLACE FUNCTION public.admin_create_trainee(
  p_username  text,
  p_password  text,
  p_name      text,
  p_phone     text DEFAULT NULL,
  p_gender    gender_kind DEFAULT 'female',
  p_branch_id uuid DEFAULT NULL,
  p_level     skill_level DEFAULT 'beginner',
  p_email     text DEFAULT NULL
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

  -- Email: إن لم يُعطَ، نولّد واحداً وهمياً فريداً
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

GRANT EXECUTE ON FUNCTION public.admin_create_trainee(text, text, text, text, gender_kind, uuid, skill_level, text) TO authenticated;

-- ─── admin_create_trainer ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_create_trainer(
  p_username  text,
  p_password  text,
  p_name      text,
  p_phone     text DEFAULT NULL,
  p_specialty text DEFAULT NULL,
  p_branch_id uuid DEFAULT NULL,
  p_email     text DEFAULT NULL
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

GRANT EXECUTE ON FUNCTION public.admin_create_trainer(text, text, text, text, text, uuid, text) TO authenticated;
