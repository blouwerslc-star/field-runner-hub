
-- 1) Profiles: Remove public exposure of full profile rows (including PII like email/phone, home coordinates, stripe/checkr IDs).
-- Server-side functions use supabaseAdmin (bypasses RLS) with explicit safe column lists, so dropping public read access is safe.
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;

-- 2) Academy quiz questions: prevent authenticated users from reading correct_answer via PostgREST.
-- Server-side getCourseQuiz/submitCourseQuiz use supabaseAdmin and never return correct_answer to clients.
DROP POLICY IF EXISTS "Authenticated view quiz questions" ON public.academy_quiz_questions;

-- 3) Academy certifications: stop leaking user_id->certification mapping to anonymous users.
DROP POLICY IF EXISTS "Certifications publicly readable" ON public.academy_certifications;
CREATE POLICY "Users view own certifications"
  ON public.academy_certifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 4) Activity events: restrict reads so users only see their own events; admins keep full access via existing ALL policy.
DROP POLICY IF EXISTS "Authenticated read activity" ON public.activity_events;
CREATE POLICY "Users read own activity"
  ON public.activity_events FOR SELECT TO authenticated
  USING (actor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- 5) Storage: remove broad SELECT policies that allow listing of public buckets.
-- Files remain accessible via their public URLs (public buckets bypass RLS for direct downloads),
-- but anonymous clients can no longer enumerate bucket contents.
DROP POLICY IF EXISTS "Portfolio media publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Profile media public read" ON storage.objects;

-- 6) Revoke EXECUTE on SECURITY DEFINER helper functions from anon (and public).
-- These are only meant to be called from RLS policies (which run as the definer) or by authenticated users.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, public, authenticated;
