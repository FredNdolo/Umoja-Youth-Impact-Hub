// File: src/admin/Events.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, q } from './supabase';
import { Panel, ErrorNote, StagePill, fmtDateTime, inputCls, labelCls, btnPrimary, btnGhost } from './ui';
import { Modal } from './People';
import { prettyPhone } from '../lib/phone';

export default function Events() {
  const [events, setEvents]     = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId]     = useState(null);

  const load = useCallback(async () => {
    try {
      const [ev, pr] = await Promise.all([
        q(supabase.from('events').select('*, attendance(attended)').order('starts_at', { ascending: false })),
        q(supabase.from('projects').select('*').order('sort_order')),
      ]);
      setEvents(ev); setProjects(pr); setError('');
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.starts_at).getTime() >= now - 6 * 3600000).reverse();
  const past = events.filter((e) => new Date(e.starts_at).getTime() < now - 6 * 3600000);

  const Row = ({ e }) => {
    const expected = e.attendance.length;
    const attended = e.attendance.filter((a) => a.attended).length;
    return (
      <li>
        <button onClick={() => setOpenId(e.id)} className="w-full text-left px-4 py-3 hover:bg-cream flex flex-wrap justify-between gap-2">
          <span>
            <span className="font-semibold text-forest">{e.title}</span>
            <span className="block text-xs text-ink-muted">{fmtDateTime(e.starts_at)}{e.location ? ` · ${e.location}` : ''}</span>
          </span>
          <span className="text-xs text-ink-muted self-center">
            {expected === 0 ? 'No one listed yet' : `${attended} of ${expected} attended${expected ? ` (${Math.round((attended / expected) * 100)}%)` : ''}`}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-display-sm text-forest">Events</h1>
          <p className="text-sm text-ink-muted">List who is expected and give each newcomer a named role, then tick who came.</p>
        </div>
        <button className={btnPrimary} onClick={() => setCreating(true)}>+ New event</button>
      </div>
      <ErrorNote error={error} />
      {loading ? <p className="text-sm text-ink-muted">Loading…</p> : (
        <>
          <Panel title="Upcoming">
            {upcoming.length === 0 ? <p className="text-sm text-ink-muted">No upcoming events.</p> :
              <ul className="-m-5 divide-y divide-sand-dark/40">{upcoming.map((e) => <Row key={e.id} e={e} />)}</ul>}
          </Panel>
          <Panel title="Past">
            {past.length === 0 ? <p className="text-sm text-ink-muted">No past events yet.</p> :
              <ul className="-m-5 divide-y divide-sand-dark/40">{past.map((e) => <Row key={e.id} e={e} />)}</ul>}
          </Panel>
        </>
      )}
      {creating && <NewEvent projects={projects} onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); load(); setOpenId(id); }} />}
      {openId && <EventDetail eventId={openId} onClose={() => { setOpenId(null); load(); }} />}
    </div>
  );
}

