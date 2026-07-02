-- Weekly availability schedule for runners
CREATE TABLE public.runner_availability_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT window_valid CHECK (end_time > start_time)
);
CREATE UNIQUE INDEX runner_avail_uniq ON public.runner_availability_schedule (runner_id, weekday, start_time, end_time);
CREATE INDEX runner_avail_by_runner ON public.runner_availability_schedule (runner_id, weekday);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.runner_availability_schedule TO authenticated;
GRANT SELECT ON public.runner_availability_schedule TO anon;
GRANT ALL ON public.runner_availability_schedule TO service_role;

ALTER TABLE public.runner_availability_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read schedules"
  ON public.runner_availability_schedule FOR SELECT
  USING (true);

CREATE POLICY "Runner manages own schedule insert"
  ON public.runner_availability_schedule FOR INSERT
  WITH CHECK (auth.uid() = runner_id);

CREATE POLICY "Runner manages own schedule update"
  ON public.runner_availability_schedule FOR UPDATE
  USING (auth.uid() = runner_id)
  WITH CHECK (auth.uid() = runner_id);

CREATE POLICY "Runner manages own schedule delete"
  ON public.runner_availability_schedule FOR DELETE
  USING (auth.uid() = runner_id);

CREATE TRIGGER trg_runner_avail_touch
  BEFORE UPDATE ON public.runner_availability_schedule
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Timezone + scheduling notes on profiles (if missing)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS scheduling_notes text;
