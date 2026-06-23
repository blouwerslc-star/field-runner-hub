-- Phase 1: real-time task tracking timeline
CREATE TABLE public.task_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_code TEXT NOT NULL,
  note TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT task_status_events_code_check CHECK (
    event_code IN (
      'posted','assigned','accepted','en_route','on_site',
      'in_progress','submitted','completed','verified','revision_requested','cancelled'
    )
  )
);

CREATE INDEX idx_tse_task_created ON public.task_status_events(task_id, created_at DESC);
CREATE INDEX idx_tse_actor ON public.task_status_events(actor_id);

GRANT SELECT, INSERT ON public.task_status_events TO authenticated;
GRANT ALL ON public.task_status_events TO service_role;

ALTER TABLE public.task_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task participants can view timeline"
  ON public.task_status_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_status_events.task_id
        AND (t.investor_id = auth.uid() OR t.runner_id = auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Task participants can add events"
  ON public.task_status_events FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_status_events.task_id
        AND (t.investor_id = auth.uid() OR t.runner_id = auth.uid())
    )
  );

CREATE POLICY "Admins manage timeline"
  ON public.task_status_events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-log events whenever a task is created or its status changes
CREATE OR REPLACE FUNCTION public.log_task_status_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ev TEXT;
  who UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    ev := 'posted';
    who := NEW.investor_id;
    INSERT INTO public.task_status_events (task_id, actor_id, event_code, metadata)
    VALUES (NEW.id, who, ev, jsonb_build_object('status', NEW.status));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- map task.status -> timeline event_code
    ev := CASE NEW.status
      WHEN 'open' THEN 'posted'
      WHEN 'assigned' THEN 'assigned'
      WHEN 'in_progress' THEN 'in_progress'
      WHEN 'submitted' THEN 'submitted'
      WHEN 'approved' THEN 'completed'
      WHEN 'paid' THEN 'verified'
      WHEN 'revision_requested' THEN 'revision_requested'
      WHEN 'cancelled' THEN 'cancelled'
      ELSE NEW.status
    END;
    who := COALESCE(auth.uid(), NEW.runner_id, NEW.investor_id);
    INSERT INTO public.task_status_events (task_id, actor_id, event_code, metadata)
    VALUES (NEW.id, who, ev, jsonb_build_object('from', OLD.status, 'to', NEW.status));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_task_status_event ON public.tasks;
CREATE TRIGGER trg_log_task_status_event
AFTER INSERT OR UPDATE OF status ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.log_task_status_event();

-- Realtime
ALTER TABLE public.task_status_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_status_events;