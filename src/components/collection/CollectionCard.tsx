import React from 'react';
import { Link } from 'react-router-dom';
import { Music, ListMusic, Share2 } from 'lucide-react';
import { Collection } from '../../types';
import { motion } from 'framer-motion';

type CollectionCardProps = {
  collection: Collection;
  trackCount?: number;
};

export default function CollectionCard({ collection, trackCount = 0 }: CollectionCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className="card overflow-hidden"
    >
      <Link to={`/collection/${collection.id}`} className="block">
        <div className="h-32 bg-gradient-to-br from-sky-800 to-slate-900 flex items-center justify-center">
          <ListMusic size={48} className="text-sky-300" />
        </div>
      
        <div className="p-4">
          <h3 className="font-semibold truncate text-lg">{collection.title}</h3>
          
          {collection.description && (
            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{collection.description}</p>
          )}
          
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center text-sm text-slate-400">
              <Music size={16} className="mr-1" />
              <span>{trackCount} {trackCount === 1 ? 'track' : 'tracks'}</span>
            </div>
            
            {collection.is_public && (
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