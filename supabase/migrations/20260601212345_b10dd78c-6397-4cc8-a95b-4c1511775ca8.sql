CREATE TABLE public.profile_completion_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('first_nudge','second_nudge')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, stage)
);

CREATE INDEX idx_pce_user ON public.profile_completion_emails(user_id);

GRANT ALL ON public.profile_completion_emails TO service_role;

ALTER TABLE public.profile_completion_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reminder log"
  ON public.profile_completion_emails
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));