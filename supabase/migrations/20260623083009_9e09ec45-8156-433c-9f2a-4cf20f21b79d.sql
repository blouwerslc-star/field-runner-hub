
-- Repoint cron to stable published URL (preview URL was 404ing for 2 hours)
SELECT cron.unschedule('process-email-queue');

SELECT cron.schedule(
  'process-email-queue',
  '5 seconds',
  $$
  SELECT CASE
    WHEN (SELECT retry_after_until FROM public.email_send_state WHERE id = 1) > now()
      THEN NULL
    WHEN EXISTS (SELECT 1 FROM pgmq.q_auth_emails LIMIT 1)
      OR EXISTS (SELECT 1 FROM pgmq.q_transactional_emails LIMIT 1)
      THEN net.http_post(
        url := 'https://project--9e7a2da0-3a6b-4d0d-ae89-c5b56e8e6594.lovable.app/lovable/email/queue/process?__lovable_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZW1haWwtY3JvbiIsInByb2plY3RfaWQiOiI5ZTdhMmRhMC0zYTZiLTRkMGQtYWU4OS1jNWI1NmU4ZTY1OTQiLCJhY2Nlc3NfdHlwZSI6InByb2plY3QiLCJpc3MiOiJsb3ZhYmxlLWFwaSIsInN1YiI6IjllN2EyZGEwLTNhNmItNGQwZC1hZTg5LWM1YjU2ZThlNjU5NCIsImF1ZCI6WyJsb3ZhYmxlLWFwcCJdLCJleHAiOjE3ODAzNDI0MDYsIm5iZiI6MTc4MDI1NjAwNiwiaWF0IjoxNzgwMjU2MDA2fQ.XwY7kvpOXfSU-CHaaJInAKnfFcwBjS8exyF41ObY19f7fh1I9PoMxT3H-79eDmWnuWhrDYXKCn5fDzN5kwRMq-xyIgc85AhxKYlKhrGm3z6luROjqCCe-rN84lHIaOMU6uiEwKpWlMAs9uzojVfVKZnbZDYcoDiZkpqmznfPZm7_LcJgxT94N3XItyIIdDDhxisxFHY-zz-DlX9xsnqGA26uivTOO1KlRf4qP9qrSL_gEtiXordewWkefNlr5cdJQ9CsaoH3cv5505o4zMExIK11NztPuZ7B7XM2erQbGHNBmChsh6VADDAw6GCI73u3DGU9BoIBmse014qTLH9iJnwwOA5hWUPkCUxRO-K90bmEnsX4zdlItbMkBH-mrAEx62LQeFRwaGK6ae-k8e0Oy1iOQ4cRHVz7OwqKDqBc_QkcjWGMmjDQCfrNqKb0RKvT8OQ_B7I04C6qsSPUh8J2x8UTRm1LW2JqL_gN5d1PbvH7YdWcFkTMo_w2AqrNFjG-bulGAcTx5JDEl9-ePXQMjyFS15agwUTEKrAPTvwdnQUC6H1zcFbHqkrp0sB1cfhe3v5dG_7f5ufuwRVWI7aE-U72PAH2bJ_o5wZrso6ymA3-S2uOfhunXIFBx_Sm1VXFZBoiTLNom-HzI7_JwQQX1dpI0JwhGYNBYOyt9QcydYE',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (
            SELECT decrypted_secret FROM vault.decrypted_secrets
            WHERE name = 'email_queue_service_role_key'
          )
        ),
        body := '{}'::jsonb
      )
    ELSE NULL
  END;
  $$
);

-- Requeue stuck DLQ messages back to main queues
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT msg_id, message FROM pgmq.q_transactional_emails_dlq LOOP
    PERFORM pgmq.send('transactional_emails', r.message);
    PERFORM pgmq.delete('transactional_emails_dlq', r.msg_id);
  END LOOP;
  FOR r IN SELECT msg_id, message FROM pgmq.q_auth_emails_dlq LOOP
    PERFORM pgmq.send('auth_emails', r.message);
    PERFORM pgmq.delete('auth_emails_dlq', r.msg_id);
  END LOOP;
END $$;
