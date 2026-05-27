
CREATE OR REPLACE FUNCTION public.enforce_runner_task_update_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Admins bypass column restrictions
  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO is_admin;
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Only enforce for the assigned runner updating their own task
  IF auth.uid() IS NULL OR NEW.runner_id IS DISTINCT FROM auth.uid() THEN
    RETURN NEW;
  END IF;

  -- Runners may only change deliverable_url and a constrained status set.
  IF NEW.payout_amount   IS DISTINCT FROM OLD.payout_amount   THEN RAISE EXCEPTION 'Runners cannot modify payout_amount'; END IF;
  IF NEW.investor_id     IS DISTINCT FROM OLD.investor_id     THEN RAISE EXCEPTION 'Runners cannot modify investor_id'; END IF;
  IF NEW.runner_id       IS DISTINCT FROM OLD.runner_id       THEN RAISE EXCEPTION 'Runners cannot reassign runner_id'; END IF;
  IF NEW.admin_notes     IS DISTINCT FROM OLD.admin_notes     THEN RAISE EXCEPTION 'Runners cannot modify admin_notes'; END IF;
  IF NEW.title           IS DISTINCT FROM OLD.title           THEN RAISE EXCEPTION 'Runners cannot modify title'; END IF;
  IF NEW.description     IS DISTINCT FROM OLD.description     THEN RAISE EXCEPTION 'Runners cannot modify description'; END IF;
  IF NEW.task_type       IS DISTINCT FROM OLD.task_type       THEN RAISE EXCEPTION 'Runners cannot modify task_type'; END IF;
  IF NEW.property_address IS DISTINCT FROM OLD.property_address THEN RAISE EXCEPTION 'Runners cannot modify property_address'; END IF;
  IF NEW.city            IS DISTINCT FROM OLD.city            THEN RAISE EXCEPTION 'Runners cannot modify city'; END IF;
  IF NEW.state           IS DISTINCT FROM OLD.state           THEN RAISE EXCEPTION 'Runners cannot modify state'; END IF;
  IF NEW.zip_code        IS DISTINCT FROM OLD.zip_code        THEN RAISE EXCEPTION 'Runners cannot modify zip_code'; END IF;
  IF NEW.due_date        IS DISTINCT FROM OLD.due_date        THEN RAISE EXCEPTION 'Runners cannot modify due_date'; END IF;
  IF NEW.created_at      IS DISTINCT FROM OLD.created_at      THEN RAISE EXCEPTION 'Runners cannot modify created_at'; END IF;

  -- Constrain status transitions to a safe runner-allowed set
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status NOT IN ('in_progress', 'submitted') THEN
      RAISE EXCEPTION 'Runners can only set status to in_progress or submitted';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_runner_task_update_columns_trg ON public.tasks;
CREATE TRIGGER enforce_runner_task_update_columns_trg
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.enforce_runner_task_update_columns();
