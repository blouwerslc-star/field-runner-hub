CREATE TABLE public.runner_eligibility_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('verification','academy')),
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  send_count integer NOT NULL DEFAULT 1,
  UNIQUE (user_id, kind)
);
GRANT SELECT ON public.runner_eligibility_reminders TO authenticated;
GRANT ALL ON public.runner_eligibility_reminders TO service_role;
ALTER TABLE public.runner_eligibility_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reminder records" ON public.runner_eligibility_reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX ON public.runner_eligibility_reminders (kind, last_sent_at);