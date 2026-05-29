
-- ============== PROFILES additions ==============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS identity_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_check_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS repeat_client_count integer NOT NULL DEFAULT 0;

-- ============== REVIEWS ==============
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  direction text NOT NULL CHECK (direction IN ('investor_to_runner','runner_to_investor')),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, reviewer_id, reviewee_id)
);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are publicly readable"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users create reviews on their completed tasks"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND (
          (direction = 'investor_to_runner' AND t.investor_id = auth.uid() AND t.runner_id = reviewee_id)
          OR (direction = 'runner_to_investor' AND t.runner_id = auth.uid() AND t.investor_id = reviewee_id)
        )
        AND t.status IN ('completed','approved','submitted')
    )
  );

CREATE POLICY "Reviewers update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Admins manage reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_reviews_touch
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Recompute reviewee aggregate rating
CREATE OR REPLACE FUNCTION public.recompute_profile_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid := COALESCE(NEW.reviewee_id, OLD.reviewee_id);
  avg_r numeric;
  cnt int;
BEGIN
  SELECT COALESCE(AVG(rating),0)::numeric(3,2), COUNT(*)
    INTO avg_r, cnt
    FROM public.reviews
   WHERE reviewee_id = target_user;
  UPDATE public.profiles
     SET average_rating = avg_r,
         review_count = cnt,
         updated_at = now()
   WHERE user_id = target_user;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.reviewee_id, 'review_received',
            'You received a ' || NEW.rating || '-star review',
            COALESCE(left(NEW.comment, 140), 'Tap to view your reviews.'),
            '/profile/edit');
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_reviews_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.recompute_profile_rating();

-- ============== TASK APPLICATIONS ==============
CREATE TABLE IF NOT EXISTS public.task_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  runner_id uuid NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, runner_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_applications TO authenticated;
GRANT ALL ON public.task_applications TO service_role;

ALTER TABLE public.task_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Runners view own applications"
  ON public.task_applications FOR SELECT TO authenticated
  USING (auth.uid() = runner_id);

CREATE POLICY "Investors view applications on own tasks"
  ON public.task_applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.investor_id = auth.uid()));

CREATE POLICY "Admins view all applications"
  ON public.task_applications FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Runners apply to tasks"
  ON public.task_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = runner_id AND has_role(auth.uid(),'runner'::app_role));

CREATE POLICY "Runners withdraw own applications"
  ON public.task_applications FOR UPDATE TO authenticated
  USING (auth.uid() = runner_id);

CREATE POLICY "Investors update applications on own tasks"
  ON public.task_applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.investor_id = auth.uid()));

CREATE POLICY "Admins manage applications"
  ON public.task_applications FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_task_applications_touch
  BEFORE UPDATE ON public.task_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.notify_task_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE inv uuid; ttitle text;
BEGIN
  SELECT investor_id, title INTO inv, ttitle FROM public.tasks WHERE id = NEW.task_id;
  IF TG_OP = 'INSERT' AND inv IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (inv, 'task_application',
            'New application for ' || COALESCE(ttitle,'your task'),
            'A runner applied to your task.',
            '/dashboard/investor');
  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.runner_id, 'application_approved',
              'Your application was approved',
              'You were selected for ' || COALESCE(ttitle,'a task') || '.',
              '/dashboard/runner');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (NEW.runner_id, 'application_rejected',
              'Application not selected',
              COALESCE(ttitle,'A task') || ' was assigned to someone else.',
              '/dashboard/runner');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_task_applications_notify
AFTER INSERT OR UPDATE ON public.task_applications
FOR EACH ROW EXECUTE FUNCTION public.notify_task_application();

-- ============== SAVED TASKS ==============
CREATE TABLE IF NOT EXISTS public.saved_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id)
);

GRANT SELECT, INSERT, DELETE ON public.saved_tasks TO authenticated;
GRANT ALL ON public.saved_tasks TO service_role;

ALTER TABLE public.saved_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved tasks"
  ON public.saved_tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============== TASK TEMPLATES ==============
