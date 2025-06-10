/*
  # Update audio_files table schema
  
  1. Changes
    - Add missing columns to match the schema from the database
    - Ensure all columns are properly defined
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add missing columns to audio_files table if they don't exist
DO $$
BEGIN
  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audio_files' AND column_name = 'name'
  ) THEN
    ALTER TABLE audio_files ADD COLUMN name text NOT NULL DEFAULT '';
  END IF;

  -- Add storage_path column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audio_files' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE audio_files ADD COLUMN storage_path text NOT NULL DEFAULT '';
  END IF;

  -- Add type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audio_files' AND column_name = 'type'
  ) THEN
    ALTER TABLE audio_files ADD COLUMN type text NOT NULL DEFAULT '';
  END IF;

  -- Add size column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audio_files' AND column_name = 'size'
  ) THEN
    ALTER TABLE audio_files ADD COLUMN size bigint NOT NULL DEFAULT 0;
  END IF;

  -- Add title column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audio_files' AND column_name = 'title'
  ) THEN
    ALTER TABLE audio_files ADD COLUMN title text NOT NULL DEFAULT '';
  END IF;

  -- Add file_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audio_files' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE audio_files ADD COLUMN file_url text NOT NULL DEFAULT '';
  END IF;

  -- Add duration column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audio_files' AND column_name = 'duration'
  ) THEN
    ALTER TABLE audio_files ADD COLUMN duration numeric NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Remove default constraints after adding columns
ALTER TABLE audio_files ALTER COLUMN name DROP DEFAULT;
ALTER TABLE audio_files ALTER COLUMN storage_path DROP DEFAULT;
ALTER TABLE audio_files ALTER COLUMN type DROP DEFAULT;
ALTER TABLE audio_files ALTER COLUMN size DROP DEFAULT;
ALTER TABLE audio_files ALTER COLUMN title DROP DEFAULT;
ALTER TABLE audio_files ALTER COLUMN file_url DROP DEFAULT;
ALTER TABLE audio_files ALTER COLUMN duration DROP DEFAULT;