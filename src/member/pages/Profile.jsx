// File: src/member/pages/Profile.jsx
// Get-to-know-you profile, activity history and personal details.
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UYIH_WHATSAPP_NUMBER } from '../../lib/config';
import { CURRENT_STATUS, AVAILABILITY, HOURS, labelFor } from '../../lib/profileOptions';
import { prettyPhone } from '../../lib/phone';
import { useMember, PageTitle, Block } from '../MemberLayout';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' }) : '');
const Section = Block;

export default function Profile() {
  const { dash, reload, editProfile: onEditProfile } = useMember();
  const { person, profile, events, projects } = dash;
  return (
    <>
      <PageTitle title="Profile">Your skills help us match you with roles and tasks you’ll enjoy.</PageTitle>
      <div className="space-y-5">
        <Section title="About me" action={<button className="btn-secondary text-sm" onClick={onEditProfile}>{profile?.completed_at ? 'Edit' : 'Complete'}</button>}>
          {profile?.completed_at ? (
            <dl className="font-sans text-sm grid sm:grid-cols-[140px_1fr] gap-x-4 gap-y-2">
              <dt className="text-ink-muted">Currently</dt><dd>{labelFor(CURRENT_STATUS, profile.current_status)}{profile.field ? ` · ${profile.field}` : ''}</dd>
              <dt className="text-ink-muted">Skills</dt>
              <dd className="flex flex-wrap gap-1.5">{profile.skills.map((s) => <span key={s} className="rounded-full bg-sand-light border border-sand-dark/50 px-2.5 py-0.5">{s}</span>)}</dd>
              {profile.languages?.length > 0 && <><dt className="text-ink-muted">Languages</dt><dd>{profile.languages.join(', ')}</dd></>}
              <dt className="text-ink-muted">Free</dt><dd>{profile.availability.map((a) => labelFor(AVAILABILITY, a)).join(', ')}{profile.hours_per_month ? ` · ${labelFor(HOURS, profile.hours_per_month)}` : ''}</dd>
            </dl>
          ) : <p className="font-sans text-sm text-ink-muted">Not finished yet. It takes about 3 minutes.</p>}
        </Section>

        {/* History */}
        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Events">
            {events.length === 0 ? <p className="font-sans text-sm text-ink-muted">No events yet.</p> : (
              <ul className="space-y-2 font-sans text-sm">
                {events.map((e, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>{e.title}{e.role && <span className="text-ink-muted"> · {e.role}</span>}</span>
                    <span className={`whitespace-nowrap ${e.attended ? 'text-forest' : 'text-ink-faint'}`}>{fmtDate(e.starts_at)}{e.attended ? ' ✓' : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Projects">
            {projects.length === 0 ? <p className="font-sans text-sm text-ink-muted">Not placed in a project yet.</p> : (
              <ul className="space-y-2 font-sans text-sm">
                {projects.map((p, i) => (
                  <li key={i} className={p.ended_on ? 'text-ink-faint' : ''}>
                    <strong className={p.ended_on ? '' : 'text-forest'}>{p.name}</strong>{p.role ? ` · ${p.role}` : ''}
                    <span className="block text-xs text-ink-muted">Since {fmtDate(p.started_on)}{p.ended_on ? ` to ${fmtDate(p.ended_on)}` : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {/* Profile */}
        {profile?.completed_at && (
          <Section title="My profile" action={<button className="btn-secondary text-sm" onClick={onEditProfile}>Edit</button>}>
            <dl className="font-sans text-sm grid sm:grid-cols-[140px_1fr] gap-x-4 gap-y-2">
              <dt className="text-ink-muted">Currently</dt><dd>{labelFor(CURRENT_STATUS, profile.current_status)}{profile.field ? ` · ${profile.field}` : ''}</dd>
              <dt className="text-ink-muted">Skills</dt>
              <dd className="flex flex-wrap gap-1.5">{profile.skills.map((s) => <span key={s} className="rounded-full bg-sand px-2.5 py-0.5">{s}</span>)}</dd>
              {profile.languages?.length > 0 && <><dt className="text-ink-muted">Languages</dt><dd>{profile.languages.join(', ')}</dd></>}
              <dt className="text-ink-muted">Free</dt><dd>{profile.availability.map((a) => labelFor(AVAILABILITY, a)).join(', ')}{profile.hours_per_month ? ` · ${labelFor(HOURS, profile.hours_per_month)}` : ''}</dd>
            </dl>
          </Section>
        )}

        <EmailSettings email={person.email} />
        <MyDetails person={person} reload={reload} />
      </div>
    </>
  );
}

// Reminders can be switched off; notices about their own record always go
function EmailSettings({ email }) {
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { supabase.rpc('get_my_email_settings').then(({ data }) => setS(data || { reminders: true })); }, [email]);
  const [err, setErr] = useState('');
  const toggle = async () => {
    const want = !s.reminders;
    setS({ ...s, reminders: want }); setSaving(true); setErr('');   // show it straight away
    const { error } = await supabase.rpc('set_my_email_reminders', { p_on: want });
    if (error) { setS((x) => ({ ...x, reminders: !want })); setErr('Couldn’t save that. Please try again.'); }
    setSaving(false);
  };
  const realEmail = email && !/\.invalid$/i.test(email);
  return (
    <Section title="Emails from UYIH">
      {!realEmail ? (
        <p className="font-sans text-sm text-ink-muted">Add your email under My details below to get updates about your tasks, certificates and events.</p>
      ) : (
        <div className="space-y-3 font-sans text-sm">
          <p className="text-ink">We email <strong>{email}</strong> when something changes for you: a task assigned or reviewed, a certificate, documents checked, events and payments.</p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[#1A3C2A]" checked={!!s?.reminders} disabled={!s} onChange={() => { if (!saving) toggle(); }} />
            <span>
              <span className="font-semibold text-forest">Send me reminders</span>
              <span className="block text-ink-muted text-xs">Tasks due soon or overdue, events the day before, and Tree Monitor check-ins. Updates about your own record are always sent.</span>
            </span>
          </label>
          {err && <p className="text-xs text-red-700" role="alert">{err}</p>}
        </div>
      )}
    </Section>
  );
}

function MyDetails({ person, reload }) {
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ full_name: person.full_name, area: person.area || '', email: person.email || '' });
  const [error, setError] = useState('');
  const save = async () => {
    if (f.full_name.trim().length < 2) { setError('Enter your name.'); return; }
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) { setError('Check your email address.'); return; }
    const { error: err } = await supabase.rpc('update_my_details', { p_full_name: f.full_name, p_area: f.area, p_email: f.email });
    if (err) { setError(err.message); return; }
    setEdit(false); setError(''); reload();
  };
  const requestDeletion = async () => {
    if (!window.confirm('Ask UYIH to delete all your data? This removes your profile, tasks and history.')) return;
    const { error: err } = await supabase.rpc('request_my_deletion');
    if (err) setError(err.message); else reload();
  };

  return (
    <Section title="My details" action={!edit && <button className="btn-secondary text-sm" onClick={() => setEdit(true)}>Edit</button>}>
      {!edit ? (
        <dl className="font-sans text-sm grid sm:grid-cols-[140px_1fr] gap-x-4 gap-y-2">
          <dt className="text-ink-muted">Name</dt><dd>{person.full_name}</dd>
          <dt className="text-ink-muted">WhatsApp</dt><dd>{prettyPhone(person.phone)}</dd>
          <dt className="text-ink-muted">Email</dt><dd>{person.email || <span className="text-ink-faint">Not added. Add one to log in by email.</span>}</dd>
          <dt className="text-ink-muted">Area</dt><dd>{person.area || '—'}</dd>
        </dl>
      ) : (
        <div className="space-y-4">
          <label className="block"><span className="input-label">Full name</span>
            <input className="input-field" maxLength={80} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></label>
          <label className="block"><span className="input-label">Email (for logging in)</span>
            <input className="input-field" type="email" maxLength={120} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label className="block"><span className="input-label">Area</span>
            <input className="input-field" maxLength={80} value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} /></label>
          <p className="font-sans text-xs text-ink-faint">To change your WhatsApp number, message UYIH.</p>
          {error && <p className="font-sans text-sm text-red-700" role="alert">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-primary text-sm" onClick={save}>Save</button>
            <button className="btn-secondary text-sm" onClick={() => { setEdit(false); setError(''); }}>Cancel</button>
          </div>
        </div>
      )}
      <div className="mt-6 pt-4 border-t border-sand-dark/50 flex flex-wrap gap-x-5 gap-y-2 font-sans text-xs text-ink-muted">
        <a className="underline" href="/privacy">How we use your data</a>
        <a className="underline" href={`https://wa.me/${UYIH_WHATSAPP_NUMBER}`}>Message UYIH</a>
        {!person.deletion_requested_at && <button className="underline text-red-700" onClick={requestDeletion}>Delete my data</button>}
      </div>
    </Section>
  );
}
