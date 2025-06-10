export interface AudioFile {
  id: string;
  user_id: string;
  name: string;
  storage_path: string;
  type: string;
  size: number;
  title: string;
  artist?: string;
  description?: string;
  file_url: string;
  duration: number;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionTrack {
  id: string;
  collection_id: string;
  audio_id: string;
  position: number;
  created_at: string;
  audio_file: AudioFile;
}