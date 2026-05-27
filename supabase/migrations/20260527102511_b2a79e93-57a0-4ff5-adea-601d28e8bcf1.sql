
-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id UUID,
  runner_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL,
  property_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT,
  due_date DATE,
  payout_amount NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  deliverable_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "Admins manage all tasks"
ON public.tasks FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Investors: view + create their own
CREATE POLICY "Investors view own tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (auth.uid() = investor_id);

CREATE POLICY "Investors create own tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = investor_id AND public.has_role(auth.uid(), 'investor'));

-- Runners: view + update tasks assigned to them
CREATE POLICY "Runners view assigned tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (auth.uid() = runner_id);

CREATE POLICY "Runners update assigned tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (auth.uid() = runner_id);

CREATE TRIGGER tasks_touch_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_investor ON public.tasks(investor_id);
CREATE INDEX idx_tasks_runner ON public.tasks(runner_id);

-- Allow admins to see all profiles, user_roles, and applications
CREATE POLICY "Admins view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all user_roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all field runner applications"
ON public.field_runner_applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all real estate pro applications"
ON public.real_estate_pro_applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
