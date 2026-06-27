import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function PhotoPlaceholder({ alt, className = '', bg = '#D4C8B0' }) {
  return (
    <div className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ background: bg }} role="img" aria-label={alt}>
      {/* PHOTO SWAP: replace with <img src={yourPhoto} alt="..." className="w-full h-full object-cover" /> */}
      <div className="text-center px-4 py-4 select-none pointer-events-none">
        <svg className="w-6 h-6 mx-auto mb-2 opacity-25" fill="none" stroke="#F7F2E8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="font-sans text-[11px] text-cream/40 leading-snug max-w-[140px] mx-auto">{alt}</p>
      </div>
    </div>
  );
}

// Import program images
import greenFuturesImg from '../assets/environment.jpg';     // Using environment for Green Futures as it's flagship environmental
import healthImg from '../assets/health.jpg';
import empowermentImg from '../assets/empowerment.jpg';
import environmentImg from '../assets/environment.jpg';
import partnershipImg from '../assets/partnership.jpg';

const programs = [
  {
    id: 1,
    eyebrow:  'Flagship Program',
    title:    'Green Futures Initiative',
    tagline:  'One seed. Two crises solved.',
    desc:     'School nurseries that simultaneously fund sanitary supplies for girls and restore degraded ecosystems in Narok East. Indigenous seedlings are propagated by students, sold to the community, and proceeds fund menstrual health supplies — keeping girls in school.',
    bullets:  ['3 pilot schools active', '200+ girls supported with sanitary supplies', 'Indigenous seedling propagation training', 'Community nursery markets established'],
    stat:     'Phase 1 Live',
    image: greenFuturesImg,
    placeholderAlt: 'Students and UYIH members tending to a school tree nursery as part of the Green Futures Initiative',
    placeholderBg:  '#1A3C2A',
    featured: true,
  },
  {
    id: 2,
    eyebrow:  'Health Program',
    title:    'Youth Health Access',
    tagline:  'Dignity. Health. Education.',
    desc:     'Delivering sanitary products, health education, and reproductive health awareness to girls across underserved schools in Narok East. We tackle period poverty directly — because no girl should miss school because of her period.',
    bullets:  ['Sanitary towel distribution drives', 'Menstrual health education sessions', 'School health awareness workshops', 'Community health referral networks'],
    stat:     '200+ Girls Reached',
    image: healthImg,
    placeholderAlt: 'UYIH volunteers distributing sanitary towels to female students at a partner school in Narok East',
    placeholderBg:  '#9B3A5A',
    featured: false,
  },
  {
    id: 3,
    eyebrow:  'Empowerment',
    title:    'Leadership & Skills',
    tagline:  'Build leaders. Build community.',
    desc:     'Bootcamps, workshops, and mentorship programs designed to equip young people in Narok East with the leadership skills and practical knowledge needed to drive community transformation.',
    bullets:  ['Youth leadership bootcamps', 'Skills development workshops', 'Environmental entrepreneurship incubation', 'Mentorship and peer support networks'],
    stat:     '500+ Youth Trained',
    image: empowermentImg,
    placeholderAlt: 'Youth attending a UYIH leadership training or skills development workshop in Narok',
    placeholderBg:  '#8B6914',
    featured: false,
  },
  {
    id: 4,
    eyebrow:  'Environment',
    title:    'Environmental Stewardship',
    tagline:  'Restore the land. Restore the future.',
    desc:     'Community-wide environmental programs including reforestation drives, eco-clubs in schools, waste management education, and clean-up campaigns that engage the whole community in environmental action.',
    bullets:  ['3,000+ trees planted since 2024', 'School eco-clubs established', 'Waste management and recycling education', 'Annual community clean-up drives'],
    stat:     '3,000+ Trees Planted',
    image: environmentImg,
    placeholderAlt: 'UYIH volunteers and community members planting trees during a reforestation drive in Narok East',
    placeholderBg:  '#2A5C40',
    featured: false,
  },
  {
    id: 5,
    eyebrow:  'Community',
    title:    'Events & Partnerships',
    tagline:  'Together, further.',
    desc:     'Open days, scouting expos, partnership forums, and community gatherings that connect youth to opportunities, celebrate impact, and build the coalitions needed for lasting change across Narok County.',
    bullets:  ['Scouts for a Sustainable Narok — July 2025', 'MOU partnerships with KGGA, KSA, ENSDA', 'Annual Green Futures Open Day', 'Government and NGO collaboration forums'],
    stat:     '4 Key Partners',
    image: partnershipImg,
    placeholderAlt: 'UYIH team and partner organizations at a community event or open day in Narok',
    placeholderBg:  '#2C4A7C',
    featured: false,
  },
];

