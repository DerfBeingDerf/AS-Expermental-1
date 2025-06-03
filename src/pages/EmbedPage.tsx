import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Music } from 'lucide-react';
import WaveformPlayer from '../components/audio/WaveformPlayer';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import { getPublicPlaylist } from '../lib/api';
import { PlaylistTrack, Playlist } from '../types';

export default function EmbedPage() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  useEffect(() => {
    const fetchPublicPlaylist = async () => {
      if (!playlistId) return;
      
      try {
        setIsLoading(true);
        const { playlist, tracks } = await getPublicPlaylist(playlistId);
        setPlaylist(playlist);
        setTracks(tracks);
      } catch (err) {
        setError('This playlist is not available.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicPlaylist();
  }, [playlistId]);

  useEffect(() => {
    document.body.classList.add('embed-player');
    return () => document.body.classList.remove('embed-player');
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="flex justify-center items-center h-screen p-4">
        <div className="text-center">
          <Music size={32} className="text-sky-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Playlist Unavailable</h3>
          <p className="text-slate-400 text-sm">
            This playlist may be private or no longer exists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="md:w-1/2 lg:w-2/5 border-b md:border-b-0 md:border-r border-slate-700/30">
          <div className="p-4 border-b border-slate-700/30 bg-gradient-to-r from-sky-500/5 to-transparent">
            <h1 className="text-lg font-semibold mb-1">{playlist.title}</h1>
            {playlist.description && (
              <p className="text-slate-300 text-sm">{playlist.description}</p>
            )}
          </div>
          
          <div className="overflow-y-auto scrollbar-thin" style={{ height: 'calc(100% - 73px)' }}>
            {tracks.length === 0 ? (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                  <Music size={24} className="text-sky-400 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">This playlist has no tracks.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/30">
                {tracks.map((track, index) => (
                  <div 
                    key={track.id}
                    className={`p-4 flex items-center cursor-pointer transition-colors duration-200 hover:bg-sky-500/5 ${
                      index === currentTrackIndex ? 'bg-sky-500/10' : ''
                    }`}
                    onClick={() => setCurrentTrackIndex(index)}
                  >
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800/50 text-sky-400 text-sm mr-3">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {track.audio_file.title}
                      </div>
                      <div className="text-sm text-slate-400 truncate">
                        {track.audio_file.artist || 'Unknown Artist'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="md:w-1/2 lg:w-3/5 flex items-center justify-center p-6">
          {tracks.length > 0 && (
            <WaveformPlayer 
              tracks={tracks}
              currentTrackIndex={currentTrackIndex}
              onTrackChange={setCurrentTrackIndex}
            />
          )}
        </div>
      </div>
      
      <div className="text-center py-2 text-[10px] text-slate-500 border-t border-slate-700/30">
        Powered by AudioShare
      </div>
    </div>
  );
}