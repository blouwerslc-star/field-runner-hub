-- Add foreign keys so PostgREST can embed tasks
ALTER TABLE public.task_applications
  ADD CONSTRAINT task_applications_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;

ALTER TABLE public.saved_tasks
  ADD CONSTRAINT saved_tasks_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;