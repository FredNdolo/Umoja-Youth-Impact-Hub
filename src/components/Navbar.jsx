import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { to: '/',         label: 'Home'     },
  { to: '/about',    label: 'About'    },
  { to: '/programs', label: 'Programs' },
  { to: '/treemonitoringapp', label: 'Tree Monitor' },
  { to: '/contact',  label: 'Contact'  },
];

import logo from '../assets/logo.jpg';

export default function Navbar() {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const location = useLocation();

  // Detect scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Lock body scroll when menu open on mobile
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Every page opens on a dark hero, so the header uses light text until
  // the cream background appears on scroll (or the mobile drawer opens).
  // Member pages and certificates sit on white, so they need dark text.
  const lightPage = /^\/(me|certificates|treemonitoringapp|tree-monitor|trees|t)(\/|$)/.test(location.pathname);
  const onDark = !scrolled && !menuOpen && !lightPage;

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        className={`print:hidden fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
          scrolled || lightPage
            ? 'bg-cream/95 backdrop-blur-xl border-b border-sand-dark/30 shadow-sm'
            : 'bg-transparent backdrop-blur-sm'
        }`}
      >
        <div className="container-wide">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* ── Logo ── */}
            <Link
              to="/"
              className="flex items-center gap-3 flex-shrink-0 group"
              aria-label="UYIH Home"
            >
              <div className="w-9 h-9 transition-transform duration-200 group-hover:scale-105 overflow-hidden rounded-lg">
                <img 
                  src={logo} 
                  alt="UYIH Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="leading-none">
                <span className={`block font-display font-bold text-lg tracking-tight transition-colors duration-300 ${onDark ? 'text-cream' : 'text-forest'}`}>
                  Umoja Youth
                </span>
                <span className="block font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-terracotta">
                  Impact Hub
                </span>
              </div>
            </Link>

            {/* ── Desktop nav ── */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`nav-link relative px-4 py-2 rounded-md font-medium hover:text-terracotta transition-colors duration-200 ${
                    isActive(to) ? 'text-terracotta' : onDark ? 'text-cream' : 'text-forest'
                  }`}
                >
                  {label}
                  {isActive(to) && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-terracotta rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* ── Desktop CTAs ── */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/me" className={`text-sm font-medium px-2 py-2 transition-colors hover:text-terracotta ${onDark ? 'text-cream/85' : 'text-forest'}`}>
                Log in
              </Link>
              <Link 
                to="/donate" 
                className="btn-secondary text-sm px-5 py-2.5 border border-terracotta/70 hover:border-terracotta text-terracotta hover:bg-terracotta/5"
              >
                Donate
              </Link>
              <Link to="/join" className="btn-primary text-sm px-5 py-2.5">
                Join Us
              </Link>
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] rounded-md
                         hover:bg-sand/20 transition-colors duration-200"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.22 }}
                className={`block w-5 h-0.5 rounded-full origin-center ${onDark ? 'bg-cream' : 'bg-forest'}`}
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.22 }}
                className={`block w-3.5 h-0.5 rounded-full self-end ${onDark ? 'bg-cream' : 'bg-forest'}`}
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.22 }}
                className={`block w-5 h-0.5 rounded-full origin-center ${onDark ? 'bg-cream' : 'bg-forest'}`}
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile menu overlay ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-ink/30 md:hidden"
              onClick={() => setMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-4/5 max-w-xs bg-cream
                         flex flex-col shadow-card-lg md:hidden safe-top safe-bottom"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 h-16 border-b border-sand-dark/50">
                <span className="font-display font-bold text-forest text-lg">Menu</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-sand transition-colors"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Drawer links */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto" aria-label="Mobile navigation">
                {navLinks.map(({ to, label }, i) => (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.3 }}
                  >
                    <Link
                      to={to}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-md font-sans font-medium text-base
                                  transition-all duration-200 ${
                        isActive(to)
                          ? 'bg-forest text-cream'
                          : 'text-ink hover:bg-sand hover:text-forest'
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {isActive(to) && (
                        <span className="w-1 h-1 rounded-full bg-terracotta flex-shrink-0" />
                      )}
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Drawer CTA */}
              <div className="px-4 pb-8 pt-4 border-t border-sand-dark/50 space-y-3">
                <Link
                  to="/me"
                  className="block w-full text-center text-forest font-medium py-2.5 hover:text-terracotta"
                  onClick={() => setMenuOpen(false)}
                >
                  Member log in
                </Link>
                <Link
                  to="/donate"
                  className="block w-full text-center border border-terracotta/70 hover:border-terracotta text-terracotta font-medium py-3.5 rounded-md hover:bg-terracotta/5 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Donate
                </Link>
                <Link
                  to="/join"
                  className="btn-primary w-full text-base py-3.5 justify-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Join Us →
                </Link>
                <p className="text-center font-sans text-xs text-ink-faint mt-4">
                  Narok, Kenya
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}