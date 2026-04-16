-- ════════════════════════════════════════════════════════════════════════════
-- Database integrity fixes — Phase 2
-- ────────────────────────────────────────────────────────────────────────────
-- 1) تحويل CASCADE إلى RESTRICT على الحجوزات
-- 2) تحويل ledger_entries.subscription_id إلى RESTRICT
-- 3) إضافة الفهارس المفقودة
-- 4) ربط sessions.type بـ session_types.name
-- 5) إصلاح ledger amount constraint (السماح بـ 0 لعمليات التجميد)
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1) bookings.trainee_id: CASCADE → RESTRICT ─────────────────────────────

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_trainee_id_fkey;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_trainee_id_fkey
  FOREIGN KEY (trainee_id) REFERENCES public.trainees(id) ON DELETE RESTRICT;

-- ─── 2) bookings.session_id: CASCADE → RESTRICT ────────────────────────────

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_session_id_fkey;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE RESTRICT;

-- ─── 3) ledger_entries.trainee_id: CASCADE → RESTRICT ──────────────────────

ALTER TABLE public.ledger_entries
  DROP CONSTRAINT IF EXISTS ledger_entries_trainee_id_fkey;

ALTER TABLE public.ledger_entries
  ADD CONSTRAINT ledger_entries_trainee_id_fkey
  FOREIGN KEY (trainee_id) REFERENCES public.trainees(id) ON DELETE RESTRICT;

-- ─── 4) ledger_entries.subscription_id: SET NULL → RESTRICT ─────────────────

ALTER TABLE public.ledger_entries
  DROP CONSTRAINT IF EXISTS ledger_entries_subscription_id_fkey;

ALTER TABLE public.ledger_entries
  ADD CONSTRAINT ledger_entries_subscription_id_fkey
  FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE RESTRICT;

-- ─── 5) Missing indexes ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sessions_branch
  ON public.sessions(branch_id);

CREATE INDEX IF NOT EXISTS idx_trainees_branch
  ON public.trainees(branch_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_package
  ON public.subscriptions(package_id);

CREATE INDEX IF NOT EXISTS idx_ledger_subscription
  ON public.ledger_entries(subscription_id);

-- ─── 6) sessions.type → FK to session_types.name ────────────────────────────

ALTER TABLE public.sessions
  ADD CONSTRAINT fk_session_type
  FOREIGN KEY (type) REFERENCES public.session_types(name)
  ON UPDATE CASCADE ON DELETE RESTRICT;

-- ─── 7) Fix ledger amount constraint to allow 0 (freeze/unfreeze entries) ───
-- القيد الأصلي amount > 0 تم تغييره في migration سابق إلى amount >= 0
-- نتأكد فقط أنه موجود بالشكل الصحيح

DO $$
BEGIN
  -- Drop the old constraint if it exists with the wrong check
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'ledger_entries_amount_check'
  ) THEN
    ALTER TABLE public.ledger_entries DROP CONSTRAINT ledger_entries_amount_check;
    ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_amount_check CHECK (amount >= 0);
  END IF;
END;
$$;
