import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AudioUploader from '../components/audio/AudioUploader';
import LoadingSpinner from '../components/layout/LoadingSpinner';

export default function UploadPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Upload Audio</h1>
          <p className="text-slate-400 mb-6">
            Sign in to upload and create audio collections.
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
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Upload Audio Collection</h1>
        <p className="text-slate-400">
          Upload your audio files and create a collection in one step.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <AudioUploader />
      </div>
    </div>
  );
}