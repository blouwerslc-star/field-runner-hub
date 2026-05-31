CREATE OR REPLACE FUNCTION public.email_queue_metrics()
RETURNS TABLE(queue_name text, queue_length bigint, oldest_msg_age_sec bigint, total_messages bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pgmq
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
  SELECT m.queue_name::text, m.queue_length, m.oldest_msg_age_sec, m.total_messages
  FROM pgmq.metrics_all() m
  WHERE m.queue_name IN ('auth_emails', 'transactional_emails', 'auth_emails_dlq', 'transactional_emails_dlq');
END;
$$;

GRANT EXECUTE ON FUNCTION public.email_queue_metrics() TO authenticated;