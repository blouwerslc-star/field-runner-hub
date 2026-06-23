ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'task';
CREATE INDEX IF NOT EXISTS idx_payments_kind ON public.payments(kind);