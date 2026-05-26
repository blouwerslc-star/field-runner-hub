
-- All three tables are written exclusively by server functions using the service role,
-- which bypasses RLS. Add explicit restrictive policies so clients (anon/authenticated)
-- cannot read or modify rows directly via the API.

-- app_settings
CREATE POLICY "No client access to app_settings"
  ON public.app_settings
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- field_runner_applications (contains PII)
CREATE POLICY "No client access to field_runner_applications"
  ON public.field_runner_applications
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- real_estate_pro_applications (contains PII)
CREATE POLICY "No client access to real_estate_pro_applications"
  ON public.real_estate_pro_applications
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
