import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
    </div>
  );
}