-- Add public profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS cover_photo_url text,
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS services_offered text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS years_experience int,
  ADD COLUMN IF NOT EXISTS hourly_rate numeric,
  ADD COLUMN IF NOT EXISTS task_rate numeric,
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS average_rating numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_tasks_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_time text,
  ADD COLUMN IF NOT EXISTS verified_status boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_profile_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS phone_public boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS turnaround_time text,
  ADD COLUMN IF NOT EXISTS preferred_payout_min numeric,
  ADD COLUMN IF NOT EXISTS preferred_payout_max numeric,
  ADD COLUMN IF NOT EXISTS company_description text;

-- Slug generator trigger
CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  suffix int := 0;
BEGIN
  IF NEW.profile_slug IS NOT NULL AND length(trim(NEW.profile_slug)) > 0 THEN
    RETURN NEW;
  END IF;
  base := lower(regexp_replace(coalesce(NEW.full_name, split_part(coalesce(NEW.email,''),'@',1), 'user'), '[^a-zA-Z0-9]+', '-', 'g'));
  base := trim(both '-' from base);
  IF length(base) < 3 THEN base := 'user-' || substr(NEW.user_id::text, 1, 8); END IF;
  base := substr(base, 1, 32);
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE profile_slug = candidate AND user_id <> NEW.user_id) LOOP
    suffix := suffix + 1;
    candidate := base || '-' || suffix;
  END LOOP;
  NEW.profile_slug := candidate;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_generate_slug ON public.profiles;
CREATE TRIGGER profiles_generate_slug
BEFORE INSERT OR UPDATE OF full_name ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.generate_profile_slug();

-- Backfill slugs for existing rows
UPDATE public.profiles SET full_name = full_name WHERE profile_slug IS NULL;

-- Public view exposing only safe columns; SECURITY INVOKER + filter
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  p.user_id,
  p.profile_slug,
  p.full_name,
  p.city,
  p.state,
  p.profile_photo_url,
  p.cover_photo_url,
  p.headline,
  p.bio,
  p.services_offered,
  p.markets_served,
  p.experience_level,
  p.years_experience,
  p.task_rate,
  p.hourly_rate,
  p.availability_status,
  p.average_rating,
  p.review_count,
  p.completed_tasks_count,
  p.response_time,
  p.verified_status,
  p.featured,
  p.turnaround_time,
  p.task_types,
  p.transportation_available,
  p.service_radius,
  p.company_name,
  p.company_description,
  p.monthly_deal_volume,
  p.created_at,
  COALESCE(
    (SELECT array_agg(ur.role::text) FROM public.user_roles ur WHERE ur.user_id = p.user_id),
    '{}'::text[]
  ) AS roles
FROM public.profiles p
WHERE p.public_profile_enabled = true AND p.suspended = false;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Allow anyone to read public profile rows directly too (needed since the view uses security_invoker)
-- Add a SELECT policy on profiles for public columns when public_profile_enabled.
-- Simpler: allow anon/auth to SELECT profiles rows where public_profile_enabled true.
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;
CREATE POLICY "Public profiles readable"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (public_profile_enabled = true AND suspended = false);

GRANT SELECT ON public.profiles TO anon;

-- Admin can update all profiles (for verify/feature/suspend)
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;
CREATE POLICY "Admins update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create public profile-media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-media', 'profile-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Profile media public read" ON storage.objects;
CREATE POLICY "Profile media public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-media');

DROP POLICY IF EXISTS "Profile media owner write" ON storage.objects;
CREATE POLICY "Profile media owner write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Profile media owner update" ON storage.objects;
CREATE POLICY "Profile media owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Profile media owner delete" ON storage.objects;
CREATE POLICY "Profile media owner delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);