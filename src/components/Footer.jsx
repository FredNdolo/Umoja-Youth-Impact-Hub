// File: src/components/Footer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const navLinks = [
  { to: '/',         label: 'Home'     },
  { to: '/about',    label: 'About Us' },
  { to: '/programs', label: 'Programs' },
  { to: '/contact',  label: 'Contact'  },
];

const socials = [
  {
    label: 'Instagram',
    href:  'https://instagram.com',
    icon: (
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    ),
  },
  {
    label: 'LinkedIn',
    href:  'https://linkedin.com',
    icon: (
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    ),
  },
  {
    label: 'X / Twitter',
    href:  'https://twitter.com',
    icon: (
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    ),
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email,        setEmail]        = useState('');
  const [status,       setStatus]       = useState('idle'); // idle | loading | success | error
  const [errorMsg,     setErrorMsg]     = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    try {
      await new Promise((r) => setTimeout(r, 1200));
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus('idle'), 5000);
    } catch {
      setStatus('error');
      setErrorMsg('Failed to subscribe. Please try again.');
    }
  };

  return (
    <footer className="bg-forest-dark text-cream/80 relative overflow-hidden">

      {/* Terracotta top rule */}
      <div className="h-1 w-full bg-terracotta" />

      {/* Subtle background texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, #C4622D 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, #2A5C40 0%, transparent 50%)`,
        }}
      />

      <div className="container-wide relative z-10 pt-14 pb-8">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3 mb-5 group">
              <div className="w-10 h-10 rounded-lg bg-cream/10 border border-cream/20 flex items-center justify-center
                              group-hover:bg-terracotta/20 group-hover:border-terracotta/40 transition-all duration-200">
                <span className="font-display font-bold text-lg text-cream">U</span>
              </div>
              <div>
                <span className="block font-display font-bold text-xl text-cream tracking-tight">UYIH</span>
                <span className="block font-sans text-[10px] uppercase tracking-[0.12em] text-terracotta">
                  Impact Hub
                </span>
              </div>
            </Link>

            <p className="font-sans text-sm text-cream/60 leading-relaxed mb-6 max-w-sm">
              Empowering youth in Narok East through sustainable development, environmental stewardship, and community health. Founded by young Kenyans, for Kenya.
            </p>

            {/* Socials */}
            <div className="flex gap-3">
              {socials.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-md border border-cream/15 flex items-center justify-center
                             text-cream/50 hover:text-cream hover:border-terracotta/60 hover:bg-terracotta/10
                             transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    {icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div>
            <h4 className="font-sans font-semibold text-xs uppercase tracking-[0.12em] text-terracotta mb-5">
              Navigation
            </h4>
            <ul className="space-y-3">
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="font-sans text-sm text-cream/60 hover:text-cream
                               flex items-center gap-2 group transition-colors duration-200"
                  >
                    <span className="w-4 h-px bg-cream/20 group-hover:w-5 group-hover:bg-terracotta transition-all duration-200" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="font-sans font-semibold text-xs uppercase tracking-[0.12em] text-terracotta mb-5">
              Contact
            </h4>
            <ul className="space-y-4">
              {[
                {
                  icon: (
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </>
                  ),
                  text: 'Narok East, Kenya',
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
                  text: 'umojayouthhub@gmail.com',
                  href: 'mailto:umojayouthhub@gmail.com',
                },
                {
                  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
                  text: '+254 783 218 081',
                  href: 'tel:+254783218081',
                },
              ].map(({ icon, text, href }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-md bg-terracotta/20 border border-terracotta/30
                                  flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {icon}
                    </svg>
                  </div>
                  {href ? (
                    <a href={href} className="font-sans text-sm text-cream/60 hover:text-cream transition-colors duration-200 leading-snug">
                      {text}
                    </a>
                  ) : (
                    <span className="font-sans text-sm text-cream/60 leading-snug">{text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Newsletter strip ── */}
        <div className="border border-terracotta/25 rounded-lg bg-terracotta/8 p-6 md:p-8 mb-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <p className="font-sans font-semibold text-xs uppercase tracking-[0.12em] text-terracotta mb-1">
                Newsletter
              </p>
              <h3 className="font-display font-bold text-xl text-cream mb-1">Stay informed</h3>
              <p className="font-sans text-sm text-cream/60">
                Community updates, program launches, and impact stories — straight to your inbox.
              </p>
            </div>

            <form
              onSubmit={handleSubscribe}
              className="flex flex-col sm:flex-row gap-3 md:min-w-[360px]"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-md bg-cream/8 border border-cream/20
                           font-sans text-sm text-cream placeholder-cream/40
                           focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/25
                           transition-all duration-200"
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary whitespace-nowrap px-5 py-3 text-sm
                           disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Subscribing…
                  </span>
                ) : status === 'success' ? (
                  '✓ Subscribed!'
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>

            {errorMsg && (
              <p className="font-sans text-xs text-red-400 mt-1">{errorMsg}</p>
            )}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="border-t border-cream/10 pt-6 flex flex-col md:flex-row items-center
                        justify-between gap-3 text-xs font-sans text-cream/40">
          <p>© {currentYear} Umoja Youth Impact Hub. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-terracotta inline-block" />
            Narok, Kenya
          </p>
        </div>

      </div>
    </footer>
  );
}