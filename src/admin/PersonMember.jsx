// File: src/admin/PersonMember.jsx
// Phase 2A sections in the admin person panel: login link, get-to-know-you
// profile, membership checklist and tasks.
import React, { useCallback, useEffect, useState } from 'react';
import { supabase, q, loginLink } from './supabase';
import { fmtDate, fmtDateTime, ErrorNote, inputCls, btnGhost, waLink } from './ui';
import { CURRENT_STATUS, AVAILABILITY, HOURS, labelFor } from '../lib/profileOptions';

export function LoginSection({ person, onChanged }) {
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const first = person.full_name.split(/\s+/)[0];

  const make = async () => {
    setBusy(true); setError(''); setLink('');
    try {
      const r = await loginLink({ mode: 'whatsapp', person_id: person.id });
      setLink(r.url); onChanged?.();
    } catch (e) { setError(e.message); }
    setBusy(false);
  };
  const message = link
    ? `Hi ${first}, here is your personal UYIH member login link:\n${link}\n\nOpen it and tap "Log me in". It works once and expires, so use it soon and don't share it. If it stops working, just ask for a new one.`
    : '';

  return (
    <section>
      <h3 className="font-semibold text-forest mb-2">Member login</h3>
      <p className="text-ink-muted mb-3">
        {person.user_id
          ? person.last_login_at ? `Last logged in ${fmtDateTime(person.last_login_at)}.` : 'Has a login but hasn’t used it yet.'
          : 'Hasn’t logged in yet.'}
        {person.email ? ` Can also log in by email (${person.email}).` : ' No email, so WhatsApp links are the way in.'}
      </p>
      {!link ? (
        <button className={btnGhost} onClick={make} disabled={busy}>{busy ? 'Creating link…' : 'Create WhatsApp login link'}</button>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <a className="inline-flex items-center gap-1.5 rounded-md bg-[#1F8F4E] hover:bg-[#187540] text-white font-semibold px-3.5 py-2 text-sm"
              href={waLink(person.phone, message)} target="_blank" rel="noopener noreferrer">Send on WhatsApp</a>
            <button className={btnGhost} onClick={async () => {
              try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
            }}>{copied ? 'Copied ✓' : 'Copy link'}</button>
          </div>
          <p className="text-xs text-ink-faint">One-time link; it stops working once used or after it expires.</p>
        </div>
      )}
      <ErrorNote error={error} />
    </section>
  );
}

export function ProfileSection({ profile }) {
  if (!profile || (!profile.skills?.length && !profile.current_status)) {
    return (
      <section>
        <h3 className="font-semibold text-forest mb-2">Get to know you</h3>
        <p className="text-ink-muted">Not filled in yet. Send them a login link so they can tell you about their skills.</p>
      </section>
    );
  }
  return (
    <section>
      <h3 className="font-semibold text-forest mb-2">Get to know you {profile.completed_at ? '' : <span className="text-xs font-normal text-terracotta-dark">(incomplete)</span>}</h3>
      <dl className="grid sm:grid-cols-[120px_1fr] gap-x-4 gap-y-1.5">
        {profile.current_status && <><dt className="text-ink-muted">Currently</dt><dd>{labelFor(CURRENT_STATUS, profile.current_status)}{profile.field ? ` · ${profile.field}` : ''}</dd></>}
        {profile.skills?.length > 0 && <><dt className="text-ink-muted">Skills</dt>
          <dd className="flex flex-wrap gap-1">{profile.skills.map((s) => <span key={s} className="rounded-full bg-sand px-2 py-0.5 text-xs">{s}</span>)}</dd></>}
        {profile.languages?.length > 0 && <><dt className="text-ink-muted">Languages</dt><dd>{profile.languages.join(', ')}</dd></>}
        {profile.availability?.length > 0 && <><dt className="text-ink-muted">Free</dt>
          <dd>{profile.availability.map((a) => labelFor(AVAILABILITY, a)).join(', ')}{profile.hours_per_month ? ` · ${labelFor(HOURS, profile.hours_per_month)}` : ''}</dd></>}
        {profile.goals?.length > 0 && <><dt className="text-ink-muted">Wants</dt><dd>{profile.goals.join(', ')}</dd></>}
        {profile.resources?.length > 0 && <><dt className="text-ink-muted">Can bring</dt><dd>{profile.resources.join(', ')}</dd></>}
        {profile.bio && <><dt className="text-ink-muted">About</dt><dd className="whitespace-pre-wrap">{profile.bio}</dd></>}
      </dl>
    </section>
  );
}

