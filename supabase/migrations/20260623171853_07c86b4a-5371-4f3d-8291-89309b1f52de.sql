-- Add diagnostic columns for signup failure logging
ALTER TABLE public.signup_attempts
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS error_code text,
  ADD COLUMN IF NOT EXISTS error_message text;

CREATE INDEX IF NOT EXISTS idx_signup_attempts_created_at
  ON public.signup_attempts (created_at DESC);

-- Allow admins to read signup_attempts (still blocks regular users via RESTRICTIVE policy below)
DROP POLICY IF EXISTS "Block non-service access to signup_attempts" ON public.signup_attempts;
CREATE POLICY "Block non-admin access to signup_attempts"
  ON public.signup_attempts
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read signup_attempts"
  ON public.signup_attempts
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT ON public.signup_attempts TO authenticated;