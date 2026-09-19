-- PostGIS-ready GIS places layer (does not alter directory_listings).
-- Enable PostGIS in the Supabase dashboard if CREATE EXTENSION is restricted.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS geo_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  local_name text,
  country text NOT NULL,
  country_code char(2) NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  bbox jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, name)
);

CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  local_name text,
  country text NOT NULL,
  country_code char(2) NOT NULL,
  city text NOT NULL,
  category text NOT NULL,
  subcategory text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  geom geography(Point, 4326),
  address text,
  phone text,
  website text,
  opening_hours text,
  source text NOT NULL DEFAULT 'Geoapify',
  source_id text,
  last_updated timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT places_lat_chk CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT places_lng_chk CHECK (longitude BETWEEN -180 AND 180)
);

CREATE OR REPLACE FUNCTION places_set_geom()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  IF TG_OP = 'UPDATE' THEN
    NEW.last_updated := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_places_set_geom ON places;
CREATE TRIGGER trg_places_set_geom
BEFORE INSERT OR UPDATE OF latitude, longitude
ON places
FOR EACH ROW
EXECUTE PROCEDURE places_set_geom();

CREATE UNIQUE INDEX IF NOT EXISTS idx_places_source_id
  ON places (source, source_id)
  WHERE source_id IS NOT NULL AND source_id <> '';

CREATE INDEX IF NOT EXISTS idx_places_geom
  ON places USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_places_city_category
  ON places (country_code, city, category);

CREATE INDEX IF NOT EXISTS idx_places_category
  ON places (category);

INSERT INTO geo_cities (name, local_name, country, country_code, latitude, longitude, bbox)
VALUES (
  'Istanbul',
  'İstanbul',
  'Turkey',
  'TR',
  41.0082,
  28.9784,
  '{"south": 40.80, "west": 28.45, "north": 41.24, "east": 29.45}'::jsonb
)
ON CONFLICT (country_code, name) DO NOTHING;

ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_places" ON places;
CREATE POLICY "anon_read_places"
ON places FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_read_geo_cities" ON geo_cities;
CREATE POLICY "anon_read_geo_cities"
ON geo_cities FOR SELECT
TO anon, authenticated USING (true);
