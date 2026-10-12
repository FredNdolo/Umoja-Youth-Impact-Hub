// File: src/member/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { STAGES, UYIH_WHATSAPP_NUMBER } from '../lib/config';
import { CURRENT_STATUS, AVAILABILITY, HOURS, labelFor } from '../lib/profileOptions';
import { prettyPhone } from '../lib/phone';
import { MemberHero } from './MemberApp';
import { MyTask, CategoryChip, STATUS, withMatches, categoryOf } from './TaskCards';

const TRIAL_DAYS = 90;
const TZ = 'Africa/Nairobi';
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }) : '');
const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

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

  const open = useMemo(() => withMatches(openTasks, mySkills), [openTasks, mySkills]);
  const forYou = open.filter((t) => t.match.length > 0).length;
  const active = myTasks.filter((t) => t.status !== 'done');
  const counts = Object.fromEntries(Object.keys(STATUS).map((k) => [k, myTasks.filter((t) => t.status === k).length]));
  // Most urgent first: needs a change, to do, then waiting
  const order = { returned: 0, todo: 1, submitted: 2 };
  const topActive = [...active].sort((a, b) => order[a.status] - order[b.status]).slice(0, 2);

  // Membership fee: pending payment?
  const [feePending, setFeePending] = useState(false);
  useEffect(() => {
    supabase.rpc('get_my_fee_payments').then(({ data }) => setFeePending((data || []).some((p) => p.status === 'pending')));
  }, [dash]);

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
                  {!c.done && c.key === 'fee' && (
                    feePending
                      ? <span className="flex-shrink-0 rounded-full bg-terracotta/15 text-terracotta-dark text-[11px] font-semibold px-2.5 py-1">Waiting for confirmation</span>
                      : <Link to="/me/pay" className="flex-shrink-0 btn-primary text-xs px-3 py-1.5">Pay now</Link>
                  )}
                  {!c.done && (c.key === 'orientation' || c.key === 'safeguarding') && (
                    <Link to={`/me/course/${c.key}`} className="flex-shrink-0 btn-secondary text-xs px-3 py-1.5">Open course</Link>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Tasks */}
        <Section title="Tasks" action={<Link to="/me/tasks" className="btn-secondary text-sm">All tasks →</Link>}>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[['todo', 'To do', counts.todo + counts.returned], ['submitted', 'Waiting', counts.submitted], ['done', 'Done', counts.done]].map(([k, label, n]) => (
              <Link key={k} to="/me/tasks" className="rounded-md bg-sand-light hover:bg-sand transition-colors p-3">
                <p className="font-display font-bold text-3xl text-forest tabular-nums">{n}</p>
                <p className="font-sans text-xs text-ink-muted">{label}</p>
              </Link>
            ))}
          </div>
          {topActive.length > 0 && (
            <ul className="mt-5 grid md:grid-cols-2 gap-4">{topActive.map((t) => <MyTask key={t.assignment_id} t={t} reload={reload} />)}</ul>
          )}
          {active.length > topActive.length && (
            <p className="font-sans text-sm text-ink-muted mt-3"><Link to="/me/tasks" className="underline">+ {active.length - topActive.length} more of your tasks</Link></p>
          )}
          {open.length > 0 && (
            <Link to="/me/tasks?tab=find" className="mt-5 flex items-center gap-4 rounded-lg border-2 border-dashed border-terracotta/40 bg-terracotta/5 hover:bg-terracotta/10 transition-colors p-4">
              <span className="text-3xl" aria-hidden="true">🧭</span>
              <span className="flex-1">
                <span className="block font-sans font-semibold text-forest">Find tasks to pick up</span>
                <span className="block font-sans text-sm text-ink-muted">
                  {open.length} open{forYou > 0 ? ` · ${forYou} match your skills` : ''}
                </span>
                <span className="flex flex-wrap gap-1.5 mt-2">
                  {[...new Set(open.map(categoryOf))].slice(0, 4).map((c) => <CategoryChip key={c} cat={c} />)}
                </span>
              </span>
              <span className="font-sans text-terracotta font-semibold" aria-hidden="true">→</span>
            </Link>
          )}
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

        <MyDetails person={person} reload={reload} />
      </div>
    </>
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
