
CREATE TABLE public.broadcast_template_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audience text NOT NULL CHECK (audience IN ('runner','investor','lead')),
  template_key text NOT NULL,
  subject text NOT NULL,
  html text NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audience, template_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.broadcast_template_overrides TO authenticated;
GRANT ALL ON public.broadcast_template_overrides TO service_role;

ALTER TABLE public.broadcast_template_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage broadcast templates"
ON public.broadcast_template_overrides
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_broadcast_template_overrides_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_broadcast_template_overrides
BEFORE UPDATE ON public.broadcast_template_overrides
FOR EACH ROW EXECUTE FUNCTION public.touch_broadcast_template_overrides_updated_at();
