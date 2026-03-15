-- Add crop_position to photos (controls object-position for thumbnails)
-- 'top' = default (preserves heads), 'center' = centered crop
ALTER TABLE photos ADD COLUMN crop_position text NOT NULL DEFAULT 'top';
