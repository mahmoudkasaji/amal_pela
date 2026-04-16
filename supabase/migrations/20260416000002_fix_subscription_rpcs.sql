-- Fix 1: freeze/unfreeze/extend insert ledger with amount=0 violating CHECK(amount>0)
-- Fix 2: adjust_balance type mismatch (text vs ledger_type enum)

-- Allow amount=0 for informational ledger entries (freeze/unfreeze/extend are notes, not balance changes)
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_amount_check;
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_amount_check CHECK (amount >= 0);

-- Fix adjust_balance: explicit cast to ledger_type enum
CREATE OR REPLACE FUNCTION public.adjust_balance(
  p_trainee_id uuid,
  p_delta      integer,
  p_reason     text
)
RETURNS public.ledger_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_sub      public.subscriptions%rowtype;
  v_entry    public.ledger_entries%rowtype;
  v_balance  integer;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مسموح' USING errcode = 'P0001';
  END IF;
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'قيمة التعديل يجب ألا تكون صفراً' USING errcode = 'P0001';
  END IF;

  SELECT * INTO v_sub FROM public.subscriptions
   WHERE trainee_id = p_trainee_id AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'لا يوجد اشتراك فعّال' USING errcode = 'P0001';
  END IF;

  IF p_delta > 0 THEN
    UPDATE public.subscriptions
       SET total_sessions = total_sessions + p_delta
     WHERE id = v_sub.id;
  ELSE
    UPDATE public.subscriptions
       SET used_sessions = LEAST(total_sessions, used_sessions + abs(p_delta))
     WHERE id = v_sub.id;
  END IF;

  v_balance := public.current_balance(p_trainee_id) + p_delta;

  INSERT INTO public.ledger_entries
    (trainee_id, subscription_id, type, amount, reason, balance_after)
  VALUES (
    p_trainee_id,
    v_sub.id,
    CASE WHEN p_delta > 0 THEN 'credit'::ledger_type ELSE 'debit'::ledger_type END,
    abs(p_delta),
    COALESCE(NULLIF(p_reason, ''), CASE WHEN p_delta > 0 THEN 'إضافة يدوية' ELSE 'خصم يدوي' END),
    v_balance
  )
  RETURNING * INTO v_entry;

  RETURN v_entry;
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjust_balance(uuid, integer, text) TO authenticated;
