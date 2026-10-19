// File: src/components/PhotoCarousel.jsx
// A gallery strip that drifts slowly sideways on its own, with arrow buttons
// (which nudge gently to show they can be used) to move one photo at a time.
// It pauses while someone hovers, touches or tabs into it, has a pause
// button, and stays still for people who've asked their device for less motion.
import React, { useCallback, useEffect, useRef, useState } from 'react';

export default function PhotoCarousel({ photos, label = 'Photo gallery', speed = 0.35, className = '' }) {
  const track = useRef(null);
  const pos = useRef(0);
  const hold = useRef(false);        // hovered / touched / focused
  const resumeAt = useRef(0);        // after an arrow press or swipe
  const [playing, setPlaying] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    setReduced(mq.matches);
    const on = (e) => setReduced(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  // The photos are rendered twice so the strip can loop without a jump
  const half = () => (track.current ? track.current.scrollWidth / 2 : 0);

  useEffect(() => {
    if (reduced || !playing) return undefined;
    let raf; let last = performance.now();
    const step = (t) => {
      const el = track.current;
      const dt = Math.min(64, t - last); last = t;
      if (el && !hold.current && t >= resumeAt.current) {
        pos.current += speed * (dt / 16);
        if (pos.current >= half()) pos.current -= half();
        el.scrollLeft = pos.current;
      } else if (el) {
        pos.current = el.scrollLeft;   // follow manual scrolling
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced, playing, speed]);

  const move = useCallback((dir) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector('[data-card]');
    const w = card ? card.getBoundingClientRect().width + 8 : el.clientWidth * 0.8;
    // Wrap around before moving so the strip never runs out
    if (dir < 0 && el.scrollLeft < w) el.scrollLeft += half();
    if (dir > 0 && el.scrollLeft + el.clientWidth + w > el.scrollWidth) el.scrollLeft -= half();
    resumeAt.current = performance.now() + 4000;
    el.scrollBy({ left: dir * w, behavior: reduced ? 'auto' : 'smooth' });
  }, [reduced]);

  const items = [...photos, ...photos];
  const arrow = 'absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-cream/95 text-forest shadow-card-lg flex items-center justify-center hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta';

  return (
    <section className={`relative ${className}`} aria-roledescription="carousel" aria-label={label}
      onMouseEnter={() => { hold.current = true; }} onMouseLeave={() => { hold.current = false; }}
      onFocus={() => { hold.current = true; }} onBlur={() => { hold.current = false; }}
      onTouchStart={() => { hold.current = true; }} onTouchEnd={() => { hold.current = false; resumeAt.current = performance.now() + 3000; }}>
      <div ref={track} className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onWheel={() => { resumeAt.current = performance.now() + 3000; }}>
        {items.map((p, i) => (
          <figure key={i} data-card className="flex-shrink-0 w-64 sm:w-72 md:w-80 h-44 md:h-60 overflow-hidden rounded-md bg-sand-dark/30"
            aria-hidden={i >= photos.length ? 'true' : undefined}>
            <img src={p.src} alt={i >= photos.length ? '' : p.alt} loading="lazy" draggable="false"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </figure>
        ))}
      </div>

      <button type="button" className={`${arrow} left-3`} onClick={() => move(-1)} aria-label="Previous photo">
        <span className="carousel-nudge-left text-xl leading-none" aria-hidden="true">←</span>
      </button>
      <button type="button" className={`${arrow} right-3`} onClick={() => move(1)} aria-label="Next photo">
        <span className="carousel-nudge-right text-xl leading-none" aria-hidden="true">→</span>
      </button>
      {!reduced && (
        <button type="button" onClick={() => setPlaying(!playing)}
          className="absolute bottom-3 right-3 z-10 rounded-full bg-forest/80 text-cream text-xs font-sans font-semibold px-3 py-1.5 hover:bg-forest"
          aria-label={playing ? 'Pause the gallery' : 'Play the gallery'}>
          {playing ? '❚❚ Pause' : '▶ Play'}
        </button>
      )}
    </section>
  );
}
