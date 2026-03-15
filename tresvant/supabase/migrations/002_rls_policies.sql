-- Tresvant: Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- TRACKS
CREATE POLICY "Public can view published tracks"
  ON tracks FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins have full access to tracks"
  ON tracks FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- PEOPLE
CREATE POLICY "Public can view people"
  ON people FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to people"
  ON people FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- TRACK_PERSONNEL
CREATE POLICY "Public can view track personnel"
  ON track_personnel FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to track personnel"
  ON track_personnel FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- PHOTOS
CREATE POLICY "Public can view featured photos"
  ON photos FOR SELECT
  USING (featured = true);

CREATE POLICY "Admins have full access to photos"
  ON photos FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- PHOTO_PEOPLE
CREATE POLICY "Public can view photo people"
  ON photo_people FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to photo people"
  ON photo_people FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ADMIN_USERS
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage admin users"
  ON admin_users FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
