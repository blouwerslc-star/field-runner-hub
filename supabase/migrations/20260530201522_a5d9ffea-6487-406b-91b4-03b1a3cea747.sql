
-- Academy progress per (user, module)
CREATE TABLE public.academy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  sections_completed text[] NOT NULL DEFAULT '{}'::text[],
  quiz_score integer,
  quiz_attempts integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_progress TO authenticated;
GRANT ALL ON public.academy_progress TO service_role;

ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own academy progress"
ON public.academy_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own academy progress"
ON public.academy_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own academy progress"
ON public.academy_progress FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage academy progress"
ON public.academy_progress FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER academy_progress_touch
BEFORE UPDATE ON public.academy_progress
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_academy_progress_user ON public.academy_progress(user_id);

-- Certification tracking on runner_profiles
ALTER TABLE public.runner_profiles
  ADD COLUMN IF NOT EXISTS certification_level integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certification_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS certified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS elite_at timestamptz;
