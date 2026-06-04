DROP POLICY IF EXISTS "Availability blocks publicly readable" ON public.runner_availability_blocks;
CREATE POLICY "Authenticated users read availability blocks"
  ON public.runner_availability_blocks
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone reads templates" ON public.task_templates;
CREATE POLICY "Authenticated users read templates"
  ON public.task_templates
  FOR SELECT
  TO authenticated
  USING ((is_system = true) OR (owner_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));