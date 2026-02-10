// File: src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-primary-500 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2 hover:scale-105 transition-transform duration-200">
            <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="text-xl font-bold">UYIH</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-secondary-500 text-white' 
                  : 'hover:bg-primary-600 hover:text-secondary-300'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className={`px-3 py-2 rounded-md transition-all duration-200 ${
                isActive('/about') 
                  ? 'bg-secondary-500 text-white' 
                  : 'hover:bg-primary-600 hover:text-secondary-300'
              }`}
            >
              About
            </Link>
            <Link 
              to="/programs" 
              className={`px-3 py-2 rounded-md transition-all duration-200 ${
                isActive('/programs') 
                  ? 'bg-secondary-500 text-white' 
                  : 'hover:bg-primary-600 hover:text-secondary-300'
              }`}
            >
              Programs
            </Link>
            <Link 
              to="/community" 
              className={`px-3 py-2 rounded-md transition-all duration-200 ${
                isActive('/community') 
                  ? 'bg-secondary-500 text-white' 
                  : 'hover:bg-primary-600 hover:text-secondary-300'
              }`}
            >
              Community
            </Link>
            <Link 
              to="/contact" 
              className={`px-3 py-2 rounded-md transition-all duration-200 ${
                isActive('/contact') 
                  ? 'bg-secondary-500 text-white' 
                  : 'hover:bg-primary-600 hover:text-secondary-300'
              }`}
            >
              Contact
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-primary-600 transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="py-4 space-y-2">
            <Link 
              to="/" 
              className={`block px-3 py-2 rounded-md transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-secondary-500 text-white' 
                  : 'hover:bg-primary-600 hover:text-secondary-300'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className={`block px-3 py-2 rounded-md transition-all duration-200 ${
                isActive('/about') 
                  ? 'bg-secondary-500 text-white' 
                  : 'hover:bg-primary-600 hover:text-secondary-300'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/programs" 
              className={`block px-3 py-2 rounded-md transition-all duration-200 ${
                isActive('/programs') 
                  ? 'bg-secondary-500 text-white' 
                  : 'hover:bg-primary-600 hover:text-secondary-300'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Programs
            </Link>
            <Link 
              to="/community" 
              className={`block px-3 py-2 rounded-md transition-all duration-200 ${
                isActive('/community') 
                  ? 'bg-secondary-500 text-white' 
                  : 'hover:bg-primary-600 hover:text-secondary-300'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Community
            </Link>
            <Link 
              to="/contact" 
              className={`block px-3 py-2 rounded-md transition-all duration-200 ${
                isActive('/contact') 
                  ? 'bg-secondary-500 text-white' 
                  : 'hover:bg-primary-600 hover:text-secondary-300'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;