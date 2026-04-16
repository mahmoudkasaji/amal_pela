-- ════════════════════════════════════════════════════════════════════════════
-- Phase 4: admin_update_trainee + admin_update_trainer RPCs
-- ────────────────────────────────────────────────────────────────────────────
-- يحل محل الكتابة المباشرة على `profiles`/`trainees`/`trainers`
-- التي كانت تحدث من useDataStore.ts — يركز الأمان عبر طبقة RPC موحدة.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── admin_update_trainee ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_update_trainee(
  p_trainee_id uuid,
  p_name       text DEFAULT NULL,
  p_email      text DEFAULT NULL,
  p_phone      text DEFAULT NULL,
  p_status     account_status DEFAULT NULL,
  p_gender     gender_kind DEFAULT NULL,
  p_birth_date date DEFAULT NULL,
  p_branch_id  uuid DEFAULT NULL,
  p_level      skill_level DEFAULT NULL,
  p_notes      text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مسموح' USING errcode = 'P0001';
  END IF;

  -- update profiles (if any relevant fields provided)
  UPDATE public.profiles
     SET name   = COALESCE(p_name,   name),
         email  = COALESCE(NULLIF(p_email,  ''), email),
         phone  = COALESCE(p_phone,  phone),
         status = COALESCE(p_status, status)
   WHERE id = p_trainee_id
     AND role = 'trainee';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'المتدربة غير موجودة' USING errcode = 'P0001';
  END IF;

  -- update trainees satellite
  UPDATE public.trainees
     SET gender     = COALESCE(p_gender,     gender),
         birth_date = COALESCE(p_birth_date, birth_date),
         branch_id  = COALESCE(p_branch_id,  branch_id),
         level      = COALESCE(p_level,      level),
         notes      = COALESCE(p_notes,      notes)
   WHERE id = p_trainee_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_trainee(uuid, text, text, text, account_status, gender_kind, date, uuid, skill_level, text) TO authenticated;

-- ─── admin_update_trainer ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_update_trainer(
  p_trainer_id uuid,
  p_name       text DEFAULT NULL,
  p_email      text DEFAULT NULL,
  p_phone      text DEFAULT NULL,
  p_status     account_status DEFAULT NULL,
  p_specialty  text DEFAULT NULL,
  p_branch_id  uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مسموح' USING errcode = 'P0001';
  END IF;

  UPDATE public.profiles
     SET name   = COALESCE(p_name,   name),
         email  = COALESCE(NULLIF(p_email,  ''), email),
         phone  = COALESCE(p_phone,  phone),
         status = COALESCE(p_status, status)
   WHERE id = p_trainer_id
     AND role = 'trainer';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'المدربة غير موجودة' USING errcode = 'P0001';
  END IF;

  UPDATE public.trainers
     SET specialty = COALESCE(p_specialty, specialty),
         branch_id = COALESCE(p_branch_id, branch_id)
   WHERE id = p_trainer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_trainer(uuid, text, text, text, account_status, text, uuid) TO authenticated;
