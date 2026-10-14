// File: src/member/GetToKnowYou.jsx
// Four short steps: about you → skills & languages → time & goals → consent.
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import SkillPicker from '../components/SkillPicker';
import { LANGUAGES } from '../lib/skills';
import { CURRENT_STATUS, AVAILABILITY, HOURS, GOALS, RESOURCES } from '../lib/profileOptions';
import { MemberHero } from './MemberApp';

const STEPS = ['About you', 'Skills', 'Time & goals', 'Finish'];

function Chips({ options, value, onChange, single }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        const on = single ? value === v : value.includes(v);
        return (
          <button key={v} type="button" aria-pressed={on}
            onClick={() => onChange(single ? v : on ? value.filter((x) => x !== v) : [...value, v])}
            className={`rounded-full border px-3.5 py-2 text-sm font-sans transition-colors ${
              on ? 'bg-forest text-cream border-forest' : 'bg-white text-ink border-sand-dark hover:border-forest/50'}`}>
            {on && !single ? '✓ ' : ''}{l}
          </button>
        );
      })}
    </div>
  );
}

const Q = ({ title, hint, children }) => (
  <div className="space-y-3">
    <div>
      <h3 className="font-sans font-semibold text-forest">{title}</h3>
      {hint && <p className="font-sans text-sm text-ink-muted">{hint}</p>}
    </div>
    {children}
  </div>
);

