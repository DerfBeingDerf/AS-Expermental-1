/*
  # Audio platform schema with policy checks
  
  1. Tables
    - audio_files: Stores audio file metadata
    - playlists: Stores playlist information
    - playlist_tracks: Links playlists and audio files
  
  2. Security
    - RLS enabled on all tables
    - Policies for authenticated users
    - Public access policies for shared content
*/

-- Create audio_files table
CREATE TABLE IF NOT EXISTS audio_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  artist text,
  description text,
  file_path text NOT NULL,
  file_url text NOT NULL,
  duration numeric NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  is_public boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create playlist_tracks table
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
  audio_id uuid REFERENCES audio_files(id) ON DELETE CASCADE NOT NULL,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  -- audio_files policies
  DROP POLICY IF EXISTS "Users can insert their own audio files" ON audio_files;
  DROP POLICY IF EXISTS "Users can update their own audio files" ON audio_files;
  DROP POLICY IF EXISTS "Users can delete their own audio files" ON audio_files;
  DROP POLICY IF EXISTS "Users can view their own audio files" ON audio_files;
  DROP POLICY IF EXISTS "Anyone can view audio files in public playlists" ON audio_files;
  
  -- playlists policies
  DROP POLICY IF EXISTS "Users can insert their own playlists" ON playlists;
  DROP POLICY IF EXISTS "Users can update their own playlists" ON playlists;
  DROP POLICY IF EXISTS "Users can delete their own playlists" ON playlists;
  DROP POLICY IF EXISTS "Users can view their own playlists" ON playlists;
  DROP POLICY IF EXISTS "Anyone can view public playlists" ON playlists;
  
  -- playlist_tracks policies
  DROP POLICY IF EXISTS "Users can insert tracks to their own playlists" ON playlist_tracks;
  DROP POLICY IF EXISTS "Users can update tracks in their own playlists" ON playlist_tracks;
  DROP POLICY IF EXISTS "Users can delete tracks from their own playlists" ON playlist_tracks;
  DROP POLICY IF EXISTS "Users can view tracks in their own playlists" ON playlist_tracks;
  DROP POLICY IF EXISTS "Anyone can view tracks in public playlists" ON playlist_tracks;
  
  -- storage policies
  DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
  DROP POLICY IF EXISTS "Allow public read access to audio files" ON storage.objects;
END $$;

-- RLS Policies for audio_files
CREATE POLICY "Users can insert their own audio files"
  ON audio_files
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audio files"
  ON audio_files
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audio files"
  ON audio_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own audio files"
  ON audio_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view audio files in public playlists"
  ON audio_files
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlist_tracks pt
      JOIN playlists p ON p.id = pt.playlist_id
      WHERE pt.audio_id = audio_files.id AND p.is_public = true
    )
  );

-- RLS Policies for playlists
CREATE POLICY "Users can insert their own playlists"
  ON playlists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
  ON playlists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
  ON playlists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own playlists"
  ON playlists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public playlists"
  ON playlists
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- RLS Policies for playlist_tracks
CREATE POLICY "Users can insert tracks to their own playlists"
  ON playlist_tracks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE id = playlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tracks in their own playlists"
  ON playlist_tracks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE id = playlist_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE id = playlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tracks from their own playlists"
  ON playlist_tracks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE id = playlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view tracks in their own playlists"
  ON playlist_tracks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE id = playlist_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view tracks in public playlists"
  ON playlist_tracks
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE id = playlist_id AND is_public = true
    )
  );

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Allow authenticated users to upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audio-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to update their own files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'audio-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow users to delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audio-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow public read access to audio files"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'audio-files');