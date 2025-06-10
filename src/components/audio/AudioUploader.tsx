import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Music, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { uploadAudioFile, createCollection, addTrackToCollection } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

type AudioUploaderProps = {
  onUploadComplete?: () => void;
};

export default function AudioUploader({ onUploadComplete }: AudioUploaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [collectionTitle, setCollectionTitle] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const audioFiles = newFiles.filter(file => file.type.startsWith('audio/'));
    if (audioFiles.length !== newFiles.length) {
      setError('Some files were skipped. Please select only audio files.');
    } else {
      setError(null);
    }
    
    setFiles(prev => [...prev, ...audioFiles]);
    
    // Auto-generate collection title from first file if not set
    if (!collectionTitle && audioFiles.length > 0) {
      const fileName = audioFiles[0].name.split('.').slice(0, -1).join('.');
      setCollectionTitle(audioFiles.length > 1 ? `${fileName} and ${audioFiles.length - 1} more` : fileName);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to upload files.');
      return;
    }
    
    if (files.length === 0) {
      setError('Please select at least one audio file.');
      return;
    }
    
    if (!collectionTitle.trim()) {
      setError('Please enter a title for your collection.');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Step 1: Create the collection
      setUploadProgress('Creating collection...');
      const collection = await createCollection(
        collectionTitle,
        user.id,
        collectionDescription || undefined,
        isPublic
      );
      
      // Step 2: Upload all audio files and add them to the collection
      const uploadedFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`);
        
        // Extract title from filename
        const title = file.name.split('.').slice(0, -1).join('.');
        
        const audioFile = await uploadAudioFile(
          file,
          title,
          user.id
        );
        
        // Add to collection
        await addTrackToCollection(collection.id, audioFile.id, i);
        uploadedFiles.push(audioFile);
      }
      
      setUploadProgress('Finalizing...');
      
      // Reset the form
      setFiles([]);
      setCollectionTitle('');
      setCollectionDescription('');
      setIsPublic(true);
      
      // Navigate to the collection detail page
      navigate(`/collection/${collection.id}`);
      
      // Notify parent component if provided
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload and save collection.');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Audio Collection</h2>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-white p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* File Drop Zone */}
        <div 
          className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-sky-400 bg-sky-500/10' 
              : 'border-slate-600 hover:border-sky-400 hover:bg-slate-700/50'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="audio/*"
            multiple
          />
          
          {files.length === 0 ? (
            <div className="py-4">
              <motion.div 
                className="mx-auto w-12 h-12 mb-3 bg-slate-700 rounded-full flex items-center justify-center text-sky-400"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Upload size={24} />
              </motion.div>
              <p className="text-slate-300 mb-1">Drop your audio files here or click to browse</p>
              <p className="text-sm text-slate-400">MP3, WAV, OGG, FLAC (Max 50MB each)</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-slate-300 font-medium">{files.length} file{files.length > 1 ? 's' : ''} selected</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-700 p-2 rounded-md text-sm">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Music size={16} className="text-sky-400 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="text-slate-400 hover:text-white p-1 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">Click to add more files</p>
            </div>
          )}
        </div>
        
        {/* Collection Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="collectionTitle" className="label">Collection Title *</label>
            <input
              type="text"
              id="collectionTitle"
              value={collectionTitle}
              onChange={(e) => setCollectionTitle(e.target.value)}
              className="input"
              placeholder="My Audio Collection"
              required
            />
          </div>
          
          <div>
            <label htmlFor="collectionDescription" className="label">Collection Description</label>
            <textarea
              id="collectionDescription"
              value={collectionDescription}
              onChange={(e) => setCollectionDescription(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Describe your collection (optional)"
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
        </div>
        
        {/* Upload Progress */}
        {isUploading && uploadProgress && (
          <div className="mb-4 p-3 bg-sky-900/30 border border-sky-700 rounded-md">
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-sky-400" />
              <span className="text-sm text-sky-300">{uploadProgress}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading || files.length === 0}
            className={`btn-primary ${(files.length === 0 || isUploading) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isUploading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Collection...
              </span>
            ) : (
              <span className="flex items-center">
                <Save className="mr-2 h-4 w-4" />
                Save Collection
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}