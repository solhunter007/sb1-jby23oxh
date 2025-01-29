/*
  # Add social media and website links to profiles

  1. Changes
    - Add three new columns to the profiles table:
      - `website_url` (text, nullable) - For personal/church website
      - `social_url_1` (text, nullable) - For first social media link
      - `social_url_2` (text, nullable) - For second social media link

  2. Security
    - No additional security needed as the profiles table already has RLS policies
*/

-- Add new columns to profiles table
DO $$ 
BEGIN
  -- Add website_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN website_url text;
  END IF;

  -- Add social_url_1 column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'social_url_1'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_url_1 text;
  END IF;

  -- Add social_url_2 column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'social_url_2'
  ) THEN
    ALTER TABLE profiles ADD COLUMN social_url_2 text;
  END IF;
END $$;