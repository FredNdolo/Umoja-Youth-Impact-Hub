// File: src/pages/Programs.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const programs = [
  {
    id: 1,
    title: 'Healthcare Access',
    description: 'Community medical camps reaching over 5,000 residents annually, health education programs, mental health awareness campaigns, and healthcare referral networks with major hospitals.',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80',
    icon: '🏥',
    stats: '5,000+ residents/year',
    accent: '#00d9ff',
  },
  {
    id: 2,
    title: 'Green Futures Initiative',
    description: 'Our flagship program turning school grounds into productive tree nurseries that simultaneously provide sanitary supplies for girls and restore degraded ecosystems in Narok East.',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=80',
    icon: '🌳',
    stats: 'Phase 1 Live • 3 pilot schools • 200+ girls supported',
    accent: '#00f594',
  },
  {
    id: 3,
    title: 'Environmental Stewardship',
    description: 'Urban greening with 3,000+ trees planted, school-based eco-clubs, waste management education, recycling programs, and community clean-up drives engaging 1,000+ volunteers annually.',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
    icon: '🌱',
    stats: '3,000+ trees planted',
    accent: '#4ade80',
  },
  {
    id: 4,
    title: 'Youth Empowerment',
    description: 'Skills development workshops benefiting 800+ youth, environmental entrepreneurship incubation, community leadership training, and green business startup support.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
    icon: '👥',
    stats: '800+ youth trained',
    accent: '#a78bfa',
  },
  {
    id: 5,
    title: 'Community Events',
    description: 'Regular community gatherings, educational workshops, and celebration events that bring people together, inspire action, and create positive change through shared purpose.',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80',
    icon: '🎉',
    stats: 'Monthly events',
    accent: '#fbbf24',
  },
];

const kpis = [
  {
    title: 'Healthcare',
    icon: '🏥',
    accent: '#00d9ff',
    items: ['Residents served per camp', 'Referrals completed within 14 days', 'Health literacy score improvement', 'Preventive care adoption rates'],
  },
  {
    title: 'Environment',
    icon: '🌱',
    accent: '#00f594',
    items: ['Trees planted & 12-month survival rate', 'Seedlings propagated in school nurseries', 'Income from tree-related activities', 'Schools with active eco-clubs'],
  },
  {
    title: 'Livelihoods',
    icon: '📈',
    accent: '#a78bfa',
    items: ['Youth completing trainings', 'Job placement or internship rate', 'New micro-enterprises sustained (6m)', 'Income from green businesses'],
  },
];

