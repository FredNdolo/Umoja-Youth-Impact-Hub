// File: src/pages/Join.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { submitJoin, fetchProjects } from '../lib/publicApi';
import { normalisePhone } from '../lib/phone';
import {
  AGE_BANDS, HEARD_FROM, CONSENT_VERSION, WHATSAPP_COMMUNITY_URL, FALLBACK_PROJECTS,
} from '../lib/config';

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const PATH = [
  { step: 'Newcomer',  when: 'Today',          text: 'Join our WhatsApp community and hear about upcoming activities.' },
  { step: 'Volunteer', when: 'First event',    text: 'Come to an event with a named role, then pick a project that fits you.' },
  { step: 'Member',    when: 'After ~90 days', text: 'Become a full member with a vote. No fee until your trial is over.' },
  { step: 'Lead',      when: 'When ready',     text: 'Lead a project, mentor newcomers and help steer UYIH.' },
];

const GAINS = [
  { icon: '🎯', title: 'A real role from day one', text: 'Photographer, facilitator, logistics: you are never just a spectator.' },
  { icon: '🌱', title: 'Hands-on project experience', text: 'Girls’ health, tree nurseries and school outreach in Narok.' },
  { icon: '🤝', title: 'A network that opens doors', text: 'Young professionals, partners and our WhatsApp jobs board.' },
  { icon: '🕊️', title: 'Low commitment to start', text: 'A 90-day volunteer trial. No fee, no pressure to do everything.' },
];

const empty = {
  fullName: '', phone: '', ageBand: '', area: '', interests: [], heardFrom: '', email: '',
  isAdult: false, consent: false, website: '',
};

