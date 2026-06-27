
-- Rate limiting infrastructure
CREATE TABLE public.rate_limits (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  identifier TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits (action, identifier, occurred_at DESC);
GRANT ALL ON public.rate_limits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.rate_limits_id_seq TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only accessed via SECURITY DEFINER RPC below.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _action TEXT,
  _identifier TEXT,
  _max INT,
  _window_seconds INT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INT;
BEGIN
  -- Garbage-collect rows older than the longest expected window opportunistically (~1% of calls)
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits
      WHERE occurred_at < now() - INTERVAL '24 hours';
  END IF;

  SELECT count(*) INTO _count
    FROM public.rate_limits
   WHERE action = _action
     AND identifier = _identifier
     AND occurred_at > now() - make_interval(secs => _window_seconds);

  IF _count >= _max THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limits (action, identifier) VALUES (_action, _identifier);
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INT, INT) TO authenticated, anon, service_role;

-- Storage upload validation: enforce per-bucket MIME allowlist and max size at insert time.
CREATE OR REPLACE FUNCTION public.validate_storage_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  _mime TEXT;
  _size BIGINT;
  _allowed TEXT[];
  _max BIGINT;
BEGIN
  _mime := COALESCE(NEW.metadata->>'mimetype', '');
  _size := COALESCE((NEW.metadata->>'size')::BIGINT, 0);

  IF NEW.bucket_id = 'task-deliverables' THEN
    _allowed := ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','application/pdf'];
    _max := 50 * 1024 * 1024; -- 50 MB
  ELSIF NEW.bucket_id = 'runner-ids' THEN
    _allowed := ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'];
    _max := 15 * 1024 * 1024; -- 15 MB
  ELSIF NEW.bucket_id = 'task-photos' THEN
    _allowed := ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif'];
    _max := 25 * 1024 * 1024;
  ELSIF NEW.bucket_id = 'avatars' OR NEW.bucket_id = 'profile-media' OR NEW.bucket_id = 'profile-portfolio' THEN
    _allowed := ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4'];
    _max := 25 * 1024 * 1024;
  ELSIF NEW.bucket_id = 'message-attachments' THEN
    _allowed := ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','application/pdf'];
    _max := 25 * 1024 * 1024;
  ELSE
    RETURN NEW; -- unknown bucket: no enforcement
  END IF;

  IF _size > _max THEN
    RAISE EXCEPTION 'File too large for bucket %: % bytes (max %)', NEW.bucket_id, _size, _max
      USING ERRCODE = 'check_violation';
  END IF;

  IF _mime <> '' AND NOT (_mime = ANY (_allowed)) THEN
    RAISE EXCEPTION 'File type % not allowed in bucket %', _mime, NEW.bucket_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_storage_upload ON storage.objects;
CREATE TRIGGER trg_validate_storage_upload
  BEFORE INSERT OR UPDATE ON storage.objects
  FOR EACH ROW EXECUTE FUNCTION public.validate_storage_upload();
