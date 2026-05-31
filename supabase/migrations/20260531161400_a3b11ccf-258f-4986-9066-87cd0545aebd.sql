
-- Revoke EXECUTE on all SECURITY DEFINER functions in public schema from anon/authenticated/public.
-- Triggers continue to execute (they run as the table owner regardless of EXECUTE grants).
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
                   r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- Grant back EXECUTE on the helpers that are actually intended to be called from RLS evaluation
-- (PostgreSQL evaluates these inline; the EXECUTE check is bypassed by SECURITY DEFINER, but be explicit).
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;
