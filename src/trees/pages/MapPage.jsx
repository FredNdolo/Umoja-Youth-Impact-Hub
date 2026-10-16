// File: src/trees/pages/MapPage.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrees } from '../TreeApp';
import { TreeMap } from '../ui';
import { STATUS, codeFromScan } from '../api';
import { dueForCheck } from './Overview';

export default function MapPage() {
  const { trees, ref, lookups } = useTrees();
  const navigate = useNavigate();
  const [site, setSite] = useState('');
  const [status, setStatus] = useState('');
  const [species, setSpecies] = useState('');
  const [search, setSearch] = useState('');
  const [found, setFound] = useState(null);
  const sites = ref.sites.filter((s) => s.active !== false);

  const shown = useMemo(() => trees
    .filter((t) => !site || lookups.plot[t.plot_id]?.site_id === site)
    .filter((t) => !species || t.species_id === species)
    .filter((t) => !status || (status === 'due' ? dueForCheck(t) : t.status === status))
    .map((t) => ({ ...t, species: lookups.species[t.species_id]?.common_name })), [trees, site, status, species, lookups]);
  const plots = ref.plots.filter((p) => (site ? p.site_id === site : sites.some((s) => s.id === p.site_id)));
  const siteList = sites.filter((s) => !site || s.id === site);

  const find = (e) => {
    e.preventDefault();
    const code = codeFromScan(search) || codeFromScan(`UYIH-${search}`);
    const t = code && trees.find((x) => x.code === code);
    setFound(t ? { code: t.code, at: [t.latitude, t.longitude] } : { missing: search });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <form onSubmit={find} className="flex gap-1">
          <input className="input-field w-36 py-2 font-mono uppercase" placeholder="Find code" value={search} onChange={(e) => setSearch(e.target.value.toUpperCase())} aria-label="Find a tree by code" />
          <button className="btn-secondary text-sm px-3">Go</button>
        </form>
        <select className="input-field w-auto py-2" value={site} onChange={(e) => setSite(e.target.value)} aria-label="Site">
          <option value="">All sites</option>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input-field w-auto py-2" value={species} onChange={(e) => setSpecies(e.target.value)} aria-label="Species">
          <option value="">All species</option>{ref.species.map((s) => <option key={s.id} value={s.id}>{s.common_name}</option>)}
        </select>
        <select className="input-field w-auto py-2" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option><option value="due">Due for check-in</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="font-sans text-sm text-ink-muted">{shown.length} trees</span>
      </div>
      {found?.missing && <p className="font-sans text-sm text-amber-800">No tree with code {found.missing}.</p>}
      <TreeMap height={560} trees={shown} plots={plots} sites={siteList} highlight={found?.code} focus={found?.at}
        onTree={(t) => navigate(`/me/trees/tree/${t.code}`)} />
      <p className="font-sans text-xs text-ink-faint">Tap a tree to open it. Orange outlines are plot boundaries, orange dots are school centres and dashed circles are their geofences. Use 📍 to show where you are, ☰ to switch layers and ⛶ for full screen.</p>
    </div>
  );
}