const faqs = [
  { q: 'Who is eligible to participate in UYIH programs?',
    a: 'Our programs primarily target youth aged 12-35 in Narok. School-based programs focus on primary and secondary students, while skills and leadership programs are open to all youth in the region.' },
  { q: 'How can I get involved or volunteer?',
    a: 'We welcome volunteers for program delivery, community outreach, administration, and skills training. Reach out via our contact page and mention the area you want to contribute to.' },
  { q: 'How can an organization partner with UYIH?',
    a: 'We actively seek partnerships with schools, NGOs, government bodies, and private sector organizations. Contact us to discuss an MOU or collaboration framework.' },
  { q: 'Where does UYIH operate?',
    a: 'Our primary focus is Narok East, Narok County, Kenya. We are in the process of expanding our model to neighboring sub-counties and counties.' },
];

const kpis = [
  { label: 'Youth Reached',     value: '500+',   icon: '👥', detail: 'Across all programs'          },
  { label: 'Trees Planted',     value: '3,000+', icon: '🌳', detail: 'Native species since 2024'    },
  { label: 'Girls Supported',   value: '200+',   icon: '🎗️', detail: 'Via health programs'          },
  { label: 'Partner Schools',   value: '3',      icon: '🏫', detail: 'Active nursery sites'         },
];

