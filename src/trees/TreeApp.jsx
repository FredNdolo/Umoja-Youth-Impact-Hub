// File: src/trees/TreeApp.jsx
// The Tree Monitor inside the member area (/me/trees/*). Field team and
// admins get the full app; other members see what it is and how to join.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes, Link } from 'react-router-dom';
import { loadReference, loadTrees, getQueue, onQueueChange, syncQueue } from './api';
import { registerTreeAppSW } from './pwa';
import { UYIH_WHATSAPP_NUMBER } from '../lib/config';
import { publicTreeSummary } from '../lib/publicApi';
import { Notice, Stat } from './ui';
import Overview from './pages/Overview';
import MapPage from './pages/MapPage';
import TreesList from './pages/TreesList';
import TreeDetail from './pages/TreeDetail';
import Register from './pages/Register';
import CheckIn from './pages/CheckIn';
import Scan from './pages/Scan';
import Nursery from './pages/Nursery';
import Sites from './pages/Sites';
import Reports from './pages/Reports';
import Labels from './pages/Labels';
import Team from './pages/Team';
import Species from './pages/Species';
import Nearby from './pages/Nearby';

const Ctx = createContext(null);
export const useTrees = () => useContext(Ctx);

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'map', label: 'Map' },
  { to: 'list', label: 'Trees' },
  { to: 'nursery', label: 'Nursery & sales' },
  { to: 'sites', label: 'Sites & plots' },
  { to: 'reports', label: 'Reports' },
  { to: 'species', label: 'Species' },
  { to: 'team', label: 'Team', manage: true },
];

