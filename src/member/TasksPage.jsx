// File: src/member/TasksPage.jsx
// /me/tasks: the member's own tasks (grouped by status) and tasks they can
// pick up (filtered by category, by skill match, or by search).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MemberHero, Login } from './MemberApp';
import { MyTask, OpenTask, STATUS, CATEGORY_STYLE, withMatches } from './TaskCards';

const Shell = ({ children }) => <div className="bg-cream min-h-screen">{children}</div>;
const CATEGORY_ORDER = ['Membership', 'Green Futures', 'School visits & pad distribution', 'MHM curriculum', 'Content', 'General'];
const shortCat = (c) => (c === 'School visits & pad distribution' ? 'School visits' : c);

export default function TasksPage() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    document.title = 'Tasks · My UYIH';
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <Shell><MemberHero eyebrow="My UYIH" title="Tasks" /></Shell>;
  if (!session) return <Shell><Login /></Shell>;
  return <Shell><TasksBody /></Shell>;
}

function TasksBody() {
  const [dash, setDash] = useState(null);
  const [error, setError] = useState('');
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'find' ? 'find' : 'mine';
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('get_my_dashboard');
    if (err) { setError(err.message); return; }
    setDash(data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const mySkills = dash?.profile?.skills || [];
  const open = useMemo(() => (dash ? withMatches(dash.open_tasks, mySkills) : []), [dash]); // eslint-disable-line react-hooks/exhaustive-deps
  const mine = dash?.my_tasks || [];
  const active = mine.filter((t) => t.status !== 'done');

  const counts = useMemo(() => {
    const c = { All: open.length, 'For you': open.filter((t) => t.match.length).length };
    open.forEach((t) => { c[t.category] = (c[t.category] || 0) + 1; });
    return c;
  }, [open]);
  const filters = ['All', 'For you', ...CATEGORY_ORDER.filter((c) => counts[c]), ...Object.keys(counts).filter((c) => !['All', 'For you', ...CATEGORY_ORDER].includes(c))];

  const shownOpen = useMemo(() => {
    const s = search.trim().toLowerCase();
    return open
      .filter((t) => cat === 'All' || (cat === 'For you' ? t.match.length > 0 : t.category === cat))
      .filter((t) => !s || `${t.title} ${t.description || ''} ${(t.skills || []).join(' ')}`.toLowerCase().includes(s))
      .sort((a, b) => (a.code ? -1 : 0) - (b.code ? -1 : 0) || b.match.length - a.match.length);
  }, [open, cat, search]);

  const setTab = (t) => setParams(t === 'find' ? { tab: 'find' } : {}, { replace: true });

  if (error) return <><MemberHero eyebrow="My UYIH" title="Tasks" /><p className="container-narrow max-w-4xl py-10 font-sans text-red-700">{error}</p></>;
  if (!dash) return <MemberHero eyebrow="My UYIH" title="Tasks" />;

  return (
    <>
      <MemberHero eyebrow="My UYIH" title="Tasks">
        <p className="font-sans text-cream/75 mt-3 max-w-xl">Pick up tasks that fit your skills. Completed project tasks, courses and content count towards membership.</p>
      </MemberHero>

      <div className="container-narrow max-w-5xl py-8 md:py-10">
        <Link to="/me" className="font-sans text-sm text-ink-muted underline">← Back to My UYIH</Link>

        {/* Tabs */}
        <div role="tablist" aria-label="Tasks" className="mt-5 grid grid-cols-2 rounded-lg bg-sand p-1 font-sans text-sm font-semibold max-w-md">
          {[['mine', 'My tasks', active.length], ['find', 'Find tasks', open.length]].map(([k, label, n]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={`rounded-md px-3 py-2.5 transition-colors ${tab === k ? 'bg-white text-forest shadow-sm' : 'text-ink-muted hover:text-forest'}`}>
              {label} <span className={`ml-1 inline-flex min-w-[1.4rem] justify-center rounded-full px-1.5 text-xs ${tab === k ? 'bg-terracotta text-white' : 'bg-sand-dark/40'}`}>{n}</span>
            </button>
          ))}
        </div>

        {tab === 'mine' && (
          <div className="mt-6 space-y-8">
            {mine.length === 0 && (
              <div className="card p-8 text-center">
                <div className="text-4xl mb-2" aria-hidden="true">🧺</div>
                <p className="font-sans text-ink">No tasks yet.</p>
                <p className="font-sans text-sm text-ink-muted mt-1">Pick one up, or we’ll assign you one that fits your skills.</p>
                <button className="btn-primary mt-5" onClick={() => setTab('find')}>Find tasks</button>
              </div>
            )}
            {['returned', 'todo', 'submitted'].map((s) => {
              const list = mine.filter((t) => t.status === s);
              if (!list.length) return null;
              return (
                <section key={s}>
                  <h2 className="font-sans text-xs uppercase tracking-[0.14em] font-semibold text-ink-muted mb-3">{STATUS[s].group} · {list.length}</h2>
                  <ul className="grid md:grid-cols-2 gap-4">{list.map((t) => <MyTask key={t.assignment_id} t={t} reload={load} />)}</ul>
                </section>
              );
            })}
            {mine.some((t) => t.status === 'done') && (
              <section>
                <button className="font-sans text-xs uppercase tracking-[0.14em] font-semibold text-ink-muted mb-3 inline-flex items-center gap-2" onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
                  Done · {mine.filter((t) => t.status === 'done').length} <span aria-hidden="true">{showDone ? '▲' : '▼'}</span>
                </button>
                {showDone && <ul className="grid md:grid-cols-2 gap-4">{mine.filter((t) => t.status === 'done').map((t) => <MyTask key={t.assignment_id} t={t} reload={load} />)}</ul>}
              </section>
            )}
          </div>
        )}

        {tab === 'find' && (
          <div className="mt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap" role="group" aria-label="Filter by category">
                {filters.map((f) => {
                  const on = cat === f;
                  const dot = CATEGORY_STYLE[f]?.dot;
                  return (
                    <button key={f} onClick={() => setCat(f)} aria-pressed={on}
                      className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-sm transition-colors ${
                        on ? 'bg-forest border-forest text-cream' : 'bg-white border-sand-dark text-ink hover:border-forest/50'}`}>
                      {f === 'For you' ? <span aria-hidden="true">★</span> : dot ? <span className={`w-2 h-2 rounded-full ${on ? 'bg-cream' : dot}`} aria-hidden="true" /> : null}
                      {shortCat(f)} <span className={`text-xs ${on ? 'text-cream/70' : 'text-ink-faint'}`}>{counts[f] || 0}</span>
                    </button>
                  );
                })}
              </div>
              <label className="md:ml-auto md:w-56 flex-shrink-0">
                <span className="sr-only">Search tasks</span>
                <input className="input-field py-2" type="search" placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} />
              </label>
            </div>

            {cat === 'For you' && mySkills.length === 0 && (
              <p className="font-sans text-sm bg-terracotta/10 text-terracotta-dark rounded-md px-4 py-3 mt-4">Add your skills to your profile and we’ll show tasks that match them here.</p>
            )}

            {shownOpen.length === 0
              ? <p className="font-sans text-ink-muted mt-8 text-center">No tasks here right now.</p>
              : <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">{shownOpen.map((t) => <OpenTask key={t.task_id} t={t} reload={load} />)}</ul>}
          </div>
        )}
      </div>
    </>
  );
}
