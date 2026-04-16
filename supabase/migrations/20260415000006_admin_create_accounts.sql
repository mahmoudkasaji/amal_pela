-- ════════════════════════════════════════════════════════════════════════════
-- Serene Studio — Admin CRUD helpers
-- ────────────────────────────────────────────────────────────────────────────
-- RPCs مخصّصة للإدارة:
--   • admin_create_trainee  — تُنشئ auth.user + profile + trainee
--   • admin_create_trainer  — تُنشئ auth.user + profile + trainer
--   • update_club_settings  — تحديث إعدادات النادي
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Helper داخلي: إنشاء auth.users + auth.identities بأسلوب GoTrue-compatible ─
create or replace function public._create_auth_user(
  p_id       uuid,
  p_email    text,
  p_password text,
  p_username text
)
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_sso_user,
    confirmation_token, recovery_token, email_change,
    email_change_token_new, email_change_token_current, reauthentication_token
  ) values (
    p_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('username', p_username),
    false,
    '', '', '', '', '', ''  -- GoTrue expects empty strings, not NULL
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    created_at, updated_at, last_sign_in_at
  ) values (
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
end;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- admin_create_trainee — إنشاء حساب متدربة جديد (Admin فقط)
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.admin_create_trainee(
  p_email     text,
  p_password  text,
  p_name      text,
  p_phone     text,
  p_gender    gender_kind,
  p_branch_id uuid,
  p_level     skill_level default 'beginner',
  p_username  text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := gen_random_uuid();
  v_username text := coalesce(nullif(trim(p_username), ''), split_part(p_email, '@', 1));
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;
  if p_email is null or length(p_email) < 5 then
    raise exception 'البريد الإلكتروني غير صحيح' using errcode = 'P0001';
  end if;
  if p_password is null or length(p_password) < 6 then
    raise exception 'كلمة المرور يجب ألا تقل عن 6 أحرف' using errcode = 'P0001';
  end if;
  if exists (select 1 from auth.users where email = p_email::citext) then
    raise exception 'البريد مسجّل بالفعل' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiles where username = v_username::citext) then
    raise exception 'اسم المستخدم مُستخدَم بالفعل' using errcode = 'P0001';
  end if;

  perform public._create_auth_user(v_user_id, p_email, p_password, v_username);

  insert into public.profiles (id, role, name, email, phone, username)
  values (v_user_id, 'trainee', p_name, p_email, p_phone, v_username);

  insert into public.trainees (id, gender, branch_id, level)
  values (v_user_id, p_gender, p_branch_id, p_level);

  return v_user_id;
end;
$$;

grant execute on function public.admin_create_trainee(text, text, text, text, gender_kind, uuid, skill_level, text) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- admin_create_trainer — إنشاء حساب مدربة جديد (Admin فقط)
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.admin_create_trainer(
  p_email     text,
  p_password  text,
  p_name      text,
  p_phone     text,
  p_specialty text,
  p_branch_id uuid,
  p_username  text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := gen_random_uuid();
  v_username text := coalesce(nullif(trim(p_username), ''), split_part(p_email, '@', 1));
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;
  if p_email is null or length(p_email) < 5 then
    raise exception 'البريد الإلكتروني غير صحيح' using errcode = 'P0001';
  end if;
  if p_password is null or length(p_password) < 6 then
    raise exception 'كلمة المرور يجب ألا تقل عن 6 أحرف' using errcode = 'P0001';
  end if;
  if exists (select 1 from auth.users where email = p_email::citext) then
    raise exception 'البريد مسجّل بالفعل' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiles where username = v_username::citext) then
    raise exception 'اسم المستخدم مُستخدَم بالفعل' using errcode = 'P0001';
  end if;

  perform public._create_auth_user(v_user_id, p_email, p_password, v_username);

  insert into public.profiles (id, role, name, email, phone, username)
  values (v_user_id, 'trainer', p_name, p_email, p_phone, v_username);

  insert into public.trainers (id, specialty, branch_id)
  values (v_user_id, p_specialty, p_branch_id);

  return v_user_id;
end;
$$;

grant execute on function public.admin_create_trainer(text, text, text, text, text, uuid, text) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- update_club_settings — تحديث الإعدادات العامة
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.update_club_settings(p_patch jsonb)
returns public.club_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.club_settings%rowtype;
begin
  if not public.is_admin() then
    raise exception 'غير مسموح' using errcode = 'P0001';
  end if;

  update public.club_settings
     set club_name            = coalesce((p_patch->>'club_name')::text,           club_name),
         email                = coalesce((p_patch->>'email')::text,               email),
         phone                = coalesce((p_patch->>'phone')::text,               phone),
         website              = coalesce((p_patch->>'website')::text,             website),
         cancellation_hours   = coalesce((p_patch->>'cancellation_hours')::int,   cancellation_hours),
         cancellation_message = coalesce((p_patch->>'cancellation_message')::text,cancellation_message),
         notification_prefs   = coalesce(p_patch->'notification_prefs',           notification_prefs),
         updated_at           = now()
   where id = 1
   returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.update_club_settings(jsonb) to authenticated;
