CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  candidate text;
  attempts int := 0;
BEGIN
  IF NEW.referral_code IS NOT NULL AND length(trim(NEW.referral_code)) > 0 THEN
    RETURN NEW;
  END IF;
  LOOP
    candidate := upper(substr(replace(encode(extensions.gen_random_bytes(6),'base64'),'/','A'),1,8));
    candidate := regexp_replace(candidate, '[^A-Z0-9]', 'X', 'g');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = candidate);
    attempts := attempts + 1;
    IF attempts > 8 THEN
      candidate := upper(substr(replace(NEW.user_id::text,'-',''),1,8));
      EXIT;
    END IF;
  END LOOP;
  NEW.referral_code := candidate;
  RETURN NEW;
END;
$function$;