import React from 'react';
import { Link } from 'react-router-dom';
import { Music, ListMusic, Share2 } from 'lucide-react';
import { Playlist } from '../../types';
import { motion } from 'framer-motion';

type PlaylistCardProps = {
  playlist: Playlist;
  trackCount?: number;
};

export default function PlaylistCard({ playlist, trackCount = 0 }: PlaylistCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="card overflow-hidden"
    >
      <Link to={`/playlist/${playlist.id}`} className="block">
        <div className="h-32 bg-gradient-to-br from-sky-800 to-slate-900 flex items-center justify-center">
          <ListMusic size={48} className="text-sky-300" />
        </div>
      
        <div className="p-4">
          <h3 className="font-semibold truncate text-lg">{playlist.title}</h3>
          
          {playlist.description && (
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{playlist.description}</p>
          )}
          
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center text-sm text-slate-400">
              <Music size={16} className="mr-1" />
              <span>{trackCount} {trackCount === 1 ? 'track' : 'tracks'}</span>
            </div>
            
            {playlist.is_public && (
              <span className="inline-flex items-center bg-sky-500/20 text-sky-300 text-xs px-2 py-1 rounded-full">
                <Share2 size={12} className="mr-1" /> 
                Public
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}