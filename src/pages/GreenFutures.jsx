// File: src/pages/GreenFutures.jsx
// Green Futures Initiative: school tree nurseries whose seedling sales fund
// sanitary products for girls. Content from the Green Futures concept note
// (Fred Ndolo, UYIH Executive Director).
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import seedlingImg from '../assets/environment.jpg';
import padsImg from '../assets/gallery-71.JPG';

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const STATS = [
  { value: '3',      label: 'Pilot schools',        detail: 'Active school nursery sites' },
  { value: '3,500+', label: 'Trees planted',        detail: 'By UYIH since 2024' },
  { value: '6',      label: 'Schools reached',      detail: 'Through sanitary pad donations' },
  { value: '10,000', label: 'Seedling target',      detail: 'For the Phase 1 pilot' },
];

const PROBLEMS = [
  { icon: '🏜️', title: 'Land under pressure', text: 'Narok East faces soil erosion, deforestation and water scarcity, which undermine livelihoods and deepen poverty.' },
  { icon: '📅', title: 'Girls missing school', text: 'Period poverty keeps many girls out of class every month because they lack sanitary products.' },
  { icon: '⏳', title: 'Relief that runs out', text: 'Pad drives are well-meaning but temporary. When the packs run out, the problem returns.' },
  { icon: '🏫', title: 'Untapped schools', text: 'Schools have land, community networks and student energy that are rarely used to tackle these challenges.' },
];

const LOOP = [
  { n: '1', title: 'Grow', text: 'Students and teachers raise indigenous and fruit tree seedlings in a school nursery.' },
  { n: '2', title: 'Sell', text: 'Seedlings and trees are sold to local markets, farmers and partners.' },
  { n: '3', title: 'Fund dignity', text: 'Profits buy sanitary products for girls in the same school, preferably reusable pads.' },
  { n: '4', title: 'Reinvest', text: 'Surplus expands the nursery, so next term there is more to sell and more to give.' },
];

const PILLARS = [
  { icon: '🌳', title: 'Environmental conservation', text: 'Indigenous and fruit tree nurseries in schools restore biodiversity, improve soil health and help the land hold water.' },
  { icon: '💰', title: 'Economic empowerment', text: 'Tree and seedling sales fund sanitary products for girls, reducing absenteeism and improving learning.' },
  { icon: '🎓', title: 'Capacity building', text: 'Students, teachers and community members learn nursery management, propagation and green entrepreneurship.' },
  { icon: '🔁', title: 'Sustainability', text: 'Sales revenue is reinvested in nursery expansion, skills training and welfare support, in a cycle that keeps going.' },
];

const PHASES = [
  {
    phase: 'Phase 1', name: 'Preparation', when: 'Months 1–3', status: 'Active',
    items: ['Needs assessment in selected schools', 'Supply of 5,000–10,000 indigenous and fruit seedlings', 'Baseline surveys on environmental and sanitary conditions'],
  },
  {
    phase: 'Phase 2', name: 'Training & nursery set-up', when: 'Months 4–6', status: 'Next',
    items: ['Practical workshops on nursery set-up, seedling care and sustainable practices', 'School-based management teams built on UYIH’s environmental club model'],
  },
  {
    phase: 'Phase 3', name: 'Sales & reinvestment', when: 'Months 7–12', status: 'Planned',
    items: ['Seedling and tree sales to local markets', 'Profits allocated to sanitary products; surplus reinvested in nurseries', 'Engagement through school clubs and parent–teacher associations', 'Integration into environmental education'],
  },
  {
    phase: 'Beyond year 1', name: 'Scale', when: 'From year 2', status: 'Goal',
    items: ['Expand from 3 pilot schools to 10 schools', 'Document the model so it can be replicated across the region'],
  },
];

const TARGETS = [
  { value: '5,000+', label: 'trees planted in the pilot', area: 'Environmental' },
  { value: '20–30%', label: 'less absenteeism among girls', area: 'Social' },
  { value: 'KES 0.5–1M', label: 'in sales revenue in year one', area: 'Economic' },
  { value: 'Quarterly', label: 'reports on trees, people trained, income and pads distributed', area: 'Monitoring' },
];

