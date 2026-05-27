-- Loosen the restrictive policies on application tables so admins can read,
-- while still blocking all other client access. Direct inserts still go through
-- the service role from server functions, which bypasses RLS.

DROP POLICY IF EXISTS "No client access to field_runner_applications" ON public.field_runner_applications;
DROP POLICY IF EXISTS "No client access to real_estate_pro_applications" ON public.real_estate_pro_applications;

-- Replace with restrictive policies that allow admins through, deny everyone else.
CREATE POLICY "Block non-admin client access to field_runner_applications"
ON public.field_runner_applications
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Block non-admin client access to real_estate_pro_applications"
ON public.real_estate_pro_applications
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));