export default function Programs() {
  const [openFaq, setOpenFaq]     = useState(null);
  const [activeProgram, setActive] = useState(null);

  return (
    <div className="bg-cream">

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20 bg-forest overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(196,98,45,0.15) 0%, transparent 55%)',
        }} />
        <div className="container-narrow relative z-10 text-center">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.span variants={fadeUp} className="eyebrow text-cream/60 mb-6 justify-center block">What We Do</motion.span>
            <motion.h1 variants={fadeUp} className="font-display font-bold text-display-2xl text-cream mb-6">
              Our <span className="text-terracotta">Programs</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="font-sans text-lg text-cream/70 max-w-xl mx-auto leading-relaxed">
              Comprehensive initiatives in environment, health, and youth empowerment — built by the community, for the community.
            </motion.p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-terracotta" />
      </section>


      {/* ══ PROGRAM IMPACT STRIP ═════════════════════════════════ */}
      <section className="bg-sand border-b border-sand-dark/60">
        <div className="container-wide py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger-children">
            {kpis.map((k, i) => (
              <div key={i} className={`flex flex-col px-4 md:px-6 ${i > 0 ? 'md:border-l border-sand-dark/60' : ''}`}>
                <span className="text-2xl mb-2">{k.icon}</span>
                <span className="stat-number text-4xl md:text-5xl mb-1">{k.value}</span>
                <span className="font-sans font-semibold text-sm text-forest mb-0.5">{k.label}</span>
                <span className="font-sans text-xs text-ink-muted">{k.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ FEATURED PROGRAM ════════════════════════════════════ */}
      <section className="section-cream">
        <div className="container-wide">
          <div className="reveal mb-12">
            <span className="eyebrow mb-4 block">Featured</span>
            <h2 className="font-display font-bold text-display-lg text-forest">Flagship Program</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-0 rounded-lg overflow-hidden shadow-card-lg border border-sand-dark/40">
            <img
              src={programs[0].image}
              alt={programs[0].placeholderAlt}
              className="w-full h-72 md:h-full min-h-[300px] object-cover"
              loading="lazy"
            />
            <div className="p-8 md:p-10 bg-cream flex flex-col justify-center">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-terracotta text-cream font-sans font-semibold text-xs mb-5 self-start">
                ⭐ {programs[0].eyebrow}
              </span>
              <h2 className="font-display font-bold text-display-md text-forest mb-2">{programs[0].title}</h2>
              <p className="font-sans font-medium text-sm text-terracotta mb-4">{programs[0].tagline}</p>
              <p className="font-sans text-sm text-ink-muted leading-relaxed mb-5">{programs[0].desc}</p>
              <ul className="space-y-2 mb-6">
                {programs[0].bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 font-sans text-sm text-ink">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta flex-shrink-0 mt-1.5" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4">
                <Link to="/contact" className="btn-primary text-sm">Get Involved →</Link>
                <a href="/green-futures" target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
                  Project Site →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ══ ALL PROGRAMS GRID ════════════════════════════════════ */}
      <section className="section-sand border-t border-sand-dark/60">
        <div className="container-wide">
          <div className="reveal mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="eyebrow mb-4 block">All Programs</span>
              <h2 className="font-display font-bold text-display-lg text-forest">Every angle covered.</h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 stagger-children">
            {programs.slice(1).map((p) => (
              <div
                key={p.id}
                className="card-hover overflow-hidden flex flex-col cursor-pointer"
                onClick={() => setActive(activeProgram === p.id ? null : p.id)}
              >
                <img
                  src={p.image}
                  alt={p.placeholderAlt}
                  className="w-full h-52 object-cover"
                  loading="lazy"
                />
                <div className="p-6 flex flex-col flex-1">
                  <span className="eyebrow text-xs mb-3">{p.eyebrow}</span>
                  <h3 className="font-display font-bold text-display-sm text-forest mb-1">{p.title}</h3>
                  <p className="font-sans font-medium text-sm text-terracotta mb-3">{p.tagline}</p>
                  <p className="font-sans text-sm text-ink-muted leading-relaxed mb-4">{p.desc}</p>

                  <AnimatePresence>
                    {activeProgram === p.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <ul className="space-y-2 mb-4 border-t border-sand-dark/60 pt-4">
                          {p.bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-3 font-sans text-sm text-ink">
                              <span className="w-1.5 h-1.5 rounded-full bg-terracotta flex-shrink-0 mt-1.5" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-sand-dark/60">
                    <span className="font-sans font-semibold text-xs text-terracotta">{p.stat}</span>
                    <button className="font-sans text-xs font-semibold text-forest hover:text-terracotta transition-colors flex items-center gap-1">
                      {activeProgram === p.id ? 'Less detail ↑' : 'More detail ↓'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ FAQ ══════════════════════════════════════════════════ */}
      <section className="section-cream border-t border-sand-dark/60">
        <div className="container-narrow">
          <div className="reveal mb-12 text-center">
            <span className="eyebrow mb-4 justify-center">FAQ</span>
            <h2 className="font-display font-bold text-display-lg text-forest">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3 stagger-children">
            {faqs.map((faq, i) => (
              <div key={i} className="card p-0 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-sans font-semibold text-sm md:text-base text-forest pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-terracotta flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 border-t border-sand-dark/60 pt-4">
                        <p className="font-sans text-sm text-ink-muted leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ CTA ═════════════════════════════════════════════════ */}
      <section className="bg-terracotta py-20 md:py-24 relative overflow-hidden">
        <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-cream/15 pointer-events-none" />
        <div className="container-narrow text-center relative z-10 reveal">
          <h2 className="font-display font-bold text-display-xl text-cream mb-6">
            Join a program.<br />Change a community.
          </h2>
          <p className="font-sans text-lg text-cream/80 mb-10 max-w-md mx-auto">
            Whether you are a student, volunteer, partner organisation, or donor — there is a role for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-sans font-semibold text-base text-terracotta bg-cream hover:bg-sand transition-all duration-200 shadow-terra-lg">
              Get Involved →
            </Link>
            <Link to="/about" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-sans font-semibold text-base text-cream border-2 border-cream/50 hover:border-cream hover:bg-cream/10 transition-all duration-200">
              About UYIH
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
