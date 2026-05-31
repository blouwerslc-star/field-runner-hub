CREATE TABLE public.facebook_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  source TEXT,
  channel TEXT,
  stage TEXT,
  lead_created_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  CONSTRAINT facebook_leads_email_unique UNIQUE (email)
);

CREATE INDEX idx_facebook_leads_email ON public.facebook_leads (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.facebook_leads TO authenticated;
GRANT ALL ON public.facebook_leads TO service_role;

ALTER TABLE public.facebook_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage facebook leads"
ON public.facebook_leads
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));