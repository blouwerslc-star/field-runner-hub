ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS service_radius text,
  ADD COLUMN IF NOT EXISTS transportation_available boolean,
  ADD COLUMN IF NOT EXISTS task_types text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS markets_served text,
  ADD COLUMN IF NOT EXISTS monthly_deal_volume text;