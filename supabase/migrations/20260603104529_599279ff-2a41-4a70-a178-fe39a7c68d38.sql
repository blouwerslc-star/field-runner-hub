-- Add explicit RESTRICTIVE policies to harden sensitive admin-only and service-only tables
-- against accidental future permissive grants.

-- broadcast_sends: admins only
CREATE POLICY "Restrict broadcast_sends to admins"
  ON public.broadcast_sends
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- facebook_leads: admins only
CREATE POLICY "Restrict facebook_leads to admins"
  ON public.facebook_leads
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- signup_attempts: service role only — block anon/authenticated explicitly
CREATE POLICY "Block non-service access to signup_attempts"
  ON public.signup_attempts
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
