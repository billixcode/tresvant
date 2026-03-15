-- Store original file properties on tracks
ALTER TABLE tracks ADD COLUMN original_filename text;
ALTER TABLE tracks ADD COLUMN file_size bigint;
