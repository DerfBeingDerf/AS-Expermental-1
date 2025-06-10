/*
  # Rename playlists to collections

  1. Changes
    - Rename `playlists` table to `collections`
    - Rename `playlist_tracks` table to `collection_tracks`
    - Update all foreign key references
    - Update all RLS policies
    - Update column names from playlist_id to collection_id

  2. Security
    - Maintain all existing RLS policies with updated names
    - Ensure no data loss during migration
*/

-- Rename playlists table to collections
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playlists') THEN
    ALTER TABLE playlists RENAME TO collections;
  END IF;
END $$;

-- Rename playlist_tracks table to collection_tracks and update column names
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playlist_tracks') THEN
    ALTER TABLE playlist_tracks RENAME TO collection_tracks;
    ALTER TABLE collection_tracks RENAME COLUMN playlist_id TO collection_id;
  END IF;
END $$;

-- Update foreign key constraint names
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'playlist_tracks_playlist_id_fkey') THEN
    ALTER TABLE collection_tracks DROP CONSTRAINT playlist_tracks_playlist_id_fkey;
  END IF;
  
  -- Add new constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'collection_tracks_collection_id_fkey') THEN
    ALTER TABLE collection_tracks 
    ADD CONSTRAINT collection_tracks_collection_id_fkey 
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Drop old RLS policies for playlists (now collections)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can insert their own playlists" ON collections;
  DROP POLICY IF EXISTS "Users can update their own playlists" ON collections;
  DROP POLICY IF EXISTS "Users can delete their own playlists" ON collections;
  DROP POLICY IF EXISTS "Users can view their own playlists" ON collections;
  DROP POLICY IF EXISTS "Anyone can view public playlists" ON collections;
END $$;

-- Drop old RLS policies for playlist_tracks (now collection_tracks)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can insert tracks to their own playlists" ON collection_tracks;
  DROP POLICY IF EXISTS "Users can update tracks in their own playlists" ON collection_tracks;
  DROP POLICY IF EXISTS "Users can delete tracks from their own playlists" ON collection_tracks;
  DROP POLICY IF EXISTS "Users can view tracks in their own playlists" ON collection_tracks;
  DROP POLICY IF EXISTS "Anyone can view tracks in public playlists" ON collection_tracks;
END $$;

-- Drop old audio_files policy that references playlists
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view audio files in public playlists" ON audio_files;
END $$;

-- Create new RLS policies for collections
CREATE POLICY "Users can insert their own collections"
  ON collections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON collections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON collections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own collections"
  ON collections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public collections"
  ON collections
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- Create new RLS policies for collection_tracks
CREATE POLICY "Users can insert tracks to their own collections"
  ON collection_tracks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE id = collection_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tracks in their own collections"
  ON collection_tracks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE id = collection_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE id = collection_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tracks from their own collections"
  ON collection_tracks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE id = collection_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view tracks in their own collections"
  ON collection_tracks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE id = collection_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view tracks in public collections"
  ON collection_tracks
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE id = collection_id AND is_public = true
    )
  );

-- Update audio_files policy to reference collections
CREATE POLICY "Anyone can view audio files in public collections"
  ON audio_files
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collection_tracks ct
      JOIN collections c ON c.id = ct.collection_id
      WHERE ct.audio_id = audio_files.id AND c.is_public = true
    )
  );