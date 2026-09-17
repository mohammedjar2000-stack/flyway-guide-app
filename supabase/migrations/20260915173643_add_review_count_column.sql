DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'directory_listings' AND column_name = 'review_count') THEN
    ALTER TABLE directory_listings ADD COLUMN review_count integer DEFAULT 0;
  END IF;
END $$;
