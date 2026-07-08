
CREATE TABLE public.runner_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL,
  email_norm text GENERATED ALWAYS AS (lower(trim(email))) STORED,
  phone text,
  city text,
  state text,
  market text,
  notes text,
  source text NOT NULL DEFAULT 'waitlist_page',
  user_agent text,
  referrer text
);

CREATE UNIQUE INDEX runner_waitlist_email_norm_key ON public.runner_waitlist (email_norm);

GRANT INSERT ON public.runner_waitlist TO anon;
GRANT INSERT ON public.runner_waitlist TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.runner_waitlist TO authenticated;
GRANT ALL ON public.runner_waitlist TO service_role;

ALTER TABLE public.runner_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.runner_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view waitlist"
  ON public.runner_waitlist
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update waitlist"
  ON public.runner_waitlist
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete waitlist"
  ON public.runner_waitlist
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
