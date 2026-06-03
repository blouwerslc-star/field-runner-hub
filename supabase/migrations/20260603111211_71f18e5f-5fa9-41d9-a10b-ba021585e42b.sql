ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS requires_interior_access boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_tasks_requires_interior_access
  ON public.tasks (requires_interior_access)
  WHERE requires_interior_access = true;