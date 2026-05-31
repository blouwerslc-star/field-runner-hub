CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_role text NOT NULL CHECK (author_role IN ('runner', 'investor', 'team', 'partner')),
  author_location text,
  author_title text,
  quote text NOT NULL,
  rating smallint CHECK (rating BETWEEN 1 AND 5),
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published testimonials"
  ON public.testimonials FOR SELECT
  USING (published = true);

CREATE POLICY "Admins manage testimonials"
  ON public.testimonials FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.testimonials (author_name, author_role, author_location, author_title, quote, rating, featured, sort_order)
VALUES
  (
    'REI Runner Team',
    'team',
    'United States',
    'Founding Team',
    'We built REI Runner because investors kept asking us the same thing: "Can someone just go look at the property?" Our job is to make that one click away in every city we serve.',
    NULL,
    true,
    10
  ),
  (
    'Founding Runner',
    'runner',
    'Detroit, MI',
    'Field Runner · Beta',
    'Clear payouts, clear instructions, and I don''t have to chase anyone for money. I pick the tasks that fit my day and get paid when the work is approved.',
    5,
    true,
    20
  ),
  (
    'Beta Investor',
    'investor',
    'Tampa, FL',
    'Out-of-State Investor · Beta',
    'Photos, walkthrough, and occupancy notes back the same week — no chasing a wholesaler or an agent. This is what remote investing was supposed to feel like.',
    5,
    true,
    30
  );