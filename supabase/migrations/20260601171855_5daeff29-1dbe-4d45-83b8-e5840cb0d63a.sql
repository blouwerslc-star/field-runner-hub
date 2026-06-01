
-- Extend task_templates with rich pricing fields
ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS investor_price numeric,
  ADD COLUMN IF NOT EXISTS runner_payout numeric,
  ADD COLUMN IF NOT EXISTS platform_fee numeric,
  ADD COLUMN IF NOT EXISTS est_minutes integer,
  ADD COLUMN IF NOT EXISTS deliverables text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS includes_notes text,
  ADD COLUMN IF NOT EXISTS excludes_notes text,
  ADD COLUMN IF NOT EXISTS available_addons text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Pricing add-ons catalog
CREATE TABLE IF NOT EXISTS public.pricing_addons (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_type text NOT NULL DEFAULT 'flat',
  investor_price numeric,
  runner_payout numeric,
  platform_fee numeric,
  investor_price_min numeric,
  investor_price_max numeric,
  unit_label text,
  runner_pct numeric,
  platform_pct numeric,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pricing_addons TO anon, authenticated;
GRANT ALL ON public.pricing_addons TO service_role;

ALTER TABLE public.pricing_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Addons publicly readable" ON public.pricing_addons
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage addons" ON public.pricing_addons
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_pricing_addons_touch BEFORE UPDATE ON public.pricing_addons
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Market / context pricing overrides
CREATE TABLE IF NOT EXISTS public.pricing_market_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.task_templates(id) ON DELETE CASCADE,
  addon_key text REFERENCES public.pricing_addons(key) ON DELETE CASCADE,
  market_state text,
  market_city text,
  urgency text,
  experience_level text,
  investor_price numeric,
  runner_payout numeric,
  platform_fee numeric,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (template_id IS NOT NULL OR addon_key IS NOT NULL)
);

GRANT SELECT ON public.pricing_market_overrides TO anon, authenticated;
GRANT ALL ON public.pricing_market_overrides TO service_role;

ALTER TABLE public.pricing_market_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Overrides publicly readable" ON public.pricing_market_overrides
  FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Admins manage overrides" ON public.pricing_market_overrides
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_pricing_overrides_touch BEFORE UPDATE ON public.pricing_market_overrides
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed system templates (idempotent upsert on name+is_system)
CREATE UNIQUE INDEX IF NOT EXISTS task_templates_system_name_uidx
  ON public.task_templates (name) WHERE is_system = true;

INSERT INTO public.task_templates
  (is_system, name, task_type, title, description, category, investor_price, runner_payout, platform_fee, est_minutes, deliverables, includes_notes, excludes_notes, available_addons, sort_order, default_payout)
