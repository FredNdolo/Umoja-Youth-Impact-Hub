// File: src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import heroImage from '../assets/hero-image.JPG';
import InstagramFeed from '../components/InstagramFeed';

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

// ── Placeholder ──────────────────────────────────────────────────────
function PhotoPlaceholder({ alt, className = '', bg = '#D4C8B0' }) {
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ background: bg }}
      role="img"
      aria-label={alt}
    >
      {/* PHOTO SWAP: replace with <img src={yourPhoto} alt="..." className="w-full h-full object-cover" /> */}
      <div className="text-center px-4 py-6 select-none pointer-events-none">
        <svg className="w-7 h-7 mx-auto mb-2 opacity-25" fill="none" stroke="#1A3C2A" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="font-sans text-[11px] text-forest/40 leading-snug max-w-[160px] mx-auto">{alt}</p>
      </div>
    </div>
  );
}

// ── Program facts ────────────────────────────────────────────────────
const programFacts = [
  {
    icon: '🌱',
    stat: '3,000+',
    label: 'Trees Planted',
    desc: 'Indigenous seedlings propagated and planted since 2024.',
    color: '#1A3C2A',
  },
  {
    icon: '🎗️',
    stat: '200+',
    label: 'Girls Supported',
    desc: 'Female students receiving sanitary supplies through the Green Futures Initiative.',
    color: '#9B3A5A',
  },
  {
    icon: '🏫',
    stat: '3',
    label: 'Pilot Schools',
    desc: 'Active school nursery sites in Phase 1 of the Green Futures program.',
    color: '#C4622D',
  },
  {
    icon: '👥',
    stat: '500+',
    label: 'Youth Reached',
    desc: 'Young people engaged across health, environment, and empowerment programs.',
    color: '#2C4A7C',
  },
  {
    icon: '🤝',
    stat: '3',
    label: 'Key Partners',
    desc: 'Government and civil society partners amplifying our community reach.',
    color: '#5C3A1A',
  },
  {
    icon: '📅',
    stat: '2024',
    label: 'Year Founded',
    desc: 'Born in Narok, built by young professionals, for a sustainable future.',
    color: '#1A4A3A',
  },
];

// ── Publications ─────────────────────────────────────────────────────
const publications = [
  {
    type: 'Event Report',
    title: 'UYIH — Schools Need Assessment Report',
    desc: 'A needs assessment report for the schools we are setting up the Green Features Program.',
    date: 'May 2025',
    icon: '📄',
  },
  {
    type: 'Concept Note',
    title: 'Green Futures Initiative — Phase 1 Concept Note',
    desc: 'Overview of the school nursery model linking seedling sales to menstrual health support for girls in Narok East.',
    date: 'March 2025',
    icon: '📋',
  },
];

