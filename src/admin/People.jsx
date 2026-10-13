// File: src/admin/People.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, q } from './supabase';
import {
  StagePill, FollowUpBadge, WhatsAppButton, messageTemplate, followUpState, fmtDate,
  Panel, ErrorNote, inputCls, labelCls, btnPrimary, btnGhost,
} from './ui';
import PersonDrawer from './PersonDrawer';
import { STAGES, AGE_BANDS, CONSENT_VERSION } from '../lib/config';
import { normalisePhone, prettyPhone } from '../lib/phone';

const FILTERS = [
  { key: 'due', label: 'Follow-up due' },
  { key: 'all', label: 'Everyone' },
  ...STAGES.map((s) => ({ key: s.value, label: s.label })),
  { key: 'review', label: 'Ready for review' },
  { key: 'docs', label: 'Documents to check' },
  { key: 'deletion', label: 'Deletion requested' },
];

// Volunteers who've met every membership criterion except the fee
const readyForReview = (p, overview) =>
  p.stage === 'volunteer' && (overview[p.id]?.criteria_done_excl_fee ?? 0) >= 7;

export default function People() {
  const [people, setPeople]     = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('due');
  const [search, setSearch]     = useState('');
  const [openId, setOpenId]     = useState(null);
  const [adding, setAdding]     = useState(false);
  const [overview, setOverview] = useState({});

  const load = useCallback(async () => {
    try {
      const [p, pr, ov] = await Promise.all([
        q(supabase.from('people').select('*, member_profiles(skills, completed_at), member_documents(doc_type, status)').order('created_at', { ascending: false })),
        q(supabase.from('projects').select('*').order('sort_order')),
        q(supabase.from('membership_overview').select('*')),
      ]);
      setPeople(p);
      setProjects(pr);
      setOverview(Object.fromEntries(ov.map((o) => [o.person_id, o])));
      setError('');
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = { all: people.length, due: 0, review: 0, docs: 0, deletion: 0 };
    STAGES.forEach((s) => { c[s.value] = 0; });
    people.forEach((p) => {
      c[p.stage] += 1;
      if (readyForReview(p, overview)) c.review += 1;
      if (p.deletion_requested_at) c.deletion += 1;
      if ((p.member_documents || []).some((d) => d.status === 'pending')) c.docs += 1;
      const st = followUpState(p.next_follow_up_at);
      if (st === 'overdue' || st === 'today') c.due += 1;
    });
    return c;
  }, [people, overview]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = people.filter((p) => {
      if (filter === 'due') {
        const st = followUpState(p.next_follow_up_at);
        if (st !== 'overdue' && st !== 'today') return false;
      } else if (filter === 'review') {
        if (!readyForReview(p, overview)) return false;
      } else if (filter === 'docs') {
        if (!(p.member_documents || []).some((d) => d.status === 'pending')) return false;
      } else if (filter === 'deletion') {
        if (!p.deletion_requested_at) return false;
      } else if (filter !== 'all' && p.stage !== filter) return false;
      if (!term) return true;
      return [p.full_name, p.phone, p.area, p.email, ...(p.member_profiles?.skills || [])].some((v) => (v || '').toLowerCase().includes(term))
        || prettyPhone(p.phone).replace(/\s/g, '').includes(term.replace(/\s/g, ''));
    });
    if (filter === 'due') {
      list = [...list].sort((a, b) => new Date(a.next_follow_up_at) - new Date(b.next_follow_up_at));
    }
    return list;
  }, [people, filter, search, overview]);

  const projectName = (slug) => projects.find((p) => p.slug === slug)?.name || slug;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-display-sm text-forest">People</h1>
          <p className="text-sm text-ink-muted">Everyone who has joined, from newcomer to lead.</p>
        </div>
        <button className={btnPrimary} onClick={() => setAdding(true)}>+ Add someone</button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter people">
        {FILTERS.map((f) => (
          <button key={f.key} role="tab" aria-selected={filter === f.key} onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
              filter === f.key ? 'bg-forest text-cream border-forest' : 'bg-white text-forest border-sand-dark hover:border-forest/40'}`}>
            {f.label}
            <span className={`ml-1.5 text-xs ${filter === f.key ? 'text-cream/70' : 'text-ink-faint'} ${
              f.key === 'due' && counts.due > 0 && filter !== 'due' ? '!text-red-700 font-bold' : ''}`}>
              {counts[f.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <input type="search" placeholder="Search by name, phone, area, email or skill" value={search}
        onChange={(e) => setSearch(e.target.value)} className={`${inputCls} max-w-md`} aria-label="Search people" />

      <ErrorNote error={error} />

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <Panel>
          <p className="text-sm text-ink-muted text-center py-6">
            {filter === 'due'
              ? 'Nobody is due for a follow-up. 🎉'
              : people.length === 0
                ? 'No one has joined yet. Share the Join page on WhatsApp and Instagram to get started.'
                : 'No one matches this filter.'}
          </p>
        </Panel>
      ) : (
        <div className="bg-white rounded-lg border border-sand-dark/50 shadow-card overflow-hidden">
          {/* Desktop table */}
          <table className="hidden md:table w-full text-sm">
            <thead className="bg-sand-light text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Stage</th>
                <th className="px-4 py-3 font-semibold">Interested in</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Follow up</th>
                <th className="px-4 py-3 font-semibold"><span className="sr-only">Message</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-dark/40">
              {shown.map((p) => (
                <tr key={p.id} className="hover:bg-cream cursor-pointer" onClick={() => setOpenId(p.id)}>
                  <td className="px-4 py-3">
                    <button className="font-semibold text-forest hover:underline text-left" onClick={(e) => { e.stopPropagation(); setOpenId(p.id); }}>
                      {p.full_name}
                    </button>
                    <div className="text-xs text-ink-muted">
                      {prettyPhone(p.phone)}{p.area ? ` · ${p.area}` : ''}
                      {!p.in_whatsapp && <span className="ml-1.5 text-terracotta-dark">· not in WhatsApp group</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StagePill stage={p.stage} /></td>
                  <td className="px-4 py-3 text-xs text-ink-muted max-w-[220px]">
                    {p.interests.length ? p.interests.map(projectName).join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3"><FollowUpBadge date={p.next_follow_up_at} /></td>
                  <td className="px-4 py-3 text-right"><WhatsAppButton phone={p.phone} text={messageTemplate(p)} small /></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="md:hidden divide-y divide-sand-dark/40">
            {shown.map((p) => (
              <li key={p.id}>
                <div className="flex items-start gap-3 px-4 py-3">
                  <button className="flex-1 text-left min-w-0" onClick={() => setOpenId(p.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-forest">{p.full_name}</span>
                      <StagePill stage={p.stage} />
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">{prettyPhone(p.phone)} · joined {fmtDate(p.created_at)}</div>
                    <div className="mt-1.5"><FollowUpBadge date={p.next_follow_up_at} /></div>
                  </button>
                  <WhatsAppButton phone={p.phone} text={messageTemplate(p)} small label="Chat" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {openId && (
        <PersonDrawer
          personId={openId}
          projects={projects}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      )}
      {adding && <AddPerson onClose={() => setAdding(false)} onAdded={() => { setAdding(false); load(); }} projects={projects} />}
    </div>
  );
}

// For people met offline (events, school visits) who agree to be added
function AddPerson({ onClose, onAdded, projects }) {
  const [f, setF] = useState({ full_name: '', phone: '', age_band: '', area: '', interests: [], agreed: false, adult: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const phone = normalisePhone(f.phone);
    if (f.full_name.trim().length < 2) return setError('Enter their name.');
    if (!phone) return setError('Enter a valid WhatsApp number, e.g. 0712 345 678.');
    if (!f.age_band) return setError('Choose an age group.');
    if (!f.adult) return setError('Only adults (18+) can be added for now.');
    if (!f.agreed) return setError('They need to agree to be contacted before you add them.');
    setBusy(true);
    try {
      await q(supabase.from('people').insert({
        full_name: f.full_name.trim(), phone, age_band: f.age_band, area: f.area.trim() || null,
        interests: f.interests, source: 'admin', consent_version: `${CONSENT_VERSION}-verbal`,
      }));
      onAdded();
    } catch (err) {
      setError(/duplicate|unique/i.test(err.message) ? 'Someone with this number is already in the list.' : err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Add someone" onClose={onClose}>
      <form onSubmit={save} className="space-y-4">
        <div>
          <label className={labelCls} htmlFor="ap-name">Full name</label>
          <input id="ap-name" className={inputCls} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls} htmlFor="ap-phone">WhatsApp number</label>
            <input id="ap-phone" type="tel" className={inputCls} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="0712 345 678" />
          </div>
          <div>
            <label className={labelCls} htmlFor="ap-age">Age group</label>
            <select id="ap-age" className={inputCls} value={f.age_band} onChange={(e) => setF({ ...f, age_band: e.target.value })}>
              <option value="">Choose</option>
              {AGE_BANDS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="ap-area">Area (optional)</label>
          <input id="ap-area" className={inputCls} value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} />
        </div>
        <fieldset>
          <legend className={labelCls}>Interested in</legend>
          <div className="flex flex-wrap gap-2">
            {projects.filter((p) => p.active).map((p) => {
              const on = f.interests.includes(p.slug);
              return (
                <label key={p.slug} className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${on ? 'bg-forest text-cream border-forest' : 'border-sand-dark text-forest'}`}>
                  <input type="checkbox" className="sr-only" checked={on}
                    onChange={() => setF({ ...f, interests: on ? f.interests.filter((s) => s !== p.slug) : [...f.interests, p.slug] })} />
                  {p.name}
                </label>
              );
            })}
          </div>
        </fieldset>
        <label className="flex gap-2.5 items-start text-sm">
          <input type="checkbox" className="mt-0.5 accent-[#1A3C2A]" checked={f.adult} onChange={(e) => setF({ ...f, adult: e.target.checked })} />
          They are 18 or older.
        </label>
        <label className="flex gap-2.5 items-start text-sm">
          <input type="checkbox" className="mt-0.5 accent-[#1A3C2A]" checked={f.agreed} onChange={(e) => setF({ ...f, agreed: e.target.checked })} />
          They agreed to UYIH keeping these details and contacting them on WhatsApp (as in the privacy notice).
        </label>
        <ErrorNote error={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button className={btnPrimary} disabled={busy}>{busy ? 'Saving…' : 'Add'}</button>
        </div>
      </form>
    </Modal>
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-0 sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`bg-white w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[92vh] overflow-y-auto rounded-t-xl sm:rounded-lg shadow-card-lg`}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-dark/40 sticky top-0 bg-white z-10">
          <h2 className="font-display font-bold text-xl text-forest">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-md hover:bg-sand-light text-ink-muted text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
