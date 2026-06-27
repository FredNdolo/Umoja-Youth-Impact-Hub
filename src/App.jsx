// File: src/App.jsx
import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// ── Lazy pages ──────────────────────────────────────────────────────
const Home     = React.lazy(() => import('./pages/Home'));
const About    = React.lazy(() => import('./pages/About'));
const Programs = React.lazy(() => import('./pages/Programs'));
const Contact  = React.lazy(() => import('./pages/Contacts'));

// ── Page transition variants ────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 18 },
  enter:   { opacity: 1, y: 0,  transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } },
};

// ── Animated page wrapper ───────────────────────────────────────────
function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

// ── Skeleton loaders — per-page shapes ──────────────────────────────

// Generic hero + content skeleton
function SkeletonBase({ rows = 3, hasImage = true }) {
  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      {hasImage && (
        <div className="sk-hero" />
      )}
      <div className="container-wide py-16 space-y-12">
        {/* Eyebrow + heading */}
        <div className="space-y-3">
          <div className="sk-badge" />
          <div className="sk-heading" />
          <div className="sk-text-md w-1/2" />
        </div>
        {/* Content rows */}
        <div className="grid md:grid-cols-3 gap-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="sk-card" />
              <div className="sk-text-md" />
              <div className="sk-text-sm" />
              <div className="sk-text-xs w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-cream animate-fade-in">
      {/* Hero — full bleed */}
      <div className="sk-hero" style={{ height: '100vh' }} />
      {/* Stats strip */}
      <div className="bg-sand py-10">
        <div className="container-wide flex gap-8">
          {[1,2,3].map(i => (
            <div key={i} className="flex-1 space-y-2">
              <div className="sk-heading w-24" />
              <div className="sk-text-xs w-full" />
            </div>
          ))}
        </div>
      </div>
      <SkeletonBase hasImage={false} rows={3} />
    </div>
  );
}

function AboutSkeleton() {
  return (
    <div className="min-h-screen bg-cream animate-fade-in">
      <div className="sk-hero" style={{ height: '60vh' }} />
      <div className="container-wide py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div className="space-y-4">
            <div className="sk-badge" />
            <div className="sk-heading" />
            <div className="sk-text-md" />
            <div className="sk-text-md w-5/6" />
            <div className="sk-text-sm w-4/6" />
          </div>
          <div className="sk-image rounded-lg" />
        </div>
        <div className="grid md:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-2">
              <div className="sk-card" />
              <div className="sk-text-sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgramsSkeleton() {
  return (
    <div className="min-h-screen bg-cream animate-fade-in">
      <div className="sk-hero" style={{ height: '50vh' }} />
      <div className="container-wide py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="space-y-3">
              <div className="sk-image rounded-lg" />
              <div className="sk-badge" />
              <div className="sk-text-lg w-3/4" />
              <div className="sk-text-sm" />
              <div className="sk-text-xs w-2/3" />
              <div className="sk-btn" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactSkeleton() {
  return (
    <div className="min-h-screen bg-cream animate-fade-in">
      <div className="sk-hero" style={{ height: '40vh' }} />
      <div className="container-narrow py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-4 items-center">
                <div className="sk-avatar" style={{ borderRadius: '12px', height: '48px', width: '48px' }} />
                <div className="flex-1 space-y-2">
                  <div className="sk-text-xs w-1/3" />
                  <div className="sk-text-sm w-2/3" />
                </div>
              </div>
            ))}
            <div className="sk-image rounded-lg" style={{ height: '200px' }} />
          </div>
          <div className="space-y-4">
            <div className="sk-text-lg" />
            {[1,2,3,4].map(i => (
              <div key={i} className="space-y-1">
                <div className="sk-text-xs w-1/4" />
                <div className="sk-card" style={{ height: '44px' }} />
              </div>
            ))}
            <div className="sk-btn w-full" style={{ height: '48px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Route skeleton map ───────────────────────────────────────────────
function PageSkeleton({ path }) {
  if (path === '/')         return <HomeSkeleton />;
  if (path === '/about')    return <AboutSkeleton />;
  if (path === '/programs') return <ProgramsSkeleton />;
  if (path === '/contact')  return <ContactSkeleton />;
  return <SkeletonBase />;
}

// ── Scroll to top on navigation ─────────────────────────────────────
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// ── App ──────────────────────────────────────────────────────────────
function App() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <ScrollToTop />
      <Navbar />

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <Suspense fallback={<PageSkeleton path="/" />}>
                  <PageWrapper><Home /></PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/about"
              element={
                <Suspense fallback={<PageSkeleton path="/about" />}>
                  <PageWrapper><About /></PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/programs"
              element={
                <Suspense fallback={<PageSkeleton path="/programs" />}>
                  <PageWrapper><Programs /></PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/contact"
              element={
                <Suspense fallback={<PageSkeleton path="/contact" />}>
                  <PageWrapper><Contact /></PageWrapper>
                </Suspense>
              }
            />
            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <PageWrapper>
                  <div className="min-h-screen flex flex-col items-center justify-center bg-cream px-4 text-center">
                    <span className="eyebrow mb-6">Page Not Found</span>
                    <h1 className="font-display text-display-xl text-forest mb-4">404</h1>
                    <p className="font-sans text-ink-muted mb-8 max-w-sm">
                      The page you're looking for doesn't exist or has moved.
                    </p>
                    <a href="/" className="btn-primary">Back to Home</a>
                  </div>
                </PageWrapper>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

      <Footer />
      <Analytics />
    </div>
  );
}

export default App;