export default function Join() {
  const [form, setForm]         = useState(empty);
  const [errors, setErrors]     = useState({});
  const navigate = useNavigate();
  const [existing, setExisting] = useState(false);
  const [status, setStatus]     = useState('idle'); // idle | loading | success | error
  const [serverMsg, setServerMsg] = useState('');
  const [projects, setProjects] = useState(FALLBACK_PROJECTS);
  const [firstName, setFirstName] = useState('');
  const topRef = useRef(null);

  useEffect(() => { fetchProjects().then(setProjects); }, []);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const toggleInterest = (slug) =>
    set('interests', form.interests.includes(slug)
      ? form.interests.filter((s) => s !== slug)
      : [...form.interests, slug]);

  const validate = () => {
    const e = {};
    if (form.fullName.trim().length < 2) e.fullName = 'Please enter your name';
    if (!normalisePhone(form.phone))     e.phone    = 'Enter a WhatsApp number like 0712 345 678';
    if (!form.ageBand)                   e.ageBand  = 'Please choose your age group';
    if (!form.email.trim())              e.email    = 'Please enter your email: we send your login link there';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = 'Check this email address';
    if (!form.isAdult)                   e.isAdult  = 'Online joining is for people aged 18 and over';
    if (!form.consent)                   e.consent  = 'We need your consent to keep in touch';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      const first = document.querySelector(`[data-field="${Object.keys(e)[0]}"]`);
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setStatus('loading');
    setServerMsg('');
    try {
      const r = await submitJoin({ ...form, phone: normalisePhone(form.phone), consentVersion: CONSENT_VERSION });
      setFirstName(form.fullName.trim().split(/\s+/)[0]);
      setForm(empty);
      setExisting(r?.status === 'existing');
      if (r?.status === 'new' && r.join_token) {
        // Sign them straight in and take them to their member page
        setStatus('signing');
        try {
          const { supabase, loginLink } = await import('../lib/supabase');
          const link = await loginLink({ mode: 'join', person_id: r.person_id, token: r.join_token });
          let res = await supabase.auth.verifyOtp({ token_hash: link.token_hash, type: 'magiclink' });
          if (res.error) res = await supabase.auth.verifyOtp({ token_hash: link.token_hash, type: 'email' });
          if (res.error) throw res.error;
          navigate('/me?welcome=1');
          return;
        } catch {
          // Couldn't sign in automatically: show the welcome with a login link
        }
      }
      setStatus('success');
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setServerMsg(err.message);
      setStatus('error');
    }
  };

  const fieldError = (name) =>
    errors[name] ? <p className="font-sans text-xs text-red-600 mt-1.5" role="alert">{errors[name]}</p> : null;
  const errRing = (name) => (errors[name] ? 'border-red-400 ring-1 ring-red-400/30' : '');

  return (
    <div className="bg-cream">

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-16 md:pb-20 bg-forest overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(196,98,45,0.16) 0%, transparent 55%)',
        }} />
        <div className="container-narrow relative z-10 text-center">
          <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.span variants={fadeUp} className="eyebrow text-cream/60 mb-6 justify-center block">Join UYIH</motion.span>
            <motion.h1 variants={fadeUp} className="font-display font-bold text-display-xl text-cream mb-5">
              Start with one event.<br /><span className="text-terracotta">Grow from there.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="font-sans text-lg text-cream/75 max-w-xl mx-auto leading-relaxed">
              Takes about a minute. No fee to start, and we’ll message you on WhatsApp within 48 hours.
            </motion.p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-terracotta" />
      </section>

      {/* ══ FORM + WHY ════════════════════════════════════════════ */}
      <section className="py-14 md:py-20" ref={topRef} style={{ scrollMarginTop: '5rem' }}>
        <div className="container-narrow grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-14 items-start">

          {/* Why join */}
          <div className="order-2 lg:order-1 space-y-10">
            <div>
              <span className="eyebrow mb-4 block">What you get</span>
              <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {GAINS.map((g) => (
                  <div key={g.title} className="flex gap-4 items-start">
                    <div className="w-11 h-11 rounded-md bg-sand flex items-center justify-center text-xl flex-shrink-0" aria-hidden="true">{g.icon}</div>
                    <div>
                      <h3 className="font-sans font-semibold text-base text-forest leading-snug">{g.title}</h3>
                      <p className="font-sans text-sm text-ink-muted mt-0.5">{g.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="eyebrow mb-4 block">How it works</span>
              <ol className="relative border-l-2 border-sand-dark ml-2 space-y-6">
                {PATH.map((p, i) => (
                  <li key={p.step} className="pl-6 relative">
                    <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-cream ${i === 0 ? 'bg-terracotta' : 'bg-forest'}`} />
                    <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-terracotta font-semibold">{p.when}</p>
                    <h3 className="font-display font-bold text-xl text-forest">{p.step}</h3>
                    <p className="font-sans text-sm text-ink-muted">{p.text}</p>
                  </li>
                ))}
              </ol>
            </div>

            <p className="font-sans text-sm text-ink-muted bg-sand-light rounded-md p-4 border border-sand-dark/40">
              <strong className="text-forest">Under 18?</strong> We’d love to have you. Online joining is for adults for now, so
              meet us at a school visit or ask a parent or guardian to <Link to="/contact" className="text-terracotta underline">contact us</Link>.
            </p>
          </div>

          {/* Form / success */}
          <div className="order-1 lg:order-2 card p-6 md:p-8 lg:sticky lg:top-24">
            <AnimatePresence mode="wait">
              {status === 'signing' ? (
                <motion.div key="signing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10" role="status">
                  <div className="w-14 h-14 mx-auto rounded-full border-4 border-sand border-t-terracotta animate-spin mb-5" aria-hidden="true" />
                  <h2 className="font-display font-bold text-display-sm text-forest">Karibu{firstName ? `, ${firstName}` : ''}!</h2>
                  <p className="font-sans text-ink-muted mt-2">Setting up your member page…</p>
                </motion.div>
              ) : status === 'success' ? (
                <Welcome key="ok" firstName={firstName} existing={existing} onAgain={() => setStatus('idle')} />
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onSubmit={handleSubmit} noValidate className="space-y-5"
                >
                  <div>
                    <h2 className="font-display font-bold text-display-sm text-forest">Your details</h2>
                    <p className="font-sans text-sm text-ink-muted mt-1">Only the starred fields are needed.</p>
                  </div>

                  {/* Honeypot: hidden from people, tempting to bots */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
                    <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} /></label>
                  </div>

                  <div data-field="fullName">
                    <label htmlFor="j-name" className="input-label">Full name *</label>
                    <input id="j-name" type="text" autoComplete="name" value={form.fullName}
                      onChange={(e) => set('fullName', e.target.value)} placeholder="e.g. Amina Sankale"
                      className={`input-field ${errRing('fullName')}`} maxLength={80} />
                    {fieldError('fullName')}
                  </div>

                  <div data-field="phone">
                    <label htmlFor="j-phone" className="input-label">WhatsApp number *</label>
                    <input id="j-phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone}
                      onChange={(e) => set('phone', e.target.value)} placeholder="0712 345 678"
                      className={`input-field ${errRing('phone')}`} maxLength={20} />
                    {fieldError('phone')}
                  </div>

                  <div data-field="email">
                    <label htmlFor="j-email" className="input-label">Email *</label>
                    <input id="j-email" type="email" autoComplete="email" inputMode="email" value={form.email}
                      onChange={(e) => set('email', e.target.value)} placeholder="e.g. amina@gmail.com" aria-required="true"
                      aria-describedby="j-email-hint"
                      className={`input-field ${errRing('email')}`} maxLength={120} />
                    <p id="j-email-hint" className="font-sans text-xs text-ink-faint mt-1">We send your member login link to this email.</p>
                    {fieldError('email')}
                  </div>

                  <fieldset data-field="ageBand">
                    <legend className="input-label">Age group *</legend>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {AGE_BANDS.map((a) => (
                        <label key={a.value}
                          className={`cursor-pointer text-center rounded-md border px-2 py-2.5 font-sans text-sm transition-colors
                            focus-within:ring-2 focus-within:ring-terracotta/40
                            ${form.ageBand === a.value ? 'bg-forest text-cream border-forest' : 'bg-white border-sand-dark hover:border-forest/50 text-ink'}`}>
                          <input type="radio" name="ageBand" value={a.value} className="sr-only"
                            checked={form.ageBand === a.value} onChange={() => set('ageBand', a.value)} />
                          {a.label}
                        </label>
                      ))}
                    </div>
                    {fieldError('ageBand')}
                  </fieldset>

                  <div>
                    <label htmlFor="j-area" className="input-label">Where do you live?</label>
                    <input id="j-area" type="text" value={form.area} onChange={(e) => set('area', e.target.value)}
                      placeholder="Town or ward, e.g. Narok Town" className="input-field" maxLength={80} />
                  </div>

                  <fieldset>
                    <legend className="input-label">What would you like to help with?</legend>
                    <div className="space-y-2">
                      {projects.map((p) => {
                        const on = form.interests.includes(p.slug);
                        return (
                          <label key={p.slug}
                            className={`flex gap-3 items-start cursor-pointer rounded-md border px-3.5 py-3 transition-colors
                              focus-within:ring-2 focus-within:ring-terracotta/40
                              ${on ? 'border-terracotta bg-terracotta/5' : 'border-sand-dark bg-white hover:border-forest/40'}`}>
                            <input type="checkbox" className="mt-1 accent-[#C4622D] w-4 h-4 flex-shrink-0"
                              checked={on} onChange={() => toggleInterest(p.slug)} />
                            <span>
                              <span className="block font-sans text-sm font-semibold text-forest">{p.name}</span>
                              {p.description && <span className="block font-sans text-xs text-ink-muted mt-0.5">{p.description}</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="font-sans text-xs text-ink-faint mt-1.5">Not sure yet? Leave these blank and we’ll help you choose.</p>
                  </fieldset>

                  <div className="sm:max-w-xs">
                    <label htmlFor="j-heard" className="input-label">How did you hear about us?</label>
                    <select id="j-heard" value={form.heardFrom} onChange={(e) => set('heardFrom', e.target.value)} className="input-field">
                      <option value="">Choose one</option>
                      {HEARD_FROM.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div data-field="isAdult">
                      <label className="flex gap-3 items-start cursor-pointer">
                        <input type="checkbox" className="mt-0.5 accent-[#1A3C2A] w-4 h-4 flex-shrink-0"
                          checked={form.isAdult} onChange={(e) => set('isAdult', e.target.checked)} />
                        <span className="font-sans text-sm text-ink">I am 18 years or older. *</span>
                      </label>
                      {fieldError('isAdult')}
                    </div>
                    <div data-field="consent">
                      <label className="flex gap-3 items-start cursor-pointer">
                        <input type="checkbox" className="mt-0.5 accent-[#1A3C2A] w-4 h-4 flex-shrink-0"
                          checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />
                        <span className="font-sans text-sm text-ink">
                          I agree that UYIH may keep these details to contact me on WhatsApp about volunteering and membership,
                          as explained in the <Link to="/privacy" target="_blank" className="text-terracotta underline">privacy notice</Link>.
                          I can ask for them to be deleted at any time. *
                        </span>
                      </label>
                      {fieldError('consent')}
                    </div>
                  </div>

                  {status === 'error' && (
                    <p className="font-sans text-sm text-red-700 bg-red-50 rounded-md px-4 py-3" role="alert">{serverMsg}</p>
                  )}

                  <button type="submit" disabled={status === 'loading'}
                    className="btn-primary w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed">
                    {status === 'loading' ? 'Joining…' : 'Join UYIH'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
}

// Shown when we couldn't sign the new joiner in automatically, or when the
// number was already registered. Joining WhatsApp is their choice.
function Welcome({ firstName, existing, onAgain }) {
  return (
    <motion.div key="welcome" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="text-center py-2" role="status">
      <div className="w-16 h-16 mx-auto rounded-full bg-terracotta/10 flex items-center justify-center text-3xl mb-5" aria-hidden="true">{existing ? '👋' : '🎉'}</div>
      <h2 className="font-display font-bold text-display-md text-forest">{existing ? 'Welcome back' : 'Karibu'}{firstName ? `, ${firstName}` : ''}!</h2>
      <p className="font-sans text-ink-muted mt-2">
        {existing ? 'You’re already registered with this number. Log in to see your member page.' : 'You’re in. Log in to your member page to get started.'}
      </p>
      <Link to="/me" className="btn-primary w-full py-4 mt-6">Go to my member page →</Link>

      <p className="font-sans text-sm text-ink mt-6 mb-4 bg-sand-light rounded-md px-4 py-3">
        Save <strong>0783 218 081</strong> as “UYIH”. Upcoming activities are shared in our WhatsApp community.
      </p>

      <a href={WHATSAPP_COMMUNITY_URL}
        className="inline-flex items-center justify-center gap-2.5 w-full rounded-md px-6 py-4 font-sans font-semibold text-white
                   bg-[#1F8F4E] hover:bg-[#187540] shadow-card transition-colors">
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 1 1 7.99 4.42zm8.02-17.45A11.33 11.33 0 0 0 12.05.75C5.8.75.72 5.83.72 12.08c0 2 .52 3.95 1.52 5.67L.62 23.62l6.01-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.32-8.01z"/></svg>
        Join our WhatsApp community
      </a>

      <div className="flex flex-col items-center gap-2 mt-6">
        <button type="button" onClick={onAgain} className="font-sans text-xs text-ink-faint underline">
          Signing up someone else? Use the form again
        </button>
      </div>
    </motion.div>
  );
}