VALUES
  (true, 'Basic Exterior Property Photos', 'photos', 'Basic exterior property photos',
   'Drive-by exterior photo set with brief condition notes.', 'Photos',
   35, 25, 10, 30,
   ARRAY['10-15 exterior photos','Front, sides, rear if accessible','Street view','Short condition notes'],
   'Exterior-only drive-by capture suitable for quick visual confirmation.',
   'No interior access. No detailed condition report.',
   ARRAY['rush','mileage','difficult_access'], 10, 25),
  (true, 'Full Property Photo Set', 'photos', 'Full property photo set',
   'Comprehensive interior + exterior photo set when access is provided.', 'Photos',
   65, 45, 20, 60,
   ARRAY['25-40 photos','Exterior + interior (if access)','Basic condition notes'],
   'Full visual documentation when keys/lockbox access is available.',
   'No professional MLS editing. No 3D tour.',
   ARRAY['rush','mileage','difficult_access'], 20, 45),
  (true, 'Vacancy / Occupancy Verification', 'occupancy', 'Vacancy / occupancy verification',
   'Visual signs of occupancy plus a short written report.', 'Verification',
   45, 30, 15, 30,
   ARRAY['Occupancy signs check','Vehicles / utilities visible','Mail buildup notes','Exterior photos','Short written report'],
   'Quick assessment of whether a property is occupied, vacant, or abandoned.',
   'No knock-and-talk. No interior entry.',
   ARRAY['rush','mileage','difficult_access'], 30, 30),
  (true, 'Lockbox Installation', 'lockbox', 'Lockbox installation',
   'Place a lockbox on the property and verify the code works.', 'Lockbox',
   65, 45, 20, 45,
   ARRAY['Lockbox placement','Code verification','Photo of lockbox location','Confirmation report'],
   'Travel to property, install client-supplied or runner-supplied lockbox, confirm access.',
   'Lockbox hardware not included unless agreed in advance.',
   ARRAY['rush','mileage','difficult_access'], 40, 45),
  (true, 'Lockbox Removal', 'lockbox', 'Lockbox removal',
   'Remove an existing lockbox and confirm site condition.', 'Lockbox',
   55, 40, 15, 30,
   ARRAY['Lockbox removal','Property confirmation','Removal photo','Submit report'],
   'Retrieve lockbox and document removal.',
   'Storage/return shipping of lockbox not included.',
   ARRAY['rush','mileage','difficult_access'], 50, 40),
  (true, 'Yard Sign Installation', 'sign', 'Yard sign installation',
   'Install a yard sign and document placement.', 'Signs',
   65, 45, 20, 30,
   ARRAY['Sign placement','Front photo','Close-up photo','Location confirmation'],
   'Place client-supplied sign at the property.',
   'Sign hardware not included. No permit handling.',
   ARRAY['rush','mileage','difficult_access'], 60, 45),
  (true, 'Contractor / Buyer Meetup', 'meetup', 'Contractor or buyer meetup',
   'Meet a contractor or buyer on-site and document the visit.', 'Meetups',
   85, 60, 25, 60,
   ARRAY['On-site meet','Verify arrival','Document visit','Upload notes + photos'],
   'First hour included. Additional time billed per 30 minutes.',
   'No contract signing on behalf of investor. No keys handoff without written approval.',
   ARRAY['extra_time','rush','mileage','difficult_access'], 70, 60),
  (true, 'Video Walkthrough', 'video', 'Video walkthrough',
   '5-10 minute walkthrough video plus photos.', 'Video',
   95, 70, 25, 75,
   ARRAY['5-10 minute video','Exterior + interior (if access)','Photos','Basic report'],
   'Narrated walkthrough that gives investors a feel for the property.',
   'No professional cinematic edit. No drone footage.',
   ARRAY['rush','mileage','difficult_access'], 80, 70)
ON CONFLICT (name) WHERE is_system = true DO UPDATE SET
  task_type = EXCLUDED.task_type,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  investor_price = EXCLUDED.investor_price,
  runner_payout = EXCLUDED.runner_payout,
  platform_fee = EXCLUDED.platform_fee,
  est_minutes = EXCLUDED.est_minutes,
  deliverables = EXCLUDED.deliverables,
  includes_notes = EXCLUDED.includes_notes,
  excludes_notes = EXCLUDED.excludes_notes,
  available_addons = EXCLUDED.available_addons,
  sort_order = EXCLUDED.sort_order,
  default_payout = EXCLUDED.default_payout,
  updated_at = now();

-- Seed add-ons
INSERT INTO public.pricing_addons (key, name, description, price_type, investor_price, runner_payout, platform_fee, investor_price_min, investor_price_max, unit_label, runner_pct, platform_pct, sort_order)
VALUES
  ('rush', 'Rush Assignment', 'Must be completed within 24 hours.', 'flat', 25, 15, 10, NULL, NULL, 'per assignment', NULL, NULL, 10),
  ('extra_time', 'Additional Time (Meetups)', 'Beyond the first hour, billed per 30 minutes.', 'per_unit', 35, 25, 10, NULL, NULL, 'per 30 min', NULL, NULL, 20),
  ('mileage', 'Mileage Beyond 10 mi', 'First 10 miles included. Extra miles billed per mile.', 'per_unit', 1.00, 0.75, 0.25, NULL, NULL, 'per mile', NULL, NULL, 30),
  ('difficult_access', 'Difficult Access / High Risk', 'Rural, unsafe, multi-unit, heavy documentation, long wait times.', 'range', NULL, NULL, NULL, 25, 75, 'per assignment', 0.70, 0.30, 40)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_type = EXCLUDED.price_type,
  investor_price = EXCLUDED.investor_price,
  runner_payout = EXCLUDED.runner_payout,
  platform_fee = EXCLUDED.platform_fee,
  investor_price_min = EXCLUDED.investor_price_min,
  investor_price_max = EXCLUDED.investor_price_max,
  unit_label = EXCLUDED.unit_label,
  runner_pct = EXCLUDED.runner_pct,
  platform_pct = EXCLUDED.platform_pct,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