const WHY = [
  { title: 'Dual impact', text: 'One model tackles both environmental degradation and period poverty.' },
  { title: 'Living classrooms', text: 'Nurseries become part of school learning and extracurricular clubs.' },
  { title: 'Market-driven conservation', text: 'Caring for the environment pays for itself.' },
  { title: 'Community ownership', text: 'School clubs, parents and local leaders manage and monitor the work.' },
];

const statusStyle = {
  Active: 'bg-terracotta text-white',
  Next: 'bg-forest text-cream',
  Planned: 'bg-sand text-forest',
  Goal: 'bg-sand-light text-ink-muted border border-sand-dark',
};

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
              <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse" aria-hidden="true" /> Green Futures Initiative · Phase 1 live
            </motion.span>
            <motion.h1 variants={fadeUp} className="font-display font-bold text-display-2xl text-cream">
              One seed.<br /><span className="text-terracotta">Two crises solved.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="font-sans text-lg text-cream/80 mt-6 max-w-xl leading-relaxed">
              School tree nurseries whose seedling sales pay for sanitary products for girls. Planting trees,
              empowering students, transforming school communities in Narok East.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mt-8">
              <Link to="/contact" className="btn-primary">Partner with us</Link>
              <Link to="/request-document?doc=green-futures-phase1-concept-note"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-sans font-semibold text-cream border-2 border-cream/40 hover:border-cream hover:bg-cream/10 transition-all">
                Request the concept note
              </Link>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="relative">
            <img src={seedlingImg} alt="Hands cupping a young seedling in dark soil"
              className="w-full h-72 md:h-96 lg:h-[28rem] object-cover rounded-xl shadow-card-lg" loading="eager" />
            <div className="absolute -bottom-5 -left-3 md:-left-6 bg-cream rounded-lg shadow-card-lg px-5 py-4 max-w-[15rem]">
              <p className="font-display font-bold text-2xl text-forest leading-none">Every seedling</p>
              <p className="font-sans text-xs text-ink-muted mt-1">is both an environmental investment and a source of income for girls’ welfare.</p>
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

      {/* ══ WHY IT MATTERS ════════════════════════════════════════ */}
      <section className="section-cream">
        <div className="container-wide">
          <div className="reveal max-w-2xl mb-12">
            <span className="eyebrow mb-4 block">Why Green Futures matters</span>
            <h2 className="font-display font-bold text-display-lg text-forest">Two problems that keep each other going.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="card p-6">
                <div className="text-3xl mb-3" aria-hidden="true">{p.icon}</div>
                <h3 className="font-sans font-semibold text-forest mb-2">{p.title}</h3>
                <p className="font-sans text-sm text-ink-muted leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
          <p className="reveal font-display text-display-sm text-forest mt-12 max-w-3xl">
            Green Futures links environmental action with economic empowerment in a model that schools own and other
            communities can copy.
          </p>
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

      {/* ══ FOUR PILLARS ══════════════════════════════════════════ */}
      <section className="section-cream">
        <div className="container-wide grid lg:grid-cols-[1fr_1.4fr] gap-12 items-start">
          <div className="reveal lg:sticky lg:top-28">
            <span className="eyebrow mb-4 block">Four pillars of impact</span>
            <h2 className="font-display font-bold text-display-lg text-forest">Restoring land. Restoring dignity.</h2>
            <img src={padsImg} alt="Packs of sanitary pads ready for distribution at a school"
              className="mt-8 w-full h-64 object-cover rounded-lg shadow-card" loading="lazy" />
          </div>
          <div className="grid sm:grid-cols-2 gap-5 stagger-children">
            {PILLARS.map((p, i) => (
              <div key={p.title} className="card p-6">
                <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-terracotta font-semibold">Pillar 0{i + 1}</p>
                <div className="text-3xl my-3" aria-hidden="true">{p.icon}</div>
                <h3 className="font-sans font-semibold text-forest mb-2">{p.title}</h3>
                <p className="font-sans text-sm text-ink-muted leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ROADMAP ═══════════════════════════════════════════════ */}
      <section className="section-sand">
        <div className="container-wide">
          <div className="reveal max-w-2xl mb-12">
            <span className="eyebrow mb-4 block">Roadmap</span>
            <h2 className="font-display font-bold text-display-lg text-forest">How we’ll make it happen.</h2>
          </div>
          <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
            {PHASES.map((p) => (
              <li key={p.phase} className={`rounded-lg p-6 bg-cream border ${p.status === 'Active' ? 'border-terracotta shadow-terra' : 'border-sand-dark/60'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide">{p.phase} · {p.when}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle[p.status]}`}>{p.status}</span>
                </div>
                <h3 className="font-display font-bold text-2xl text-forest mt-3 mb-3">{p.name}</h3>
                <ul className="space-y-2">
                  {p.items.map((it) => (
                    <li key={it} className="flex gap-2.5 font-sans text-sm text-ink">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-terracotta flex-shrink-0" aria-hidden="true" />{it}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══ IMPACT WE EXPECT ══════════════════════════════════════ */}
      <section className="section-cream">
        <div className="container-wide">
          <div className="reveal max-w-2xl mb-12">
            <span className="eyebrow mb-4 block">Impact we expect</span>
            <h2 className="font-display font-bold text-display-lg text-forest">Targets for the pilot year.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-sand-dark/40 border border-sand-dark/40 rounded-lg overflow-hidden stagger-children">
            {TARGETS.map((t) => (
              <div key={t.label} className="bg-cream p-6 md:p-8">
                <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-terracotta font-semibold">{t.area}</p>
                <p className="stat-number text-4xl mt-2">{t.value}</p>
                <p className="font-sans text-sm text-ink-muted mt-1">{t.label}</p>
              </div>
            ))}
          </div>
          <p className="font-sans text-sm text-ink-muted mt-6 max-w-3xl">
            The aim: self-sufficient school nurseries that keep funding welfare and environmental activities long after the
            pilot, with marketable horticultural and business skills passed on to students and the community.
          </p>
        </div>
      </section>

      {/* ══ WHY THIS WORKS + QUOTE ════════════════════════════════ */}
      <section className="section-sand">
        <div className="container-wide grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="eyebrow mb-4 block">Why this works long-term</span>
            <ul className="space-y-5 mt-6">
              {WHY.map((w) => (
                <li key={w.title} className="flex gap-4">
                  <span className="mt-1 w-7 h-7 rounded-full bg-forest text-cream flex items-center justify-center text-sm flex-shrink-0" aria-hidden="true">✓</span>
                  <div>
                    <h3 className="font-sans font-semibold text-forest">{w.title}</h3>
                    <p className="font-sans text-sm text-ink-muted">{w.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <figure className="bg-forest rounded-xl p-8 md:p-10 relative">
            <span className="absolute -top-6 left-8 font-display text-8xl text-terracotta leading-none" aria-hidden="true">“</span>
            <blockquote className="font-display text-display-sm text-cream leading-snug">
              Green Futures is not a welfare program. It is built so that saving the environment and keeping girls in
              school become the same act.
            </blockquote>
            <figcaption className="font-sans text-sm text-cream/70 mt-6">
              <strong className="text-cream">Fred Ndolo</strong>, Executive Director, Umoja Youth Impact Hub
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section className="bg-terracotta py-20 md:py-24 relative overflow-hidden">
        <div className="container-narrow text-center relative z-10">
          <h2 className="font-display font-bold text-display-xl text-cream mb-4">Let’s grow Green Futures together.</h2>
          <p className="font-sans text-lg text-cream/85 max-w-2xl mx-auto mb-8">
            Together we can make sure no girl misses school for lack of sanitary products, and no community lacks green
            cover. We’re looking for partners to take the pilot to more schools.
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
