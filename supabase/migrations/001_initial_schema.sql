-- Tresvant: Initial Schema

-- Tracks
CREATE TABLE tracks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  album           text,
  recorded_date   date,
  released_date   date,
  duration_secs   integer,
  genre           text[],
  key             text,
  tempo_bpm       integer,
  notes           text,
  storage_path    text,
  cover_art_url   text,
  status          text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Personnel registry
CREATE TABLE people (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  bio             text,
  created_at      timestamptz DEFAULT now()
);

-- Track <-> Personnel (many-to-many)
CREATE TABLE track_personnel (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id        uuid NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  person_id       uuid NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  instrument      text,
  role            text CHECK (role IN ('performer', 'producer', 'engineer', 'composer', 'featuring')),
  session_notes   text
);

-- Photos
CREATE TABLE photos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path    text NOT NULL,
  caption         text,
  photo_date      date,
  location        text,
  event_name      text,
  featured        boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- Photo <-> People (many-to-many)
CREATE TABLE photo_people (
  photo_id        uuid NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  person_id       uuid NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  PRIMARY KEY (photo_id, person_id)
);

-- Admin users
CREATE TABLE admin_users (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           text NOT NULL,
  invited_by      uuid REFERENCES admin_users(id),
  created_at      timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tracks_status ON tracks(status);
CREATE INDEX idx_tracks_album ON tracks(album);
CREATE INDEX idx_tracks_recorded_date ON tracks(recorded_date);
CREATE INDEX idx_track_personnel_track ON track_personnel(track_id);
CREATE INDEX idx_track_personnel_person ON track_personnel(person_id);
CREATE INDEX idx_photos_featured ON photos(featured);
CREATE INDEX idx_photo_people_person ON photo_people(person_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tracks_updated_at
  BEFORE UPDATE ON tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
