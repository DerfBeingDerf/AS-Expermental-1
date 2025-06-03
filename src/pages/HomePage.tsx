import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Upload, ListMusic, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Upload className="h-6 w-6 text-sky-400" />,
      title: 'Upload Audio',
      description: 'Upload your audio files and organize them in your personal library.',
    },
    {
      icon: <ListMusic className="h-6 w-6 text-sky-400" />,
      title: 'Create Playlists',
      description: 'Organize your audio into playlists for easy access and sharing.',
    },
    {
      icon: <ExternalLink className="h-6 w-6 text-sky-400" />,
      title: 'Share & Embed',
      description: 'Share your playlists or embed them directly on your website or blog.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-sky-500/20 mb-6">
              <Music size={36} className="text-sky-400" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Share Your Sound with the World
            </h1>
            
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Upload, organize, and share your audio content with embeddable players
              that work anywhere on the web.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              {user ? (
                <>
                  <button 
                    onClick={() => navigate('/library')}
                    className="btn-primary px-6 py-3 text-lg"
                  >
                    My Library
                  </button>
                  <button 
                    onClick={() => navigate('/upload')}
                    className="btn-secondary px-6 py-3 text-lg"
                  >
                    Upload Audio
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => navigate('/register')}
                    className="btn-primary px-6 py-3 text-lg"
                  >
                    Get Started
                  </button>
                  <button 
                    onClick={() => navigate('/login')}
                    className="btn-secondary px-6 py-3 text-lg"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card p-6 text-center"
              >
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-slate-800 mb-4 mx-auto">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-sky-900 to-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Share Your Audio?</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Join thousands of creators who share their audio content with embedded players.
          </p>
          
          {!user && (
            <button 
              onClick={() => navigate('/register')}
              className="btn-accent px-8 py-3 text-lg font-semibold"
            >
              Create Your Account
            </button>
          )}
        </div>
      </section>
    </div>
  );
}