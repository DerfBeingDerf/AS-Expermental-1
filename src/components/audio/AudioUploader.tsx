import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, File, Music, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { uploadAudioFile } from '../../lib/api';

type AudioUploaderProps = {
  onUploadComplete: () => void;
};

export default function AudioUploader({ onUploadComplete }: AudioUploaderProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileNameRef = useRef<HTMLParagraphElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    if (fileNameRef.current) {
      const element = fileNameRef.current;
      setShouldScroll(element.scrollWidth > element.clientWidth);
    }
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if the file is an audio file
      if (!selectedFile.type.startsWith('audio/')) {
        setError('Please select an audio file.');
        return;
      }
      
      setFile(selectedFile);
      // Auto-fill the title with the file name (without extension)
      const fileName = selectedFile.name.split('.').slice(0, -1).join('.');
      setTitle(fileName);
      setError(null);
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
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.type.startsWith('audio/')) {
        setError('Please select an audio file.');
        return;
      }
      
      setFile(droppedFile);
      const fileName = droppedFile.name.split('.').slice(0, -1).join('.');
      setTitle(fileName);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to upload files.');
      return;
    }
    
    if (!file) {
      setError('Please select an audio file.');
      return;
    }
    
    if (!title.trim()) {
      setError('Please enter a title for your audio.');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      await uploadAudioFile(
        file,
        title,
        user.id,
        artist || undefined,
        description || undefined
      );
      
      // Reset the form
      setFile(null);
      setTitle('');
      setArtist('');
      setDescription('');
      
      // Notify parent component
      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload audio file.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Audio</h2>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-white p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
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
          />
          
          {file ? (
            <div className="flex items-center justify-between bg-slate-700 p-3 rounded-md">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="bg-sky-500/20 p-2 rounded-md flex-shrink-0">
                  <Music className="h-6 w-6 text-sky-400" />
                </div>
                <div className="text-left min-w-0">
                  <p 
                    ref={fileNameRef}
                    className={`font-medium whitespace-nowrap overflow-hidden ${
                      shouldScroll ? 'animate-[scroll_15s_linear_infinite]' : ''
                    }`}
                    style={{
                      maskImage: shouldScroll ? 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' : 'none'
                    }}
                  >
                    {file.name}
                  </p>
                  <p className="text-sm text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="text-slate-400 hover:text-white p-1 flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="py-4">
              <motion.div 
                className="mx-auto w-12 h-12 mb-3 bg-slate-700 rounded-full flex items-center justify-center text-sky-400"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Upload size={24} />
              </motion.div>
              <p className="text-slate-300 mb-1">Drop your audio file here or click to browse</p>
              <p className="text-sm text-slate-400">MP3, WAV, OGG, FLAC (Max 50MB)</p>
            </div>
          )}
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="title" className="label">Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Audio title"
              required
            />
          </div>
          
          <div>
            <label htmlFor="artist" className="label">Artist</label>
            <input
              type="text"
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="input"
              placeholder="Artist name (optional)"
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
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isUploading || !file}
            className={`btn-primary ${(!file || isUploading) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isUploading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </span>
            ) : (
              <span className="flex items-center">
                <Upload className="mr-2 h-4 w-4" />
                Upload Audio
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}