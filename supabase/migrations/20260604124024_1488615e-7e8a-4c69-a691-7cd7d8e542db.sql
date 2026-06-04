CREATE POLICY "Profile media owner read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Profile media owner update" ON storage.objects;
CREATE POLICY "Profile media owner update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-media' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'profile-media' AND (auth.uid())::text = (storage.foldername(name))[1]);