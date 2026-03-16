// File: src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/programs', label: 'Programs' },
  { to: '/community', label: 'Community' },
  { to: '/contact', label: 'Contact' },
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-dark-900/80 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-xl bg-primary-500 opacity-20 group-hover:opacity-40 blur-md transition-opacity duration-300" />
              <div className="relative w-10 h-10 rounded-xl border border-primary-500/60 flex items-center justify-center bg-dark-800/80">
                <span
                  className="font-display font-black text-lg"
                  style={{ color: '#00f594' }}
                >
                  U
                </span>
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-extrabold text-lg text-white tracking-tight">UYIH</span>
              <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: '#00f594' }}>
                Impact Hub
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 font-sans ${
                  isActive(to)
                    ? 'text-primary-500'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {isActive(to) && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(0,245,148,0.08)', border: '1px solid rgba(0,245,148,0.2)' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link to="/contact" className="btn-primary text-sm px-5 py-2.5">
              Get Involved
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <motion.span
              animate={isMenuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              className="block w-6 h-0.5 bg-white rounded-full origin-center transition-colors duration-200"
            />
            <motion.span
              animate={isMenuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              className="block w-4 h-0.5 bg-white rounded-full self-end"
            />
            <motion.span
              animate={isMenuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              className="block w-6 h-0.5 bg-white rounded-full origin-center"
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden"
            style={{ background: 'rgba(6,15,30,0.95)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map(({ to, label }, i) => (
                <motion.div
                  key={to}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link
                    to={to}
                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive(to)
                        ? 'text-primary-500 bg-primary-500/10 border border-primary-500/20'
                        : 'text-neutral-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="pt-2 pb-2"
              >
                <Link to="/contact" className="btn-primary w-full text-sm justify-center">
                  Get Involved
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;
