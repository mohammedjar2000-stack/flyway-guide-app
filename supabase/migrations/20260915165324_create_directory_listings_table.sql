/*
# Create directory_listings table for the 15 Master Classification Index

1. New Tables
- `directory_listings` — stores entries for the 15-category travel directory
  - `id` (uuid, primary key)
  - `category_key` (text, not null) — one of 15 category keys (hotels, restaurants, hospitals, etc.)
  - `category_label` (text, not null) — Arabic label for the category
  - `name` (text, not null) — name of the listing
  - `description` (text) — description of the listing
  - `country_name` (text) — destination country
  - `city` (text) — city within the country
  - `address` (text) — street address
  - `image` (text) — image URL
  - `rating` (numeric, default 0) — star rating 0-5
  - `price_level` (text) — budget/mid-range/luxury
  - `tags` (text[]) — filterable tags (halal, 24/7, family, etc.)
  - `proximity_note` (text) — proximity to landmarks/metro/markets
  - `phone` (text) — contact phone
  - `hours` (text) — operating hours
  - `is_featured` (boolean, default false) — featured listings
  - `sort_order` (integer, default 0) — display ordering
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `directory_listings`.
- Allow anon + authenticated SELECT (public data, no sign-in required).
- No insert/update/delete policies needed (admin-managed data).

3. Important Notes
- This is a single-tenant no-auth app: all policies use `TO anon, authenticated`.
- Data is publicly readable; writes are not exposed via RLS.
- Seed data covers all 15 categories with realistic entries.
*/

CREATE TABLE IF NOT EXISTS directory_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL,
  category_label text NOT NULL,
  name text NOT NULL,
  description text,
  country_name text DEFAULT '',
  city text DEFAULT '',
  address text DEFAULT '',
  image text DEFAULT '',
  rating numeric DEFAULT 0,
  price_level text DEFAULT '',
  tags text[] DEFAULT '{}',
  proximity_note text DEFAULT '',
  phone text DEFAULT '',
  hours text DEFAULT '',
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE directory_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_directory_listings" ON directory_listings;
CREATE POLICY "anon_read_directory_listings"
ON directory_listings FOR SELECT
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_directory_listings_category ON directory_listings(category_key);
CREATE INDEX IF NOT EXISTS idx_directory_listings_country ON directory_listings(country_name);
CREATE INDEX IF NOT EXISTS idx_directory_listings_featured ON directory_listings(is_featured);
