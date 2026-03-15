-- Storage policies for audio and photos buckets
-- Public read access, admin write access

-- Photos bucket: public read
CREATE POLICY "Public can read photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

-- Photos bucket: admin upload
CREATE POLICY "Admins can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos' AND is_admin());

-- Photos bucket: admin update
CREATE POLICY "Admins can update photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'photos' AND is_admin());

-- Photos bucket: admin delete
CREATE POLICY "Admins can delete photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'photos' AND is_admin());

-- Audio bucket: public read
CREATE POLICY "Public can read audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio');

-- Audio bucket: admin upload
CREATE POLICY "Admins can upload audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio' AND is_admin());

-- Audio bucket: admin update
CREATE POLICY "Admins can update audio"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'audio' AND is_admin());

-- Audio bucket: admin delete
CREATE POLICY "Admins can delete audio"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audio' AND is_admin());