CREATE TABLE IF NOT EXISTS public.task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  is_system boolean NOT NULL DEFAULT false,
  name text NOT NULL,
  task_type text NOT NULL,
  title text NOT NULL,
  description text,
  default_payout numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.task_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_templates TO authenticated;
GRANT ALL ON public.task_templates TO service_role;

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads templates"
  ON public.task_templates FOR SELECT
  TO anon, authenticated
  USING (is_system = true OR owner_id = auth.uid() OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Users manage own templates"
  ON public.task_templates FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND is_system = false);

CREATE POLICY "Admins manage all templates"
  ON public.task_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_task_templates_touch
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed 8 system templates
INSERT INTO public.task_templates (is_system, name, task_type, title, description, default_payout) VALUES
  (true, 'Property Photos', 'photos', 'Property Photos', 'Capture 15-25 high-quality exterior and interior photos of the property. Include front, sides, back, street view, and any notable features.', 50),
  (true, 'Walkthrough Video', 'video', 'Walkthrough Video', 'Record a steady 2-5 minute walkthrough video covering all rooms, exterior, and key conditions. Narration appreciated.', 75),
  (true, 'Occupancy Check', 'occupancy_check', 'Occupancy Check', 'Verify whether the property is occupied or vacant. Look for signs of life: mail, vehicles, lights, lawn care.', 30),
  (true, 'Lockbox Install', 'lockbox', 'Lockbox Install', 'Install a lockbox at the property and confirm the access code with the investor.', 45),
  (true, 'Property Condition Report', 'condition_report', 'Property Condition Report', 'Complete a detailed condition assessment: roof, foundation, siding, HVAC, plumbing, electrical, interior finishes. Submit photos + written report.', 125),
  (true, 'Showing Assistance', 'showing', 'Showing Assistance', 'Meet a potential buyer or contractor at the property and grant access for a scheduled showing.', 60),
  (true, 'Vacant Property Verification', 'vacancy_verification', 'Vacant Property Verification', 'Confirm vacancy with timestamped photos of the front door, mailbox, and interior if accessible.', 40),
  (true, 'Document Delivery', 'document_delivery', 'Document Delivery', 'Pick up or drop off documents at the property or specified address. Confirm with photo.', 35)
ON CONFLICT DO NOTHING;

-- ============== STRIPE PREP: payout_methods ==============
CREATE TABLE IF NOT EXISTS public.payout_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  method_type text NOT NULL CHECK (method_type IN ('bank_account','debit_card','paypal','venmo','cashapp','other')),
  display_name text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_default boolean NOT NULL DEFAULT false,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payout_methods TO authenticated;
GRANT ALL ON public.payout_methods TO service_role;

ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own payout methods"
  ON public.payout_methods FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all payout methods"
  ON public.payout_methods FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_payout_methods_touch
  BEFORE UPDATE ON public.payout_methods
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== STRIPE PREP: invoices ==============
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL,
  task_id uuid,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','paid','void','uncollectible')),
  description text,
  due_at timestamptz,
  paid_at timestamptz,
  stripe_invoice_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Investors view own invoices"
  ON public.invoices FOR SELECT TO authenticated
  USING (auth.uid() = investor_id);

CREATE POLICY "Admins manage invoices"
  ON public.invoices FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_invoices_touch
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== STRIPE PREP: payout_requests ==============
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','approved','processing','paid','rejected')),
  notes text,
  payout_method_id uuid,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.payout_requests TO authenticated;
GRANT ALL ON public.payout_requests TO service_role;

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Runners view own payout requests"
  ON public.payout_requests FOR SELECT TO authenticated
  USING (auth.uid() = runner_id);

CREATE POLICY "Runners create own payout requests"
  ON public.payout_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = runner_id AND has_role(auth.uid(),'runner'::app_role));

CREATE POLICY "Admins manage payout requests"
  ON public.payout_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_payout_requests_touch
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_task ON public.reviews(task_id);
CREATE INDEX IF NOT EXISTS idx_task_apps_task ON public.task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_apps_runner ON public.task_applications(runner_id);
CREATE INDEX IF NOT EXISTS idx_saved_tasks_user ON public.saved_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_investor ON public.invoices(investor_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_runner ON public.payout_requests(runner_id);
