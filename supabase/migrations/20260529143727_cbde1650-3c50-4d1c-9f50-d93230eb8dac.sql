
-- =========================
-- Conversations
-- =========================
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text
);

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- =========================
-- Participants
-- =========================
CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT to_timestamp(0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE INDEX idx_conv_participants_user ON public.conversation_participants(user_id);
CREATE INDEX idx_conv_participants_conv ON public.conversation_participants(conversation_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT ALL ON public.conversation_participants TO service_role;

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Helper: is the caller a participant in a given conversation?
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conv_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conv_id AND user_id = _user_id
  );
$$;

-- Conversation policies
CREATE POLICY "Participants view conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Participants update conversation" ON public.conversations
  FOR UPDATE TO authenticated
  USING (public.is_conversation_participant(id, auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Participant policies
CREATE POLICY "View participants of own conversations" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creator or admin adds participants" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
    OR user_id = auth.uid()
  );

CREATE POLICY "Users update own participant row" ON public.conversation_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users leave or admin removes participants" ON public.conversation_participants
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- Messages
-- =========================
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at);

GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Participants send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (public.is_conversation_participant(conversation_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role))
  );

-- =========================
-- Attachments
-- =========================
CREATE TABLE public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL,
  bucket text NOT NULL DEFAULT 'message-attachments',
  path text NOT NULL,
  filename text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_msg_att_msg ON public.message_attachments(message_id);

GRANT SELECT, INSERT, DELETE ON public.message_attachments TO authenticated;
GRANT ALL ON public.message_attachments TO service_role;

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view attachments" ON public.message_attachments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id
        AND (public.is_conversation_participant(m.conversation_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Uploader inserts attachments" ON public.message_attachments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Uploader or admin deletes attachments" ON public.message_attachments
  FOR DELETE TO authenticated
  USING (auth.uid() = uploader_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- Trigger: bump conversation + notify other participants
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sender_name text;
BEGIN
  UPDATE public.conversations
     SET updated_at = now(),
         last_message_at = NEW.created_at,
         last_message_preview = left(NEW.body, 140)
   WHERE id = NEW.conversation_id;

  SELECT COALESCE(full_name, email, 'Someone') INTO sender_name
    FROM public.profiles WHERE user_id = NEW.sender_id LIMIT 1;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  SELECT p.user_id,
         'message_received',
         'New message from ' || COALESCE(sender_name, 'a user'),
         left(NEW.body, 140),
         '/messages/' || NEW.conversation_id
    FROM public.conversation_participants p
   WHERE p.conversation_id = NEW.conversation_id
     AND p.user_id <> NEW.sender_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_insert
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- updated_at touches
CREATE TRIGGER touch_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- Storage bucket for attachments
-- =========================
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own message attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own message attachment files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins read any message attachment files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'message-attachments' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Uploader deletes own message attachment files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
