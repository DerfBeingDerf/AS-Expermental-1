/*
  # Initial schema for audio platform
  
  1. New Tables
    - `audio_files`: Stores metadata about uploaded audio files
      - `id` (uuid, primary key)
      - `user_id` (uuid): References the authenticated user
      - `title` (text): Title of the audio file
      - `artist` (text, optional): Artist name
      - `description` (text, optional): Description of the audio
      - `file_path` (text): Path to the file in storage
      - `file_url` (text): Public URL for the file
      - `duration` (numeric): Duration in seconds
      - `created_at` (timestamptz): When the file was uploaded
    
    - `playlists`: Stores user-created playlists
      - `id` (uuid, primary key)
      - `user_id` (uuid): References the authenticated user
      - `title` (text): Playlist title
      - `description` (text, optional): Playlist description
      - `cover_url` (text, optional): URL to playlist cover image
      - `is_public` (boolean): Whether the playlist is public/embeddable
      - `created_at` (timestamptz): When the playlist was created
      - `updated_at` (timestamptz): When the playlist was last updated
    
    - `playlist_tracks`: Junction table for playlists and audio files
      - `id` (uuid, primary key)
      - `playlist_id` (uuid): References the playlist
      - `audio_id` (uuid): References the audio file
      - `position` (integer): Position in playlist order
      - `created_at` (timestamptz): When the track was added to the playlist
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public access to public playlists
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
  cover_url text,
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

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audio-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create policy to allow users to update their own files
CREATE POLICY "Allow users to update their own files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'audio-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create policy to allow users to delete their own files
CREATE POLICY "Allow users to delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'audio-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create policy to allow anyone to read files from public storage
CREATE POLICY "Allow public read access to audio files"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'audio-files');