-- Auto-flag top runners based on performance thresholds
CREATE OR REPLACE FUNCTION public.compute_top_runner()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.top_runner := (
    COALESCE(NEW.completed_tasks_count, 0) >= 20
    AND COALESCE(NEW.average_rating, 0) >= 4.8
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_compute_top_runner ON public.profiles;
CREATE TRIGGER profiles_compute_top_runner
BEFORE INSERT OR UPDATE OF completed_tasks_count, average_rating ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.compute_top_runner();

-- Backfill once
UPDATE public.profiles
SET top_runner = (COALESCE(completed_tasks_count,0) >= 20 AND COALESCE(average_rating,0) >= 4.8);