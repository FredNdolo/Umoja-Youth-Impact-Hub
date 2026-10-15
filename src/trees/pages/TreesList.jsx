// File: src/trees/pages/TreesList.jsx
import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTrees } from '../TreeApp';
import { StatusPill } from '../ui';
import { STATUS, fmtDate, daysSince } from '../api';
import { dueForCheck } from './Overview';

export default function TreesList() {
  const { trees, ref, lookups } = useTrees();
  const [params] = useSearchParams();
  const [site, setSite] = useState('');
  const [species, setSpecies] = useState('');
  const [status, setStatus] = useState(params.get('filter') === 'due' ? 'due' : '');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(50);

  const shown = useMemo(() => {
    const s = search.trim().toUpperCase();
    return trees
      .filter((t) => !site || lookups.plot[t.plot_id]?.site_id === site)
      .filter((t) => !species || t.species_id === species)
      .filter((t) => !status || (status === 'due' ? dueForCheck(t) : t.status === status))
      .filter((t) => !s || t.code.includes(s) || (t.sponsor_name || '').toUpperCase().includes(s));
  }, [trees, site, species, status, search, lookups]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input className="input-field w-full sm:w-44 py-2 font-mono uppercase" placeholder="Search code" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search code" />
        <select className="input-field w-auto py-2" value={site} onChange={(e) => setSite(e.target.value)} aria-label="Site">
          <option value="">All sites</option>{ref.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input-field w-auto py-2" value={species} onChange={(e) => setSpecies(e.target.value)} aria-label="Species">
          <option value="">All species</option>{ref.species.map((s) => <option key={s.id} value={s.id}>{s.common_name}</option>)}
        </select>
        <select className="input-field w-auto py-2" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option><option value="due">Due for check-in</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <p className="font-sans text-sm text-ink-muted">{shown.length} tree{shown.length === 1 ? '' : 's'}</p>
      {shown.length === 0 ? <p className="font-sans text-ink-muted py-6 text-center">No trees match.</p> : (
        <div className="rounded-xl border border-sand-dark/50 overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead className="bg-sand-light text-left text-xs text-ink-muted">
                <tr><th className="px-3 py-2.5">Code</th><th className="px-3">Species</th><th className="px-3 hidden md:table-cell">Site · plot</th><th className="px-3">Status</th><th className="px-3 hidden sm:table-cell">Height</th><th className="px-3 hidden sm:table-cell">Last check</th><th className="px-3" /></tr>
              </thead>
              <tbody className="divide-y divide-sand-dark/40">
                {shown.slice(0, limit).map((t) => {
                  const p = lookups.plot[t.plot_id]; const d = daysSince(t.last_checked_at);
                  return (
                    <tr key={t.id} className="hover:bg-sand-light/50">
                      <td className="px-3 py-2.5"><Link to={`/me/trees/tree/${t.code}`} className="font-mono font-semibold text-forest">{t.code}</Link></td>
                      <td className="px-3">{lookups.species[t.species_id]?.common_name}</td>
                      <td className="px-3 hidden md:table-cell text-ink-muted">{lookups.site[p?.site_id]?.name} · {p?.name}</td>
                      <td className="px-3"><StatusPill status={t.status} /></td>
                      <td className="px-3 hidden sm:table-cell">{t.height_cm != null ? `${Number(t.height_cm)} cm` : '—'}</td>
                      <td className="px-3 hidden sm:table-cell text-ink-muted">{t.last_checked_at ? `${fmtDate(t.last_checked_at)}${d >= 30 ? ' ⚠️' : ''}` : 'Never'}</td>
                      <td className="px-3 text-right"><Link to={`/me/trees/check-in/${t.code}`} className="text-xs font-semibold text-terracotta whitespace-nowrap">Check in</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {shown.length > limit && <button className="btn-secondary w-full text-sm" onClick={() => setLimit(limit + 100)}>Show more</button>}
    </div>
  );
}
