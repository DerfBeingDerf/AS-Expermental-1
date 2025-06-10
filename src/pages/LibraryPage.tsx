import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CollectionCreator from '../components/collection/CollectionCreator';
import CollectionCard from '../components/collection/CollectionCard';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import { getUserCollections, getCollectionTracks } from '../lib/api';
import { Collection } from '../types';

export default function LibraryPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [trackCounts, setTrackCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const fetchCollections = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userCollections = await getUserCollections(user.id);
      setCollections(userCollections);
      
      // Fetch track counts for each collection
      const counts: Record<string, number> = {};
      await Promise.all(
        userCollections.map(async (collection) => {
          const tracks = await getCollectionTracks(collection.id);
          counts[collection.id] = tracks.length;
        })
      );
      
      setTrackCounts(counts);
    } catch (err) {
      setError('Failed to load your collections.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Your Library</h1>
          <p className="text-slate-400 mb-6">
            Sign in to access your collections and audio files.
          </p>
          <div className="space-x-4">
            <button 
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="btn-secondary"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Library</h1>
        <p className="text-slate-400">
          Manage your collections and audio files in one place.
        </p>
      </div>

      <CollectionCreator onCollectionCreated={fetchCollections} />

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-white p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      {collections.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>You haven't created any collections yet.</p>
          <p className="mt-2">Create your first collection to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <CollectionCard 
              key={collection.id} 
              collection={collection} 
              trackCount={trackCounts[collection.id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}