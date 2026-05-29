ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS checkr_candidate_id text,
  ADD COLUMN IF NOT EXISTS checkr_report_id text,
  ADD COLUMN IF NOT EXISTS checkr_invitation_url text,
  ADD COLUMN IF NOT EXISTS checkr_status text,
  ADD COLUMN IF NOT EXISTS background_check_paid_at timestamptz;