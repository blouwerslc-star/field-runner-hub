
-- 1. Harden tasks UPDATE policy with WITH CHECK preventing runners from changing sensitive columns at the RLS layer
DROP POLICY IF EXISTS "Runners update assigned tasks" ON public.tasks;
CREATE POLICY "Runners update assigned tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (auth.uid() = runner_id)
WITH CHECK (
  auth.uid() = runner_id
  AND runner_id = (SELECT runner_id FROM public.tasks t WHERE t.id = tasks.id)
  AND investor_id IS NOT DISTINCT FROM (SELECT investor_id FROM public.tasks t WHERE t.id = tasks.id)
  AND payout_amount IS NOT DISTINCT FROM (SELECT payout_amount FROM public.tasks t WHERE t.id = tasks.id)
  AND title = (SELECT title FROM public.tasks t WHERE t.id = tasks.id)
  AND task_type = (SELECT task_type FROM public.tasks t WHERE t.id = tasks.id)
  AND property_address = (SELECT property_address FROM public.tasks t WHERE t.id = tasks.id)
  AND city = (SELECT city FROM public.tasks t WHERE t.id = tasks.id)
  AND state = (SELECT state FROM public.tasks t WHERE t.id = tasks.id)
  AND admin_notes IS NOT DISTINCT FROM (SELECT admin_notes FROM public.tasks t WHERE t.id = tasks.id)
  AND status IN ('in_progress', 'submitted')
);

-- 2. Lock down SECURITY DEFINER email helpers: fixed search_path + revoke from public/anon/authenticated
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
