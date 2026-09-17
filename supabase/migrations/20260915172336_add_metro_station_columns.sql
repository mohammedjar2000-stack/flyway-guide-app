/*
# Add metro station info to directory_listings and create metro_stations table

1. Modified Tables
- `directory_listings` — added `metro_station_name` (text) and `metro_walk_minutes` (integer) columns
  - `metro_station_name` — name of nearest metro/train station (e.g., "Taksim", "BurJuman")
  - `metro_walk_minutes` — walking minutes from listing to that station
  - Both nullable, default empty/0

2. New Tables
- `metro_stations` — public transport stations for the metro navigation feature
  - `id` (uuid, primary key)
  - `name` (text) — station name in Arabic
  - `name_en` (text) — station name in English
  - `city` (text) — city name
  - `country_name` (text) — country name
  - `lines` (text[]) — metro lines serving this station (e.g., ['M2', 'T1'])
  - `ticket_info` (text) — how to buy tickets (e.g., "Istanbulkart", "Nol card")
  - `lat` (numeric) — latitude
  - `lng` (numeric) — longitude
  - `sort_order` (integer, default 0)
  - `created_at` (timestamptz, default now())

3. Security
- Enable RLS on `metro_stations`.
- Allow anon + authenticated SELECT (public data, no sign-in required).
- directory_listings already has anon SELECT; new columns covered by existing policy.

4. Important Notes
- Single-tenant no-auth app: all policies use `TO anon, authenticated`.
- Metro stations cover Istanbul (Marmaray, Metro, Tram), Dubai (Metro Red/Green), Tehran (Metro), Mashhad, Riyadh, Kuala Lumpur, Bangkok, Tokyo, London, Paris.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_listings' AND column_name = 'metro_station_name') THEN
    ALTER TABLE directory_listings ADD COLUMN metro_station_name text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_listings' AND column_name = 'metro_walk_minutes') THEN
    ALTER TABLE directory_listings ADD COLUMN metro_walk_minutes integer DEFAULT 0;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS metro_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  city text NOT NULL,
  country_name text NOT NULL,
  lines text[] DEFAULT '{}',
  ticket_info text DEFAULT '',
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE metro_stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_metro_stations" ON metro_stations;
CREATE POLICY "anon_read_metro_stations"
ON metro_stations FOR SELECT
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_metro_stations_city ON metro_stations(city);