// ────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="bg-cream">

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="UYIH members and students gathered together in Narok East, Kenya"
            className="w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-forest/60 to-forest/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/70 via-transparent to-transparent hidden md:block" />
        </div>

        <motion.div
          className="absolute top-1/2 right-6 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        >
          <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-cream/40 [writing-mode:vertical-lr]">Scroll</span>
          <motion.div className="w-px h-12 bg-gradient-to-b from-cream/0 to-cream/40"
            animate={{ scaleY: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} />
        </motion.div>

        <div className="relative z-10 container-wide pb-16 md:pb-24 pt-32">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-2xl">
            <motion.span variants={fadeUp} className="eyebrow text-cream/70 mb-6 block">Narok, Kenya</motion.span>
            <motion.h1 variants={fadeUp} className="font-display font-bold text-display-2xl text-cream mb-6 leading-[0.95]">
              Youth{' '}<em className="not-italic text-terracotta">building</em>
              <br className="hidden sm:block" /> a sustainable future.
            </motion.h1>
            <motion.p variants={fadeUp} className="font-sans text-lg md:text-xl text-cream/75 leading-relaxed mb-10 max-w-lg">
            Umoja Youth Impact Hub empowers underserved communities in Narok County through sustainable development, healthcare access, environmental stewardship, and youth economic empowerment.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link to="/programs" className="btn-primary text-base px-8 py-4">Explore Our Work →</Link>
              <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-sans font-semibold text-base text-cream border-2 border-cream/50 hover:border-cream hover:bg-cream/10 transition-all duration-200">Get Involved</Link>
            </motion.div>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-terracotta" />
      </section>


      {/* ══ PROGRAM FACTS ════════════════════════════════════════ */}
      <section className="section-cream">
        <div className="container-wide">
          <div className="reveal mb-14 text-center max-w-xl mx-auto">
            <span className="eyebrow mb-4 justify-center">Impact by the Numbers</span>
            <h2 className="font-display font-bold text-display-lg text-forest">
              Real programs.<br />Measurable results.
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-sand-dark/40 border border-sand-dark/40 stagger-children">
            {programFacts.map((f, i) => (
              <div key={i} className="bg-cream hover:bg-sand transition-colors duration-300 p-6 md:p-8 group">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-4"
                  style={{ background: `${f.color}15` }}
                >{f.icon}</div>
                <div className="stat-number text-4xl md:text-5xl mb-1" style={{ color: f.color }}>{f.stat}</div>
                <div className="font-sans font-semibold text-sm text-forest mb-2">{f.label}</div>
                <p className="font-sans text-xs text-ink-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/programs" className="btn-secondary">View All Programs →</Link>
          </div>
        </div>
      </section>


      {/* ══ SOCIAL IMPACT FEED — real Instagram embeds ════════════ */}
      <section className="section-sand border-t border-sand-dark/60">
        <div className="container-wide">

          {/* Header */}
          <div className="reveal mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="eyebrow mb-4 block">Social Impact Feed</span>
              <h2 className="font-display font-bold text-display-lg text-forest">
                Follow our journey.
              </h2>
              <p className="font-sans text-sm text-ink-muted mt-3 max-w-sm">
                Real posts from our Instagram — see the work as it happens.
              </p>
            </div>
            <a
              href="https://www.instagram.com/umojayouthimpacthub/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-terra-outline self-start md:self-auto"
            >
              Follow @umojayouthimpacthub →
            </a>
          </div>

          {/* Real Instagram embeds — 3 posts side by side */}
          <div className="reveal">
            <InstagramFeed />
          </div>

        </div>
      </section>


      {/* ══ PUBLICATIONS ═════════════════════════════════════════ */}
      <section className="section-cream border-t border-sand-dark/60">
        <div className="container-wide">
          <div className="reveal mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="eyebrow mb-4 block">Publications</span>
              <h2 className="font-display font-bold text-display-lg text-forest">
                Our work, documented.
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {publications.map((pub, i) => (
              <div key={i} className="card-hover p-6 flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">{pub.icon}</div>
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded font-sans font-semibold text-[10px] uppercase tracking-wider bg-terracotta/10 text-terracotta mb-2">
                      {pub.type}
                    </span>
                    <h3 className="font-sans font-semibold text-sm text-forest leading-snug">{pub.title}</h3>
                  </div>
                </div>
                <p className="font-sans text-sm text-ink-muted leading-relaxed">{pub.desc}</p>
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-sand-dark/60">
                  <span className="font-sans text-xs text-ink-faint">{pub.date}</span>
                  <button className="font-sans text-xs font-semibold text-terracotta hover:underline transition-all">
                    Request Copy →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PARTNERS ═════════════════════════════════════════════ */}
      <section className="section-sand border-t border-sand-dark/60">
        <div className="container-wide text-center">
          <div className="reveal">
            <span className="eyebrow mb-4 justify-center">Trusted By</span>
            <p className="font-sans text-sm text-ink-muted mb-10 max-w-sm mx-auto">
              We work alongside government and civil society to amplify our impact across Narok County.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 stagger-children">
            {['Kenya Scouts Association', 'Kenya Girl Guides Association', 'ENSDA'].map((p) => (
              <div key={p} className="px-6 py-3 border border-sand-dark/80 rounded-md bg-cream font-sans font-semibold text-sm text-ink-muted hover:border-terracotta/60 hover:text-forest transition-all duration-200">
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ CTA BANNER ════════════════════════════════════════════ */}
      <section className="bg-terracotta py-20 md:py-28 relative overflow-hidden">
        <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-cream/15 pointer-events-none" />
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-cream/10 pointer-events-none" />
        <div className="container-narrow text-center relative z-10 reveal">
          <h2 className="font-display font-bold text-display-xl text-cream mb-6">
            Ready to make<br />a difference?
          </h2>
          <p className="font-sans text-lg text-cream/80 mb-10 max-w-md mx-auto leading-relaxed">
            Volunteer, partner with us, or support our programs. Every contribution strengthens our work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-sans font-semibold text-base text-terracotta bg-cream hover:bg-sand transition-all duration-200 shadow-terra-lg active:scale-[0.98]">
              Get Involved →
            </Link>
            <Link to="/programs" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-sans font-semibold text-base text-cream border-2 border-cream/50 hover:border-cream hover:bg-cream/10 transition-all duration-200 active:scale-[0.98]">
              See Our Programs
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}