export default function TreeApp() {
  const [ref, setRef] = useState(null);
  const [trees, setTrees] = useState(null);
  const [error, setError] = useState('');
  const [queue, setQueue] = useState([]);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  const reload = useCallback(async () => {
    try {
      const r = await loadReference();
      setRef(r);
      if (r.me?.role) setTrees(await loadTrees().catch(() => trees || []));
      setError('');
    } catch (e) { setError(e.message); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    reload();
    registerTreeAppSW();
    getQueue().then(setQueue);
    const off = onQueueChange(setQueue);
    const up = () => { setOnline(true); syncQueue().then(reload); };
    const down = () => setOnline(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    if (navigator.onLine) syncQueue().then((r) => { if (r.sent) reload(); });
    return () => { off(); window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, [reload]);

  const role = ref?.me?.role || null;
  const value = useMemo(() => ({
    ref, trees: trees || [], reload, role, canManage: role === 'admin' || role === 'coordinator', queue, online,
    lookups: ref ? {
      site: Object.fromEntries(ref.sites.map((s) => [s.id, s])),
      plot: Object.fromEntries(ref.plots.map((p) => [p.id, p])),
      species: Object.fromEntries(ref.species.map((s) => [s.id, s])),
      nursery: Object.fromEntries(ref.nurseries.map((n) => [n.id, n])),
    } : null,
  }), [ref, trees, reload, role, queue, online]);

  if (error && !ref) return <Notice kind="error">{error}</Notice>;
  if (!ref) return <SlowLoading />;
  if (!role) return <NotOnTeam />;

  return (
    <Ctx.Provider value={value}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display font-bold text-display-sm md:text-display-md text-forest">Tree Monitor</h1>
          <p className="font-sans text-sm text-ink-muted">Green Futures · {role === 'admin' ? 'Admin' : role === 'coordinator' ? 'Coordinator' : 'Field team'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/me/trees/nearby" className="btn-secondary text-sm">📍 Near me</Link>
          <Link to="/me/trees/scan" className="btn-secondary text-sm">📷 Scan</Link>
          <Link to="/me/trees/register" className="btn-primary text-sm">+ Register tree</Link>
        </div>
      </div>

      {!online && <div className="mb-4"><Notice kind="warn">You’re offline. Registrations and check-ins are saved on this phone and will sync automatically.</Notice></div>}
      {queue.length > 0 && online && (
        <div className="mb-4"><Notice kind="info">
          {queue.length} record{queue.length > 1 ? 's' : ''} waiting to sync. <button className="underline font-semibold" onClick={() => syncQueue().then(reload)}>Sync now</button>
          {queue.some((q) => q.error) && <span className="block text-xs text-red-700 mt-1">Last error: {queue.find((q) => q.error).error}</span>}
        </Notice></div>
      )}

      <nav className="flex gap-1 overflow-x-auto border-b border-sand-dark/50 mb-5 -mx-1 px-1" aria-label="Tree Monitor sections">
        {TABS.filter((t) => !t.manage || value.canManage).map((t) => (
          <NavLink key={t.to} to={`/me/trees${t.to ? `/${t.to}` : ''}`} end={t.end}
            className={({ isActive }) => `flex-shrink-0 px-3 py-2.5 -mb-px font-sans text-sm font-medium border-b-2 ${isActive ? 'border-terracotta text-forest' : 'border-transparent text-ink-muted hover:text-forest'}`}>
            {t.label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route index element={<Overview />} />
        <Route path="map" element={<MapPage />} />
        <Route path="list" element={<TreesList />} />
        <Route path="tree/:code" element={<TreeDetail />} />
        <Route path="register" element={<Register />} />
        <Route path="check-in/:code" element={<CheckIn />} />
        <Route path="scan" element={<Scan />} />
        <Route path="nearby" element={<Nearby />} />
        <Route path="nursery" element={<Nursery />} />
        <Route path="sites" element={<Sites />} />
        <Route path="reports" element={<Reports />} />
        <Route path="labels" element={<Labels />} />
        <Route path="species" element={<Species />} />
        <Route path="team" element={<Team />} />
        <Route path="*" element={<Overview />} />
      </Routes>
    </Ctx.Provider>
  );
}

function SlowLoading() {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 15000); return () => clearTimeout(t); }, []);
  return (
    <div className="font-sans text-ink-muted space-y-3">
      <p>Loading the Tree Monitor…</p>
      {slow && (
        <>
          <p className="text-sm">This is taking longer than usual. Your connection may be slow, or your network may be blocking the site.</p>
          <button className="btn-secondary text-sm" onClick={() => window.location.reload()}>Try again</button>
        </>
      )}
    </div>
  );
}

function NotOnTeam() {
  const [s, setS] = useState(null);
  useEffect(() => { publicTreeSummary().then(setS).catch(() => {}); }, []);
  return (
    <>
      <h1 className="font-display font-bold text-display-sm md:text-display-md text-forest">Tree Monitor</h1>
      <p className="font-sans text-ink-muted mt-1 max-w-2xl">
        UYIH’s field app for Green Futures: every tree gets a QR label, a GPS point and regular health checks, from the school
        nursery to a growing tree.
      </p>
      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <Stat label="Trees planted" value={s.trees_planted} />
          <Stat label="Survival" value={s.survival_pct != null ? `${s.survival_pct}%` : '—'} />
          <Stat label="Seedlings sold" value={s.seedlings_sold} />
          <Stat label="Sites" value={s.sites} />
        </div>
      )}
      <div className="rounded-xl border border-sand-dark/50 bg-white p-5 mt-5">
        <h2 className="font-display font-bold text-xl text-forest">Join the field team</h2>
        <p className="font-sans text-sm text-ink-muted mt-1">
          Field team members register and check on trees at the pilot schools. You’ll need to complete Safeguarding Basics first,
          because the work happens in schools.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <a className="btn-primary text-sm" href={`https://wa.me/${UYIH_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi UYIH, I’d like to join the Tree Monitor field team.')}`}>Ask to join</a>
          <Link to="/treemonitoringapp" className="btn-secondary text-sm">About the app</Link>
        </div>
      </div>
    </>
  );
}
