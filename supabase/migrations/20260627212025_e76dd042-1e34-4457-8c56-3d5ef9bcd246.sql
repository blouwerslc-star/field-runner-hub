CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_checkout_session_id_uniq
  ON public.payments (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;