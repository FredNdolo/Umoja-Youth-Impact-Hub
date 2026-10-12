// File: src/pages/RequestDocument.jsx
// Request a copy of a publication. The request goes to the admin dashboard
// (Messages → Document requests); the admin replies by email.
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PUBLICATIONS } from '../lib/publications';
import { submitDocumentRequest } from '../lib/publicApi';

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
};

export default function RequestDocument() {
  const [params] = useSearchParams();
  const initial = PUBLICATIONS.find((p) => p.slug === params.get('doc'))?.slug || '';
  const [form, setForm] = useState({ slug: initial, name: '', email: '', organisation: '', purpose: '', website: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [serverMsg, setServerMsg] = useState('');

  const doc = PUBLICATIONS.find((p) => p.slug === form.slug);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!doc) e.slug = 'Choose a document';
    if (form.name.trim().length < 2) e.name = 'Please enter your name';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = 'Enter a valid email so we can send it';
    if (form.purpose.trim().length < 2) e.purpose = 'Tell us briefly how you will use it';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStatus('loading'); setServerMsg('');
    try {
      await submitDocumentRequest({ ...form, title: doc.title });
      setStatus('success');
    } catch (err) {
      setServerMsg(err.message); setStatus('error');
    }
  };

  const fieldError = (n) => errors[n] ? <p className="font-sans text-xs text-red-600 mt-1.5" role="alert">{errors[n]}</p> : null;
  const ring = (n) => (errors[n] ? 'border-red-400 ring-1 ring-red-400/30' : '');

  return (
    <div className="bg-cream">
      <section className="relative pt-32 pb-14 md:pb-16 bg-forest overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(196,98,45,0.14) 0%, transparent 55%)',
        }} />
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="container-narrow relative z-10 text-center">
          <span className="eyebrow text-cream/60 mb-6 justify-center block">Publications</span>
          <h1 className="font-display font-bold text-display-xl text-cream mb-4">Request a document</h1>
          <p className="font-sans text-lg text-cream/75 max-w-xl mx-auto">
            Tell us a little about yourself and we’ll email you a copy.
          </p>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-terracotta" />
      </section>

      <section className="py-14 md:py-20">
        <div className="container-narrow max-w-2xl">
          <div className="card p-6 md:p-8">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div key="ok" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4" role="status">
                  <div className="w-16 h-16 mx-auto rounded-full bg-terracotta/10 flex items-center justify-center text-3xl mb-5" aria-hidden="true">📬</div>
                  <h2 className="font-display font-bold text-display-sm text-forest">Request received</h2>
                  <p className="font-sans text-ink-muted mt-2 max-w-md mx-auto">
                    Thank you. We’ll email <strong className="text-ink">{doc?.title}</strong> to {form.email.trim()} soon.
                  </p>
                  <Link to="/" className="btn-primary mt-8">Back to home</Link>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onSubmit={submit} noValidate className="space-y-5">

                  {/* Honeypot: hidden from people, tempting to bots */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                    <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} /></label>
                  </div>

                  <fieldset>
                    <legend className="input-label">Document *</legend>
                    <div className="space-y-2">
                      {PUBLICATIONS.map((p) => {
                        const on = form.slug === p.slug;
                        return (
                          <label key={p.slug}
                            className={`flex gap-3 items-start cursor-pointer rounded-md border px-3.5 py-3 transition-colors
                              focus-within:ring-2 focus-within:ring-terracotta/40
                              ${on ? 'border-terracotta bg-terracotta/5' : 'border-sand-dark bg-white hover:border-forest/40'}`}>
                            <input type="radio" name="doc" className="mt-1 accent-[#C4622D] w-4 h-4 flex-shrink-0"
                              checked={on} onChange={() => set('slug', p.slug)} />
                            <span>
                              <span className="block font-sans text-sm font-semibold text-forest">{p.title}</span>
                              <span className="block font-sans text-xs text-ink-muted mt-0.5">{p.type} · {p.date}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {fieldError('slug')}
                  </fieldset>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="rd-name" className="input-label">Full name *</label>
                      <input id="rd-name" type="text" autoComplete="name" maxLength={80} value={form.name}
                        onChange={(e) => set('name', e.target.value)} className={`input-field ${ring('name')}`} />
                      {fieldError('name')}
                    </div>
                    <div>
                      <label htmlFor="rd-email" className="input-label">Email *</label>
                      <input id="rd-email" type="email" autoComplete="email" maxLength={120} value={form.email}
                        onChange={(e) => set('email', e.target.value)} placeholder="Where we’ll send it"
                        className={`input-field ${ring('email')}`} />
                      {fieldError('email')}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rd-org" className="input-label">Organisation</label>
                    <input id="rd-org" type="text" autoComplete="organization" maxLength={120} value={form.organisation}
                      onChange={(e) => set('organisation', e.target.value)} placeholder="Optional" className="input-field" />
                  </div>

                  <div>
                    <label htmlFor="rd-purpose" className="input-label">How will you use it? *</label>
                    <textarea id="rd-purpose" rows={3} maxLength={1000} value={form.purpose}
                      onChange={(e) => set('purpose', e.target.value)}
                      placeholder="e.g. Exploring a partnership, research, funding review"
                      className={`input-field resize-none ${ring('purpose')}`} />
                    {fieldError('purpose')}
                  </div>

                  {status === 'error' && (
                    <p className="font-sans text-sm text-red-700 bg-red-50 rounded-md px-4 py-3" role="alert">{serverMsg}</p>
                  )}

                  <button type="submit" disabled={status === 'loading'}
                    className="btn-primary w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                    {status === 'loading' ? 'Sending…' : 'Request a copy'}
                  </button>
                  <p className="font-sans text-xs text-ink-faint text-center">
                    We use your details only to respond to this request. See our <Link to="/privacy" className="underline">privacy notice</Link>.
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
