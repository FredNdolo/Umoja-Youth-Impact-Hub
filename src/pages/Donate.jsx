// File: src/pages/Donate.jsx
// Donations by M-Pesa paybill. After paying, donors can (optionally) tell us
// their M-Pesa code so we can match it and say thank you.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PaybillCard from '../components/PaybillCard';
import { submitDonation } from '../lib/publicApi';
import { normalisePhone } from '../lib/phone';
import { PAYBILL } from '../lib/config';

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
};

const USES = [
  { icon: '🎗️', title: 'Sanitary products for girls', text: 'Pads, preferably reusable, so girls don’t miss school during their periods.' },
  { icon: '🌱', title: 'Seedlings for school nurseries', text: 'Starter stock for the Green Futures nurseries, whose sales then fund pads term after term.' },
  { icon: '🎓', title: 'Training and outreach', text: 'Nursery training for Girl Guides, school health talks, and getting our volunteers to the schools.' },
];

const EMPTY = { amount: '', code: '', name: '', phone: '', email: '', message: '', website: '' };

export default function Donate() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [serverError, setServerError] = useState('');
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); setServerError(''); };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    const code = form.code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(code)) errs.code = 'The M-Pesa code has 10 letters and numbers, like SJK4XYZ12A.';
    if (!(Number(form.amount) >= 1)) errs.amount = 'Enter the amount you sent.';
    let phone = null;
    if (form.phone.trim()) {
      phone = normalisePhone(form.phone);
      if (!phone) errs.phone = 'Check the phone number, e.g. 0712 345 678.';
    }
    if (form.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) errs.email = 'Check the email address.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus('sending');
    try {
      await submitDonation({ ...form, code, phone });
      setStatus('sent');
      window.scrollTo({ top: document.getElementById('tell-us')?.offsetTop - 100 || 0, behavior: 'smooth' });
    } catch (err) {
      setServerError(err.message); setStatus('idle');
    }
  };

  return (
    <div className="bg-cream">
      <section className="relative pt-32 pb-14 md:pb-16 bg-forest overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(196,98,45,0.16) 0%, transparent 55%)',
        }} />
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="container-narrow relative z-10 text-center">
          <span className="eyebrow text-cream/60 mb-6 justify-center block">Support our work</span>
          <h1 className="font-display font-bold text-display-xl text-cream mb-4">Donate</h1>
          <p className="font-sans text-lg text-cream/75 max-w-xl mx-auto">
            Every shilling helps keep girls in school and grows green cover in Narok East. Give any amount by M-Pesa.
          </p>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-terracotta" />
      </section>

      <section className="py-12 md:py-16">
        <div className="container-wide grid lg:grid-cols-[1.1fr_1fr] gap-8 items-start">
          <div className="space-y-8">
            <PaybillCard title="Give by M-Pesa" />

            <div>
              <h2 className="font-display font-bold text-display-sm text-forest mb-4">Where your gift goes</h2>
              <ul className="space-y-3">
                {USES.map((u) => (
                  <li key={u.title} className="flex gap-4 rounded-lg bg-sand-light border border-sand-dark/50 p-4">
                    <span className="text-2xl" aria-hidden="true">{u.icon}</span>
                    <div>
                      <h3 className="font-sans font-semibold text-forest">{u.title}</h3>
                      <p className="font-sans text-sm text-ink-muted">{u.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="font-sans text-sm text-ink-muted mt-4">
                Want to fund a whole school nursery, donate supplies or partner with us?{' '}
                <Link to="/contact" className="text-terracotta underline">Get in touch</Link>.
              </p>
            </div>
          </div>

          <div id="tell-us" className="card p-6 md:p-8 lg:sticky lg:top-28">
            <AnimatePresence mode="wait">
              {status === 'sent' ? (
                <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6" role="status">
                  <div className="text-5xl mb-3" aria-hidden="true">💚</div>
                  <h2 className="font-display font-bold text-display-sm text-forest">Asante sana!</h2>
                  <p className="font-sans text-ink-muted mt-2 max-w-sm mx-auto">
                    Thank you for your gift. We’ll match it to our M-Pesa statement{form.phone || form.email ? ' and get in touch to say thank you' : ''}.
                  </p>
                  <button className="btn-secondary mt-6" onClick={() => { setForm(EMPTY); setStatus('idle'); }}>Record another gift</button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} noValidate className="space-y-4">
                  <div>
                    <h2 className="font-display font-bold text-display-sm text-forest">Already sent it? Let us know</h2>
                    <p className="font-sans text-sm text-ink-muted mt-1">Optional, but it helps us thank you and keep honest records.</p>
                  </div>
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                    <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} /></label>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="input-label">M-Pesa code *</span>
                      <input className="input-field uppercase tracking-wider" value={form.code} maxLength={14} placeholder="SJK4XYZ12A"
                        autoCapitalize="characters" onChange={(e) => set('code', e.target.value)} aria-invalid={Boolean(errors.code)} />
                      {errors.code && <span className="block font-sans text-xs text-red-700 mt-1">{errors.code}</span>}
                    </label>
                    <label className="block">
                      <span className="input-label">Amount (Ksh) *</span>
                      <input className="input-field" type="number" inputMode="numeric" min="1" value={form.amount}
                        onChange={(e) => set('amount', e.target.value)} aria-invalid={Boolean(errors.amount)} />
                      {errors.amount && <span className="block font-sans text-xs text-red-700 mt-1">{errors.amount}</span>}
                    </label>
                  </div>
                  <label className="block">
                    <span className="input-label">Your name (leave blank to give anonymously)</span>
                    <input className="input-field" maxLength={80} autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
                  </label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="input-label">Phone (optional)</span>
                      <input className="input-field" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                      {errors.phone && <span className="block font-sans text-xs text-red-700 mt-1">{errors.phone}</span>}
                    </label>
                    <label className="block">
                      <span className="input-label">Email (optional)</span>
                      <input className="input-field" type="email" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
                      {errors.email && <span className="block font-sans text-xs text-red-700 mt-1">{errors.email}</span>}
                    </label>
                  </div>
                  <label className="block">
                    <span className="input-label">A message for us (optional)</span>
                    <textarea className="input-field resize-none" rows={2} maxLength={500} value={form.message} onChange={(e) => set('message', e.target.value)} />
                  </label>
                  {serverError && <p className="font-sans text-sm text-red-700" role="alert">{serverError}</p>}
                  <button className="btn-primary w-full py-3.5" disabled={status === 'sending' || !PAYBILL.number}>
                    {status === 'sending' ? 'Sending…' : 'Send'}
                  </button>
                  <p className="font-sans text-xs text-ink-faint">
                    We only use these details to confirm your gift and thank you. See our <Link to="/privacy" className="underline">privacy notice</Link>.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}
