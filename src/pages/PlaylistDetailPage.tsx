import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Music, Plus, ListMusic, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import WaveformPlayer from '../components/audio/WaveformPlayer';
import PlaylistEmbed from '../components/playlist/PlaylistEmbed';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import { getPlaylist, getPlaylistTracks, getUserAudioFiles, addTrackToPlaylist } from '../lib/api';
import { Playlist, PlaylistTrack, AudioFile } from '../types';

export default function PlaylistDetailPage() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const [showAddTrack, setShowAddTrack] = useState(false);
  const [availableAudios, setAvailableAudios] = useState<AudioFile[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchPlaylistData = async () => {
    if (!playlistId) return;

    try {
      setIsLoading(true);
      const playlistData = await getPlaylist(playlistId);
      setPlaylist(playlistData);

      if (user && playlistData.user_id !== user.id && !playlistData.is_public) {
        setError('You do not have access to this playlist.');
        return;
      }

      const tracksData = await getPlaylistTracks(playlistId);
      setTracks(tracksData);
    } catch (err) {
      setError('Failed to load playlist details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylistData();
  }, [playlistId, user]);

  const fetchAvailableAudios = async () => {
    if (!user) return;

    try {
      const audios = await getUserAudioFiles(user.id);
      setAvailableAudios(audios);
    } catch (err) {
      console.error('Failed to load available audio files:', err);
    }
  };

  useEffect(() => {
    if (showAddTrack) {
      fetchAvailableAudios();
    }
  }, [showAddTrack, user]); // Added user dependency

  const handleAddTrack = async () => {
    if (!playlistId || !selectedAudioId) return;

    if (tracks.some(track => track.audio_id === selectedAudioId)) {
      setAddError('This track is already in the playlist.');
      return;
    }

    try {
      setIsAdding(true);
      setAddError(null);
      await addTrackToPlaylist(playlistId, selectedAudioId, tracks.length);
      await fetchPlaylistData(); // Refetch to update track list and count
      setShowAddTrack(false);
      setSelectedAudioId('');
    } catch (err) {
      setAddError('Failed to add track to playlist.');
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-900/50 border border-red-700 text-white p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate('/library')}
            className="mt-4 btn-primary"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Playlist not found.</p>
      </div>
    );
  }

  const isOwner = user && playlist.user_id === user.id;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Playlist Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1 min-w-0"> {/* Added min-w-0 for proper truncation on flex children */}
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 break-words">{playlist.title}</h1> {/* Adjusted text size for responsiveness */}
            {playlist.description && (
              <p className="text-slate-400 mb-2 break-words">{playlist.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400 text-sm"> {/* Ensured wrapping for smaller screens */}
              <div className="flex items-center">
                <ListMusic size={16} className="mr-1" />
                <span>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</span>
              </div>

              {playlist.is_public && (
                <div className="flex items-center text-sky-400">
                  <Share2 size={16} className="mr-1" />
                  <span>Public Playlist</span>
                </div>
              )}
            </div>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowAddTrack(!showAddTrack)}
              className="btn-secondary whitespace-nowrap w-full md:w-auto mt-4 md:mt-0" /* Full width on mobile, auto on md+ */
            >
              {showAddTrack ? (
                "Cancel"
              ) : (
                <span className="flex items-center justify-center"> {/* Ensure icon and text are centered */}
                  <Plus size={18} className="mr-1" />
                  Add Tracks
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Add Track Section */}
      {showAddTrack && isOwner && (
        <div className="card p-4 sm:p-6 mb-8"> {/* Adjusted padding for smaller screens */}
          <h2 className="text-lg font-semibold mb-4">Add Track to Playlist</h2>

          {addError && (
            <div className="bg-red-900/50 border border-red-700 text-white p-3 rounded-md mb-4 text-sm">
              {addError}
            </div>
          )}

          {availableAudios.length === 0 ? (
            <div className="text-slate-400 mb-4">
              <p>You don't have any audio files to add.</p> {/* Slightly rephrased */}
              { user && // Only show upload link if user is available for context
                <p className="mt-2">
                  <a href="/upload\" className="text-sky-400 hover:text-sky-300">
                    Upload new audio files
                  </a> to add them to this playlist.
                </p>
              }
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="audioSelect" className="label">Select Audio File</label>
                <select
                  id="audioSelect"
                  value={selectedAudioId}
                  onChange={(e) => {
                    setSelectedAudioId(e.target.value);
                    setAddError(null); // Clear error when selection changes
                  }}
                  className="input" //
                >
                  <option value="">-- Select an audio file --</option>
                  {availableAudios.map((audio) => (
                    <option key={audio.id} value={audio.id}>
                      {audio.title} {audio.artist ? `- ${audio.artist}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3"> {/* Stack buttons on mobile, row on sm+ */}
                <button
                  onClick={() => {
                     setShowAddTrack(false);
                     setAddError(null); // Clear error on cancel
                     setSelectedAudioId(''); // Clear selection on cancel
                  }}
                  className="btn bg-slate-600 hover:bg-slate-500 text-white w-full sm:w-auto" // Secondary/cancel button style
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTrack}
                  disabled={!selectedAudioId || isAdding}
                  className={`btn-primary ${(!selectedAudioId || isAdding) ? 'opacity-70 cursor-not-allowed' : ''} w-full sm:w-auto`} //
                >
                  {isAdding ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Adding...
                    </span>
                  ) : (
                    "Add to Playlist"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tracks and Player/Embed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> {/* Single column on small/medium, 3 columns on large */}
        <div className="lg:col-span-2"> {/* Takes 2 out of 3 columns on large screens */}
          {tracks.length === 0 ? (
            <div className="card p-6 text-center py-12"> {/* */}
              <Music size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tracks in this playlist yet</h3>
              <p className="text-slate-400">
                {isOwner ? "Add some tracks to get started." : "This playlist is empty."}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden"> {/* */}
              <div className="p-4 bg-slate-800/50"> {/* Header for the tracks table */}
                <h2 className="text-lg font-semibold">Tracks</h2>
              </div>

              <div className="overflow-x-auto scrollbar-thin"> {/* Applied scrollbar-thin from index.css for horizontal scrolling */} {/* */}
                <table className="w-full divide-y divide-slate-700/50 min-w-[600px]"> {/* Added min-width to enforce scroll on smaller views */}
                  <thead className="bg-slate-800/30"> {/* Added a subtle background to thead */}
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-10 sm:w-12">#</th> {/* Adjusted padding and width */}
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Title</th> {/* Adjusted padding */}
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Artist</th> {/* Hide on small, show on md+ */}
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">Duration</th> {/* Hide on xs, show on sm+ */}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {tracks.map((track, index) => (
                      <tr
                        key={track.id}
                        className={`hover:bg-slate-700/30 cursor-pointer transition-colors ${
                          index === currentTrackIndex ? 'bg-sky-900/30' : ''
                        }`}
                        onClick={() => setCurrentTrackIndex(index)}
                      >
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-400"> {/* Adjusted padding */}
                          {index + 1}
                        </td>
                        <td className="px-3 sm:px-4 py-3"> {/* Adjusted padding */}
                          <div className="font-medium truncate">{track.audio_file.title}</div>
                           {/* Show artist below title on smaller screens where artist column is hidden */}
                          <div className="text-xs text-slate-500 md:hidden truncate">{track.audio_file.artist || 'Unknown'}</div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-slate-400 hidden md:table-cell"> {/* Adjusted padding */}
                          <div className="truncate">{track.audio_file.artist || 'Unknown'}</div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-400 hidden sm:table-cell"> {/* Adjusted padding */}
                          {formatDuration(track.audio_file.duration)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar for Player and Embed */}
        <div className="lg:col-span-1 space-y-6"> {/* Takes 1 out of 3 columns on large screens */}
          {tracks.length > 0 && (
            <div className="sticky top-20"> {/* Keeps player sticky on scroll */}
              <WaveformPlayer
                tracks={tracks}
                currentTrackIndex={currentTrackIndex}
                onTrackChange={setCurrentTrackIndex}
              />

              {playlist.is_public && playlistId && (
                <div className="mt-6">
                  <PlaylistEmbed playlistId={playlistId} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}