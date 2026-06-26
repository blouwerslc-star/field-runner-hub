CREATE TABLE public.investor_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  investment_range text,
  accredited_status text,
  interest_type text,
  message text,
  source text,
  user_agent text,
  ip_hash text
);

GRANT INSERT ON public.investor_inquiries TO anon, authenticated;
GRANT ALL ON public.investor_inquiries TO service_role;

ALTER TABLE public.investor_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit investor inquiries"
  ON public.investor_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read investor inquiries"
  ON public.investor_inquiries
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));