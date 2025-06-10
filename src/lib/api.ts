import { supabase } from './supabase';
import { AudioFile, Collection, CollectionTrack } from '../types';
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
  const { error: uploadError } = await supabase.storage
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
      name: file.name,
      storage_path: filePath,
      type: file.type,
      size: file.size,
      title,
      artist,
      description,
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

// Collection operations
export const createCollection = async (
  title: string,
  userId: string,
  description?: string,
  isPublic: boolean = true
): Promise<Collection> => {
  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: userId,
      title,
      description,
      is_public: isPublic,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating collection: ${error.message}`);
  }

  return data;
};

export const getUserCollections = async (userId: string): Promise<Collection[]> => {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching collections: ${error.message}`);
  }

  return data || [];
};

export const getCollection = async (collectionId: string): Promise<Collection> => {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .single();

  if (error) {
    throw new Error(`Error fetching collection: ${error.message}`);
  }

  return data;
};

export const getCollectionTracks = async (collectionId: string): Promise<CollectionTrack[]> => {
  const { data, error } = await supabase
    .from('collection_tracks')
    .select(`
      *,
      audio_file:audio_id(*)
    `)
    .eq('collection_id', collectionId)
    .order('position', { ascending: true });

  if (error) {
    throw new Error(`Error fetching collection tracks: ${error.message}`);
  }

  return data || [];
};

export const addTrackToCollection = async (
  collectionId: string,
  audioId: string,
  position: number
): Promise<void> => {
  const { error } = await supabase
    .from('collection_tracks')
    .insert({
      collection_id: collectionId,
      audio_id: audioId,
      position,
    });

  if (error) {
    throw new Error(`Error adding track to collection: ${error.message}`);
  }
};

export const removeTrackFromCollection = async (
  collectionTrackId: string
): Promise<void> => {
  const { error } = await supabase
    .from('collection_tracks')
    .delete()
    .eq('id', collectionTrackId);

  if (error) {
    throw new Error(`Error removing track from collection: ${error.message}`);
  }
};

export const updateCollectionTrackPositions = async (
  tracks: { id: string; position: number }[]
): Promise<void> => {
  // Using Promise.all to update all tracks concurrently
  await Promise.all(
    tracks.map(({ id, position }) => 
      supabase
        .from('collection_tracks')
        .update({ position })
        .eq('id', id)
    )
  );
};

export const getPublicCollection = async (collectionId: string): Promise<{
  collection: Collection;
  tracks: CollectionTrack[];
}> => {
  // First get the collection
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .eq('is_public', true)
    .single();

  if (collectionError) {
    throw new Error(`Error fetching public collection: ${collectionError.message}`);
  }

  // Then get the tracks
  const { data: tracks, error: tracksError } = await supabase
    .from('collection_tracks')
    .select(`
      *,
      audio_file:audio_id(*)
    `)
    .eq('collection_id', collectionId)
    .order('position', { ascending: true });

  if (tracksError) {
    throw new Error(`Error fetching collection tracks: ${tracksError.message}`);
  }

  return { collection, tracks: tracks || [] };
};