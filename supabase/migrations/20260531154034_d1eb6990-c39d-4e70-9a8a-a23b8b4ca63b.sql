
-- Profile 2.0 columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS insurance_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS top_runner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_active_at timestamptz,
  ADD COLUMN IF NOT EXISTS completion_rate numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repeat_client_rate numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS response_time_minutes integer,
  ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS real_estate_experience boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS real_estate_years integer,
  ADD COLUMN IF NOT EXISTS contractor_experience boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contractor_years integer,
  ADD COLUMN IF NOT EXISTS property_management_experience boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS property_management_years integer,
  ADD COLUMN IF NOT EXISTS realtor_experience boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS realtor_years integer,
  ADD COLUMN IF NOT EXISTS rate_lockbox_install numeric(10,2),
  ADD COLUMN IF NOT EXISTS rate_occupancy_check numeric(10,2),
  ADD COLUMN IF NOT EXISTS rate_property_photos numeric(10,2),
  ADD COLUMN IF NOT EXISTS rate_video_walkthrough numeric(10,2),
  ADD COLUMN IF NOT EXISTS rate_sign_placement numeric(10,2),
  ADD COLUMN IF NOT EXISTS avail_today boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avail_this_week boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS avail_weekends boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avail_emergency boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_lat numeric(9,6),
  ADD COLUMN IF NOT EXISTS home_lng numeric(9,6);

-- Portfolio media
CREATE TABLE IF NOT EXISTS public.profile_portfolio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'photo',
  url text NOT NULL,
  thumb_url text,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profile_portfolio TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_portfolio TO authenticated;
GRANT ALL ON public.profile_portfolio TO service_role;
ALTER TABLE public.profile_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Portfolio publicly readable" ON public.profile_portfolio FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Owners manage portfolio" ON public.profile_portfolio FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage portfolio" ON public.profile_portfolio FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE INDEX IF NOT EXISTS profile_portfolio_user_idx ON public.profile_portfolio(user_id, sort_order);

-- Investor favorites
CREATE TABLE IF NOT EXISTS public.favorite_runners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid NOT NULL,
  runner_id uuid NOT NULL,
  list_name text NOT NULL DEFAULT 'Favorites',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (investor_id, runner_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorite_runners TO authenticated;
GRANT ALL ON public.favorite_runners TO service_role;
ALTER TABLE public.favorite_runners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Investors manage own favorites" ON public.favorite_runners FOR ALL TO authenticated USING (auth.uid() = investor_id) WITH CHECK (auth.uid() = investor_id);
CREATE POLICY "Admins read favorites" ON public.favorite_runners FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'::app_role));
CREATE INDEX IF NOT EXISTS favorite_runners_investor_idx ON public.favorite_runners(investor_id);
CREATE INDEX IF NOT EXISTS favorite_runners_runner_idx ON public.favorite_runners(runner_id);

-- Runner availability date blocks
CREATE TABLE IF NOT EXISTS public.runner_availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  runner_id uuid NOT NULL,
  blocked_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (runner_id, blocked_date)
);
GRANT SELECT ON public.runner_availability_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.runner_availability_blocks TO authenticated;
GRANT ALL ON public.runner_availability_blocks TO service_role;
ALTER TABLE public.runner_availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Availability blocks publicly readable" ON public.runner_availability_blocks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Runners manage own blocks" ON public.runner_availability_blocks FOR ALL TO authenticated USING (auth.uid() = runner_id) WITH CHECK (auth.uid() = runner_id);
CREATE POLICY "Admins manage blocks" ON public.runner_availability_blocks FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE INDEX IF NOT EXISTS runner_availability_blocks_runner_idx ON public.runner_availability_blocks(runner_id, blocked_date);

-- Public bucket for portfolio media
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-portfolio', 'profile-portfolio', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Portfolio media publicly readable"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'profile-portfolio');

CREATE POLICY "Users upload to own portfolio folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own portfolio files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own portfolio files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);
