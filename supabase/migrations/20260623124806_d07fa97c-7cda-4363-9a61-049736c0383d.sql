
CREATE TABLE IF NOT EXISTS public.phone_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS phone_verification_codes_user_idx ON public.phone_verification_codes (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_verification_codes TO authenticated;
GRANT ALL ON public.phone_verification_codes TO service_role;
ALTER TABLE public.phone_verification_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own phone codes select" ON public.phone_verification_codes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own phone codes insert" ON public.phone_verification_codes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own phone codes update" ON public.phone_verification_codes FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.sms_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  phone text NOT NULL,
  body text NOT NULL,
  provider text,
  provider_message_id text,
  status text NOT NULL DEFAULT 'queued',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sms_send_log_user_idx ON public.sms_send_log (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS sms_send_log_notification_uniq ON public.sms_send_log (notification_id) WHERE notification_id IS NOT NULL;
GRANT SELECT ON public.sms_send_log TO authenticated;
GRANT ALL ON public.sms_send_log TO service_role;
ALTER TABLE public.sms_send_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sms log" ON public.sms_send_log FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.dispatch_sms_for_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _anon text;
  _url text;
BEGIN
  SELECT value INTO _url FROM public.app_settings WHERE key = 'sms_dispatcher_url' LIMIT 1;
  SELECT value INTO _anon FROM public.app_settings WHERE key = 'sms_dispatcher_apikey' LIMIT 1;
  IF _url IS NULL OR _anon IS NULL THEN
    RETURN NEW;
  END IF;
  PERFORM net.http_post(
    url := _url,
    headers := jsonb_build_object('Content-Type','application/json','apikey', _anon),
    body := jsonb_build_object('notification_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dispatch_sms ON public.notifications;
CREATE TRIGGER trg_dispatch_sms AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.dispatch_sms_for_notification();

INSERT INTO public.app_settings (key, value) VALUES
  ('sms_dispatcher_url', 'https://field-runner-hub.lovable.app/api/public/hooks/dispatch-sms'),
  ('sms_dispatcher_apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dWtpcnB4Z3B4cWNyc3pibm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDkyNTQsImV4cCI6MjA5NTI4NTI1NH0.IKjmsh4iqtVsGaN06Z4PueMEKxcIV0vn9DXyqNdOcgs')
ON CONFLICT (key) DO NOTHING;
