-- Subscription Expiry Automation
-- This function marks active subscriptions as expired when their end_date has passed.
-- It can be called manually or scheduled via pg_cron.

CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.subscriptions
     SET status = 'expired'
   WHERE status = 'active'
     AND end_date < current_date;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- To schedule automatic expiry with pg_cron (run once daily at midnight):
--
--   SELECT cron.schedule(
--     'expire-subscriptions',   -- job name
--     '0 0 * * *',              -- every day at 00:00
--     $$SELECT public.expire_subscriptions()$$
--   );
--
-- To remove the scheduled job:
--   SELECT cron.unschedule('expire-subscriptions');
--
-- To run manually:
--   SELECT public.expire_subscriptions();
