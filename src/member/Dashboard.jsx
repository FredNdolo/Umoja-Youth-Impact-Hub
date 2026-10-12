// File: src/member/Dashboard.jsx
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { STAGES, UYIH_WHATSAPP_NUMBER } from '../lib/config';
import { CURRENT_STATUS, AVAILABILITY, HOURS, labelFor } from '../lib/profileOptions';
import { sameSkill } from '../lib/skills';
import { prettyPhone } from '../lib/phone';
import { MemberHero } from './MemberApp';

const TRIAL_DAYS = 90;
const TZ = 'Africa/Nairobi';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }) : '');
const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

const KIND_LABEL = { task: 'Task', course: 'Course', content: 'Content' };
const STATUS = {
  todo:      { label: 'To do',            cls: 'bg-sand text-forest' },
  submitted: { label: 'Waiting for UYIH', cls: 'bg-terracotta/15 text-terracotta-dark' },
  done:      { label: 'Done',             cls: 'bg-forest text-cream' },
  returned:  { label: 'Needs a change',   cls: 'bg-red-50 text-red-700' },
};

// Tasks with an online course open the course instead of “Mark as done”
const COURSE_TASKS = { orientation: '/me/course/orientation', safeguarding: '/me/course/safeguarding' };

const Section = ({ title, action, children }) => (
  <section className="card p-5 md:p-7">
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="font-display font-bold text-display-sm text-forest">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

export default function Dashboard({ dash, reload, onEditProfile }) {
  const { person, profile, progress, events, projects, my_tasks: myTasks, open_tasks: openTasks } = dash;
  const first = person.full_name.split(/\s+/)[0];
  const stageIdx = STAGES.findIndex((s) => s.value === person.stage);
  const trialDay = person.stage === 'volunteer' ? daysSince(person.stage_changed_at) : null;
  const doneCount = progress.filter((c) => c.done).length;
  const mySkills = profile?.skills || [];

  // Open tasks that match your skills come first
  const rankedOpen = useMemo(() => openTasks
    .map((t) => ({ ...t, match: (t.skills || []).filter((s) => mySkills.some((m) => sameSkill(m, s))) }))
    .sort((a, b) => (a.code ? -1 : 0) - (b.code ? -1 : 0) || b.match.length - a.match.length), [openTasks, mySkills]);

  const [showAllOpen, setShowAllOpen] = useState(false);
  const OPEN_LIMIT = 6;
  const visibleOpen = showAllOpen ? rankedOpen : rankedOpen.slice(0, OPEN_LIMIT);

  return (
    <>
      <MemberHero eyebrow="My UYIH" title={`Habari, ${first}`}>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="rounded-full bg-terracotta text-white text-sm font-semibold px-3 py-1">
            {STAGES[stageIdx]?.label}
          </span>
          <span className="font-sans text-cream/70 text-sm">Joined {fmtDate(person.joined_at)}</span>
          <button className="ml-auto font-sans text-sm text-cream/80 underline" onClick={() => supabase.auth.signOut()}>Log out</button>
        </div>
      </MemberHero>

      <div className="container-narrow max-w-4xl py-10 space-y-6">
        {person.deletion_requested_at && (
          <p className="font-sans text-sm bg-red-50 text-red-800 rounded-md px-4 py-3" role="status">
            You asked us to delete your data on {fmtDate(person.deletion_requested_at)}. We’ll do this within 30 days.
            Changed your mind? Message us on WhatsApp.
          </p>
        )}

        {!profile?.completed_at && (
          <div className="rounded-lg border-2 border-dashed border-terracotta/50 bg-terracotta/5 p-5 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <h2 className="font-display font-bold text-xl text-forest">Tell us about yourself</h2>
              <p className="font-sans text-sm text-ink-muted">Your skills and free time help us give you roles you’ll enjoy. About 3 minutes.</p>
            </div>
            <button className="btn-primary" onClick={onEditProfile}>Complete my profile</button>
          </div>
        )}

        {/* Journey */}
        <Section title="Your journey">
          <ol className="grid grid-cols-4 gap-2" aria-label="Stages">
            {STAGES.map((s, i) => (
              <li key={s.value} className="text-center">
                <div className={`h-2 rounded-full ${i <= stageIdx ? 'bg-terracotta' : 'bg-sand-dark/50'}`} />
                <span className={`block mt-2 font-sans text-xs sm:text-sm ${i === stageIdx ? 'text-forest font-semibold' : 'text-ink-muted'}`}>
                  {i === stageIdx && <span className="sr-only">You are here: </span>}{s.label}
                </span>
              </li>
            ))}
          </ol>
          {trialDay !== null && (
            <div className="mt-6 bg-sand-light rounded-md p-4">
              <div className="flex justify-between font-sans text-sm mb-2">
                <span className="font-semibold text-forest">Volunteer trial</span>
                <span className="text-ink-muted">Day {Math.min(trialDay, TRIAL_DAYS)} of {TRIAL_DAYS}</span>
              </div>
              <div className="h-2 rounded-full bg-sand-dark/50 overflow-hidden">
                <div className="h-full bg-forest" style={{ width: `${Math.min(100, (trialDay / TRIAL_DAYS) * 100)}%` }} />
              </div>
            </div>
          )}
          {person.stage === 'newcomer' && (
            <p className="font-sans text-sm text-ink-muted mt-5">Come to your first UYIH activity to become a Volunteer and start your 90-day trial.</p>
          )}
        </Section>

        {/* Membership checklist */}
        {person.stage !== 'member' && person.stage !== 'lead' && (
          <Section title="Becoming a member" action={<span className="font-sans text-sm text-ink-muted">{doneCount} of {progress.length} done</span>}>
            <ul className="space-y-3">
              {progress.map((c) => (
                <li key={c.key} className="flex gap-3 items-start">
                  <span aria-hidden="true" className={`mt-0.5 w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-sm ${c.done ? 'bg-forest text-cream' : 'border-2 border-sand-dark'}`}>
                    {c.done ? '✓' : ''}
                  </span>
                  <div className="flex-1">
                    <p className={`font-sans text-sm ${c.done ? 'text-ink-muted line-through decoration-sand-dark' : 'text-ink font-medium'}`}>
                      <span className="sr-only">{c.done ? 'Done: ' : 'To do: '}</span>{c.label}
                      {c.target > 1 && !c.done && <span className="text-ink-faint font-normal"> · {c.count}/{c.target}</span>}
                    </p>
                    {!c.done && <p className="font-sans text-xs text-ink-faint">{c.hint}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Tasks */}
        <Section title="My tasks">
          {myTasks.length === 0
            ? <p className="font-sans text-sm text-ink-muted">No tasks yet. Pick one below, or we’ll assign you one that fits your skills.</p>
            : <ul className="space-y-3">{myTasks.map((t) => <MyTask key={t.assignment_id} t={t} reload={reload} />)}</ul>}
        </Section>

        {rankedOpen.length > 0 && (
          <Section title="Tasks you can pick up">
            <ul className="space-y-3">
              {visibleOpen.map((t) => <OpenTask key={t.task_id} t={t} reload={reload} />)}
            </ul>
            {rankedOpen.length > OPEN_LIMIT && (
              <button className="btn-secondary w-full mt-4 text-sm" onClick={() => setShowAllOpen(!showAllOpen)}>
                {showAllOpen ? 'Show fewer' : `Show all ${rankedOpen.length} tasks`}
              </button>
            )}
          </Section>
        )}

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

        <MyDetails person={person} reload={reload} />
      </div>
    </>
  );
}

function MyTask({ t, reload }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const st = STATUS[t.status];
  const canSubmit = t.status === 'todo' || t.status === 'returned';
  const courseUrl = COURSE_TASKS[t.code];

  const submit = async () => {
    setBusy(true);
    const { error: err } = await supabase.rpc('submit_task', { p_assignment_id: t.assignment_id, p_note: note || null });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setOpen(false); reload();
  };

  return (
    <li className="rounded-md border border-sand-dark/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-sans font-semibold text-forest">{t.title}</p>
          <p className="font-sans text-xs text-ink-muted">
            {KIND_LABEL[t.kind]}{t.project ? ` · ${t.project}` : ''}{t.due_on ? ` · due ${fmtDate(t.due_on)}` : ''}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
      </div>
      {t.description && <p className="font-sans text-sm text-ink mt-2 whitespace-pre-wrap">{t.description}</p>}
      {t.status === 'returned' && t.admin_note && (
        <p className="font-sans text-sm bg-red-50 text-red-800 rounded px-3 py-2 mt-2">UYIH: {t.admin_note}</p>
      )}
      {canSubmit && courseUrl && (
        <Link to={courseUrl} className="btn-primary text-sm mt-3">Start the course →</Link>
      )}
      {canSubmit && !courseUrl && !open && (
        <button className="btn-primary text-sm mt-3" onClick={() => setOpen(true)}>Mark as done</button>
      )}
      {canSubmit && !courseUrl && open && (
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="input-label">{t.kind === 'content' ? 'Link to your post *' : 'Anything we should know? (optional)'}</span>
            <textarea className="input-field resize-none" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {error && <p className="font-sans text-sm text-red-700" role="alert">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-primary text-sm" disabled={busy || (t.kind === 'content' && !note.trim())} onClick={submit}>
              {busy ? 'Sending…' : 'Send to UYIH'}
            </button>
            <button className="btn-secondary text-sm" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </li>
  );
}

function OpenTask({ t, reload }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const courseUrl = COURSE_TASKS[t.code];
  const claim = async () => {
    setBusy(true);
    const { error: err } = await supabase.rpc('claim_task', { p_task_id: t.task_id });
    setBusy(false);
    if (err) setError(err.message);
    else if (courseUrl) navigate(courseUrl);
    else reload();
  };
  return (
    <li className="rounded-md border border-sand-dark/70 p-4 flex flex-wrap gap-3 items-start">
      <div className="flex-1 min-w-[200px]">
        <p className="font-sans font-semibold text-forest">
          {t.title}
          {t.match.length > 0 && <span className="ml-2 align-middle inline-block whitespace-nowrap rounded-full bg-terracotta/15 text-terracotta-dark text-[11px] font-semibold px-2 py-0.5">Matches your skills</span>}
          {t.code && <span className="ml-2 align-middle inline-block whitespace-nowrap rounded-full bg-forest/10 text-forest text-[11px] font-semibold px-2 py-0.5">Counts toward membership</span>}
        </p>
        <p className="font-sans text-xs text-ink-muted">{KIND_LABEL[t.kind]}{t.project ? ` · ${t.project}` : ''}{t.due_on ? ` · due ${fmtDate(t.due_on)}` : ''}</p>
        {t.description && <p className="font-sans text-sm text-ink mt-1.5">{t.description}</p>}
        {t.skills?.length > 0 && <p className="font-sans text-xs text-ink-faint mt-1.5">Skills: {t.skills.join(', ')}</p>}
        {error && <p className="font-sans text-sm text-red-700 mt-1" role="alert">{error}</p>}
      </div>
      <button className="btn-secondary text-sm" onClick={claim} disabled={busy}>{busy ? 'Adding…' : courseUrl ? 'Start the course' : 'I’ll do this'}</button>
    </li>
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
