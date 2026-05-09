// File: src/pages/Contacts.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import contactImage from '../assets/contact-image.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
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

const contactDetails = [
  {
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ),
    label: 'Location',
    value: 'Narok, Kenya',
    accent: '#00f594',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    ),
    label: 'Email',
    value: 'umojayouthhub@gmail.com',
    accent: '#00d9ff',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    ),
    label: 'Phone',
    value: '+254 783 218 081',
    accent: '#ff5e1f',
  },
];

const faqs = [
  {
    q: 'Who can participate in UYIH programs?',
    a: 'Youth, caregivers, schools, and community members. Some trainings have limited slots — follow our socials for calls.',
  },
  {
    q: 'Do you offer certificates?',
    a: 'Yes — upon completing specified training hours and assessments in selected bootcamps.',
  },
  {
    q: 'How can organizations partner with UYIH?',
    a: 'Email partnership proposals to umojayouthhub@gmail.com with scope, timelines, and expected outcomes.',
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Email is invalid';
    if (!formData.subject.trim()) e.subject = 'Subject is required';
    if (!formData.message.trim()) e.message = 'Message is required';
    else if (formData.message.trim().length < 10) e.message = 'Message must be at least 10 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#060f1e' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-12 text-center max-w-md w-full"
          style={{ borderColor: 'rgba(0,245,148,0.2)' }}
        >
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 rounded-full blur-xl opacity-60" style={{ background: '#00f594' }} />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,245,148,0.15)', border: '2px solid rgba(0,245,148,0.5)' }}>
              <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="font-display text-3xl font-extrabold text-white mb-3">Message Sent!</h2>
          <p className="text-neutral-400 mb-8">
            Thank you for reaching out. We'll get back to you within 24 hours.
          </p>
          <button onClick={() => setIsSubmitted(false)} className="btn-primary px-8 py-3">
            Send Another Message
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#060f1e' }}>
      {/* ══════════ HERO ══════════ */}
      <section className="relative pt-32 pb-24 hero-grid overflow-hidden" style={{ background: '#030812' }}>
        <div className="glow-orb w-[500px] h-[500px] -top-32 right-0 opacity-25"
          style={{ background: 'rgba(255,94,31,0.12)' }} />
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.p variants={fadeUp} className="section-label justify-center">Reach Out</motion.p>
            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl font-extrabold text-white mb-6">
              Contact <span className="gradient-text">Us</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-neutral-400 text-xl max-w-xl mx-auto">
              We'd love to hear from you. Get in touch — we respond within 24 hours.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ══════════ CONTACT GRID ══════════ */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Left column */}
            <motion.div
              variants={fadeLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="space-y-6"
            >
              <div>
                <p className="section-label">How to find us</p>
                <h2 className="font-display text-4xl font-extrabold text-white mb-3">
                  Get in <span className="gradient-text">Touch</span>
                </h2>
                <p className="text-neutral-400 leading-relaxed">
                  We're here to help and answer any questions. We look forward to hearing from you.
                </p>
              </div>

              {/* Contact info cards */}
              <div className="space-y-4">
                {contactDetails.map(({ icon, label, value, accent }, i) => (
                  <div key={i} className="glass rounded-xl p-4 flex items-center gap-4 hover:border-white/[0.12] transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                      <svg className="w-5 h-5" fill="none" stroke={accent} viewBox="0 0 24 24">{icon}</svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-0.5">{label}</p>
                      <p className="text-neutral-200 text-sm">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Photo */}
              <div className="glass rounded-2xl overflow-hidden">
                <img
                  src={contactImage}
                  alt="UYIH office visit"
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                <div className="p-5">
                  <h3 className="font-display font-bold text-white mb-1">Visit Us</h3>
                  <p className="text-neutral-400 text-sm">
                    Come visit our office and see the work we're doing in the community. We're always happy to meet new people.
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="glass rounded-xl p-5"
                style={{ borderColor: 'rgba(0,217,255,0.15)' }}>
                <h3 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                  <span>🕐</span> Office Hours
                </h3>
                <ul className="space-y-1.5 text-sm text-neutral-400">
                  <li className="flex justify-between">
                    <span>Monday – Friday</span>
                    <span className="text-neutral-300">9:00 AM – 5:00 PM (EAT)</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Saturday</span>
                    <span className="text-neutral-300">By schedule</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sunday & Holidays</span>
                    <span className="text-neutral-500">Closed</span>
                  </li>
                </ul>
                <p className="text-xs text-neutral-500 mt-3">Responses within 24–48 hours.</p>
              </div>
            </motion.div>

            {/* Right column — Form */}
            <motion.div
              variants={fadeRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="glass rounded-2xl p-8"
              style={{ borderColor: 'rgba(0,245,148,0.1)' }}
            >
              <h2 className="font-display text-2xl font-extrabold text-white mb-7">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                {[
                  { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
                  { id: 'email', label: 'Email Address', type: 'email', placeholder: 'your@email.com' },
                  { id: 'subject', label: 'Subject', type: 'text', placeholder: "What's this about?" },
                ].map(({ id, label, type, placeholder }) => (
                  <div key={id}>
                    <label htmlFor={id} className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wide">
                      {label} *
                    </label>
                    <input
                      type={type}
                      id={id}
                      name={id}
                      value={formData[id]}
                      onChange={handleChange}
                      className={`input-dark text-sm ${errors[id] ? 'border-red-500/60' : ''}`}
                      placeholder={placeholder}
                    />
                    {errors[id] && <p className="text-red-400 text-xs mt-1">{errors[id]}</p>}
                  </div>
                ))}

                <div>
                  <label htmlFor="message" className="block text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wide">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    className={`input-dark text-sm resize-none ${errors.message ? 'border-red-500/60' : ''}`}
                    placeholder="Tell us more about your inquiry…"
                  />
                  {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-primary w-full py-4 text-base justify-center ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </span>
                  ) : (
                    <>Send Message <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ FAQs ══════════ */}
      <section className="py-20" style={{ background: '#0d1526' }}>
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="section-label justify-center">Got Questions?</p>
            <h2 className="font-display text-4xl font-extrabold text-white">
              Frequently <span className="gradient-text">Asked</span>
            </h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="glass rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-white text-sm">{q}</span>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 45 : 0 }}
                    className="text-primary-500 text-xl flex-shrink-0 ml-4"
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-neutral-400 text-sm leading-relaxed border-t border-white/[0.06] pt-4">
                        {a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
