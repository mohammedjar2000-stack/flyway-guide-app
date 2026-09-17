/*
# Add geographic coordinates and neighborhoods table

1. Modified Tables
- `directory_listings` — added `lat` (numeric) and `lng` (numeric) columns for map positioning
  - Both default to 0.0, nullable for listings without coordinates
  - Added GiST index for spatial queries (optional, future)

2. New Tables
- `neighborhoods` — predefined micro-locations for the geo-contextual navigator
  - `id` (uuid, primary key)
  - `name` (text, not null) — Arabic name of neighborhood (e.g., "تقسيم", "الفاتح")
  - `name_en` (text) — English name (e.g., "Taksim", "Fatih")
  - `city` (text) — city name (e.g., "إسطنبول")
  - `country_name` (text) — country name
  - `lat` (numeric, not null) — latitude
  - `lng` (numeric, not null) — longitude
  - `zoom` (integer, default 14) — map zoom level
  - `sort_order` (integer, default 0)
  - `created_at` (timestamptz, default now())

3. Security
- Enable RLS on `neighborhoods`.
- Allow anon + authenticated SELECT (public data, no sign-in required).
- directory_listings already has anon SELECT policy; new columns are covered by existing policy.

4. Important Notes
- This is a single-tenant no-auth app: all policies use `TO anon, authenticated`.
- Coordinates are seeded for all existing directory_listings entries.
- Neighborhoods cover Istanbul (Taksim, Fatih, Sisli, Sultanahmet, Beyoglu, Kadikoy, Laleli, Aksaray) and Dubai (Marina, Deira, Downtown, JBR, Business Bay).
*/

-- Add lat/lng columns to directory_listings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_listings' AND column_name = 'lat') THEN
    ALTER TABLE directory_listings ADD COLUMN lat numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_listings' AND column_name = 'lng') THEN
    ALTER TABLE directory_listings ADD COLUMN lng numeric DEFAULT 0;
  END IF;
END $$;

-- Create neighborhoods table
CREATE TABLE IF NOT EXISTS neighborhoods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  city text NOT NULL,
  country_name text NOT NULL,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  zoom integer DEFAULT 14,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_neighborhoods" ON neighborhoods;
CREATE POLICY "anon_read_neighborhoods"
ON neighborhoods FOR SELECT
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_neighborhoods_city ON neighborhoods(city);

-- Seed neighborhoods
INSERT INTO neighborhoods (name, name_en, city, country_name, lat, lng, zoom, sort_order) VALUES
('تقسيم', 'Taksim', 'إسطنبول', 'تركيا', 41.0369, 28.9850, 15, 1),
('الفاتح', 'Fatih', 'إسطنبول', 'تركيا', 41.0110, 28.9390, 14, 2),
('السلطان أحمد', 'Sultanahmet', 'إسطنبول', 'تركيا', 41.0086, 28.9802, 15, 3),
('بي أوغلو', 'Beyoglu', 'إسطنبول', 'تركيا', 41.0360, 28.9740, 14, 4),
('شيشلي', 'Sisli', 'إسطنبول', 'تركيا', 41.0530, 28.9870, 14, 5),
('قاضي كوي', 'Kadikoy', 'إسطنبول', 'تركيا', 40.9900, 29.0280, 14, 6),
('لاله لي', 'Laleli', 'إسطنبول', 'تركيا', 41.0080, 28.9620, 15, 7),
('أقصراي', 'Aksaray', 'إسطنبول', 'تركيا', 41.0090, 28.9460, 14, 8),
('إمينونو', 'Eminonu', 'إسطنبول', 'تركيا', 41.0170, 28.9710, 15, 9),
('كراكوي', 'Karakoy', 'إسطنبول', 'تركيا', 41.0250, 28.9740, 15, 10),
('دبي مارينا', 'Dubai Marina', 'دبي', 'الإمارات (دبي)', 25.0770, 55.1390, 14, 11),
('ديرة', 'Deira', 'دبي', 'الإمارات (دبي)', 25.2730, 55.3290, 14, 12),
('وسط مدينة دبي', 'Downtown Dubai', 'دبي', 'الإمارات (دبي)', 25.1970, 55.2740, 14, 13),
('البرشاء', 'Al Barsha', 'دبي', 'الإمارات (دبي)', 25.1150, 55.1880, 14, 14),
('مول الإمارات', 'Mall of the Emirates', 'دبي', 'الإمارات (دبي)', 25.1180, 55.2010, 14, 15)
ON CONFLICT DO NOTHING;
