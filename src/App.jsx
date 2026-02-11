// File: src/App.jsx
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Analytics } from '@vercel/analytics/react';   // ← Import from the React version

// Lazy load components for better performance
const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));
const Programs = React.lazy(() => import('./pages/Programs'));
const Contact = React.lazy(() => import('./pages/Contacts'));
const Community = React.lazy(() => import('./pages/Community'));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-white flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-primary-600 font-semibold">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/community" element={<Community />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      
      {/* Add Vercel Analytics here – it will track all page views and route changes */}
      <Analytics />
    </div>
  );
}

export default App;