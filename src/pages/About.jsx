// File: src/pages/About.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import storyImage from '../assets/story-image.JPG';
import aboutHero from '../assets/about-hero.jpg';
import gallery1 from '../assets/gallery-1.JPG';
import gallery2 from '../assets/gallery-2.JPG';
import gallery3 from '../assets/gallery-3.JPG';
import gallery4 from '../assets/gallery-4.JPG';
import gallery6 from '../assets/gallery-6.JPG';
import gallery7 from '../assets/gallery-7.JPG';


const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

function PhotoPlaceholder({ alt, className = '', bg = '#D4C8B0' }) {
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ background: bg }} role="img" aria-label={alt}
    >
      {/* PHOTO SWAP: replace with <img src={yourPhoto} alt="..." className="w-full h-full object-cover" /> */}
      <div className="text-center px-4 py-6 select-none pointer-events-none">
        <svg className="w-7 h-7 mx-auto mb-2 opacity-25" fill="none" stroke="#F7F2E8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="font-sans text-[11px] text-cream/40 leading-snug max-w-[160px] mx-auto">{alt}</p>
      </div>
    </div>
  );
}

const values = [
  { icon: '🤝', title: 'Community First',    desc: 'We put the community at the center of every decision, ensuring initiatives are shaped by the people they serve.' },
  { icon: '🌱', title: 'Sustainability',      desc: 'Our programs are designed to create lasting positive change — economically, environmentally, and socially.' },
  { icon: '💡', title: 'Innovation',          desc: ' We embrace creative, evidence-based solutions to the complex challenges communities face every day.' },
  { icon: '🎯', title: 'Measurable Impact',   desc: 'Every action we take is tracked and measured by its tangible positive effect on the community.' },
];

const objectives = [
  { title: 'Expand Green Futures to 10 Schools',  status: 'In Progress', progress: 30 },
  { title: 'Achieve PBO Registration Status',      status: 'Planned',     progress: 15 },
  { title: 'Launch Green Youth Fund',              status: 'Planned',     progress: 5  },
  { title: 'Partner with International NGO',       status: 'In Progress', progress: 20 },
];

const impactNumbers = [
  { stat: '500+',  label: 'Youth Reached',       detail: 'Across Narok'                      },
  { stat: '3,000+',label: 'Trees Planted',        detail: 'Native species since 2024'        },
  { stat: '200+',  label: 'Girls Supported',      detail: 'Sanitary supplies distributed'    },
  { stat: '3',     label: 'Strategic Partners',   detail: 'Government and civil society'     },
];

export default function About() {
  const [openObj, setOpenObj] = useState(null);

  return (
    <div className="bg-cream">

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20 md:pb-28 bg-forest overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(196,98,45,0.12) 0%, transparent 60%)',
        }} />
        {/* PHOTO SWAP: replace PhotoPlaceholder with about-narok.JPG — Narok East landscape */}
        {/* HERO IMAGE: about-hero.jpg */}
<img
  src={aboutHero}
  alt="Wide landscape view of Narok East, Kenya — rolling hills and community environment"
  className="absolute inset-0 w-full h-full object-cover opacity-20"
  loading="lazy"
/>
        <div className="container-narrow relative z-10 text-center">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.span variants={fadeUp} className="eyebrow text-cream/60 mb-6 justify-center block">Our Story</motion.span>
            <motion.h1 variants={fadeUp} className="font-display font-bold text-display-2xl text-cream mb-6">
              About <span className="text-terracotta">UYIH</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="font-sans text-lg text-cream/70 max-w-xl mx-auto leading-relaxed">
              Transforming communities through youth-led initiatives and sustainable development since 2024.
            </motion.p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-terracotta" />
      </section>


      {/* ══ OUR STORY ════════════════════════════════════════════ */}
      <section className="section-cream">
        <div className="container-narrow">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">

            <div className="reveal-right order-2 md:order-1">
              <div className="relative">
                <img
                  src={storyImage}
                  alt="UYIH members in a working session, Narok East Kenya"
                  className="w-full h-80 md:h-96 object-cover rounded-lg"
                  loading="lazy"
                />
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-terracotta rounded-md -z-10" />
                <div className="absolute -top-4 -left-4 w-16 h-16 border-2 border-forest/30 rounded-md -z-10" />
              </div>
            </div>

            <div className="reveal order-1 md:order-2">
              <span className="eyebrow mb-5 block">Founded 2024</span>
              <h2 className="font-display font-bold text-display-lg text-forest mb-6">Our Story</h2>
              <p className="font-sans text-base text-ink-muted leading-relaxed mb-4">
              Umoja Youth Impact Hub (UYIH) was born from a shared vision: a coalition of young professionals in Narok County who believed that change starts at home, in underserved communities too often overlooked by mainstream development efforts.
              </p>
              <p className="font-sans text-base text-ink-muted leading-relaxed mb-4">
                We focus on healthcare access, environmental sustainability, and youth economic empowerment
                through community-led solutions and strategic partnerships. Our flagship Green Futures Initiative
                empowers school communities through tree propagation and sustainable income generation.
              </p>
              <p className="font-sans text-base text-ink-muted leading-relaxed mb-8">
                Every program we run is designed, delivered, and owned by youths for a sustainable future.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Healthcare', 'Environment', 'Youth Empowerment', 'Green Futures', 'Narok East'].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-md font-sans font-medium text-xs bg-sand border border-sand-dark/60 text-forest">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ══ MISSION / VISION ════════════════════════════════════ */}
