-- JWTs can outlive Auth account deletion. Require a live owner profile as well
-- as the signed user folder, so a deleted user's token cannot recreate exports.
DROP POLICY IF EXISTS exports_storage_insert_own ON storage.objects;
CREATE POLICY exports_storage_insert_own ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'exports'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS exports_storage_read_own ON storage.objects;
CREATE POLICY exports_storage_read_own ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'exports'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = (SELECT auth.uid())));
