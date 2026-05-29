
-- Runner application approval queue
ALTER TABLE public.field_runner_applications
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS admin_notes text;

ALTER TABLE public.field_runner_applications
  DROP CONSTRAINT IF EXISTS field_runner_applications_status_check;
ALTER TABLE public.field_runner_applications
  ADD CONSTRAINT field_runner_applications_status_check
  CHECK (status IN ('pending','approved','rejected'));

CREATE INDEX IF NOT EXISTS idx_field_runner_apps_status
  ON public.field_runner_applications(status, created_at DESC);

-- Runner ID document tracking
CREATE TABLE IF NOT EXISTS public.runner_id_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('front_id','back_id','selfie')),
  bucket text NOT NULL DEFAULT 'runner-ids',
  path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.runner_id_documents TO authenticated;
GRANT ALL ON public.runner_id_documents TO service_role;

ALTER TABLE public.runner_id_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own id docs"
  ON public.runner_id_documents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage id docs"
  ON public.runner_id_documents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER runner_id_documents_touch_updated_at
  BEFORE UPDATE ON public.runner_id_documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage policies for runner-ids bucket (private)
DROP POLICY IF EXISTS "Runners upload own ID files" ON storage.objects;
CREATE POLICY "Runners upload own ID files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'runner-ids' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Runners read own ID files" ON storage.objects;
CREATE POLICY "Runners read own ID files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'runner-ids' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Runners update own ID files" ON storage.objects;
CREATE POLICY "Runners update own ID files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'runner-ids' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Runners delete own ID files" ON storage.objects;
CREATE POLICY "Runners delete own ID files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'runner-ids' AND auth.uid()::text = (storage.foldername(name))[1]);