export default function Programs() {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [registrationData, setRegistrationData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRegistrationChange = (e) => {
    const { name, value } = e.target;
    setRegistrationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1800));
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setSelectedProgram(null);
      setRegistrationData({ name: '', email: '', phone: '', message: '' });
    }, 3000);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#060f1e' }}>
      {/* HERO */}
      <section className="relative pt-32 pb-24 overflow-hidden hero-grid" style={{ background: '#030812' }}>
        <div className="glow-orb w-[600px] h-[600px] -top-40 left-1/3 opacity-30" style={{ background: 'rgba(0,217,255,0.12)' }} />
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.p variants={fadeUp} className="section-label justify-center">What We Do</motion.p>
            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl font-extrabold text-white mb-6">
              Our <span className="gradient-text">Programs</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-neutral-400 text-xl max-w-2xl mx-auto">
              Comprehensive initiatives in healthcare, environment, and youth empowerment — built by the community, for the community.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* PROGRAMS GRID */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {programs.map((program) => (
              <motion.div
                key={program.id}
                variants={fadeUp}
                className="glass rounded-2xl overflow-hidden group cursor-pointer hover:-translate-y-2 transition-all duration-400"
                style={{ borderColor: `${program.accent}20` }}
                onClick={() =>
                  program.id === 2
                    ? window.open('/green-futures', '_blank')   // Correct link for public/green-futures/index.html
                    : setSelectedProgram(program)
                }
                whileHover={{ boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${program.accent}18` }}
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${program.accent}25`, border: `1px solid ${program.accent}40`, backdropFilter: 'blur(8px)' }}>
                    {program.icon}
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: `${program.accent}20`, border: `1px solid ${program.accent}40`, color: program.accent, backdropFilter: 'blur(8px)' }}>
                      {program.stats}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-bold text-white mb-3">{program.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed mb-5 line-clamp-3">{program.description}</p>
                  <div className="flex items-center gap-2 text-sm font-semibold transition-colors duration-200"
                    style={{ color: program.accent }}>
                    <span>Learn More</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* GREEN FUTURES SHORT TEASER */}
      <section className="py-24" style={{ background: '#0d1526' }}>
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 md:p-12"
            style={{ borderColor: 'rgba(0,245,148,0.2)', boxShadow: '0 0 60px rgba(0,245,148,0.06)' }}
          >
            <div className="text-center mb-10">
              <div className="text-5xl mb-4">🌳</div>
              <p className="section-label justify-center">Flagship Program</p>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white mb-3">
                Green Futures Initiative
              </h2>
              <p className="text-neutral-400 max-w-2xl mx-auto">
                One seed. Two crises solved. Turning school grounds into productive nurseries that fund sanitary supplies for girls and restore ecosystems in Narok East.
              </p>
            </div>

            <div className="flex justify-center">
              <a
                href="/green-futures"
                target="_blank"
                className="btn-primary text-base px-10 py-4 inline-flex items-center gap-3 hover:scale-105 transition-transform"
              >
                Explore Full Green Futures Program →
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* KPIs */}
      <section className="py-24" style={{ background: '#060f1e' }}>
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="section-label justify-center">Measuring Impact</p>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white">
              Key Performance <span className="gradient-text">Indicators</span>
            </h2>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-5"
          >
            {kpis.map(({ title, icon, accent, items }, i) => (
              <motion.div key={i} variants={fadeUp} className="glass rounded-2xl p-6 hover:-translate-y-1 transition-all duration-300"
                style={{ borderColor: `${accent}20` }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
                    {icon}
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">{title}</h3>
                </div>
                <ul className="space-y-2.5">
                  {items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-neutral-400">
                      <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ background: accent }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden" style={{ background: '#0d1526' }}>
        <div className="glow-orb w-full h-full opacity-10"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,245,148,0.2) 0%, transparent 60%)' }} />
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-extrabold text-white mb-5">
              Join Our <span className="gradient-text">Mission</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-neutral-400 text-lg max-w-xl mx-auto mb-10">
              Volunteer, partner with us, or support our programs. Every contribution makes a difference.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="btn-primary text-base px-8 py-4">Get Involved</Link>
              <Link to="/contact" className="btn-ghost text-base px-8 py-4">Contact Us</Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* REGISTRATION MODAL */}
      <AnimatePresence>
        {selectedProgram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(3,8,18,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && setSelectedProgram(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              className="glass-strong rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-7">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-display text-xl font-bold text-white">Register Interest</h3>
                  <button
                    onClick={() => setSelectedProgram(null)}
                    className="w-8 h-8 glass rounded-lg flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="rounded-xl p-4 mb-6"
                  style={{ background: `${selectedProgram.accent}10`, border: `1px solid ${selectedProgram.accent}25` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span>{selectedProgram.icon}</span>
                    <h4 className="font-display font-bold text-white">{selectedProgram.title}</h4>
                  </div>
                  <p className="text-xs" style={{ color: selectedProgram.accent }}>{selectedProgram.stats}</p>
                </div>

                {isSubmitted ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ background: 'rgba(0,245,148,0.15)', border: '2px solid rgba(0,245,148,0.5)' }}>
                      <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="font-display text-xl font-bold text-white mb-2">You're Registered!</h4>
                    <p className="text-neutral-400 text-sm">We'll be in touch soon with program details.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleRegistrationSubmit} className="space-y-4">
                    {['name', 'email', 'phone'].map((field) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wide">
                          {field === 'name' ? 'Full Name' : field === 'email' ? 'Email Address' : 'Phone Number'} *
                        </label>
                        <input
                          type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                          name={field}
                          value={registrationData[field]}
                          onChange={handleRegistrationChange}
                          required
                          className="input-dark text-sm"
                          placeholder={
                            field === 'name' ? 'Your full name' :
                            field === 'email' ? 'your@email.com' :
                            '+254 700 000 000'
                          }
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wide">
                        Message (Optional)
                      </label>
                      <textarea
                        name="message"
                        value={registrationData.message}
                        onChange={handleRegistrationChange}
                        rows={3}
                        className="input-dark text-sm resize-none"
                        placeholder="Tell us about your interest..."
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProgram(null)}
                        className="btn-ghost flex-1 py-3 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`btn-primary flex-1 py-3 text-sm justify-center ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? 'Registering…' : 'Register'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
