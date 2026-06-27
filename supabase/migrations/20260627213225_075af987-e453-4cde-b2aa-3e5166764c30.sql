
-- 1) Webhook event log (idempotency + replayability)
CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  event_id text NOT NULL,
  event_type text NOT NULL,
  environment text,
  payload jsonb,
  processed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'received',
  error_message text,
  UNIQUE (source, event_id)
);
GRANT ALL ON public.webhook_events TO service_role;
GRANT SELECT ON public.webhook_events TO authenticated;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read webhook_events" ON public.webhook_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Job runs (cron observability)
CREATE TABLE public.job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  result jsonb,
  error_message text
);
CREATE INDEX idx_job_runs_name_started ON public.job_runs(job_name, started_at DESC);
GRANT ALL ON public.job_runs TO service_role;
GRANT SELECT ON public.job_runs TO authenticated;
ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read job_runs" ON public.job_runs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Allow 'refunded' state on payments (no CHECK exists today; add one).
ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending','funded','released','paid','refunded','disputed','failed'));

-- 4) Dispute freezes payment: when a dispute is opened on a task,
--    flip any non-paid/non-refunded payment to 'disputed' so payout requests
--    and approval flows can guard on it.
CREATE OR REPLACE FUNCTION public.freeze_payment_on_dispute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status IN ('open','under_review') THEN
    UPDATE public.payments
       SET status = 'disputed', updated_at = now()
     WHERE task_id = NEW.task_id
       AND status IN ('funded','released');
  ELSIF TG_OP = 'UPDATE'
        AND NEW.status = 'resolved'
        AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Resolution unblocks payment back to 'released' (admin can mark paid/refunded after).
    UPDATE public.payments
       SET status = 'released', updated_at = now()
     WHERE task_id = NEW.task_id
       AND status = 'disputed'
       AND kind = 'task';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_freeze_payment_on_dispute ON public.disputes;
CREATE TRIGGER trg_freeze_payment_on_dispute
AFTER INSERT OR UPDATE OF status ON public.disputes
FOR EACH ROW EXECUTE FUNCTION public.freeze_payment_on_dispute();

-- 5) Helper to log webhook events idempotently
CREATE OR REPLACE FUNCTION public.record_webhook_event(
  _source text, _event_id text, _event_type text, _env text, _payload jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.webhook_events (source, event_id, event_type, environment, payload)
  VALUES (_source, _event_id, _event_type, _env, _payload);
  RETURN true;
EXCEPTION WHEN unique_violation THEN
  RETURN false;
END;
$$;
