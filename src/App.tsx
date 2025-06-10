import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UploadPage from './pages/UploadPage';
import LibraryPage from './pages/LibraryPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import EmbedPage from './pages/EmbedPage';

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Update page title based on route
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    let title = 'AudioShare';
    
    if (pathSegments.length > 0) {
      const page = pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1);
      title = `${page} | AudioShare`;
    }
    
    document.title = title;
  }, [location]);
  
  // Check if we're on the embed page
  const isEmbed = location.pathname.startsWith('/embed');

  return (
    <>
      {!isEmbed && <Navbar />}
      
      <main className={isEmbed ? '' : 'min-h-screen pt-16'}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Public routes */}
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/collection/:collectionId" element={<CollectionDetailPage />} />
          
          {/* Public embed route */}
          <Route path="/embed/:collectionId" element={<EmbedPage />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/\" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;