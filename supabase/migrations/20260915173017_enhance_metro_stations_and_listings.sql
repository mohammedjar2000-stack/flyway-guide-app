/*
# Enhance metro_stations with train details and add listings density

1. Modified Tables
- `metro_stations` — added columns:
  - `train_type` (text) — type of train (e.g., "مترو M2", "ترام T1", "قطار Marmaray")
  - `frequency_minutes` (text) — operational frequency (e.g., "كل 2-5 دقائق")
  - `fare_local` (text) — fare in local currency (e.g., "27.50 ليرة تركية")
  - `platform_directions` (text) — platform guidance toward major hubs
  - `image` (text) — image URL of train type
  - `operating_hours` (text) — daily operating hours

2. Security
- No policy changes needed; existing anon SELECT policy covers new columns.

3. Important Notes
- Single-tenant no-auth app; all columns are publicly readable.
- New columns are nullable with defaults for backward compatibility.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metro_stations' AND column_name = 'train_type') THEN
    ALTER TABLE metro_stations ADD COLUMN train_type text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metro_stations' AND column_name = 'frequency_minutes') THEN
    ALTER TABLE metro_stations ADD COLUMN frequency_minutes text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metro_stations' AND column_name = 'fare_local') THEN
    ALTER TABLE metro_stations ADD COLUMN fare_local text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metro_stations' AND column_name = 'platform_directions') THEN
    ALTER TABLE metro_stations ADD COLUMN platform_directions text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metro_stations' AND column_name = 'image') THEN
    ALTER TABLE metro_stations ADD COLUMN image text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metro_stations' AND column_name = 'operating_hours') THEN
    ALTER TABLE metro_stations ADD COLUMN operating_hours text DEFAULT '';
  END IF;
END $$;
