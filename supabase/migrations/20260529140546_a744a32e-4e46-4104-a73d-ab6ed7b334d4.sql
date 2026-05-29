CREATE OR REPLACE FUNCTION public.generate_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
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

REVOKE EXECUTE ON FUNCTION public.generate_profile_slug() FROM PUBLIC, anon, authenticated;