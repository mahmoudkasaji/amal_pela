-- Fix: pgcrypto lives in 'extensions' schema on Supabase Hosted.
-- _create_auth_user needs it in search_path to use crypt() and gen_salt().

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
