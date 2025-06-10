import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Music, User, LogOut, Home, Library, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-slate-900 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto">
        {/* Top Bar */}
        <div className="h-16 flex items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="text-sky-400"
            >
              <Music size={28} />
            </motion.div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 text-transparent bg-clip-text">
              AudioShare
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/profile" 
                  className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-slate-800"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-white px-4 py-1.5 rounded-md transition-all duration-200 shadow-lg shadow-sky-500/20"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="w-full bg-slate-800 border-t border-slate-700/50">
        <div className="container mx-auto">
          <nav className="h-12 px-4">
            <div className="h-full flex items-center space-x-6">
              <Link 
                to="/" 
                className={`px-3 h-full flex items-center space-x-2 transition-colors relative ${
                  isActive('/') 
                    ? 'text-sky-400' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Home size={18} />
                <span>Home</span>
                {isActive('/') && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400"
                  />
                )}
              </Link>
              
              <Link 
                to="/library" 
                className={`px-3 h-full flex items-center space-x-2 transition-colors relative ${
                  isActive('/library') 
                    ? 'text-sky-400' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Library size={18} />
                <span>Library</span>
                {isActive('/library') && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400"
                  />
                )}
              </Link>
              
              <Link 
                to="/upload" 
                className={`px-3 h-full flex items-center space-x-2 transition-colors relative ${
                  isActive('/upload') 
                    ? 'text-sky-400' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload size={18} />
                <span>Upload</span>
                {isActive('/upload') && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400"
                  />
                )}
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}