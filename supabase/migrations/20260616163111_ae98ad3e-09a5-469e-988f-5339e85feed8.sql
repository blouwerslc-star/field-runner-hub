REVOKE EXECUTE ON FUNCTION public.email_queue_metrics() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_metrics() FROM anon;
GRANT EXECUTE ON FUNCTION public.email_queue_metrics() TO service_role;