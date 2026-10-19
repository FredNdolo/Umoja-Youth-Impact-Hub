// File: src/pages/GreenFutures.jsx
// High-level overview only. The full concept note (problem analysis,
// phases, budget, targets and partner roles) is shared on request through
// /request-document?doc=green-futures-proposal.
// Green Futures Initiative: school tree nurseries whose seedling sales fund
// sanitary products for girls. Content from the Green Futures proposal
// (Fred Ndolo, UYIH Executive Director, August 2026), delivered with the
// Kenya Girl Guides Association.
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import seedlingImg from '../assets/environment.webp';

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const STATS = [
  { value: '3',       label: 'Pilot schools',        detail: 'Selected in Narok East sub-county' },
  { value: '10,000',  label: 'Seedlings per school', detail: 'Grown in each nursery over the pilot' },
  { value: '75%+',    label: 'Survival target',      detail: 'For seedlings in every school' },
  { value: '3,500+',  label: 'Trees planted',        detail: 'By UYIH since 2024' },
];

const LOOP = [
  { n: '1', title: 'Grow', text: 'Girl Guides in each pilot school, supported by UYIH members, raise indigenous and fruit tree seedlings in a school nursery.' },
  { n: '2', title: 'Sell', text: 'Seedlings and trees are sold to local markets.' },
  { n: '3', title: 'Fund dignity', text: 'Profits buy sanitary products for girls, preferably reusable pads, on a self-renewing basis rather than a one-off donation.' },
  { n: '4', title: 'Reinvest', text: 'The surplus expands the nurseries, so there is more to sell and more to give.' },
];

