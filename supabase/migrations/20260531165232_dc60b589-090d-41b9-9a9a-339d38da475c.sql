CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text,
  email text,
  role text,
  blocked boolean NOT NULL DEFAULT false,
  reason text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip_created
  ON public.signup_attempts (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_email_created
  ON public.signup_attempts (email, created_at DESC);

GRANT ALL ON public.signup_attempts TO service_role;

ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

-- No public/authenticated access. Only the service role (server functions
-- using supabaseAdmin) may read or write spam-protection records.
CREATE POLICY "Service role only"
  ON public.signup_attempts FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);