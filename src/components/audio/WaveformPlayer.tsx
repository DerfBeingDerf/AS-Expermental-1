import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { motion } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import { PlaylistTrack } from '../../types';

type WaveformPlayerProps = {
  tracks: PlaylistTrack[];
  currentTrackIndex: number;
  onTrackChange: (index: number) => void;
};

export default function WaveformPlayer({ tracks, currentTrackIndex, onTrackChange }: WaveformPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const currentTrack = tracks[currentTrackIndex]?.audio_file;

  useEffect(() => {
    if (!waveformRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#38bdf8',
      progressColor: '#fb923c', // Softer orange (orange-400)
      cursorColor: '#ffffff',
      barWidth: 2,
      barGap: 2,
      barRadius: 4,
      cursorWidth: 0,
      height: 80,
      barMinHeight: 3,
      normalize: true,
      backend: 'WebAudio',
      interact: true // Enable waveform interaction
    });

    // Set maximum volume
    wavesurfer.current.setVolume(1.0);

    wavesurfer.current.on('finish', () => {
      setIsPlaying(false);
      playNextTrack();
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => {
      setIsPlaying(false);
      if (wavesurfer.current) {
        wavesurfer.current.seekTo(0);
      }
    });

    // Ensure volume is always maximum when audio context is created
    wavesurfer.current.on('ready', () => {
      if (wavesurfer.current) {
        wavesurfer.current.setVolume(1.0);
      }
    });

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!wavesurfer.current || !currentTrack) return;

    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    wavesurfer.current.load(currentTrack.file_url, undefined, abortController.current.signal);
    setIsPlaying(false);

    // Ensure volume is maximum after loading new track
    wavesurfer.current.setVolume(1.0);

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [currentTrackIndex, currentTrack]);

  const togglePlayPause = () => {
    if (!wavesurfer.current) return;
    
    if (isPlaying) {
      wavesurfer.current.pause();
    } else {
      wavesurfer.current.play();
    }
  };

  const playNextTrack = () => {
    if (currentTrackIndex < tracks.length - 1) {
      onTrackChange(currentTrackIndex + 1);
    } else {
      onTrackChange(0);
    }
  };

  const playPreviousTrack = () => {
    if (wavesurfer.current && wavesurfer.current.getCurrentTime() > 3) {
      wavesurfer.current.seekTo(0);
    } else if (currentTrackIndex > 0) {
      onTrackChange(currentTrackIndex - 1);
    }
  };

  if (!currentTrack) {
    return <div className="text-center py-4 text-slate-400">No tracks to play</div>;
  }

  return (
    <div className="w-full max-w-2xl bg-gradient-to-br from-slate-800/90 to-slate-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl">
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-1">{currentTrack.title}</h3>
        <p className="text-sky-400">{currentTrack.artist || 'Unknown Artist'}</p>
      </div>
      
      <div 
        ref={waveformRef}
        className="mb-6 rounded-lg overflow-hidden bg-slate-900/50 cursor-pointer hover:bg-slate-900/70 transition-colors"
      />
      
      <div className="flex justify-center items-center space-x-6">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={playPreviousTrack}
          className="text-slate-300 hover:text-white transition-colors"
        >
          <SkipBack size={24} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlayPause}
          className="bg-gradient-to-r from-sky-500 to-orange-400 hover:from-sky-400 hover:to-orange-300 text-white p-4 rounded-full shadow-lg"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={playNextTrack}
          className="text-slate-300 hover:text-white transition-colors"
        >
          <SkipForward size={24} />
        </motion.button>
      </div>
    </div>
  );
}