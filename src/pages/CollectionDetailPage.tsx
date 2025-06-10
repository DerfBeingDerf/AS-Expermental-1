import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Music, Plus, ListMusic, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import WaveformPlayer from '../components/audio/WaveformPlayer';
import CollectionEmbed from '../components/collection/CollectionEmbed';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import { getCollection, getCollectionTracks, getUserAudioFiles, addTrackToCollection } from '../lib/api';
import { Collection, CollectionTrack, AudioFile } from '../types';

export default function CollectionDetailPage() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [tracks, setTracks] = useState<CollectionTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const [showAddTrack, setShowAddTrack] = useState(false);
  const [availableAudios, setAvailableAudios] = useState<AudioFile[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchCollectionData = async () => {
    if (!collectionId) return;

    try {
      setIsLoading(true);
      const collectionData = await getCollection(collectionId);
      setCollection(collectionData);

      if (user && collectionData.user_id !== user.id && !collectionData.is_public) {
        setError('You do not have access to this collection.');
        return;
      }

      const tracksData = await getCollectionTracks(collectionId);
      setTracks(tracksData);
    } catch (err) {
      setError('Failed to load collection details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionData();
  }, [collectionId, user]);

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
  }, [showAddTrack, user]);

  const handleAddTrack = async () => {
    if (!collectionId || !selectedAudioId) return;

    if (tracks.some(track => track.audio_id === selectedAudioId)) {
      setAddError('This track is already in the collection.');
      return;
    }

    try {
      setIsAdding(true);
      setAddError(null);
      await addTrackToCollection(collectionId, selectedAudioId, tracks.length);
      await fetchCollectionData();
      setShowAddTrack(false);
      setSelectedAudioId('');
    } catch (err) {
      setAddError('Failed to add track to collection.');
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

  if (!collection) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Collection not found.</p>
      </div>
    );
  }

  const isOwner = user && collection.user_id === user.id;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Collection Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 break-words">{collection.title}</h1>
            {collection.description && (
              <p className="text-slate-400 mb-2 break-words">{collection.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400 text-sm">
              <div className="flex items-center">
                <ListMusic size={16} className="mr-1" />
                <span>{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</span>
              </div>

              {collection.is_public && (
                <div className="flex items-center text-sky-400">
                  <Share2 size={16} className="mr-1" />
                  <span>Public Collection</span>
                </div>
              )}
            </div>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowAddTrack(!showAddTrack)}
              className="btn-secondary whitespace-nowrap w-full md:w-auto mt-4 md:mt-0"
            >
              {showAddTrack ? (
                "Cancel"
              ) : (
                <span className="flex items-center justify-center">
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
        <div className="card p-4 sm:p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Add Track to Collection</h2>

          {addError && (
            <div className="bg-red-900/50 border border-red-700 text-white p-3 rounded-md mb-4 text-sm">
              {addError}
            </div>
          )}

          {availableAudios.length === 0 ? (
            <div className="text-slate-400 mb-4">
              <p>You don't have any audio files to add.</p>
              {user && (
                <p className="mt-2">
                  <a href="/upload\" className="text-sky-400 hover:text-sky-300">
                    Upload new audio files
                  </a> to add them to this collection.
                </p>
              )}
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
                    setAddError(null);
                  }}
                  className="input"
                >
                  <option value="">-- Select an audio file --</option>
                  {availableAudios.map((audio) => (
                    <option key={audio.id} value={audio.id}>
                      {audio.title} {audio.artist ? `- ${audio.artist}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                <button
                  onClick={() => {
                     setShowAddTrack(false);
                     setAddError(null);
                     setSelectedAudioId('');
                  }}
                  className="btn bg-slate-600 hover:bg-slate-500 text-white w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTrack}
                  disabled={!selectedAudioId || isAdding}
                  className={`btn-primary ${(!selectedAudioId || isAdding) ? 'opacity-70 cursor-not-allowed' : ''} w-full sm:w-auto`}
                >
                  {isAdding ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Adding...
                    </span>
                  ) : (
                    "Add to Collection"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tracks and Player/Embed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {tracks.length === 0 ? (
            <div className="card p-6 text-center py-12">
              <Music size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tracks in this collection yet</h3>
              <p className="text-slate-400">
                {isOwner ? "Add some tracks to get started." : "This collection is empty."}
              </p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="p-4 bg-slate-800/50">
                <h2 className="text-lg font-semibold">Tracks</h2>
              </div>

              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full divide-y divide-slate-700/50 min-w-[600px]">
                  <thead className="bg-slate-800/30">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-10 sm:w-12">#</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Title</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Artist</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">Duration</th>
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
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <div className="font-medium truncate">{track.audio_file.title}</div>
                          <div className="text-xs text-slate-500 md:hidden truncate">{track.audio_file.artist || 'Unknown'}</div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-slate-400 hidden md:table-cell">
                          <div className="truncate">{track.audio_file.artist || 'Unknown'}</div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-slate-400 hidden sm:table-cell">
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
        <div className="lg:col-span-1 space-y-6">
          {tracks.length > 0 && (
            <div className="sticky top-20">
              <WaveformPlayer
                tracks={tracks}
                currentTrackIndex={currentTrackIndex}
                onTrackChange={setCurrentTrackIndex}
              />

              {collection.is_public && collectionId && (
                <div className="mt-6">
                  <CollectionEmbed collectionId={collectionId} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}