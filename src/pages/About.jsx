// File: src/pages/About.jsx
import React from 'react';
import { motion } from 'framer-motion';
import storyImage from '../assets/story-image.JPG';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13 } },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const teamMembers = [
  {
    name: 'Fred Ndolo',
    role: 'Executive Director',
    bio: 'Visionary leader with extensive experience in community development and youth empowerment. Fred brings strategic leadership and a deep commitment to sustainable community transformation.',
    initial: 'F',
    accent: '#00f594',
  },
  {
    name: 'Joseph Ndolo',
    role: 'Director, Health & Environment',
    bio: 'Public health specialist and environmental advocate with expertise in community health initiatives and sustainable environmental practices.',
    initial: 'J',
    accent: '#00d9ff',
  },
  {
    name: 'Nikki Cherotich',
    role: 'Director, Operations & Finance',
    bio: 'Financial management expert and operations specialist with a passion for organizational efficiency and sustainable growth.',
    initial: 'N',
    accent: '#ff5e1f',
  },
];

const values = [
  {
    icon: '🤝',
    title: 'Community First',
    desc: 'We put the community at the center of every decision, ensuring initiatives are shaped by the people they serve.',
    accent: '#00f594',
  },
  {
    icon: '🌱',
    title: 'Sustainability',
    desc: 'Our programs are designed to create lasting positive change — economically, environmentally, and socially.',
    accent: '#00d9ff',
  },
  {
    icon: '💡',
    title: 'Innovation',
    desc: 'We embrace creative, evidence-based solutions to the complex challenges communities face every day.',
    accent: '#ff5e1f',
  },
  {
    icon: '🎯',
    title: 'Measurable Impact',
    desc: 'Every action we take is tracked and measured by its tangible positive effect on the community.',
    accent: '#a78bfa',
  },
];

function About() {
  return (
    <div className="min-h-screen" style={{ background: '#060f1e' }}>
      {/* ══════════ HERO ══════════ */}
      <section
        className="relative pt-32 pb-24 overflow-hidden hero-grid"
        style={{ background: '#030812' }}
      >
        <div className="glow-orb w-[600px] h-[600px] -top-40 left-1/4 opacity-30"
          style={{ background: 'rgba(0,245,148,0.15)' }} />
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.p variants={fadeUp} className="section-label justify-center">Our Story</motion.p>
            <motion.h1
              variants={fadeUp}
              className="font-display text-5xl md:text-7xl font-extrabold text-white mb-6"
            >
              About <span className="gradient-text">UYIH</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="text-neutral-400 text-xl max-w-2xl mx-auto"
            >
              Transforming communities through youth-led initiatives and sustainable development since 2024.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ══════════ STORY ══════════ */}
      <section className="py-24" style={{ background: '#060f1e' }}>
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="relative"
            >
              {/* Neon frame effect */}
              <div className="absolute -inset-1 rounded-3xl opacity-40"
                style={{ background: 'linear-gradient(135deg, rgba(0,245,148,0.3), rgba(0,217,255,0.3))', filter: 'blur(8px)' }} />
              <img
                src={storyImage}
                alt="UYIH Story"
                className="relative w-full rounded-2xl object-cover"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                loading="lazy"
              />
            </motion.div>

            <motion.div
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
            >
              <p className="section-label">Founded 2024</p>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white mb-6">
                Our <span className="gradient-text">Story</span>
              </h2>
              <p className="text-neutral-300 text-lg leading-relaxed mb-5">
                Umoja Youth Impact Hub (UYIH) was born from a shared vision: a coalition of young
                professionals in Narok County who believed that change starts at home, in underserved
                communities too often overlooked by mainstream development efforts.
              </p>
              <p className="text-neutral-400 leading-relaxed mb-8">
                We focus on healthcare access, environmental sustainability, and youth economic
                empowerment through community-led solutions and strategic partnerships. Our flagship
                Green Futures Initiative empowers school communities through tree propagation and
                sustainable income generation.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Healthcare', 'Environment', 'Youth Empowerment', 'Green Futures'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-semibold text-primary-500"
                    style={{ background: 'rgba(0,245,148,0.08)', border: '1px solid rgba(0,245,148,0.2)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ VALUES ══════════ */}
      <section className="py-24" style={{ background: '#0d1526' }}>
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="section-label justify-center">What Drives Us</p>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white">
              Our Core <span className="gradient-text">Values</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto"
          >
            {values.map(({ icon, title, desc, accent }, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="glass rounded-2xl p-6 group transition-all duration-300 hover:-translate-y-2"
                style={{ '--accent': accent }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-all duration-300"
                  style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}
                >
                  {icon}
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-3">{title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
                <div
                  className="mt-4 h-0.5 rounded-full w-0 group-hover:w-full transition-all duration-500"
                  style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════ TEAM ══════════ */}
      <section className="py-24" style={{ background: '#060f1e' }}>
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="section-label justify-center">The People Behind It</p>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white">
              Meet the <span className="gradient-text">Team</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          >
            {teamMembers.map(({ name, role, bio, initial, accent }, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="glass rounded-2xl p-7 text-center group hover:-translate-y-2 transition-all duration-300"
                style={{ borderColor: `${accent}18` }}
              >
                {/* Avatar */}
                <div className="relative inline-flex mb-5">
                  <div
                    className="absolute inset-0 rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity"
                    style={{ background: accent }}
                  />
                  <div
                    className="relative w-16 h-16 rounded-full flex items-center justify-center font-display text-2xl font-extrabold text-white"
                    style={{ background: `${accent}25`, border: `2px solid ${accent}50` }}
                  >
                    {initial}
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-1">{name}</h3>
                <p className="text-sm font-semibold mb-4" style={{ color: accent }}>{role}</p>
                <div className="w-8 h-px mx-auto mb-4"
                  style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
                <p className="text-neutral-400 text-sm leading-relaxed">{bio}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default About;