<section className="section-sand border-t border-sand-dark/60">
  <div className="container-wide">
    <div className="grid md:grid-cols-2 gap-6 stagger-children">
      {[
        {
          label: 'Our Mission',
          icon: '🎯',
          bg: 'bg-forest',
          text: 'To empower residents of underserved communities by providing access to healthcare, environmental solutions, and economic opportunities, enhancing quality of life and promoting sustainable development.',
        },
        {
          label: 'Our Vision',
          icon: '🌍',
          bg: 'bg-terracotta',
          text: 'To foster healthier, more educated, and environmentally sustainable communities through integrated youth-led initiatives that create lasting positive change for generations to come.',
        },
      ].map((item) => (
        <div key={item.label} className={`${item.bg} rounded-lg p-6 md:p-8`}>
          <div className="text-3xl mb-4">{item.icon}</div>
          <span className="font-sans font-semibold text-xs uppercase tracking-[0.10em] text-cream/60 mb-3 block">{item.label}</span>
          <p className="font-display font-bold text-2xl md:text-3xl text-cream leading-snug">{item.text}</p>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* ══ CORE VALUES ═════════════════════════════════════════ */}
      <section className="section-cream border-t border-sand-dark/60">
        <div className="container-wide">
          <div className="reveal text-center mb-14">
            <span className="eyebrow mb-4 justify-center">What Drives Us</span>
            <h2 className="font-display font-bold text-display-lg text-forest">Core Values</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {values.map((v, i) => (
              <div key={i} className="card-hover p-6">
                <div className="w-12 h-12 rounded-lg bg-terracotta/10 flex items-center justify-center text-2xl mb-4">{v.icon}</div>
                <h3 className="font-display font-bold text-lg text-forest mb-3">{v.title}</h3>
                <div className="w-8 h-0.5 bg-terracotta rounded-full mb-3" />
                <p className="font-sans text-sm text-ink-muted leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ IMPACT NUMBERS ══════════════════════════════════════ */}
      <section className="bg-forest py-20 md:py-28">
        <div className="container-wide">
          <div className="reveal text-center mb-14">
            <span className="eyebrow text-cream/60 mb-4 justify-center">Impact by the Numbers</span>
            <h2 className="font-display font-bold text-display-lg text-cream">The results speak.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger-children">
            {impactNumbers.map((item, i) => (
              <div key={i} className="text-center">
                <div className="stat-number text-5xl md:text-6xl mb-2" style={{ color: '#C4622D' }}>{item.stat}</div>
                <div className="font-sans font-semibold text-sm text-cream mb-1">{item.label}</div>
                <div className="font-sans text-xs text-cream/50">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ STRATEGIC OBJECTIVES ════════════════════════════════ */}
      <section className="section-sand border-t border-sand-dark/60">
        <div className="container-narrow">
          <div className="reveal mb-12">
            <span className="eyebrow mb-4 block">Where We Are Going</span>
            <h2 className="font-display font-bold text-display-lg text-forest">Strategic Objectives</h2>
          </div>
          <div className="space-y-3 stagger-children">
            {objectives.map((obj, i) => (
              <div
                key={i}
                className="card p-0 overflow-hidden cursor-pointer"
                onClick={() => setOpenObj(openObj === i ? null : i)}
              >
                <div className="flex items-center justify-between p-5 md:p-6">
                  <div className="flex items-center gap-4 flex-1">
                    <span className={`flex-shrink-0 px-2.5 py-1 rounded font-sans font-semibold text-xs ${
                      obj.status === 'In Progress'
                        ? 'bg-terracotta/15 text-terracotta'
                        : 'bg-sand-dark/60 text-ink-muted'
                    }`}>{obj.status}</span>
                    <h3 className="font-sans font-semibold text-sm md:text-base text-forest">{obj.title}</h3>
                  </div>
                  <svg
                    className={`w-5 h-5 text-ink-faint flex-shrink-0 ml-4 transition-transform duration-200 ${openObj === i ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {openObj === i && (
                  <div className="px-5 md:px-6 pb-5 border-t border-sand-dark/60">
                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-sans text-xs text-ink-muted">Progress</span>
                        <span className="font-sans font-semibold text-xs text-terracotta">{obj.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-sand-dark/60 overflow-hidden">
                        <motion.div
                          className="h-full bg-terracotta rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${obj.progress}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ IMPACT GALLERY STRIP ════════════════════════════════ */}
<section className="bg-sand border-t border-sand-dark/60 py-0 overflow-hidden">
  <div className="flex gap-1">
    {[gallery1, gallery2, gallery3, gallery4, gallery6, gallery7].map((img, i) => (
      <div key={i} className="flex-1 h-44 md:h-60 overflow-hidden">
        <img
          src={img}
          alt={`UYIH community impact photo ${i + 1} — youth programs and events in Narok East`}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
    ))}
  </div>
</section>


      {/* ══ CTA ═════════════════════════════════════════════════ */}
      <section className="section-cream border-t border-sand-dark/60">
        <div className="container-narrow text-center reveal">
          <span className="eyebrow mb-5 justify-center">Join the Movement</span>
          <h2 className="font-display font-bold text-display-lg text-forest mb-6">
            Be part of the change.
          </h2>
          <p className="font-sans text-base text-ink-muted leading-relaxed mb-10 max-w-md mx-auto">
            Whether you want to volunteer, partner, or support — there is a place for you in the UYIH family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="btn-primary px-8 py-4 text-base">Get Involved →</Link>
            <Link to="/programs" className="btn-secondary px-8 py-4 text-base">Explore Programs</Link>
          </div>
        </div>
      </section>

    </div>
  );
}