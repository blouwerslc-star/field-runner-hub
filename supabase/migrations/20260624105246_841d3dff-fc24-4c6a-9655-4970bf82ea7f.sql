
INSERT INTO public.app_settings (key, value)
VALUES ('hook_secret', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

UPDATE public.app_settings
   SET value = (SELECT value FROM public.app_settings WHERE key = 'hook_secret')
 WHERE key = 'sms_dispatcher_apikey';

ALTER FUNCTION public.haversine_ft(numeric, numeric, numeric, numeric) SET search_path = public;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon;', r.proname, r.args);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_override_task_completion(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_metrics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sweep_stale_tracking(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

DROP POLICY IF EXISTS "Conversation participants read message attachment files" ON storage.objects;
CREATE POLICY "Conversation participants read message attachment files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1
      FROM public.message_attachments ma
      JOIN public.messages m ON m.id = ma.message_id
     WHERE ma.path = storage.objects.name
       AND public.is_conversation_participant(m.conversation_id, auth.uid())
  )
);