function NewEvent({ projects, onClose, onCreated }) {
  const [f, setF] = useState({ title: '', date: '', time: '09:00', location: '', project_id: '' });
  const [error, setError] = useState('');
  const save = async (e) => {
    e.preventDefault();
    if (f.title.trim().length < 2 || !f.date) return setError('Add a title and date.');
    try {
      const row = await q(supabase.from('events').insert({
        title: f.title.trim(),
        starts_at: new Date(`${f.date}T${f.time || '09:00'}:00+03:00`).toISOString(),
        location: f.location.trim() || null,
        project_id: f.project_id ? Number(f.project_id) : null,
      }).select('id').single());
      onCreated(row.id);
    } catch (err) { setError(err.message); }
  };
  return (
    <Modal title="New event" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className={labelCls} htmlFor="ne-title">Title</label>
          <input id="ne-title" className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Pad distribution at Ole Sankale Primary" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="ne-date">Date</label>
            <input id="ne-date" type="date" className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </div>
          <div>
            <label className={labelCls} htmlFor="ne-time">Start time</label>
            <input id="ne-time" type="time" className={inputCls} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="ne-loc">Location</label>
          <input id="ne-loc" className={inputCls} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
        </div>
        <div>
          <label className={labelCls} htmlFor="ne-proj">Project (optional)</label>
          <select id="ne-proj" className={inputCls} value={f.project_id} onChange={(e) => setF({ ...f, project_id: e.target.value })}>
            <option value="">None</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <ErrorNote error={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button className={btnPrimary}>Create event</button>
        </div>
      </form>
    </Modal>
  );
}

const ROLE_SUGGESTIONS = ['Photographer', 'Registration desk', 'Facilitator', 'Logistics', 'Distribution', 'Social media', 'Timekeeper'];

function EventDetail({ eventId, onClose }) {
  const [event, setEvent]   = useState(null);
  const [rows, setRows]     = useState([]);
  const [people, setPeople] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError]   = useState('');

  const load = useCallback(async () => {
    try {
      const [ev, at, pp] = await Promise.all([
        q(supabase.from('events').select('*').eq('id', eventId).single()),
        q(supabase.from('attendance').select('person_id, role, attended, people(full_name, phone, stage)').eq('event_id', eventId)),
        q(supabase.from('people').select('id, full_name, phone, stage').order('full_name')),
      ]);
      setEvent(ev);
      setRows(at.sort((a, b) => (a.people?.full_name || '').localeCompare(b.people?.full_name || '')));
      setPeople(pp); setError('');
    } catch (e) { setError(e.message); }
  }, [eventId]);
  useEffect(() => { load(); }, [load]);

  const listed = useMemo(() => new Set(rows.map((r) => r.person_id)), [rows]);
  const matches = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return [];
    return people.filter((p) => !listed.has(p.id) && (p.full_name.toLowerCase().includes(t) || p.phone.includes(t))).slice(0, 6);
  }, [people, listed, search]);

  const add = async (personId) => {
    try { await q(supabase.from('attendance').insert({ event_id: eventId, person_id: personId })); setSearch(''); load(); }
    catch (e) { setError(e.message); }
  };
  const patch = async (personId, change) => {
    setRows((rs) => rs.map((r) => (r.person_id === personId ? { ...r, ...change } : r)));
    try { await q(supabase.from('attendance').update(change).eq('event_id', eventId).eq('person_id', personId)); }
    catch (e) { setError(e.message); load(); }
  };
  const remove = async (personId) => {
    try { await q(supabase.from('attendance').delete().eq('event_id', eventId).eq('person_id', personId)); load(); }
    catch (e) { setError(e.message); }
  };
  const deleteEvent = async () => {
    if (!window.confirm('Delete this event and its attendance list?')) return;
    try { await q(supabase.from('events').delete().eq('id', eventId)); onClose(); }
    catch (e) { setError(e.message); }
  };

  if (!event) return <Modal title="Loading…" onClose={onClose} wide><ErrorNote error={error} /></Modal>;

  const attended = rows.filter((r) => r.attended).length;

  return (
    <Modal title={event.title} onClose={onClose} wide>
      <div className="space-y-5 text-sm">
        <p className="text-ink-muted">{fmtDateTime(event.starts_at)}{event.location ? ` · ${event.location}` : ''}</p>
        <ErrorNote error={error} />

        <div className="relative">
          <label className={labelCls} htmlFor="ed-add">Add people to the list</label>
          <input id="ed-add" className={inputCls} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type a name or number" autoComplete="off" />
          {matches.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-sand-dark rounded-md shadow-card-lg overflow-hidden">
              {matches.map((p) => (
                <li key={p.id}>
                  <button className="w-full text-left px-3 py-2 hover:bg-cream flex justify-between gap-2" onClick={() => add(p.id)}>
                    <span>{p.full_name} <span className="text-ink-muted text-xs">{prettyPhone(p.phone)}</span></span>
                    <StagePill stage={p.stage} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <datalist id="role-suggestions">{ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}</datalist>

        {rows.length === 0 ? <p className="text-ink-muted">No one on the list yet.</p> : (
          <>
            <p className="text-ink-muted">{attended} of {rows.length} attended</p>
            <ul className="divide-y divide-sand-dark/40 border border-sand-dark/50 rounded-md">
              {rows.map((r) => (
                <li key={r.person_id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <label className="flex items-center gap-2.5 flex-1 min-w-[160px] cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 accent-[#1A3C2A]" checked={r.attended} onChange={(e) => patch(r.person_id, { attended: e.target.checked })} />
                    <span>
                      <span className="font-medium text-forest">{r.people?.full_name}</span>
                      {r.people?.stage === 'newcomer' && <span className="ml-2 text-[11px] text-terracotta-dark font-semibold">FIRST EVENT?</span>}
                    </span>
                  </label>
                  <input list="role-suggestions" className={`${inputCls} w-44`} defaultValue={r.role || ''} placeholder="Named role"
                    aria-label={`Role for ${r.people?.full_name}`}
                    onBlur={(e) => { if ((e.target.value.trim() || null) !== (r.role || null)) patch(r.person_id, { role: e.target.value.trim() || null }); }} />
                  <button className="text-xs text-ink-faint underline" onClick={() => remove(r.person_id)}>Remove</button>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex justify-between pt-3 border-t border-sand-dark/40">
          <button className="text-xs text-red-700 underline" onClick={deleteEvent}>Delete event</button>
          <button className={btnPrimary} onClick={onClose}>Done</button>
        </div>
      </div>
    </Modal>
  );
}