export default function GetToKnowYou({ person, profile, firstTime, onDone, onSkip }) {
  const p = profile || {};
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    bio: p.bio || '',
    current_status: p.current_status || '',
    field: p.field || '',
    skills: p.skills || [],
    languages: p.languages?.length ? p.languages : [],
    otherLanguage: '',
    availability: p.availability || [],
    hours_per_month: p.hours_per_month || '',
    goals: p.goals || [],
    resources: p.resources || [],
    consent: Boolean(p.profile_consented_at),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setError(''); };
  const first = person.full_name.split(/\s+/)[0];

  const stepError = () => {
    if (step === 0 && !f.current_status) return 'Choose what you do at the moment.';
    if (step === 1 && f.skills.length < 3) return 'Add at least 3 skills. Everyday ones count too!';
    if (step === 2 && f.availability.length === 0) return 'Choose when you’re usually free.';
    if (step === 3 && !f.consent) return 'Please tick the box so we can use your answers to match you with roles.';
    return '';
  };

  const next = () => {
    const e = stepError();
    if (e) { setError(e); return; }
    if (step < STEPS.length - 1) { setStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else save();
  };

  const save = async () => {
    setSaving(true);
    const languages = [...f.languages];
    const other = f.otherLanguage.trim();
    if (other && !languages.includes(other)) languages.push(other.slice(0, 40));
    const row = {
      person_id: person.id,
      bio: f.bio.trim() || null,
      current_status: f.current_status || null,
      field: f.field.trim() || null,
      skills: f.skills,
      languages,
      availability: f.availability,
      hours_per_month: f.hours_per_month || null,
      goals: f.goals,
      resources: f.resources,
      profile_consented_at: f.consent ? (p.profile_consented_at || new Date().toISOString()) : null,
    };
    const { error: err } = await supabase.from('member_profiles').upsert(row, { onConflict: 'person_id' });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onDone();
  };

  return (
    <>
      <MemberHero eyebrow="Get to know you" title={firstTime ? `Karibu, ${first}!` : 'Your profile'}>
        <p className="font-sans text-ink-muted mt-2 max-w-xl">
          {firstTime
            ? 'Tell us a little about yourself so we can match you with roles and tasks you’ll enjoy. About 3 minutes.'
            : 'Keep this up to date so we can match you with the right roles and tasks.'}
        </p>
      </MemberHero>

      <div className="container-narrow max-w-2xl py-10 md:py-14">
        {/* Step indicator */}
        <ol className="flex gap-2 mb-8" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-terracotta' : 'bg-sand-dark/60'}`} />
              <span className={`block mt-2 font-sans text-[11px] uppercase tracking-wide ${i === step ? 'text-forest font-semibold' : 'text-ink-faint'}`}>
                <span className="sr-only">{i < step ? 'Done: ' : i === step ? 'Current: ' : ''}</span>{s}
              </span>
            </li>
          ))}
        </ol>

        <div className="card p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }} className="space-y-8">
              {step === 0 && (
                <>
                  <Q title="What do you do at the moment? *">
                    <Chips options={CURRENT_STATUS} value={f.current_status} single onChange={(v) => set('current_status', v)} />
                  </Q>
                  <Q title="What do you study or work in?" hint="e.g. Nursing student at Narok TTI, teacher, boda boda business">
                    <input className="input-field" maxLength={120} value={f.field} onChange={(e) => set('field', e.target.value)} />
                  </Q>
                  <Q title="Tell us a bit about yourself" hint="Optional. What you care about, what you’re good at, anything you’d like us to know.">
                    <textarea className="input-field resize-none" rows={4} maxLength={600} value={f.bio} onChange={(e) => set('bio', e.target.value)} />
                    <p className="font-sans text-xs text-ink-faint text-right">{f.bio.length}/600</p>
                  </Q>
                </>
              )}

              {step === 1 && (
                <>
                  <Q title="What are you good at? *" hint="Add at least 3: work skills, hobbies and everyday talents all count.">
                    <SkillPicker label="" value={f.skills} onChange={(v) => set('skills', v)} />
                  </Q>
                  <Q title="Which languages do you speak?">
                    <Chips options={LANGUAGES} value={f.languages} onChange={(v) => set('languages', v)} />
                    <input className="input-field mt-2" placeholder="Another language" maxLength={40}
                      value={f.otherLanguage} onChange={(e) => set('otherLanguage', e.target.value)} />
                  </Q>
                </>
              )}

              {step === 2 && (
                <>
                  <Q title="When are you usually free? *">
                    <Chips options={AVAILABILITY} value={f.availability} onChange={(v) => set('availability', v)} />
                  </Q>
                  <Q title="How much time could you give?">
                    <Chips options={HOURS} value={f.hours_per_month} single onChange={(v) => set('hours_per_month', v)} />
                  </Q>
                  <Q title="What would you like to get out of UYIH?">
                    <Chips options={GOALS} value={f.goals} onChange={(v) => set('goals', v)} />
                  </Q>
                  <Q title="Anything you could bring or use?" hint="Helps us plan, never required.">
                    <Chips options={RESOURCES} value={f.resources} onChange={(v) => set('resources', v)} />
                  </Q>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="bg-sand-light rounded-md p-5 font-sans text-sm space-y-2">
                    <p><strong className="text-forest">Skills:</strong> {f.skills.join(', ')}</p>
                    {f.languages.length > 0 && <p><strong className="text-forest">Languages:</strong> {f.languages.join(', ')}</p>}
                    <p><strong className="text-forest">Free:</strong> {AVAILABILITY.filter((a) => f.availability.includes(a.value)).map((a) => a.label).join(', ')}</p>
                  </div>
                  <label className="flex gap-3 items-start cursor-pointer font-sans text-sm text-ink">
                    <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[#1A3C2A]" checked={f.consent} onChange={(e) => set('consent', e.target.checked)} />
                    <span>I agree that UYIH may use these answers to match me with roles, tasks and opportunities. Only the UYIH admin can see them, and I can change or delete them any time.</span>
                  </label>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {error && <p className="font-sans text-sm text-red-700 bg-red-50 rounded-md px-4 py-3 mt-6" role="alert">{error}</p>}

          <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-sand-dark/50">
            {step > 0
              ? <button type="button" className="btn-secondary" onClick={() => { setStep(step - 1); setError(''); }}>Back</button>
              : <button type="button" className="font-sans text-sm text-ink-muted underline" onClick={onSkip}>{firstTime ? 'Do this later' : 'Cancel'}</button>}
            <button type="button" className="btn-primary" onClick={next} disabled={saving}>
              {step < STEPS.length - 1 ? 'Next' : saving ? 'Saving…' : 'Save my profile'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
