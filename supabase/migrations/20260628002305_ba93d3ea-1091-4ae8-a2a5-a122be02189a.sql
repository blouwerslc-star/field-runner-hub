
-- 1. promo_campaigns
CREATE TABLE public.promo_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  credit_cents INTEGER NOT NULL DEFAULT 5000 CHECK (credit_cents >= 0 AND credit_cents <= 50000),
  expires_at TIMESTAMPTZ,
  legal_disclaimer TEXT NOT NULL DEFAULT 'Offer valid for new investor accounts only. Maximum promotional value of $50. REI Runner reserves the right to modify or discontinue this promotion at any time.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_campaigns TO anon, authenticated;
GRANT ALL ON public.promo_campaigns TO service_role;

ALTER TABLE public.promo_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read enabled campaigns"
  ON public.promo_campaigns FOR SELECT
  USING (enabled = true);

CREATE POLICY "Admins manage campaigns"
  ON public.promo_campaigns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_promo_campaigns_touch
  BEFORE UPDATE ON public.promo_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed default campaign
INSERT INTO public.promo_campaigns (code, name, credit_cents)
VALUES ('first_task_free', 'First Task Free', 5000);

-- 2. promo_credits
CREATE TABLE public.promo_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.promo_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  email_norm TEXT,
  payment_fingerprint TEXT,
  signup_ip TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','redeemed','void')),
  credit_cents INTEGER NOT NULL,
  remaining_cents INTEGER NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id)
);

CREATE UNIQUE INDEX promo_credits_campaign_email_idx
  ON public.promo_credits (campaign_id, email_norm)
  WHERE email_norm IS NOT NULL;

CREATE UNIQUE INDEX promo_credits_campaign_fingerprint_idx
  ON public.promo_credits (campaign_id, payment_fingerprint)
  WHERE payment_fingerprint IS NOT NULL;

GRANT SELECT ON public.promo_credits TO authenticated;
GRANT ALL ON public.promo_credits TO service_role;

ALTER TABLE public.promo_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own promo credit"
  ON public.promo_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage promo credits"
  ON public.promo_credits FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_promo_credits_touch
  BEFORE UPDATE ON public.promo_credits
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. promo_events
CREATE TABLE public.promo_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.promo_campaigns(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'banner_view','banner_click','signup','first_task_created','credit_redeemed','repeat_task'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX promo_events_lookup_idx
  ON public.promo_events (campaign_id, event_type, created_at DESC);

GRANT SELECT, INSERT ON public.promo_events TO anon, authenticated;
GRANT ALL ON public.promo_events TO service_role;

ALTER TABLE public.promo_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record promo events"
  ON public.promo_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins read promo events"
  ON public.promo_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Trigger: auto-issue credit when an investor role is granted
CREATE OR REPLACE FUNCTION public.issue_promo_credit_on_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _campaign public.promo_campaigns%ROWTYPE;
  _email TEXT;
BEGIN
  IF NEW.role <> 'investor'::app_role THEN
    RETURN NEW;
  END IF;

  SELECT * INTO _campaign FROM public.promo_campaigns
    WHERE code = 'first_task_free' AND enabled = true
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;
  IF _campaign.id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT email INTO _email FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;

  BEGIN
    INSERT INTO public.promo_credits (
      campaign_id, user_id, email, email_norm,
      credit_cents, remaining_cents, status
    )
    VALUES (
      _campaign.id, NEW.user_id, _email,
      CASE WHEN _email IS NOT NULL THEN lower(trim(_email)) ELSE NULL END,
      _campaign.credit_cents, _campaign.credit_cents, 'available'
    );
  EXCEPTION WHEN unique_violation THEN
    -- Already issued (same user OR cross-account email match): silently skip.
    NULL;
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_issue_promo_credit
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.issue_promo_credit_on_role();

-- Backfill: issue credits for any existing investors who don't have one yet
INSERT INTO public.promo_credits (campaign_id, user_id, email, email_norm, credit_cents, remaining_cents, status)
SELECT
  (SELECT id FROM public.promo_campaigns WHERE code = 'first_task_free'),
  ur.user_id,
  p.email,
  CASE WHEN p.email IS NOT NULL THEN lower(trim(p.email)) ELSE NULL END,
  5000, 5000, 'available'
FROM public.user_roles ur
LEFT JOIN public.profiles p ON p.user_id = ur.user_id
WHERE ur.role = 'investor'::app_role
ON CONFLICT DO NOTHING;