export default function GreenFutures() {
  return (
    <div className="bg-cream">

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative bg-forest overflow-hidden pt-28 md:pt-32">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(196,98,45,0.18) 0%, transparent 55%)',
        }} />
        <div className="container-wide relative z-10 grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center pb-16 md:pb-20">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-terracotta/20 text-cream px-3 py-1 font-sans text-xs font-semibold tracking-wide uppercase mb-6">
              <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" aria-hidden="true" /> Green Futures Initiative · Phase 1 underway
            </motion.span>
            <motion.h1 variants={fadeUp} className="font-display font-bold text-display-2xl text-cream">
              One seed.<br /><span className="text-terracotta">Two crises solved.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="font-sans text-lg text-cream/80 mt-6 max-w-xl leading-relaxed">
              School tree nurseries whose seedling sales pay for sanitary products for girls, delivered with the
              Kenya Girl Guides Association. Planting trees, empowering students, transforming communities in Narok East.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mt-8">
              <Link to="/contact" className="btn-primary">Partner with us</Link>
              <Link to="/request-document?doc=green-futures-proposal"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-sans font-semibold text-cream border-2 border-cream/40 hover:border-cream hover:bg-cream/10 transition-all">
                Request the full proposal
              </Link>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="relative">
            <img src={seedlingImg} alt="Hands cupping a young seedling in dark soil"
              className="w-full h-72 md:h-96 lg:h-[28rem] object-cover rounded-xl shadow-card-lg" loading="eager" />
            <div className="absolute -bottom-5 -left-3 md:-left-6 bg-cream rounded-lg shadow-card-lg px-5 py-4 max-w-[15rem]">
              <p className="font-display font-bold text-2xl text-forest leading-none">Every seedling</p>
              <p className="font-sans text-xs text-ink-muted mt-1">is both an environmental investment and a source of ongoing revenue for school welfare.</p>
            </div>
          </motion.div>
        </div>
        <div className="h-1 bg-terracotta" />
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════ */}
      <section className="bg-sand-light border-b border-sand-dark/50">
        <div className="container-wide py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <div key={s.label} className={`px-2 md:px-6 ${i > 0 ? 'md:border-l border-sand-dark/60' : ''}`}>
              <p className="stat-number text-4xl md:text-5xl">{s.value}</p>
              <p className="font-sans font-semibold text-sm text-forest mt-1">{s.label}</p>
              <p className="font-sans text-xs text-ink-muted">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ TREE MONITOR ══════════════════════════════════════════ */}
      <section className="bg-forest">
        <div className="container-wide py-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-sans text-cream">
            <span className="font-semibold">🌳 Track every tree.</span>{' '}
            <span className="text-cream/80">Live survival, growth and a map of every seedling planted, in our Tree Monitor.</span>
          </p>
          <Link to="/treemonitoringapp" className="btn-primary text-sm">Open the Tree Monitor →</Link>
        </div>
      </section>

      {/* ══ IN BRIEF ══════════════════════════════════════════════ */}
      <section className="section-cream">
        <div className="container-wide grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div className="reveal">
            <span className="eyebrow mb-4 block">The idea in brief</span>
            <h2 className="font-display font-bold text-display-lg text-forest">Trees for the land. Dignity for girls.</h2>
            <p className="font-sans text-lg text-ink-muted mt-5 leading-relaxed">
              Narok East faces soil erosion and deforestation, and many girls miss school each month for lack of sanitary
              products. Green Futures tackles both at once: school nurseries grow indigenous and fruit tree seedlings, and
              the money from selling them buys sanitary products, year after year rather than as a one-off donation.
            </p>
          </div>
          <div className="reveal bg-forest rounded-xl p-7 md:p-9">
            <span className="eyebrow text-cream/60 mb-3 block">Where and with whom</span>
            <p className="font-display text-display-sm text-cream leading-snug">
              Three pilot schools in Narok East, delivered with the Kenya Girl Guides Association.
            </p>
            <p className="font-sans text-sm text-cream/75 mt-4 leading-relaxed">
              Girl Guides run the nurseries with support from trained UYIH members, and every tree planted is tracked in our
              Tree Monitor.
            </p>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS: THE LOOP ════════════════════════════════ */}
      <section className="section-forest relative overflow-hidden">
        <div className="container-wide relative z-10">
          <div className="reveal max-w-2xl mb-12">
            <span className="eyebrow text-cream/60 mb-4 block">How it works</span>
            <h2 className="font-display font-bold text-display-lg text-cream">A loop that pays for itself.</h2>
          </div>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
            {LOOP.map((s, i) => (
              <li key={s.n} className="relative rounded-lg bg-cream/5 border border-cream/15 p-6">
                <span className="font-display font-bold text-5xl text-terracotta leading-none">{s.n}</span>
                <h3 className="font-display font-bold text-2xl text-cream mt-3">{s.title}</h3>
                <p className="font-sans text-sm text-cream/75 mt-2 leading-relaxed">{s.text}</p>
                <span aria-hidden="true" className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 text-terracotta text-2xl">
                  {i < LOOP.length - 1 ? '→' : '↺'}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ FULL PROPOSAL ON REQUEST ═════════════════════════════ */}
      <section className="section-sand">
        <div className="container-wide">
          <div className="reveal card p-7 md:p-10 grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
            <div>
              <span className="eyebrow mb-3 block">Want the full picture?</span>
              <h2 className="font-display font-bold text-display-md text-forest">Request the full concept note.</h2>
              <p className="font-sans text-ink-muted mt-3 leading-relaxed">
                Partners, funders and researchers can request the complete Green Futures proposal. We share it by email
                once we’ve reviewed your request.
              </p>
              <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-2 font-sans text-sm text-ink">
                {['The problem in detail', 'How the nurseries and sales work', 'Implementation phases and timeline',
                  'Budget and sustainability plan', 'Targets and how we measure them', 'Roles of UYIH, KGGA and the schools'].map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-terracotta" aria-hidden="true">✓</span>{t}</li>
                ))}
              </ul>
            </div>
            <div className="text-center md:text-left">
              <Link to="/request-document?doc=green-futures-proposal" className="btn-primary text-base px-7 py-4">
                Request the full proposal →
              </Link>
              <p className="font-sans text-xs text-ink-faint mt-3">Takes a minute: your name, email and how you’ll use it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section className="bg-terracotta py-20 md:py-24 relative overflow-hidden">
        <div className="container-narrow text-center relative z-10">
          <h2 className="font-display font-bold text-display-xl text-cream mb-4">Let’s grow Green Futures together.</h2>
          <p className="font-sans text-lg text-cream/85 max-w-2xl mx-auto mb-8">
            We invite partners to join us in transforming schools into hubs of environmental restoration and economic
            empowerment. Together, we can ensure no girl misses school for lack of sanitary products and no community
            lacks green cover.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-md font-sans font-semibold text-terracotta bg-cream hover:bg-sand transition-colors">
              Become a partner →
            </Link>
            <Link to="/join" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-md font-sans font-semibold text-cream border-2 border-cream/60 hover:border-cream hover:bg-cream/10 transition-colors">
              Volunteer with us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
