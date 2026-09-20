-- Production POI layer on the existing PostGIS `places` table.
-- Does not drop tables. Adds bilingual/district fields, identity, dataset version,
-- nearby RPC, and public-read RLS.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE places
  ADD COLUMN IF NOT EXISTS identity_key text,
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS description_ar text,
  ADD COLUMN IF NOT EXISTS address_ar text,
  ADD COLUMN IF NOT EXISTS street_name text,
  ADD COLUMN IF NOT EXISTS street_name_ar text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS district_ar text,
  ADD COLUMN IF NOT EXISTS city_ar text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS rating numeric,
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS is_24_7 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_emergency boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE places
SET identity_key = lower(
  coalesce(nullif(source, ''), 'legacy')
  || ':'
  || coalesce(nullif(source_id, ''), category || ':' || round(latitude::numeric, 5) || ':' || round(longitude::numeric, 5))
)
WHERE identity_key IS NULL OR identity_key = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_places_identity_key
  ON places (identity_key);

CREATE INDEX IF NOT EXISTS idx_places_district
  ON places (country_code, city, district);

CREATE INDEX IF NOT EXISTS idx_places_active_city
  ON places (country_code, city, category)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_places_is_24_7
  ON places (category)
  WHERE is_24_7 = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_places_emergency
  ON places (category)
  WHERE is_emergency = true AND is_active = true;

CREATE TABLE IF NOT EXISTS dataset_meta (
  key text PRIMARY KEY,
  version integer NOT NULL,
  city text,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO dataset_meta (key, version, city, notes)
VALUES (
  'ISTANBUL_DATASET_VERSION',
  1,
  'Istanbul',
  'Verified Flyway Guide Istanbul/Turkey POI catalog'
)
ON CONFLICT (key) DO UPDATE
SET notes = EXCLUDED.notes,
    updated_at = now();

ALTER TABLE dataset_meta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_dataset_meta" ON dataset_meta;
CREATE POLICY "anon_read_dataset_meta"
ON dataset_meta FOR SELECT
TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION places_set_geom()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.coord_locked, false) THEN
    NEW.latitude := OLD.latitude;
    NEW.longitude := OLD.longitude;
  END IF;
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  IF NEW.identity_key IS NULL OR btrim(NEW.identity_key) = '' THEN
    NEW.identity_key := lower(
      coalesce(nullif(NEW.source, ''), 'flyway')
      || ':'
      || coalesce(
        nullif(NEW.source_id, ''),
        NEW.category || ':' || round(NEW.latitude::numeric, 5) || ':' || round(NEW.longitude::numeric, 5)
      )
    );
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.last_updated := now();
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_places_set_geom ON places;
CREATE TRIGGER trg_places_set_geom
BEFORE INSERT OR UPDATE OF latitude, longitude, source, source_id, category, identity_key
ON places
FOR EACH ROW
EXECUTE PROCEDURE places_set_geom();

DROP FUNCTION IF EXISTS places_nearby(
  double precision, double precision, double precision, text, text, text, text, boolean, boolean, integer
);

CREATE OR REPLACE FUNCTION places_nearby(
  p_lat double precision,
  p_lng double precision,
  p_radius_m double precision DEFAULT 5000,
  p_category text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_district text DEFAULT NULL,
  p_query text DEFAULT NULL,
  p_only_24_7 boolean DEFAULT FALSE,
  p_only_emergency boolean DEFAULT FALSE,
  p_limit integer DEFAULT 2000
)
RETURNS TABLE (
  id uuid,
  identity_key text,
  name text,
  local_name text,
  name_ar text,
  description text,
  country text,
  country_code char,
  city text,
  city_ar text,
  district text,
  district_ar text,
  province text,
  category text,
  subcategory text,
  latitude double precision,
  longitude double precision,
  address text,
  address_ar text,
  phone text,
  website text,
  opening_hours text,
  rating numeric,
  review_count integer,
  image_url text,
  is_24_7 boolean,
  is_emergency boolean,
  verified boolean,
  source text,
  source_id text,
  distance_m double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id,
    p.identity_key,
    p.name,
    p.local_name,
    p.name_ar,
    p.description,
    p.country,
    p.country_code,
    p.city,
    p.city_ar,
    p.district,
    p.district_ar,
    p.province,
    p.category,
    p.subcategory,
    p.latitude,
    p.longitude,
    p.address,
    p.address_ar,
    p.phone,
    p.website,
    p.opening_hours,
    p.rating,
    p.review_count,
    p.image_url,
    p.is_24_7,
    p.is_emergency,
    p.verified,
    p.source,
    p.source_id,
    ST_Distance(p.geom, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) AS distance_m
  FROM places p
  WHERE COALESCE(p.is_active, true)
    AND p.latitude BETWEEN -90 AND 90
    AND p.longitude BETWEEN -180 AND 180
    AND ST_DWithin(
      p.geom,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      LEAST(GREATEST(COALESCE(p_radius_m, 5000), 50), 80000)
    )
    AND (
      p_category IS NULL
      OR p.category = p_category
      OR (p_category = 'embassy' AND p.category IN ('embassy', 'police'))
    )
    AND (
      p_city IS NULL
      OR p.city ILIKE p_city
      OR p.city_ar ILIKE p_city
    )
    AND (
      p_district IS NULL
      OR p.district ILIKE p_district
      OR p.district_ar ILIKE p_district
    )
    AND (
      p_query IS NULL
      OR p.name ILIKE '%' || p_query || '%'
      OR COALESCE(p.local_name, '') ILIKE '%' || p_query || '%'
      OR COALESCE(p.address, '') ILIKE '%' || p_query || '%'
    )
    AND (NOT p_only_24_7 OR p.is_24_7)
    AND (NOT p_only_emergency OR p.is_emergency)
  ORDER BY distance_m ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 2000), 1), 5000);
$$;

CREATE OR REPLACE FUNCTION get_dataset_version(p_key text DEFAULT 'ISTANBUL_DATASET_VERSION')
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT version FROM dataset_meta WHERE key = p_key;
$$;

GRANT EXECUTE ON FUNCTION places_nearby(
  double precision, double precision, double precision, text, text, text, text, boolean, boolean, integer
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION get_dataset_version(text) TO anon, authenticated;

GRANT SELECT ON places TO anon, authenticated;
GRANT SELECT ON dataset_meta TO anon, authenticated;
GRANT SELECT ON geo_cities TO anon, authenticated;