export function ChecklistSection({ personId, refreshKey }) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    supabase.rpc('membership_progress', { p_person: personId }).then(({ data }) => setItems(data || []));
  }, [personId, refreshKey]);
  if (!items) return null;
  const done = items.filter((c) => c.done).length;
  return (
    <section>
      <h3 className="font-semibold text-forest mb-2">Membership checklist <span className="font-normal text-ink-muted">· {done} of {items.length}</span></h3>
      <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1">
        {items.map((c) => (
          <li key={c.key} className={c.done ? 'text-forest' : 'text-ink-muted'}>
            {c.done ? '✓' : '○'} {c.label}{c.target > 1 && !c.done ? ` (${c.count}/${c.target})` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}

const STATUS_LABEL = { todo: 'To do', submitted: 'To review', done: 'Done', returned: 'Sent back' };

export function TasksSection({ personId, onChanged }) {
  const [rows, setRows]   = useState([]);
  const [tasks, setTasks] = useState([]);
  const [pick, setPick]   = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [r, t] = await Promise.all([
        q(supabase.from('task_assignments').select('id, status, member_note, tasks(id, title, kind)').eq('person_id', personId).order('created_at', { ascending: false })),
        q(supabase.from('tasks').select('id, title').eq('active', true).order('title')),
      ]);
      setRows(r); setTasks(t); setError('');
    } catch (e) { setError(e.message); }
  }, [personId]);
  useEffect(() => { load(); }, [load]);

  const assign = async () => {
    if (!pick) return;
    try { await q(supabase.from('task_assignments').insert({ task_id: Number(pick), person_id: personId })); setPick(''); load(); onChanged?.(); }
    catch (e) { setError(/duplicate|unique/i.test(e.message) ? 'Already assigned.' : e.message); }
  };
  const setStatus = async (id, status) => {
    try { await q(supabase.from('task_assignments').update({ status }).eq('id', id)); load(); onChanged?.(); }
    catch (e) { setError(e.message); }
  };
  const have = new Set(rows.map((r) => r.tasks?.id));

  return (
    <section>
      <h3 className="font-semibold text-forest mb-2">Tasks</h3>
      {rows.length === 0 ? <p className="text-ink-muted mb-2">No tasks yet.</p> : (
        <ul className="space-y-1.5 mb-3">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap justify-between gap-2">
              <span>{r.tasks?.title}{r.member_note ? <span className="text-ink-muted"> · “{r.member_note}”</span> : null}</span>
              <span className="flex items-center gap-2 text-xs">
                <span className={r.status === 'done' ? 'text-forest font-semibold' : r.status === 'submitted' ? 'text-terracotta-dark font-semibold' : 'text-ink-muted'}>{STATUS_LABEL[r.status]}</span>
                {r.status !== 'done' && <button className="underline text-ink-muted" onClick={() => setStatus(r.id, 'done')}>Mark done</button>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <select className={`${inputCls} w-auto flex-1 min-w-[180px]`} value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Task to assign">
          <option value="">Assign a task…</option>
          {tasks.filter((t) => !have.has(t.id)).map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <button className={btnGhost} onClick={assign} disabled={!pick}>Assign</button>
      </div>
      <ErrorNote error={error} />
    </section>
  );
}

export function DeletionBanner({ person }) {
  if (!person.deletion_requested_at) return null;
  return (
    <p className="text-sm bg-red-50 text-red-800 rounded-md px-3 py-2" role="alert">
      Asked for their data to be deleted on {fmtDate(person.deletion_requested_at)}. Use “Delete this person” at the bottom within 30 days.
    </p>
  );
}

export { waLink };
