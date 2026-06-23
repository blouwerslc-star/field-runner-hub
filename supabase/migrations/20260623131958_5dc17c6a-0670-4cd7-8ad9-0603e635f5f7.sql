-- 1) When investor assigns a runner, set runner_state='accepted' if not set
CREATE OR REPLACE FUNCTION public.set_runner_state_on_assign()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.runner_id IS NOT NULL
     AND (OLD.runner_id IS NULL OR OLD.runner_id IS DISTINCT FROM NEW.runner_id)
     AND NEW.runner_state IS NULL THEN
    NEW.runner_state := 'accepted';
    NEW.accepted_at := COALESCE(NEW.accepted_at, now());
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_set_runner_state_on_assign ON public.tasks;
CREATE TRIGGER trg_set_runner_state_on_assign
  BEFORE UPDATE OF runner_id ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_runner_state_on_assign();

-- 2) Backfill
UPDATE public.tasks
   SET runner_state = 'accepted',
       accepted_at = COALESCE(accepted_at, now())
 WHERE runner_id IS NOT NULL
   AND runner_state IS NULL;

-- 3) Schedule sweep every 5 minutes
DO $$
DECLARE
  _url text;
  _anon text;
BEGIN
  SELECT value INTO _url FROM public.app_settings WHERE key = 'sweep_tracking_url' LIMIT 1;
  SELECT value INTO _anon FROM public.app_settings WHERE key = 'sweep_tracking_apikey' LIMIT 1;
  PERFORM cron.unschedule('sweep-stale-tracking') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'sweep-stale-tracking'
  );
  IF _url IS NOT NULL THEN
    PERFORM cron.schedule(
      'sweep-stale-tracking',
      '*/5 * * * *',
      format(
        $cmd$SELECT net.http_post(url := %L, headers := jsonb_build_object('Content-Type','application/json','apikey', %L), body := '{}'::jsonb);$cmd$,
        _url, COALESCE(_anon, '')
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Sweep scheduling skipped: %', SQLERRM;
END $$;
