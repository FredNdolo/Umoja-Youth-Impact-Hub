// File: src/trees/pages/Nearby.jsx
// "Near me": follows the phone's GPS, says which school and plot you're in
// (from the geofence and plot boundaries) and lists the trees around you,
// nearest first, so a check-in round needs no searching or scanning.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTrees } from '../TreeApp';
import { Card, Notice, StatusPill, TreeMap, Accuracy } from '../ui';
import { locate, nearby, fmtDistance } from '../geo';
import { dueForCheck } from './Overview';

const RANGES = [50, 100, 250, 500];

export default function Nearby() {
  const { trees, ref, lookups } = useTrees();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [err, setErr] = useState('');
  const [range, setRange] = useState(100);

  useEffect(() => {
    if (!navigator.geolocation) { setErr('This phone or browser can’t share its location.'); return undefined; }
    const id = navigator.geolocation.watchPosition(
      (p) => { setMe({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }); setErr(''); },
      (e) => setErr(e.code === 1 ? 'Location permission was refused. Allow location for this site and try again.' : 'Couldn’t get a GPS fix. Move into the open.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const sites = useMemo(() => ref.sites.filter((s) => s.active !== false), [ref]);
  const where = me ? locate({ lat: me.lat, lng: me.lng, accuracy: me.acc }, sites, ref.plots) : null;
  const list = useMemo(() => (me ? nearby(trees, me.lat, me.lng, range) : []), [trees, me, range]);
  const due = list.filter(dueForCheck).length;

  return (
    <div className="space-y-4 max-w-3xl">
      {err && <Notice kind="warn">{err}</Notice>}
      <Card>
        {!me ? <p className="font-sans text-sm text-ink-muted">Finding your location…</p> : (
          <div className="font-sans text-sm space-y-1">
            <p className="text-forest font-semibold">
              {where?.plot ? `📍 Plot “${where.plot.name}”, ${where.site.name}`
                : where?.site && where.inside ? `📍 ${where.site.name}`
                : where?.site ? `Not at a site · nearest is ${where.site.name}, ${fmtDistance(where.distance)} away`
                : 'Not at a site'}
            </p>
            <p className="text-xs text-ink-muted">{me.lat.toFixed(6)}, {me.lng.toFixed(6)} <Accuracy m={me.acc} /></p>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-2 font-sans text-sm">
        <span className="text-ink-muted">Within</span>
        {RANGES.map((r) => (
          <button key={r} onClick={() => setRange(r)} className={`rounded-full px-3 py-1 text-xs font-semibold border ${range === r ? 'bg-forest text-cream border-forest' : 'border-sand-dark text-ink-muted'}`}>{r} m</button>
        ))}
        {me && <span className="ml-auto text-ink-muted">{list.length} trees · {due} due</span>}
      </div>

      {me && (
        <TreeMap height={300} trees={list.map((t) => ({ ...t, species: lookups.species[t.species_id]?.common_name }))}
          plots={where?.site ? ref.plots.filter((p) => p.site_id === where.site.id) : []} sites={where?.site ? [where.site] : []}
          focus={[me.lat, me.lng]} onTree={(t) => navigate(`/me/trees/check-in/${t.code}`)} />
      )}

      {me && list.length === 0 && <p className="font-sans text-sm text-ink-muted text-center py-4">No trees within {range} m.</p>}
      <ul className="space-y-2">
        {list.map((t) => (
          <li key={t.id} className="rounded-xl border border-sand-dark/50 bg-white p-3 flex items-center gap-3">
            <span className="w-14 text-center font-sans text-sm font-semibold text-forest tabular-nums">{fmtDistance(t.distance)}</span>
            <div className="flex-1 min-w-0">
              <Link to={`/me/trees/tree/${t.code}`} className="font-mono font-semibold text-forest">{t.code}</Link>
              <p className="font-sans text-xs text-ink-muted truncate">{lookups.species[t.species_id]?.common_name} · {lookups.plot[t.plot_id]?.name}</p>
              <div className="mt-1 flex gap-2 items-center"><StatusPill status={t.status} />{dueForCheck(t) && <span className="font-sans text-[11px] font-semibold text-terracotta">Due</span>}</div>
            </div>
            <Link to={`/me/trees/check-in/${t.code}`} className="btn-primary text-xs px-3 py-2">Check in</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
