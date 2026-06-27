// File: src/pages/Contacts.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const subjects = [
  'Volunteer Enquiry',
  'Partnership / MOU',
  'Program Information',
  'Donation / Funding',
  'Media / Press',
  'General Enquiry',
];

const contactInfo = [
  {
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ),
    label: 'Location',
    value: 'Narok County, Kenya',
    href: null,
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    label: 'Email',
    value: 'umojayouthhub@gmail.com',
    href: 'mailto:umojayouthhub@gmail.com',
  },
  {
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
    label: 'Phone',
    value: '+254 783 218 081',
    href: 'tel:+254783218081',
  },
];

const involvedOptions = [
  { icon: '🙌', title: 'Volunteer',   desc: 'Join our team on the ground in Narok East — program delivery, outreach, skills training, and more.' },
  { icon: '🤝', title: 'Partner',     desc: 'Formalise collaboration through an MOU. We welcome NGOs, schools, government bodies, and businesses.' },
  { icon: '💛', title: 'Support',     desc: 'Fund a program, sponsor a school nursery kit, or donate sanitary supplies for girls in our network.' },
  { icon: '📣', title: 'Advocate',    desc: 'Amplify our work through your networks, media, or advocacy platforms to expand our reach.' },
];

export default function Contacts() {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors]   = useState({});
  const [status, setStatus]   = useState('idle'); // idle | loading | success | error

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!form.email.trim())   e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.subject)        e.subject = 'Please select a subject';
    if (!form.message.trim()) e.message = 'Message is required';
    return e;
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStatus('loading');
    try {
      await new Promise(r => setTimeout(r, 1500));
      setStatus('success');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 6000);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-cream">

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20 bg-forest overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 60% 40%, rgba(196,98,45,0.12) 0%, transparent 55%)',
        }} />
        <div className="container-narrow relative z-10 text-center">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.span variants={fadeUp} className="eyebrow text-cream/60 mb-6 justify-center block">Reach Out</motion.span>
            <motion.h1 variants={fadeUp} className="font-display font-bold text-display-2xl text-cream mb-6">
              Contact <span className="text-terracotta">UYIH</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="font-sans text-lg text-cream/70 max-w-lg mx-auto leading-relaxed">
              Reach out to empower our community. Whether you want to volunteer, partner, or just learn more — we would love to hear from you.
            </motion.p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-terracotta" />
      </section>


      {/* ══ CONTACT INFO CARDS ═══════════════════════════════════ */}
      <section className="bg-sand border-b border-sand-dark/60 py-10">
        <div className="container-wide">
          <div className="grid md:grid-cols-3 gap-4 stagger-children">
            {contactInfo.map((c, i) => (
              <div key={i} className="card p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-terracotta/15 border border-terracotta/25 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">{c.icon}</svg>
                </div>
                <div>
                  <p className="font-sans font-semibold text-xs uppercase tracking-[0.1em] text-ink-muted mb-1">{c.label}</p>
                  {c.href ? (
                    <a href={c.href} className="font-sans text-sm font-medium text-forest hover:text-terracotta transition-colors">{c.value}</a>
                  ) : (
                    <p className="font-sans text-sm text-ink leading-snug">{c.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ GET IN TOUCH FORM ════════════════════════════════════ */}
      <section className="section-cream">
        <div className="container-narrow">
          <div className="grid md:grid-cols-5 gap-12 md:gap-16">

            {/* Left — Ways to get involved */}
            <div className="md:col-span-2 reveal">
              <span className="eyebrow mb-5 block">Get Involved</span>
              <h2 className="font-display font-bold text-display-md text-forest mb-8">
                There is a role for everyone.
              </h2>
              <div className="space-y-5">
                {involvedOptions.map((opt) => (
                  <div key={opt.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-sand flex items-center justify-center text-xl flex-shrink-0">{opt.icon}</div>
                    <div>
                      <h3 className="font-sans font-semibold text-sm text-forest mb-1">{opt.title}</h3>
                      <p className="font-sans text-xs text-ink-muted leading-relaxed">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Form */}
            <div className="md:col-span-3 reveal-right">
              <h2 className="font-display font-bold text-display-md text-forest mb-8">Send a Message</h2>

              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg bg-forest/5 border border-forest/20 p-8 text-center"
                >
                  <div className="text-4xl mb-4">✅</div>
                  <h3 className="font-display font-bold text-display-sm text-forest mb-2">Message Sent!</h3>
                  <p className="font-sans text-sm text-ink-muted">Thank you for reaching out. We will be in touch soon.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {/* Name + Email */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="input-label">Full Name *</label>
                      <input
                        type="text" name="name" value={form.name} onChange={handleChange}
                        placeholder="Your full name"
                        className={`input-field ${errors.name ? 'border-red-400 ring-1 ring-red-400/30' : ''}`}
                      />
                      {errors.name && <p className="font-sans text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="input-label">Email Address *</label>
                      <input
                        type="email" name="email" value={form.email} onChange={handleChange}
                        placeholder="your@email.com"
                        className={`input-field ${errors.email ? 'border-red-400 ring-1 ring-red-400/30' : ''}`}
                      />
                      {errors.email && <p className="font-sans text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Phone + Subject */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="input-label">Phone (Optional)</label>
                      <input
                        type="tel" name="phone" value={form.phone} onChange={handleChange}
                        placeholder="+254 700 000 000"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="input-label">Subject *</label>
                      <select
                        name="subject" value={form.subject} onChange={handleChange}
                        className={`input-field ${errors.subject ? 'border-red-400 ring-1 ring-red-400/30' : ''}`}
                      >
                        <option value="">Select a subject</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.subject && <p className="font-sans text-xs text-red-500 mt-1">{errors.subject}</p>}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="input-label">Message *</label>
                    <textarea
                      name="message" value={form.message} onChange={handleChange}
                      rows={5} placeholder="How can we help? Tell us about yourself and what you have in mind..."
                      className={`input-field resize-none ${errors.message ? 'border-red-400 ring-1 ring-red-400/30' : ''}`}
                    />
                    {errors.message && <p className="font-sans text-xs text-red-500 mt-1">{errors.message}</p>}
                  </div>

                  {status === 'error' && (
                    <p className="font-sans text-sm text-red-500 bg-red-50 rounded-md px-4 py-3">
                      Something went wrong. Please try again or email us directly.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="btn-primary w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === 'loading' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>


      {/* ══ SOCIAL LINKS ════════════════════════════════════════ */}
      <section className="section-sand border-t border-sand-dark/60">
        <div className="container-narrow text-center reveal">
          <span className="eyebrow mb-5 justify-center">Follow Us</span>
          <h2 className="font-display font-bold text-display-md text-forest mb-10">
            Stay connected.
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {[
              { label: 'Follow on Instagram', href: 'https://instagram.com', color: 'bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]' },
              { label: 'Connect on LinkedIn', href: 'https://linkedin.com',  color: 'bg-[#0077b5]' },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-md font-sans font-semibold text-sm text-cream ${s.color} hover:opacity-90 transition-opacity shadow-card`}
              >
                {s.label} →
              </a>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}