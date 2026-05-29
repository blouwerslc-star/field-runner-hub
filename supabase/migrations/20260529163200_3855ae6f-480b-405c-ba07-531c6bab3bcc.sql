
-- Add verification tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'not_started'
    CHECK (verification_status IN ('not_started','pending_payment','pending_review','verified','rejected')),
  ADD COLUMN IF NOT EXISTS verification_level integer NOT NULL DEFAULT 0
    CHECK (verification_level BETWEEN 0 AND 4),
  ADD COLUMN IF NOT EXISTS verification_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS verification_notes text;

-- Backfill verification_level from existing boolean flags
UPDATE public.profiles SET verification_level =
  (CASE WHEN email_verified THEN 1 ELSE 0 END)
  + (CASE WHEN email_verified AND phone_verified THEN 1 ELSE 0 END)
  + (CASE WHEN email_verified AND phone_verified AND identity_verified THEN 1 ELSE 0 END)
  + (CASE WHEN email_verified AND phone_verified AND identity_verified AND background_check_verified THEN 1 ELSE 0 END)
WHERE verification_level = 0;

UPDATE public.profiles SET verification_status = 'verified'
  WHERE verification_level >= 1 AND verification_status = 'not_started';

-- Verification requests audit / queue
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  requested_level integer NOT NULL CHECK (requested_level BETWEEN 1 AND 4),
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_payment','pending_review','verified','rejected')),
  notes text,
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.verification_requests TO authenticated;
GRANT ALL ON public.verification_requests TO service_role;

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own verification requests"
  ON public.verification_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own verification requests"
  ON public.verification_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update verification requests"
  ON public.verification_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER verification_requests_touch
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON public.verification_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_level ON public.profiles(verification_level DESC);
