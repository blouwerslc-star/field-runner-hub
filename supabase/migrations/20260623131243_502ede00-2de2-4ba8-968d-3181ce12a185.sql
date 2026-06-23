-- Phase 9: Task-only GPS tracking

-- 1) Extend tasks with geofence + runner_state columns
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS property_lat numeric(9,6),
  ADD COLUMN IF NOT EXISTS property_lng numeric(9,6),
  ADD COLUMN IF NOT EXISTS geofence_radius_ft integer NOT NULL DEFAULT 250,
  ADD COLUMN IF NOT EXISTS runner_state text,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS en_route_at timestamptz,
  ADD COLUMN IF NOT EXISTS arrived_at timestamptz,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS tracking_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_ping_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_ping_lat numeric(9,6),
  ADD COLUMN IF NOT EXISTS last_ping_lng numeric(9,6),
  ADD COLUMN IF NOT EXISTS last_ping_within_geofence boolean,
  ADD COLUMN IF NOT EXISTS last_ping_distance_ft numeric;

-- Validate runner_state via trigger (CHECK can't be ALTERed cheaply later)
CREATE OR REPLACE FUNCTION public.validate_runner_state()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.runner_state IS NOT NULL AND NEW.runner_state NOT IN
    ('accepted','en_route','arrived','in_progress','completed','verified') THEN
    RAISE EXCEPTION 'Invalid runner_state: %', NEW.runner_state;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_validate_runner_state ON public.tasks;
CREATE TRIGGER trg_validate_runner_state
  BEFORE INSERT OR UPDATE OF runner_state ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.validate_runner_state();

-- 2) Haversine helper (returns feet)
CREATE OR REPLACE FUNCTION public.haversine_ft(
  lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric
) RETURNS numeric LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  r_ft numeric := 20902231.0;  -- earth radius in feet
  dlat numeric;
  dlng numeric;
  a numeric;
  c numeric;
BEGIN
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  a := sin(dlat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2)^2;
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN r_ft * c;
END;
$$;

-- 3) task_location_pings
CREATE TABLE IF NOT EXISTS public.task_location_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  runner_id uuid NOT NULL,
  investor_id uuid,
  latitude numeric(9,6) NOT NULL,
  longitude numeric(9,6) NOT NULL,
  accuracy_m numeric,
  speed_mps numeric,
  heading_deg numeric,
  runner_state text,
  within_geofence boolean,
  distance_ft numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pings_task_created ON public.task_location_pings(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pings_runner_created ON public.task_location_pings(runner_id, created_at DESC);

GRANT SELECT, INSERT ON public.task_location_pings TO authenticated;
GRANT ALL ON public.task_location_pings TO service_role;

ALTER TABLE public.task_location_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Runner can insert own pings for active task"
  ON public.task_location_pings FOR INSERT TO authenticated
  WITH CHECK (
    runner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id
        AND t.runner_id = auth.uid()
        AND t.tracking_active = true
    )
  );

CREATE POLICY "Pings visible to runner, investor, admin"
  ON public.task_location_pings FOR SELECT TO authenticated
  USING (
    runner_id = auth.uid()
    OR investor_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admin can delete pings"
  ON public.task_location_pings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) task_permission_events
CREATE TABLE IF NOT EXISTS public.task_permission_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  runner_id uuid NOT NULL,
  outcome text NOT NULL, -- granted | denied | unavailable | timeout | error
  error_message text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_perm_events_task ON public.task_permission_events(task_id, created_at DESC);

GRANT SELECT, INSERT ON public.task_permission_events TO authenticated;
GRANT ALL ON public.task_permission_events TO service_role;

ALTER TABLE public.task_permission_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Runner can log own permission events"
  ON public.task_permission_events FOR INSERT TO authenticated
  WITH CHECK (runner_id = auth.uid());

CREATE POLICY "Permission events visible to runner, investor, admin"
  ON public.task_permission_events FOR SELECT TO authenticated
  USING (
    runner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.investor_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 5) Auto-compute distance + within_geofence on ping insert, update task last_ping_*
CREATE OR REPLACE FUNCTION public.process_task_ping()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t RECORD;
  d numeric;
  inside boolean;
BEGIN
  SELECT property_lat, property_lng, geofence_radius_ft, investor_id
    INTO t FROM public.tasks WHERE id = NEW.task_id;
  IF t.investor_id IS NOT NULL AND NEW.investor_id IS NULL THEN
    NEW.investor_id := t.investor_id;
  END IF;
  IF t.property_lat IS NOT NULL AND t.property_lng IS NOT NULL THEN
    d := public.haversine_ft(t.property_lat, t.property_lng, NEW.latitude, NEW.longitude);
    inside := (d <= COALESCE(t.geofence_radius_ft, 250));
    NEW.distance_ft := d;
    NEW.within_geofence := inside;
  END IF;

  UPDATE public.tasks
     SET last_ping_at = NEW.created_at,
         last_ping_lat = NEW.latitude,
         last_ping_lng = NEW.longitude,
         last_ping_within_geofence = NEW.within_geofence,
         last_ping_distance_ft = NEW.distance_ft
   WHERE id = NEW.task_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_process_task_ping ON public.task_location_pings;
CREATE TRIGGER trg_process_task_ping
  BEFORE INSERT ON public.task_location_pings
  FOR EACH ROW EXECUTE FUNCTION public.process_task_ping();

-- 6) Auto-stop tracking when task reaches terminal state
CREATE OR REPLACE FUNCTION public.auto_stop_tracking()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (NEW.runner_state IN ('completed','verified')
      OR NEW.status IN ('cancelled','approved','paid'))
     AND COALESCE(OLD.tracking_active, false) = true THEN
    NEW.tracking_active := false;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_auto_stop_tracking ON public.tasks;
CREATE TRIGGER trg_auto_stop_tracking
  BEFORE UPDATE OF runner_state, status ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.auto_stop_tracking();

-- 7) Admin override RPC
CREATE OR REPLACE FUNCTION public.admin_override_task_completion(_task_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.tasks
     SET runner_state = 'verified',
         verified_at = COALESCE(verified_at, now()),
         tracking_active = false
   WHERE id = _task_id;
  INSERT INTO public.task_status_events (task_id, actor_id, event_code, metadata)
  VALUES (_task_id, auth.uid(), 'admin_override',
          jsonb_build_object('reason', _reason));
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_override_task_completion(uuid, text) TO authenticated;

-- 8) Stale-tracking sweep (called by cron / hook)
CREATE OR REPLACE FUNCTION public.sweep_stale_tracking(_minutes integer DEFAULT 10)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  n integer;
BEGIN
  WITH stopped AS (
    UPDATE public.tasks
       SET tracking_active = false
     WHERE tracking_active = true
       AND (last_ping_at IS NULL OR last_ping_at < now() - make_interval(mins => _minutes))
    RETURNING id
  )
  SELECT count(*) INTO n FROM stopped;
  RETURN n;
END;
$$;
GRANT EXECUTE ON FUNCTION public.sweep_stale_tracking(integer) TO service_role;

-- 9) Realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.task_location_pings;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
