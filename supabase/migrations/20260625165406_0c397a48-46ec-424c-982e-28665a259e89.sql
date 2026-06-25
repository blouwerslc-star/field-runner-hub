
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- =====================================================================
-- Submissions table
-- =====================================================================
CREATE TABLE public.background_check_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','in_review','needs_info','passed','failed')),

  -- Identity
  legal_first_name text NOT NULL,
  legal_middle_name text,
  legal_last_name text NOT NULL,
  name_suffix text,
  other_names jsonb NOT NULL DEFAULT '[]'::jsonb,
  date_of_birth date NOT NULL,

  -- SSN
  ssn_last4 text NOT NULL CHECK (ssn_last4 ~ '^[0-9]{4}$'),
  ssn_full_encrypted bytea, -- pgp_sym_encrypt of full SSN; nullable

  -- License
  drivers_license_number text,
  drivers_license_state text,
  drivers_license_expiration date,

  -- Contact
  phone text NOT NULL,
  email text NOT NULL,

  -- Current address
  current_address_line1 text NOT NULL,
  current_address_line2 text,
  current_city text NOT NULL,
  current_state text NOT NULL,
  current_zip text NOT NULL,
  current_address_since date,

  -- Prior addresses (array of {line1,line2,city,state,zip,from,to})
  prior_addresses jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Uploaded files (paths in runner-ids bucket)
  id_front_path text,
  id_back_path text,
  selfie_path text,

  -- Consent + e-signature
  fcra_consent boolean NOT NULL DEFAULT false,
  background_check_consent boolean NOT NULL DEFAULT false,
  info_truthful_consent boolean NOT NULL DEFAULT false,
  signature_full_name text NOT NULL,
  signature_ip text,
  signed_at timestamptz NOT NULL DEFAULT now(),

  admin_notes text,
  needs_info_reason text,

  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.background_check_submissions TO authenticated;
GRANT ALL ON public.background_check_submissions TO service_role;

ALTER TABLE public.background_check_submissions ENABLE ROW LEVEL SECURITY;

-- Runner can see their own row (sensitive cols blocked at app layer; SSN is encrypted bytea)
CREATE POLICY "Runners can view their own submission"
  ON public.background_check_submissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all submissions"
  ON public.background_check_submissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- All writes go through server functions with service_role; no INSERT/UPDATE/DELETE policies for authenticated.

CREATE TRIGGER trg_bg_subs_touch
  BEFORE UPDATE ON public.background_check_submissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =====================================================================
-- Audit log
-- =====================================================================
CREATE TABLE public.background_check_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.background_check_submissions(id) ON DELETE CASCADE,
  subject_user_id uuid NOT NULL,
  actor_id uuid REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('view','reveal_ssn','download_id','status_change','request_more_info','resubmit')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.background_check_audit TO authenticated;
GRANT ALL ON public.background_check_audit TO service_role;

ALTER TABLE public.background_check_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.background_check_audit
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX bg_audit_subject_idx ON public.background_check_audit (subject_user_id, created_at DESC);

-- =====================================================================
-- SSN encrypt / decrypt helpers (server-side use via supabaseAdmin only)
-- Key is supplied per-call so the secret never lives in the database.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.bg_encrypt_ssn(_ssn text, _key text)
RETURNS bytea
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  SELECT CASE
    WHEN _ssn IS NULL OR length(_ssn) = 0 THEN NULL
    ELSE extensions.pgp_sym_encrypt(_ssn, _key)
  END;
$$;

CREATE OR REPLACE FUNCTION public.bg_decrypt_ssn(_submission_id uuid, _key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  _blob bytea;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT ssn_full_encrypted INTO _blob
    FROM public.background_check_submissions WHERE id = _submission_id;
  IF _blob IS NULL THEN RETURN NULL; END IF;
  RETURN extensions.pgp_sym_decrypt(_blob, _key);
END;
$$;

REVOKE ALL ON FUNCTION public.bg_encrypt_ssn(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bg_decrypt_ssn(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bg_decrypt_ssn(uuid, text) TO authenticated;
