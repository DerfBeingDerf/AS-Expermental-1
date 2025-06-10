import React, { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';
import { motion } from 'framer-motion';

type CollectionEmbedProps = {
  collectionId: string;
};

export default function CollectionEmbed({ collectionId }: CollectionEmbedProps) {
  const [copied, setCopied] = useState(false);
  
  // Create the embed code with responsive styling
  const hostUrl = window.location.origin;
  const embedUrl = `${hostUrl}/embed/${collectionId}`;
  const embedCode = `<iframe 
  src="${embedUrl}"
  style="border: 0; width: 100%; height: 100%; min-height: 400px; overflow: auto; background: transparent;"
  scrolling="yes"
  allow="encrypted-media"
></iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="card p-5">
      <div className="flex items-center mb-4">
        <Code className="text-sky-400 mr-2" size={20} />
        <h3 className="text-lg font-semibold">Embed Collection</h3>
      </div>
      
      <p className="text-slate-300 text-sm mb-4">
        Copy this code to embed your collection on any website or blog.
      </p>
      
      <div className="bg-slate-900 rounded-md p-3 overflow-x-auto mb-4">
        <pre className="text-slate-300 text-sm">
          <code>{embedCode}</code>
        </pre>
      </div>
      
      <div className="flex justify-between">
        <a 
          href={embedUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sky-400 hover:text-sky-300 text-sm"
        >
          Preview embedded player
        </a>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={copyToClipboard}
          className="btn-primary text-sm py-1"
        >
          {copied ? (
            <span className="flex items-center">
              <Check size={16} className="mr-1" /> Copied!
            </span>
          ) : (
            <span className="flex items-center">
              <Copy size={16} className="mr-1" /> Copy Code
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}