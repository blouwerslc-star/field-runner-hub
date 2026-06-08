-- Tighten runner_availability_blocks SELECT policy
DROP POLICY IF EXISTS "Authenticated users read availability blocks" ON public.runner_availability_blocks;

CREATE POLICY "Read own, assigned, or admin availability blocks"
ON public.runner_availability_blocks
FOR SELECT
TO authenticated
USING (
  auth.uid() = runner_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.runner_id = public.runner_availability_blocks.runner_id
      AND t.investor_id = auth.uid()
      AND t.status IN ('assigned','in_progress','submitted')
  )
);

-- Remove tasks from realtime publication (not used by client realtime subscribers)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tasks'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.tasks';
  END IF;
END$$;
