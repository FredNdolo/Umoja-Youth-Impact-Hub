// File: src/trees/pages/Reports.jsx
// Partner and donor reporting: KPIs for a period, survival by site and
// species, the Green Futures loop, data exports and a printable report.
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTrees } from '../TreeApp';
import { Card, Stat, Bar, Notice } from '../ui';
import { download, toCsv, today, fmtDate } from '../api';
import { survival, isLiving } from './Overview';
import { PRINT_CSS } from './Labels';
import { inRing, inSite, CHECKIN_FLAG_M } from '../geo';

function quarterOf(d = new Date()) {
  const q = Math.floor(d.getMonth() / 3);
  const from = new Date(d.getFullYear(), q * 3, 1);
  const to = new Date(d.getFullYear(), q * 3 + 3, 0);
  const iso = (x) => x.toLocaleDateString('en-CA');
  return { from: iso(from), to: iso(to), label: `Q${q + 1} ${d.getFullYear()}` };
}
const kes = (n) => `KES ${Math.round(Number(n || 0)).toLocaleString('en-KE')}`;
const inRange = (d, from, to) => d && d.slice(0, 10) >= from && d.slice(0, 10) <= to;

export default function Reports() {
  const { trees, ref, lookups } = useTrees();
  const [period, setPeriod] = useState(quarterOf());
  const [checkins, setCheckins] = useState(null);
  const [sales, setSales] = useState([]);
  const [dist, setDist] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('tm_checkins').select('id, tree_id, checked_at, health, height_cm, dbh_cm, latitude, longitude, accuracy_m, photo_path, offline, distance_m, people:checked_by(full_name)').order('checked_at').limit(20000),
      supabase.from('tm_sales').select('*'),
      supabase.from('tm_distributions').select('*'),
    ]).then(([c, s, d]) => {
      if (c.error) setErr(c.error.message);
      setCheckins(c.data || []); setSales(s.data || []); setDist(d.data || []);
    });
  }, []);

  const { from, to } = period;
  const k = useMemo(() => {
    const planted = trees.filter((t) => inRange(t.planted_on, from, to));
    const upTo = trees.filter((t) => t.planted_on <= to);
    const ci = (checkins || []).filter((c) => inRange(c.checked_at, from, to));
    const s = sales.filter((x) => inRange(x.sold_on, from, to));
    const d = dist.filter((x) => inRange(x.distributed_on, from, to));
    return {
      planted: planted.length, total: upTo.length, living: upTo.filter((t) => isLiving(t.status)).length, surv: survival(upTo),
      checkins: ci.length, treesChecked: new Set(ci.map((c) => c.tree_id)).size, photos: ci.filter((c) => c.photo_path).length,
      sold: s.reduce((a, x) => a + x.quantity, 0), kes: s.reduce((a, x) => a + Number(x.amount_kes), 0),
      packs: d.reduce((a, x) => a + x.packs, 0), girls: d.reduce((a, x) => a + (x.girls_reached || 0), 0), spent: d.reduce((a, x) => a + Number(x.cost_kes || 0), 0),
      raised: ref.batches.reduce((a, b) => a + (b.ready || 0), 0),
    };
  }, [trees, checkins, sales, dist, ref, from, to]);

  const group = (keyFn, names) => Object.entries(trees.reduce((m, t) => { const key = keyFn(t); (m[key] ||= []).push(t); return m; }, {}))
    .map(([key, list]) => ({ name: names(key), n: list.length, living: list.filter((t) => isLiving(t.status)).length, surv: survival(list) }))
    .sort((a, b) => b.n - a.n);
  const bySite = useMemo(() => group((t) => lookups.plot[t.plot_id]?.site_id, (id) => lookups.site[id]?.name || '—'), [trees, lookups]); // eslint-disable-line react-hooks/exhaustive-deps
  const bySpecies = useMemo(() => group((t) => t.species_id, (id) => lookups.species[id]?.common_name || '—'), [trees, lookups]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Exports ──
  const treeRow = (t) => {
    const p = lookups.plot[t.plot_id]; const s = lookups.site[p?.site_id]; const sp = lookups.species[t.species_id];
    return { code: t.code, site: s?.name, site_code: s?.code, plot: p?.name, species: sp?.scientific_name, common_name: sp?.common_name, native: sp?.is_native, planted_on: t.planted_on, status: t.status, height_cm: t.height_cm, dbh_cm: t.dbh_cm, last_checked: t.last_checked_at, latitude: t.latitude, longitude: t.longitude, gps_accuracy_m: t.accuracy_m, sponsor: t.sponsor_name };
  };
  const exportTrees = () => {
    const rows = trees.map(treeRow);
    download(`uyih-trees-${today()}.csv`, toCsv(rows, Object.keys(rows[0] || treeRow({})).map((key) => ({ label: key, get: (r) => r[key] }))), 'text/csv');
  };
  const exportCheckins = () => {
    const code = Object.fromEntries(trees.map((t) => [t.id, t.code]));
    download(`uyih-checkins-${today()}.csv`, toCsv(checkins || [], [
      { label: 'tree_code', get: (c) => code[c.tree_id] }, { label: 'checked_at', get: (c) => c.checked_at }, { label: 'health', get: (c) => c.health },
      { label: 'height_cm', get: (c) => c.height_cm }, { label: 'dbh_cm', get: (c) => c.dbh_cm }, { label: 'latitude', get: (c) => c.latitude },
      { label: 'longitude', get: (c) => c.longitude }, { label: 'gps_accuracy_m', get: (c) => c.accuracy_m }, { label: 'has_photo', get: (c) => !!c.photo_path },
      { label: 'synced_later', get: (c) => !!c.offline }, { label: 'distance_from_tree_m', get: (c) => c.distance_m }, { label: 'recorded_by', get: (c) => c.people?.full_name },
    ]), 'text/csv');
  };
  const exportGeoJSON = () => {
    const fc = {
      type: 'FeatureCollection',
      features: [
        ...trees.map((t) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [t.longitude, t.latitude] }, properties: treeRow(t) })),
        ...ref.plots.filter((p) => p.boundary).map((p) => ({ type: 'Feature', geometry: p.boundary, properties: { kind: 'plot', name: p.name, site: lookups.site[p.site_id]?.name, area_ha: p.area_ha, baseline_locked_at: p.baseline_locked_at } })),
      ],
    };
    download(`uyih-trees-${today()}.geojson`, JSON.stringify(fc, null, 1), 'application/geo+json');
  };
  const exportKML = () => {
    const x = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
    const marks = trees.map((t) => { const r = treeRow(t); return `<Placemark><name>${x(t.code)}</name><description>${x(`${r.common_name} · ${r.site} · ${r.status} · planted ${r.planted_on}`)}</description><Point><coordinates>${t.longitude},${t.latitude},0</coordinates></Point></Placemark>`; });
    const polys = ref.plots.filter((p) => p.boundary).map((p) => `<Placemark><name>${x(p.name)}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${p.boundary.coordinates[0].map(([lng, lat]) => `${lng},${lat},0`).join(' ')}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>`);
    download(`uyih-trees-${today()}.kml`, `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>UYIH Green Futures trees</name>${polys.join('')}${marks.join('')}</Document></kml>`, 'application/vnd.google-earth.kml+xml');
  };

  const quarters = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 3 * i); return quarterOf(d); });

  return (
    <div className="space-y-5">
      <style>{PRINT_CSS}</style>
      <div className="tm-noprint flex flex-wrap items-end gap-3">
        <label className="block"><span className="input-label">Period</span>
          <select className="input-field py-2" value={period.label} onChange={(e) => setPeriod(e.target.value === 'all' ? { from: '2000-01-01', to: today(), label: 'all' } : quarters.find((q) => q.label === e.target.value))}>
            {quarters.map((q) => <option key={q.label} value={q.label}>{q.label}</option>)}<option value="all">All time</option>
          </select></label>
        <button className="btn-primary text-sm" onClick={() => window.print()}>🖨 Print / save report as PDF</button>
        <span className="flex flex-wrap gap-2 text-sm">
          <button className="btn-secondary text-sm" onClick={exportTrees} disabled={!trees.length}>Trees CSV</button>
          <button className="btn-secondary text-sm" onClick={exportCheckins} disabled={!checkins?.length}>Check-ins CSV</button>
          <button className="btn-secondary text-sm" onClick={exportGeoJSON} disabled={!trees.length && !ref.plots.some((p) => p.boundary)}>GeoJSON</button>
          <button className="btn-secondary text-sm" onClick={exportKML} disabled={!trees.length}>KML (Google Earth)</button>
          <Link to="/me/trees/labels" className="btn-secondary text-sm">🏷 QR labels</Link>
        </span>
      </div>
      {err && <Notice kind="error">{err}</Notice>}

      <div className="tm-print space-y-5 bg-white">
        <header className="flex items-end justify-between border-b-2 border-forest pb-3">
          <div>
            <p className="font-sans text-xs font-bold tracking-wider text-terracotta uppercase">Umoja Youth Impact Hub · Green Futures</p>
            <h2 className="font-display font-bold text-2xl text-forest">Tree monitoring report — {period.label === 'all' ? 'all time' : period.label}</h2>
            <p className="font-sans text-xs text-ink-muted">{period.label === 'all' ? `Up to ${fmtDate(to)}` : `${fmtDate(from)} – ${fmtDate(to)}`} · Narok County, Kenya · generated {fmtDate(new Date())}</p>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Planted this period" value={k.planted} />
          <Stat label="Trees on record" value={k.total} hint={`${k.living} living`} />
          <Stat label="Survival" value={k.surv != null ? `${k.surv}%` : '—'} hint="Of trees checked at least once" accent={k.surv != null && k.surv < 75 ? 'text-amber-700' : 'text-forest'} />
          <Stat label="Check-ins this period" value={checkins ? k.checkins : '…'} hint={`${k.treesChecked} trees · ${k.photos} with photos`} />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <Card title="Survival by site"><Breakdown rows={bySite} /></Card>
          <Card title="Survival by species"><Breakdown rows={bySpecies} /></Card>
        </div>

        <Card title="Green Futures loop this period">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 font-sans">
            <div><dt className="text-xs text-ink-muted">Seedlings sold</dt><dd className="font-display font-bold text-xl text-forest">{k.sold}</dd></div>
            <div><dt className="text-xs text-ink-muted">Sales income</dt><dd className="font-display font-bold text-xl text-forest">{kes(k.kes)}</dd></div>
            <div><dt className="text-xs text-ink-muted">Pad packs distributed</dt><dd className="font-display font-bold text-xl text-terracotta">{k.packs}</dd></div>
            <div><dt className="text-xs text-ink-muted">Girls reached</dt><dd className="font-display font-bold text-xl text-terracotta">{k.girls}</dd></div>
          </dl>
          <p className="font-sans text-xs text-ink-muted mt-3">Seedlings currently ready in nurseries: {k.raised}. Spent on products: {kes(k.spent)}.</p>
        </Card>

        <Quality trees={trees} checkins={checkins || []} lookups={lookups} />

        <Card title="Method">
          <p className="font-sans text-xs text-ink-muted leading-relaxed">
            Each tree has a unique QR-labelled code and a phone GPS point (accuracy recorded per point). Trained UYIH members check trees roughly monthly,
            recording health, height and a photo of the tree. Survival = trees alive or stressed ÷ trees checked at least once (alive, stressed, dead or missing).
            Plot baselines are recorded and locked before planting. All edits are kept in an audit log, and records can only be deleted by an administrator.
            No children are photographed or named in this system.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Breakdown({ rows }) {
  if (!rows.length) return <p className="font-sans text-sm text-ink-muted">No trees yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.name}>
          <div className="flex justify-between gap-2 font-sans text-sm"><span className="font-semibold text-forest">{r.name}</span><span className="text-ink-muted">{r.n} · {r.living} living · {r.surv != null ? `${r.surv}%` : '—'}</span></div>
          <div className="mt-1"><Bar pct={r.surv ?? 0} color={r.surv == null ? '#E8DCC4' : r.surv >= 75 ? '#1F8F4E' : '#D99A1E'} /></div>
        </li>
      ))}
    </ul>
  );
}

