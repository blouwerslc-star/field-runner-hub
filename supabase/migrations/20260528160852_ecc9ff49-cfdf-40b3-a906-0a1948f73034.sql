
-- =========================================================
-- Extend existing tables
-- =========================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS funded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS funding_payment_id uuid;

-- =========================================================
-- runner_profiles
-- =========================================================
CREATE TABLE IF NOT EXISTS public.runner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_account_id text,
  payouts_enabled boolean NOT NULL DEFAULT false,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.runner_profiles TO authenticated;
GRANT ALL ON public.runner_profiles TO service_role;

ALTER TABLE public.runner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Runners view own runner profile"
  ON public.runner_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Runners insert own runner profile"
  ON public.runner_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Runners update own runner profile"
  ON public.runner_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins manage runner profiles"
  ON public.runner_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER runner_profiles_touch_updated_at
  BEFORE UPDATE ON public.runner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- task_submissions
-- =========================================================
CREATE TABLE IF NOT EXISTS public.task_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  runner_id uuid NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_submissions_task ON public.task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_runner ON public.task_submissions(runner_id);

GRANT SELECT, INSERT, UPDATE ON public.task_submissions TO authenticated;
GRANT ALL ON public.task_submissions TO service_role;

ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Runners view own submissions"
  ON public.task_submissions FOR SELECT TO authenticated
  USING (auth.uid() = runner_id);
CREATE POLICY "Investors view submissions on own tasks"
  ON public.task_submissions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.investor_id = auth.uid()));
CREATE POLICY "Runners create own submissions on assigned tasks"
  ON public.task_submissions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = runner_id
    AND EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.runner_id = auth.uid())
  );
CREATE POLICY "Runners update own pending submissions"
  ON public.task_submissions FOR UPDATE TO authenticated
  USING (auth.uid() = runner_id AND status = 'pending');
CREATE POLICY "Admins manage submissions"
  ON public.task_submissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER task_submissions_touch_updated_at
  BEFORE UPDATE ON public.task_submissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- task_files
-- =========================================================
CREATE TABLE IF NOT EXISTS public.task_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  submission_id uuid REFERENCES public.task_submissions(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL,
  bucket text NOT NULL,
  path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  kind text NOT NULL DEFAULT 'other', -- photo | video | id | deliverable | other
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_files_task ON public.task_files(task_id);
CREATE INDEX IF NOT EXISTS idx_task_files_submission ON public.task_files(submission_id);

GRANT SELECT, INSERT, DELETE ON public.task_files TO authenticated;
GRANT ALL ON public.task_files TO service_role;

ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Uploader views own files"
  ON public.task_files FOR SELECT TO authenticated
  USING (auth.uid() = uploader_id);
CREATE POLICY "Task investor views task files"
  ON public.task_files FOR SELECT TO authenticated
  USING (
    task_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.investor_id = auth.uid())
  );
CREATE POLICY "Assigned runner views task files"
  ON public.task_files FOR SELECT TO authenticated
  USING (
    task_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.runner_id = auth.uid())
  );
CREATE POLICY "Users insert own files"
  ON public.task_files FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Uploader deletes own files"
  ON public.task_files FOR DELETE TO authenticated
  USING (auth.uid() = uploader_id);
CREATE POLICY "Admins manage all files"
  ON public.task_files FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- payments
-- =========================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  investor_id uuid,
  runner_id uuid,
  amount_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  runner_payout_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending', -- pending | charged | released | refunded | failed
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  stripe_checkout_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_task ON public.payments(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_investor ON public.payments(investor_id);
CREATE INDEX IF NOT EXISTS idx_payments_runner ON public.payments(runner_id);
CREATE INDEX IF NOT EXISTS idx_payments_pi ON public.payments(stripe_payment_intent_id);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors view own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = investor_id);
CREATE POLICY "Runners view own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = runner_id);
CREATE POLICY "Admins manage payments"
  ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER payments_touch_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- notifications
-- =========================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users mark own notifications read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins manage notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Notification triggers
-- =========================================================
CREATE OR REPLACE FUNCTION public.notify_task_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Newly assigned to a runner
  IF TG_OP = 'UPDATE'
     AND NEW.runner_id IS NOT NULL
     AND (OLD.runner_id IS DISTINCT FROM NEW.runner_id) THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.runner_id, 'task_assigned', 'New task assigned',
            COALESCE(NEW.title,'A task') || ' — ' || COALESCE(NEW.city,'') ,
            '/dashboard/runner');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_notify_change ON public.tasks;
CREATE TRIGGER tasks_notify_change
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_change();

CREATE OR REPLACE FUNCTION public.notify_submission_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t_investor uuid;
  t_title text;
BEGIN
  SELECT investor_id, title INTO t_investor, t_title FROM public.tasks WHERE id = NEW.task_id;

  IF TG_OP = 'INSERT' AND t_investor IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (t_investor, 'submission_received', 'New submission to review',
            COALESCE(t_title,'A task') || ' has a new submission',
            '/dashboard/investor');
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.runner_id, 'submission_approved', 'Submission approved',
              COALESCE(t_title,'Your task') || ' was approved. Payment is being released.',
              '/dashboard/runner');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.runner_id, 'submission_rejected', 'Submission needs changes',
              COALESCE(NEW.rejection_reason, 'Please review and resubmit.'),
              '/dashboard/runner');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS submissions_notify_change ON public.task_submissions;
CREATE TRIGGER submissions_notify_change
  AFTER INSERT OR UPDATE ON public.task_submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_submission_change();

REVOKE EXECUTE ON FUNCTION public.notify_task_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_submission_change() FROM PUBLIC, anon, authenticated;

-- =========================================================
-- Realtime
-- =========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =========================================================
-- Storage buckets + policies
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('task-photos', 'task-photos', false),
  ('task-deliverables', 'task-deliverables', false),
  ('runner-ids', 'runner-ids', false),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- avatars: public read, owner writes (path prefix = user_id)
CREATE POLICY "Avatars public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- task-photos & task-deliverables: path = {task_id}/{user_id}/{filename}
-- Uploader writes; uploader, task investor, assigned runner, and admins read.
CREATE POLICY "Task assets uploader insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('task-photos', 'task-deliverables')
    AND auth.uid()::text = (storage.foldername(name))[2]
  );
CREATE POLICY "Task assets read by participants"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('task-photos', 'task-deliverables')
    AND (
      auth.uid()::text = (storage.foldername(name))[2]
      OR public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id::text = (storage.foldername(name))[1]
          AND (t.investor_id = auth.uid() OR t.runner_id = auth.uid())
      )
    )
  );
CREATE POLICY "Task assets uploader delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('task-photos', 'task-deliverables')
    AND (auth.uid()::text = (storage.foldername(name))[2] OR public.has_role(auth.uid(), 'admin'))
  );

-- runner-ids: path = {user_id}/{filename}; owner + admin only
CREATE POLICY "Runner IDs owner read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'runner-ids'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
  );
CREATE POLICY "Runner IDs owner write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'runner-ids' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Runner IDs owner update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'runner-ids' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Runner IDs owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'runner-ids'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
  );
