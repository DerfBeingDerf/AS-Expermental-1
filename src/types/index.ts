export interface AudioFile {
  id: string;
  user_id: string;
  title: string;
  artist?: string;
  description?: string;
  file_path: string;
  file_url: string;
  duration: number;
  created_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  audio_id: string;
  position: number;
  audio_file: AudioFile;
}