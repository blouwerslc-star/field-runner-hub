
-- 1) Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_referred_by_idx ON public.profiles(referred_by);

-- 2) Code generator
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  candidate text;
  attempts int := 0;
BEGIN
  IF NEW.referral_code IS NOT NULL AND length(trim(NEW.referral_code)) > 0 THEN
    RETURN NEW;
  END IF;
  LOOP
    candidate := upper(substr(replace(encode(gen_random_bytes(6),'base64'),'/','A'),1,8));
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
$$;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON public.profiles;
CREATE TRIGGER trg_generate_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- Backfill existing rows
UPDATE public.profiles SET referral_code = NULL WHERE referral_code = '';
DO $$
DECLARE r record; candidate text;
BEGIN
  FOR r IN SELECT user_id FROM public.profiles WHERE referral_code IS NULL LOOP
    LOOP
      candidate := upper(substr(replace(encode(gen_random_bytes(6),'base64'),'/','A'),1,8));
      candidate := regexp_replace(candidate, '[^A-Z0-9]', 'X', 'g');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = candidate);
    END LOOP;
    UPDATE public.profiles SET referral_code = candidate WHERE user_id = r.user_id;
  END LOOP;
END $$;

-- 3) Referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','qualified','rewarded','void')),
  reward_amount_cents integer NOT NULL DEFAULT 2500,
  qualifying_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  qualified_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referee_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON public.referrals(status);

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own referrals (sent or received)"
ON public.referrals FOR SELECT TO authenticated
USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE TRIGGER trg_referrals_touch
BEFORE UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Update handle_new_user to capture referral
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role public.app_role;
  _role_text TEXT;
  _meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  _task_types text[] := '{}'::text[];
  _transport boolean := NULL;
  _ref_code text;
  _referrer uuid;
BEGIN
  IF jsonb_typeof(_meta->'task_types') = 'array' THEN
    SELECT COALESCE(array_agg(value), '{}'::text[])
      INTO _task_types
      FROM jsonb_array_elements_text(_meta->'task_types') AS value;
  END IF;

  IF jsonb_typeof(_meta->'transportation_available') = 'boolean' THEN
    _transport := (_meta->>'transportation_available')::boolean;
  ELSIF lower(COALESCE(_meta->>'transportation_available', '')) IN ('yes','true','1') THEN
    _transport := true;
  ELSIF lower(COALESCE(_meta->>'transportation_available', '')) IN ('no','false','0') THEN
    _transport := false;
  END IF;

  _ref_code := upper(NULLIF(trim(_meta->>'referral_code'),''));
  IF _ref_code IS NOT NULL THEN
    SELECT user_id INTO _referrer FROM public.profiles WHERE referral_code = _ref_code LIMIT 1;
    IF _referrer = NEW.id THEN _referrer := NULL; END IF;
  END IF;

  INSERT INTO public.profiles (
    user_id, email, full_name, phone, city, state,
    service_radius, transportation_available, task_types,
    company_name, markets_served, monthly_deal_volume, referred_by
  )
  VALUES (
    NEW.id, NEW.email,
    NULLIF(_meta->>'full_name', ''),
    NULLIF(_meta->>'phone', ''),
    NULLIF(_meta->>'city', ''),
    NULLIF(_meta->>'state', ''),
    NULLIF(_meta->>'service_radius', ''),
    _transport, _task_types,
    NULLIF(_meta->>'company_name', ''),
    NULLIF(_meta->>'markets_served', ''),
    NULLIF(_meta->>'monthly_deal_volume', ''),
    _referrer
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    city = COALESCE(EXCLUDED.city, public.profiles.city),
    state = COALESCE(EXCLUDED.state, public.profiles.state),
    service_radius = COALESCE(EXCLUDED.service_radius, public.profiles.service_radius),
    transportation_available = COALESCE(EXCLUDED.transportation_available, public.profiles.transportation_available),
    task_types = CASE WHEN array_length(EXCLUDED.task_types, 1) IS NULL THEN public.profiles.task_types ELSE EXCLUDED.task_types END,
    company_name = COALESCE(EXCLUDED.company_name, public.profiles.company_name),
    markets_served = COALESCE(EXCLUDED.markets_served, public.profiles.markets_served),
    monthly_deal_volume = COALESCE(EXCLUDED.monthly_deal_volume, public.profiles.monthly_deal_volume),
    referred_by = COALESCE(public.profiles.referred_by, EXCLUDED.referred_by),
    updated_at = now();

  IF _referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referee_id, code, status)
    VALUES (_referrer, NEW.id, _ref_code, 'pending')
    ON CONFLICT (referee_id) DO NOTHING;
  END IF;

  _role_text := _meta->>'role';
  IF _role_text IN ('runner', 'investor') THEN
    _role := _role_text::public.app_role;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role) ON CONFLICT (user_id, role) DO NOTHING;
    IF _role = 'runner'::public.app_role THEN
      INSERT INTO public.runner_profiles (user_id) VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 5) Qualifier: when a referee gets their first completed task, mark qualified
CREATE OR REPLACE FUNCTION public.mark_referral_qualified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _participant uuid;
  _other_count int;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status IN ('approved','paid','completed')
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Check both runner and investor; mark referral if it's their first qualifying task
    FOREACH _participant IN ARRAY ARRAY[NEW.runner_id, NEW.investor_id] LOOP
      IF _participant IS NULL THEN CONTINUE; END IF;
      SELECT COUNT(*) INTO _other_count FROM public.tasks
        WHERE status IN ('approved','paid','completed')
          AND (runner_id = _participant OR investor_id = _participant)
          AND id <> NEW.id;
      IF _other_count = 0 THEN
        UPDATE public.referrals
           SET status = 'qualified', qualified_at = now(), qualifying_task_id = NEW.id
         WHERE referee_id = _participant AND status = 'pending';
        -- Notify referrer
        INSERT INTO public.notifications (user_id, type, title, body, link)
        SELECT r.referrer_id, 'referral_qualified',
               'Your referral just earned you a reward',
               'They completed their first task. $' || (r.reward_amount_cents/100)::text || ' credit pending.',
               '/dashboard/referrals'
          FROM public.referrals r
         WHERE r.referee_id = _participant AND r.qualifying_task_id = NEW.id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_referral_qualified ON public.tasks;
CREATE TRIGGER trg_mark_referral_qualified
AFTER UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.mark_referral_qualified();
