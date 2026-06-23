ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS recurrence_rule text,
  ADD COLUMN IF NOT EXISTS recurrence_next_at timestamptz,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recurrence_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_due
  ON public.tasks (recurrence_next_at)
  WHERE recurrence_rule IS NOT NULL AND recurrence_active = true;