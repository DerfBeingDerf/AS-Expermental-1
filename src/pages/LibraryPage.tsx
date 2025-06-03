import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PlaylistCreator from '../components/playlist/PlaylistCreator';
import PlaylistCard from '../components/playlist/PlaylistCard';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import { getUserPlaylists, getPlaylistTracks } from '../lib/api';
import { Playlist } from '../types';

export default function LibraryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [trackCounts, setTrackCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const fetchPlaylists = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userPlaylists = await getUserPlaylists(user.id);
      setPlaylists(userPlaylists);
      
      // Fetch track counts for each playlist
      const counts: Record<string, number> = {};
      await Promise.all(
        userPlaylists.map(async (playlist) => {
          const tracks = await getPlaylistTracks(playlist.id);
          counts[playlist.id] = tracks.length;
        })
      );
      
      setTrackCounts(counts);
    } catch (err) {
      setError('Failed to load your playlists.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Library</h1>
        <p className="text-slate-400">
          Manage your playlists and audio files in one place.
        </p>
      </div>

      <PlaylistCreator onPlaylistCreated={fetchPlaylists} />

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-white p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      {playlists.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>You haven't created any playlists yet.</p>
          <p className="mt-2">Create your first playlist to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <PlaylistCard 
              key={playlist.id} 
              playlist={playlist} 
              trackCount={trackCounts[playlist.id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}