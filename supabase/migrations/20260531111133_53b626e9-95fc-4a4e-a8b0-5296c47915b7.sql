
CREATE TABLE public.broadcast_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL,
  subject text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  provider_message_id text,
  sent_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.broadcast_sends TO authenticated;
GRANT ALL ON public.broadcast_sends TO service_role;

ALTER TABLE public.broadcast_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage broadcast sends"
  ON public.broadcast_sends FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_broadcast_sends_created_at ON public.broadcast_sends (created_at DESC);
CREATE INDEX idx_broadcast_sends_audience ON public.broadcast_sends (audience);
