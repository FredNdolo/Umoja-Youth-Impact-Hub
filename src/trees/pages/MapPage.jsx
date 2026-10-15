// File: src/trees/pages/MapPage.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrees } from '../TreeApp';
import { TreeMap } from '../ui';
import { STATUS } from '../api';

export default function MapPage() {
  const { trees, ref, lookups } = useTrees();
  const navigate = useNavigate();
  const [site, setSite] = useState('');
  const [status, setStatus] = useState('');
  const shown = useMemo(() => trees
    .filter((t) => !site || lookups.plot[t.plot_id]?.site_id === site)
    .filter((t) => !status || t.status === status)
    .map((t) => ({ ...t, species: lookups.species[t.species_id]?.common_name })), [trees, site, status, lookups]);
  const plots = ref.plots.filter((p) => !site || p.site_id === site);
  const sites = ref.sites.filter((s) => !site || s.id === site);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select className="input-field w-auto py-2" value={site} onChange={(e) => setSite(e.target.value)} aria-label="Site">
          <option value="">All sites</option>
          {ref.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input-field w-auto py-2" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="font-sans text-sm text-ink-muted self-center">{shown.length} trees</span>
      </div>
      <TreeMap height={560} trees={shown} plots={plots} sites={sites} onTree={(t) => navigate(`/me/trees/tree/${t.code}`)} />
      <p className="font-sans text-xs text-ink-faint">Tap a tree to open it. Orange outlines are plot boundaries; orange dots are sites.</p>
    </div>
  );
}
