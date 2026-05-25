
ALTER TABLE public.field_runner_applications
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS street_address text,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS has_drivers_license text,
  ADD COLUMN IF NOT EXISTS vehicle_type text,
  ADD COLUMN IF NOT EXISTS travel_radius_miles text,
  ADD COLUMN IF NOT EXISTS hours_per_week text,
  ADD COLUMN IF NOT EXISTS preferred_payout text,
  ADD COLUMN IF NOT EXISTS background_check_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS heard_about text,
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS social_links text;
