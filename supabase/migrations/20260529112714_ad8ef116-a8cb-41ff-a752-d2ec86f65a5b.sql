CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
  _role_text TEXT;
  _meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  _task_types text[] := '{}'::text[];
  _transport boolean := NULL;
BEGIN
  -- task_types: accept jsonb array
  IF jsonb_typeof(_meta->'task_types') = 'array' THEN
    SELECT COALESCE(array_agg(value::text), '{}'::text[])
      INTO _task_types
      FROM jsonb_array_elements_text(_meta->'task_types') AS value;
  END IF;

  -- transportation_available: accept boolean or "yes"/"no" string
  IF jsonb_typeof(_meta->'transportation_available') = 'boolean' THEN
    _transport := (_meta->>'transportation_available')::boolean;
  ELSIF (_meta->>'transportation_available') IN ('yes','true','1') THEN
    _transport := true;
  ELSIF (_meta->>'transportation_available') IN ('no','false','0') THEN
    _transport := false;
  END IF;

  INSERT INTO public.profiles (
    user_id, full_name, phone, city, state,
    service_radius, transportation_available, task_types,
    company_name, markets_served, monthly_deal_volume
  )
  VALUES (
    NEW.id,
    NULLIF(_meta->>'full_name', ''),
    NULLIF(_meta->>'phone', ''),
    NULLIF(_meta->>'city', ''),
    NULLIF(_meta->>'state', ''),
    NULLIF(_meta->>'service_radius', ''),
    _transport,
    _task_types,
    NULLIF(_meta->>'company_name', ''),
    NULLIF(_meta->>'markets_served', ''),
    NULLIF(_meta->>'monthly_deal_volume', '')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    city = COALESCE(EXCLUDED.city, public.profiles.city),
    state = COALESCE(EXCLUDED.state, public.profiles.state),
    service_radius = COALESCE(EXCLUDED.service_radius, public.profiles.service_radius),
    transportation_available = COALESCE(EXCLUDED.transportation_available, public.profiles.transportation_available),
    task_types = CASE WHEN array_length(EXCLUDED.task_types,1) IS NULL THEN public.profiles.task_types ELSE EXCLUDED.task_types END,
    company_name = COALESCE(EXCLUDED.company_name, public.profiles.company_name),
    markets_served = COALESCE(EXCLUDED.markets_served, public.profiles.markets_served),
    monthly_deal_volume = COALESCE(EXCLUDED.monthly_deal_volume, public.profiles.monthly_deal_volume);

  _role_text := _meta->>'role';
  IF _role_text IN ('runner', 'investor') THEN
    _role := _role_text::public.app_role;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;