// Records that may need a second look, found with the GPS geofences
function Quality({ trees, checkins, lookups }) {
  const weak = trees.filter((t) => Number(t.accuracy_m) > 25);
  const offPlot = trees.filter((t) => { const r = lookups.plot[t.plot_id]?.boundary?.coordinates?.[0]; return r && !inRing(t.longitude, t.latitude, r); });
  const offSite = trees.filter((t) => inSite(lookups.site[lookups.plot[t.plot_id]?.site_id], t.latitude, t.longitude, t.accuracy_m) === false);
  const far = checkins.filter((c) => c.distance_m != null && Number(c.distance_m) > CHECKIN_FLAG_M);
  const code = Object.fromEntries(trees.map((t) => [t.id, t.code]));
  const rows = [
    ['Trees with weak GPS (over ±25 m)', weak.map((t) => t.code)],
    ['Trees outside their plot boundary', offPlot.map((t) => t.code)],
    ['Trees outside their school’s geofence', offSite.map((t) => t.code)],
    [`Check-ins made over ${CHECKIN_FLAG_M} m from the tree`, far.map((c) => code[c.tree_id]).filter(Boolean)],
  ];
  const total = rows.reduce((a, [, l]) => a + l.length, 0);
  return (
    <Card title="Data quality">
      {total === 0 ? <p className="font-sans text-sm text-forest">✓ No location issues found.</p> : (
        <ul className="space-y-2 font-sans text-sm">
          {rows.map(([label, list]) => (
            <li key={label} className="flex flex-wrap gap-x-2">
              <span className={list.length ? 'text-amber-800 font-semibold' : 'text-ink-muted'}>{list.length}</span>
              <span className="text-ink">{label}</span>
              {list.length > 0 && <span className="w-full text-xs font-mono text-ink-muted break-words">{[...new Set(list)].slice(0, 20).join(', ')}{list.length > 20 ? ' …' : ''}</span>}
            </li>
          ))}
        </ul>
      )}
      <p className="font-sans text-xs text-ink-faint mt-3">Checked against each school’s geofence and each plot’s boundary. Distances are worked out by the database and can’t be edited.</p>
    </Card>
  );
}
