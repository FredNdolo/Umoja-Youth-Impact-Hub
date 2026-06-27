// File: src/components/InstagramFeed.jsx
// Renders real Instagram posts via oEmbed — no API key required.
// Instagram's embed.js script is loaded once globally and handles rendering.

import React, { useEffect, useRef, useState } from 'react';

const POSTS = [
  {
    url:     'https://www.instagram.com/p/DRH5tOSCr0O/',
    label:   'Community Event',
  },
  {
    url:     'https://www.instagram.com/reel/DUGU56QCEio/',
    label:   'Program Reel',
  },
  {
    url:     'https://www.instagram.com/p/DXgj1ixjSJ0/',
    label:   'Latest Post',
  },
];

// ── Skeleton card ────────────────────────────────────────────────────
function EmbedSkeleton() {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-sand-dark/60 bg-cream animate-pulse">
      {/* Fake Instagram header */}
      <div className="flex items-center gap-3 p-3 border-b border-sand-dark/40">
        <div className="sk-avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
        <div className="flex-1 space-y-1.5">
          <div className="sk-text-xs w-1/3" />
          <div className="sk-text-xs w-1/4" />
        </div>
      </div>
      {/* Fake image */}
      <div className="skeleton aspect-square w-full" />
      {/* Fake caption */}
      <div className="p-3 space-y-2">
        <div className="sk-text-sm" />
        <div className="sk-text-xs w-4/5" />
        <div className="sk-text-xs w-3/5" />
      </div>
    </div>
  );
}

// ── Single embed ─────────────────────────────────────────────────────
function InstagramEmbed({ url }) {
  const ref     = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Once the container mounts, ask Instagram's script to process it
    const tryProcess = () => {
      if (window.instgrm?.Embeds?.process) {
        window.instgrm.Embeds.process();
        setReady(true);
      }
    };

    // Script may already be loaded
    if (window.instgrm) {
      tryProcess();
      return;
    }

    // Otherwise wait for the global script to fire
    const interval = setInterval(() => {
      if (window.instgrm?.Embeds?.process) {
        tryProcess();
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [url]);

  return (
    <div ref={ref} className="relative w-full">
      {/* Skeleton shown until embed renders */}
      {!ready && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <EmbedSkeleton />
        </div>
      )}

      {/* Instagram blockquote — Instagram's script converts this to an iframe */}
      <blockquote
        className="instagram-media w-full"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        data-instgrm-captioned
        style={{
          background:   '#FFF',
          border:       '0',
          borderRadius: '8px',
          boxShadow:    '0 2px 16px rgba(28,28,26,0.08)',
          margin:       '0',
          maxWidth:     '100%',
          minWidth:     '326px',
          width:        '100%',
          padding:      '0',
        }}
      >
        {/* Fallback link inside blockquote */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-sans text-sm text-terracotta hover:underline block p-4"
        >
          View this post on Instagram →
        </a>
      </blockquote>
    </div>
  );
}

// ── Main feed component ──────────────────────────────────────────────
export default function InstagramFeed() {
  useEffect(() => {
    // Load Instagram embed script once
    if (document.getElementById('instagram-embed-script')) return;
    const script       = document.createElement('script');
    script.id          = 'instagram-embed-script';
    script.src         = '//www.instagram.com/embed.js';
    script.async       = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {POSTS.map((post) => (
        <InstagramEmbed key={post.url} url={post.url} />
      ))}
    </div>
  );
}