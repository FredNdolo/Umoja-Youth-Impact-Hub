// File: src/pages/Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import heroImage from '../assets/hero-image.JPG';

import gallery1 from '../assets/gallery-1.JPG';
import gallery2 from '../assets/gallery-2.JPG';
import gallery3 from '../assets/gallery-3.JPG';
import gallery4 from '../assets/gallery-4.JPG';
import gallery5 from '../assets/gallery-5.JPG';
import gallery6 from '../assets/gallery-6.JPG';
import gallery7 from '../assets/gallery-7.JPG';
import gallery8 from '../assets/gallery-8.JPG';

/* ── Animation Variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

/* ── Animated Counter ── */
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Gallery images ── */
const galleryImages = [
  { src: gallery1, alt: 'Community event' },
  { src: gallery2, alt: 'Tree planting' },
  { src: gallery3, alt: 'Youth workshop' },
  { src: gallery4, alt: 'Healthcare camp' },
  { src: gallery5, alt: 'Green Futures nursery' },
  { src: gallery6, alt: 'Community gathering' },
  { src: gallery7, alt: 'Group impact moment' },
  { src: gallery8, alt: 'Environmental stewardship' },
];

const stats = [
  { value: 5000, suffix: '+', label: 'Residents Reached' },
  { value: 3000, suffix: '+', label: 'Trees Planted' },
  { value: 800, suffix: '+', label: 'Youth Trained' },
  { value: 15, suffix: '+', label: 'Schools Engaged' },
];

function Home() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const heroRef = useRef(null);
  const galleryRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const scrollLeft = () => galleryRef.current?.scrollBy({ left: -340, behavior: 'smooth' });
  const scrollRight = () => galleryRef.current?.scrollBy({ left: 340, behavior: 'smooth' });

  return (
    <div className="overflow-x-hidden">
      {/* ══════════ HERO ══════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center hero-grid overflow-hidden"
        style={{ background: '#060f1e' }}
      >
        {/* Glow orbs */}
        <div className="glow-orb w-[600px] h-[600px] -top-40 -left-20 opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(0,245,148,0.2) 0%, transparent 70%)' }} />
        <div className="glow-orb w-[500px] h-[500px] top-20 right-0 opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.15) 0%, transparent 70%)' }} />

        {/* Parallax hero image */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 overflow-hidden"
        >
          <img
            src={heroImage}
            alt="Community hero"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-30 blur-0' : 'opacity-0 blur-lg'}`}
          />
          {/* Dark overlay with gradient */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, rgba(6,15,30,0.85) 0%, rgba(6,15,30,0.6) 50%, rgba(6,15,30,0.8) 100%)' }} />
        </motion.div>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 container mx-auto px-4 md:px-8 py-32 text-center"
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.p variants={fadeUp} className="section-label justify-center mb-6">
              Narok County, Kenya — Est. 2024
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-extrabold leading-tight mb-6"
            >
              <span className="text-white">Welcome to </span>
              <span className="gradient-text">UYIH</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-neutral-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10"
            >
              Umoja Youth Impact Hub empowers underserved communities in Narok County through
              sustainable development, healthcare access, environmental stewardship, and youth
              economic empowerment.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/programs" className="btn-primary text-base px-8 py-4">
                Explore Programs
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link to="/about" className="btn-ghost text-base px-8 py-4">
                Learn More
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-neutral-500 text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-primary-500 to-transparent" />
        </motion.div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section className="py-20 relative" style={{ background: '#0d1526' }}>
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {stats.map(({ value, suffix, label }, i) => (
              <motion.div key={i} variants={fadeUp} className="stat-card">
                <p className="font-display text-4xl md:text-5xl font-extrabold mb-2 gradient-text">
                  <Counter target={value} suffix={suffix} />
                </p>
                <p className="text-neutral-400 text-sm">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ MISSION & VISION ══════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: '#060f1e' }}>
        <div className="glow-orb w-96 h-96 top-0 right-0 opacity-20"
          style={{ background: 'rgba(0,217,255,0.15)' }} />

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="section-label justify-center">Who We Are</p>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white">
              Purpose-Driven <span className="gradient-text">Impact</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {[
              {
                label: 'Our Mission',
                icon: '🎯',
                text: 'To empower residents of underserved communities by providing access to healthcare, environmental solutions, and economic opportunities, enhancing quality of life and promoting sustainable development.',
                accent: '#00f594',
              },
              {
                label: 'Our Vision',
                icon: '🔭',
                text: 'To foster healthier, more educated, and environmentally sustainable communities through integrated youth-led initiatives that create lasting positive change for generations to come.',
                accent: '#00d9ff',
              },
            ].map(({ label, icon, text, accent }, i) => (
              <motion.div
                key={i}
                variants={i === 0 ? fadeLeft : fadeRight}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                className="card group"
                style={{ borderColor: `${accent}20` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                    {icon}
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">{label}</h3>
                </div>
                <div className="w-12 h-0.5 mb-4 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
                <p className="text-neutral-400 leading-relaxed">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ GALLERY ══════════ */}
      <section className="py-24" style={{ background: '#0d1526' }}>
        <div className="container mx-auto px-4 md:px-8 mb-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4"
          >
            <div>
              <p className="section-label">Our Work</p>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white">
                Moments of <span className="gradient-text">Impact</span>
              </h2>
            </div>
            <div className="flex gap-3">
              <button
                onClick={scrollLeft}
                className="w-10 h-10 glass rounded-xl flex items-center justify-center text-neutral-400 hover:text-primary-500 hover:border-primary-500/40 transition-all"
                aria-label="Scroll left"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={scrollRight}
                className="w-10 h-10 glass rounded-xl flex items-center justify-center text-neutral-400 hover:text-primary-500 hover:border-primary-500/40 transition-all"
                aria-label="Scroll right"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scrollable gallery */}
        <div className="pl-4 md:pl-8">
          <div
            ref={galleryRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
            style={{ paddingRight: '2rem' }}
          >
            {galleryImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="relative flex-shrink-0 w-72 md:w-96 h-60 md:h-72 rounded-2xl overflow-hidden group"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white text-sm font-medium">{img.alt}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: '#060f1e' }}>
        <div className="glow-orb w-full h-full inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,245,148,0.12) 0%, transparent 60%)' }} />
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.p variants={fadeUp} className="section-label justify-center">Join Us</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-6xl font-extrabold text-white mb-6">
              Ready to make a <span className="gradient-text">difference?</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-neutral-400 text-lg max-w-2xl mx-auto mb-10">
              Partner with us, volunteer, or support our programs. Every contribution transforms a life in Narok County.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="btn-primary text-base px-8 py-4">
                Get Involved
              </Link>
              <Link to="/programs" className="btn-secondary text-base px-8 py-4">
                View Programs
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Home;
