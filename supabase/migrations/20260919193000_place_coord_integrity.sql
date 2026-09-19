-- Coordinate integrity flags and manual rooftop locks.

ALTER TABLE places
  ADD COLUMN IF NOT EXISTS coord_precision text,
  ADD COLUMN IF NOT EXISTS coord_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS coord_locked boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS place_coord_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  category text NOT NULL,
  source_id text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, city, name)
);

CREATE INDEX IF NOT EXISTS idx_places_coord_locked
  ON places (coord_locked)
  WHERE coord_locked = true;
