import { supabase } from './supabase';
import { AudioFile, Playlist, PlaylistTrack } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Audio file operations
export const uploadAudioFile = async (
  file: File,
  title: string,
  userId: string,
  artist?: string,
  description?: string
): Promise<AudioFile> => {
  // Generate a unique file path
  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${userId}/audio/${fileName}`;

  // Upload file to Supabase Storage
  const { error: uploadError, data: uploadData } = await supabase.storage
    .from('audio-files')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Error uploading file: ${uploadError.message}`);
  }

  // Get public URL for the uploaded file
  const { data: { publicUrl } } = supabase.storage
    .from('audio-files')
    .getPublicUrl(filePath);

  // Create a dummy duration (in a real app, you'd extract this from the audio file)
  const duration = 180; // 3 minutes in seconds

  // Create a record in the database
  const { error: dbError, data: audioFile } = await supabase
    .from('audio_files')
    .insert({
      user_id: userId,
      title,
      artist,
      description,
      file_path: filePath,
      file_url: publicUrl,
      duration,
    })
    .select()
    .single();

  if (dbError) {
    throw new Error(`Error creating audio file record: ${dbError.message}`);
  }

  return audioFile;
};

export const getUserAudioFiles = async (userId: string): Promise<AudioFile[]> => {
  const { data, error } = await supabase
    .from('audio_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching audio files: ${error.message}`);
  }

  return data || [];
};

export const getAudioFile = async (audioId: string): Promise<AudioFile> => {
  const { data, error } = await supabase
    .from('audio_files')
    .select('*')
    .eq('id', audioId)
    .single();

  if (error) {
    throw new Error(`Error fetching audio file: ${error.message}`);
  }

  return data;
};

// Playlist operations
export const createPlaylist = async (
  title: string,
  userId: string,
  description?: string,
  isPublic: boolean = true
): Promise<Playlist> => {
  const { data, error } = await supabase
    .from('playlists')
    .insert({
      user_id: userId,
      title,
      description,
      is_public: isPublic,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating playlist: ${error.message}`);
  }

  return data;
};

export const getUserPlaylists = async (userId: string): Promise<Playlist[]> => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching playlists: ${error.message}`);
  }

  return data || [];
};

export const getPlaylist = async (playlistId: string): Promise<Playlist> => {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', playlistId)
    .single();

  if (error) {
    throw new Error(`Error fetching playlist: ${error.message}`);
  }

  return data;
};

export const getPlaylistTracks = async (playlistId: string): Promise<PlaylistTrack[]> => {
  const { data, error } = await supabase
    .from('playlist_tracks')
    .select(`
      *,
      audio_file:audio_id(*)
    `)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (error) {
    throw new Error(`Error fetching playlist tracks: ${error.message}`);
  }

  return data || [];
};

export const addTrackToPlaylist = async (
  playlistId: string,
  audioId: string,
  position: number
): Promise<void> => {
  const { error } = await supabase
    .from('playlist_tracks')
    .insert({
      playlist_id: playlistId,
      audio_id: audioId,
      position,
    });

  if (error) {
    throw new Error(`Error adding track to playlist: ${error.message}`);
  }
};

export const removeTrackFromPlaylist = async (
  playlistTrackId: string
): Promise<void> => {
  const { error } = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('id', playlistTrackId);

  if (error) {
    throw new Error(`Error removing track from playlist: ${error.message}`);
  }
};

export const updatePlaylistTrackPositions = async (
  tracks: { id: string; position: number }[]
): Promise<void> => {
  // Using Promise.all to update all tracks concurrently
  await Promise.all(
    tracks.map(({ id, position }) => 
      supabase
        .from('playlist_tracks')
        .update({ position })
        .eq('id', id)
    )
  );
};

export const getPublicPlaylist = async (playlistId: string): Promise<{
  playlist: Playlist;
  tracks: PlaylistTrack[];
}> => {
  // First get the playlist
  const { data: playlist, error: playlistError } = await supabase
    .from('playlists')
    .select('*')
    .eq('id', playlistId)
    .eq('is_public', true)
    .single();

  if (playlistError) {
    throw new Error(`Error fetching public playlist: ${playlistError.message}`);
  }

  // Then get the tracks
  const { data: tracks, error: tracksError } = await supabase
    .from('playlist_tracks')
    .select(`
      *,
      audio_file:audio_id(*)
    `)
    .eq('playlist_id', playlistId)
    .order('position', { ascending: true });

  if (tracksError) {
    throw new Error(`Error fetching playlist tracks: ${tracksError.message}`);
  }

  return { playlist, tracks: tracks || [] };
};