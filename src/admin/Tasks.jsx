// File: src/admin/Tasks.jsx
// Review submitted tasks, create tasks with skill tags, and assign them to
// the people whose skills and availability fit best.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, q } from './supabase';
import { Panel, ErrorNote, StagePill, fmtDate, fmtDateTime, inputCls, labelCls, btnPrimary, btnGhost } from './ui';
import { Modal } from './People';
import SkillPicker from '../components/SkillPicker';
import { sameSkill } from '../lib/skills';
import { AVAILABILITY, labelFor } from '../lib/profileOptions';

const KINDS = [
  { value: 'task', label: 'Task' },
  { value: 'course', label: 'Course' },
  { value: 'content', label: 'Content' },
];

export default function Tasks() {
  const [tasks, setTasks]       = useState([]);
  const [review, setReview]     = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError]       = useState('');
  const [editing, setEditing]   = useState(null);  // task object or {} for new
  const [assigning, setAssigning] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, r, p] = await Promise.all([
        q(supabase.from('tasks').select('*, projects(name), task_assignments(status)').order('created_at', { ascending: false })),
        q(supabase.from('task_assignments').select('*, tasks(title, kind, code), people(full_name, phone)').eq('status', 'submitted').order('submitted_at')),
        q(supabase.from('projects').select('*').order('sort_order')),
      ]);
      setTasks(t); setReview(r); setProjects(p); setError('');
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = tasks.filter((t) => showInactive || t.active);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-display-sm text-forest">Tasks</h1>
          <p className="text-sm text-ink-muted">Create tasks, match them to people’s skills, and confirm what’s been done.</p>
        </div>
        <button className={btnPrimary} onClick={() => setEditing({})}>+ New task</button>
      </div>
      <ErrorNote error={error} />

      <Panel title={`To review${review.length ? ` · ${review.length}` : ''}`}>
        {review.length === 0 ? <p className="text-sm text-ink-muted">Nothing waiting. Tasks members mark as done appear here for you to confirm.</p> : (
          <ul className="space-y-3">{review.map((a) => <ReviewItem key={a.id} a={a} onDone={load} setError={setError} />)}</ul>
        )}
      </Panel>

      <Panel title="All tasks" action={
        <label className="text-xs flex items-center gap-1.5 text-ink-muted"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show archived</label>}>
        {shown.length === 0 ? <p className="text-sm text-ink-muted">No tasks yet.</p> : (
          <ul className="-m-5 divide-y divide-sand-dark/40">
            {shown.map((t) => {
              const n = t.task_assignments.length;
              const done = t.task_assignments.filter((a) => a.status === 'done').length;
              return (
                <li key={t.id} className={`px-5 py-3 flex flex-wrap gap-3 items-center ${t.active ? '' : 'opacity-60'}`}>
                  <div className="flex-1 min-w-[220px]">
                    <p className="font-semibold text-forest text-sm">
                      {t.title}
                      {t.code && <span className="ml-2 rounded-full bg-forest/10 text-forest text-[10px] font-semibold px-2 py-0.5 align-middle">MEMBERSHIP</span>}
                      {t.is_open && <span className="ml-2 rounded-full bg-terracotta/15 text-terracotta-dark text-[10px] font-semibold px-2 py-0.5 align-middle">OPEN TO CLAIM</span>}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {KINDS.find((k) => k.value === t.kind)?.label}{t.projects ? ` · ${t.projects.name}` : ''}{t.due_on ? ` · due ${fmtDate(t.due_on)}` : ''}
                      {t.skills.length > 0 && ` · ${t.skills.join(', ')}`}
                    </p>
                  </div>
                  <span className="text-xs text-ink-muted">{done}/{n} done</span>
                  <button className={btnGhost} onClick={() => setAssigning(t)}>Assign</button>
                  <button className="text-xs text-ink-muted underline" onClick={() => setEditing(t)}>Edit</button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {editing && <TaskForm task={editing} projects={projects} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {assigning && <AssignTask task={assigning} onClose={() => { setAssigning(null); load(); }} />}
    </div>
  );
}

function ReviewItem({ a, onDone, setError }) {
  const [note, setNote] = useState('');
  const [returning, setReturning] = useState(false);
  const set = async (status) => {
    try {
      await q(supabase.from('task_assignments').update({ status, admin_note: status === 'returned' ? note.trim() || null : null }).eq('id', a.id));
      onDone();
    } catch (e) { setError(e.message); }
  };
  const link = (a.member_note || '').match(/https?:\/\/\S+/)?.[0];
  return (
    <li className="rounded-md border border-sand-dark p-4 text-sm">
      <div className="flex flex-wrap justify-between gap-2">
        <span><strong className="text-forest">{a.people?.full_name}</strong> · {a.tasks?.title}</span>
        <span className="text-xs text-ink-muted">{fmtDateTime(a.submitted_at)}</span>
      </div>
      {a.member_note && <p className="mt-2 whitespace-pre-wrap">{a.member_note}</p>}
      {link && <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-terracotta underline">Open link</a>}
      {a.tasks?.code === 'safeguarding' && <p className="text-xs text-forest mt-1">✓ Signed the safeguarding declaration</p>}
      {returning ? (
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <input className={`${inputCls} flex-1 min-w-[200px]`} placeholder="What needs changing?" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
          <button className={btnGhost} onClick={() => set('returned')}>Send back</button>
          <button className="text-xs underline text-ink-muted" onClick={() => setReturning(false)}>Cancel</button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button className={btnPrimary} onClick={() => set('done')}>Confirm done</button>
          <button className={btnGhost} onClick={() => setReturning(true)}>Send back</button>
        </div>
      )}
    </li>
  );
}

function TaskForm({ task, projects, onClose, onSaved }) {
  const isNew = !task.id;
  const [f, setF] = useState({
    title: task.title || '', description: task.description || '', kind: task.kind || 'task',
    project_id: task.project_id ? String(task.project_id) : '', skills: task.skills || [],
    points: task.points ?? 1, due_on: task.due_on || '', is_open: task.is_open ?? false, active: task.active ?? true,
  });
  const [error, setError] = useState('');
  const save = async (e) => {
    e.preventDefault();
    if (f.title.trim().length < 2) return setError('Add a title.');
    const row = {
      title: f.title.trim(), description: f.description.trim() || null, kind: f.kind,
      project_id: f.project_id ? Number(f.project_id) : null, skills: f.skills,
      points: Number(f.points) || 0, due_on: f.due_on || null, is_open: f.is_open, active: f.active,
    };
    try {
      if (isNew) await q(supabase.from('tasks').insert(row));
      else await q(supabase.from('tasks').update(row).eq('id', task.id));
      onSaved();
    } catch (err) { setError(err.message); }
  };
  return (
    <Modal title={isNew ? 'New task' : 'Edit task'} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-4 text-sm">
        <div><label className={labelCls} htmlFor="tf-title">Title</label>
          <input id="tf-title" className={inputCls} value={f.title} maxLength={120} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Photograph Saturday’s tree planting" /></div>
        <div><label className={labelCls} htmlFor="tf-desc">What to do</label>
          <textarea id="tf-desc" className={inputCls} rows={3} maxLength={2000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><label className={labelCls} htmlFor="tf-kind">Type</label>
            <select id="tf-kind" className={inputCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} disabled={Boolean(task.code)}>
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select></div>
          <div><label className={labelCls} htmlFor="tf-proj">Project</label>
            <select id="tf-proj" className={inputCls} value={f.project_id} onChange={(e) => setF({ ...f, project_id: e.target.value })}>
              <option value="">None</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select></div>
          <div><label className={labelCls} htmlFor="tf-due">Due date</label>
            <input id="tf-due" type="date" className={inputCls} value={f.due_on} onChange={(e) => setF({ ...f, due_on: e.target.value })} /></div>
        </div>
        <p className="text-xs text-ink-muted -mt-1">Tasks linked to a project count toward “complete 3 project tasks” for membership.</p>
        <SkillPicker compact label="Skills needed" value={f.skills} max={15} onChange={(v) => setF({ ...f, skills: v })} placeholder="Type a skill" />
        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.is_open} onChange={(e) => setF({ ...f, is_open: e.target.checked })} /> Open: any member can pick it up</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active</label>
        </div>
        <ErrorNote error={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button className={btnPrimary}>{isNew ? 'Create task' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

// Rank people by how many of the task's skills they have
export function matchScore(profile, skills) {
  if (!profile || !skills?.length) return 0;
  return skills.filter((s) => (profile.skills || []).some((m) => sameSkill(m, s))).length;
}

function AssignTask({ task, onClose }) {
  const [people, setPeople] = useState([]);
  const [taken, setTaken]   = useState(new Set());
  const [search, setSearch] = useState('');
  const [free, setFree]     = useState('');
  const [picked, setPicked] = useState(new Set());
  const [error, setError]   = useState('');
  const [busy, setBusy]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pp, ta] = await Promise.all([
          q(supabase.from('people').select('id, full_name, stage, phone, member_profiles(skills, availability)').order('full_name')),
          q(supabase.from('task_assignments').select('person_id').eq('task_id', task.id)),
        ]);
        setPeople(pp); setTaken(new Set(ta.map((x) => x.person_id)));
      } catch (e) { setError(e.message); }
    })();
  }, [task.id]);

  const ranked = useMemo(() => {
    const t = search.trim().toLowerCase();
    return people
      .filter((p) => !taken.has(p.id))
      .map((p) => ({ ...p, profile: p.member_profiles, score: matchScore(p.member_profiles, task.skills) }))
      .filter((p) => !free || (p.profile?.availability || []).includes(free))
      .filter((p) => !t || p.full_name.toLowerCase().includes(t) || (p.profile?.skills || []).some((s) => s.toLowerCase().includes(t)))
      .sort((a, b) => b.score - a.score || a.full_name.localeCompare(b.full_name));
  }, [people, taken, search, free, task.skills]);

  const toggle = (id) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const assign = async () => {
    setBusy(true);
    try {
      await q(supabase.from('task_assignments').insert([...picked].map((person_id) => ({ task_id: task.id, person_id }))));
      onClose();
    } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <Modal title={`Assign: ${task.title}`} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        {task.skills.length > 0
          ? <p className="text-ink-muted">Best matches for <strong className="text-forest">{task.skills.join(', ')}</strong> are listed first.</p>
          : <p className="text-ink-muted">Add skills to this task to rank people by fit.</p>}
        <div className="flex flex-wrap gap-2">
          <input className={`${inputCls} flex-1 min-w-[180px]`} placeholder="Search name or skill" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className={`${inputCls} w-auto`} value={free} onChange={(e) => setFree(e.target.value)} aria-label="Free when">
            <option value="">Any availability</option>
            {AVAILABILITY.map((a) => <option key={a.value} value={a.value}>Free {a.label.toLowerCase()}</option>)}
          </select>
        </div>
        <ErrorNote error={error} />
        <ul className="max-h-[50vh] overflow-y-auto divide-y divide-sand-dark/40 border border-sand-dark/50 rounded-md">
          {ranked.length === 0 && <li className="p-4 text-ink-muted">No one matches.</li>}
          {ranked.map((p) => (
            <li key={p.id}>
              <label className="flex gap-3 items-start px-3 py-2.5 cursor-pointer hover:bg-cream">
                <input type="checkbox" className="mt-1 w-4 h-4 accent-[#1A3C2A]" checked={picked.has(p.id)} onChange={() => toggle(p.id)} />
                <span className="flex-1">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-forest">{p.full_name}</span>
                    <StagePill stage={p.stage} />
                    {p.score > 0 && <span className="rounded-full bg-terracotta/15 text-terracotta-dark text-[11px] font-semibold px-2 py-0.5">{p.score} skill match{p.score > 1 ? 'es' : ''}</span>}
                  </span>
                  <span className="block text-xs text-ink-muted mt-0.5">
                    {p.profile?.skills?.length ? p.profile.skills.slice(0, 8).join(', ') : 'No profile yet'}
                    {p.profile?.availability?.length ? ` · free ${p.profile.availability.map((a) => labelFor(AVAILABILITY, a).toLowerCase()).join(', ')}` : ''}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center">
          <span className="text-ink-muted">{picked.size} selected</span>
          <div className="flex gap-2">
            <button className={btnGhost} onClick={onClose}>Cancel</button>
            <button className={btnPrimary} disabled={!picked.size || busy} onClick={assign}>Assign</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
