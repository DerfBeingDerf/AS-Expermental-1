import React, { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createCollection } from '../../lib/api';

type CollectionCreatorProps = {
  onCollectionCreated: () => void;
};

export default function CollectionCreator({ onCollectionCreated }: CollectionCreatorProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create collections.');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title for your collection.');
      return;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      await createCollection(
        title,
        user.id,
        description || undefined,
        isPublic
      );
      
      // Reset the form
      setTitle('');
      setDescription('');
      setIsPublic(true);
      setIsFormOpen(false);
      
      // Notify parent component
      onCollectionCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="card mb-6">
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Create New Collection</h2>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="text-sky-400 hover:text-sky-300 flex items-center"
        >
          <PlusCircle size={20} className="mr-1" />
          <span className="hidden sm:inline">{isFormOpen ? 'Cancel' : 'New Collection'}</span>
        </button>
      </div>
      
      {isFormOpen && (
        <div className="p-4 pt-0 border-t border-slate-700">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-white p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="label">Title *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="My Awesome Collection"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="label">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-[80px]"
                placeholder="Add a description (optional)"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 text-sky-500 focus:ring-sky-500 bg-slate-700"
              />
              <label htmlFor="isPublic" className="ml-2 text-sm text-slate-300">
                Make this collection public and embeddable
              </label>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary"
              >
                {isCreating ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create Collection"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}