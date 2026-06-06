-- Defense-in-depth: explicitly block non-owner, non-admin reads on runner_profiles
CREATE POLICY "Block non-owner non-admin reads on runner_profiles"
  ON public.runner_profiles
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));