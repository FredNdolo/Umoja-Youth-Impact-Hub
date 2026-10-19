// File: src/trees/pages/Sites.jsx
// Sites (schools) with their geofence, plots with walked or drawn
// boundaries, and the before-planting baseline that gets locked as evidence.
// Sites can be added, archived (work there has ended), restored, or — while
// nothing has been recorded there yet — deleted by an admin.
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTrees } from '../TreeApp';
import { Card, Field, Notice, TreeMap, Accuracy } from '../ui';
import { getPosition, ringAreaHa, compressPhoto, uuid, PHOTO_BUCKET, photoUrl, fmtDate, today } from '../api';
import { DEFAULT_GEOFENCE_M, inRing, inSite, fmtDistance, siteDistance } from '../geo';

const num = (v) => (v === '' || v == null ? null : Number(v));
const friendly = (msg) => (/foreign key|violates/i.test(msg)
  ? 'This still has records attached (plots, nursery, trees, baseline or distributions), so it can’t be deleted. Archive it instead.'
  : msg);

export default function Sites() {
  const { ref, canManage, reload } = useTrees();
  const active = ref.sites.filter((s) => s.active !== false);
  const archived = ref.sites.filter((s) => s.active === false);
  const [open, setOpen] = useState(active[0]?.id || null);
  return (
    <div className="space-y-4">
      {!canManage && <Notice kind="info">Coordinators manage sites and plots. Field team members can record plot baselines.</Notice>}
      <SitesMap />
      {active.map((s) => <Site key={s.id} site={s} open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} />)}
      {active.length === 0 && <p className="font-sans text-sm text-ink-muted">No active sites.</p>}
      {canManage && <NewSite onDone={reload} />}
      {archived.length > 0 && (
        <details className="rounded-xl border border-sand-dark/50 bg-white p-4">
          <summary className="cursor-pointer font-sans text-sm font-semibold text-ink-muted">Archived sites ({archived.length})</summary>
          <ul className="mt-3 divide-y divide-sand-dark/40">{archived.map((s) => <ArchivedSite key={s.id} site={s} />)}</ul>
        </details>
      )}
    </div>
  );
}

// Overview map of every active site, its geofence and plots
function SitesMap() {
  const { ref, trees, lookups } = useTrees();
  const active = ref.sites.filter((s) => s.active !== false);
  if (!active.some((s) => s.latitude != null) && !ref.plots.some((p) => p.boundary)) return null;
  return (
    <TreeMap height={300} sites={active} plots={ref.plots.filter((p) => active.some((s) => s.id === p.site_id))}
      trees={trees.map((t) => ({ ...t, species: lookups.species[t.species_id]?.common_name }))} />
  );
}

function useSiteCounts(site) {
  const { ref, trees } = useTrees();
  return useMemo(() => {
    const plots = ref.plots.filter((p) => p.site_id === site.id);
    return {
      plots,
      trees: trees.filter((t) => plots.some((p) => p.id === t.plot_id)).length,
      nurseries: ref.nurseries.filter((n) => n.site_id === site.id).length,
    };
  }, [ref, trees, site.id]);
}

function SiteActions({ site, counts, onEdit }) {
  const { role, canManage, reload } = useTrees();
  const [err, setErr] = useState('');
  if (!canManage) return null;
  const empty = !counts.plots.length && !counts.nurseries && !counts.trees;
  const archive = async () => {
    if (!window.confirm(`Archive ${site.name}? It disappears from the field app and the public page, but all its records are kept. You can restore it later.`)) return;
    const { error } = await supabase.from('tm_sites').update({ active: false }).eq('id', site.id);
    if (error) setErr(error.message); else reload();
  };
  const remove = async () => {
    if (!window.confirm(`Delete ${site.name} permanently? This can’t be undone.`)) return;
    const { error } = await supabase.from('tm_sites').delete().eq('id', site.id);
    if (error) setErr(friendly(error.message)); else reload();
  };
  return (
    <span className="flex flex-wrap gap-3 font-sans text-xs">
      {onEdit && <button className="underline text-ink-muted" onClick={onEdit}>Edit site</button>}
      <button className="underline text-ink-muted" onClick={archive}>Archive</button>
      {role === 'admin' && empty && <button className="underline text-red-700" onClick={remove}>Delete</button>}
      {err && <span className="text-red-700 w-full">{err}</span>}
    </span>
  );
}

function ArchivedSite({ site }) {
  const { role, canManage, reload } = useTrees();
  const counts = useSiteCounts(site);
  const [err, setErr] = useState('');
  const restore = async () => {
    const { error } = await supabase.from('tm_sites').update({ active: true }).eq('id', site.id);
    if (error) setErr(error.message); else reload();
  };
  const remove = async () => {
    if (!window.confirm(`Delete ${site.name} permanently? This can’t be undone.`)) return;
    const { error } = await supabase.from('tm_sites').delete().eq('id', site.id);
    if (error) setErr(friendly(error.message)); else reload();
  };
  const empty = !counts.plots.length && !counts.nurseries && !counts.trees;
  return (
    <li className="py-2.5 flex flex-wrap items-center gap-3 font-sans text-sm">
      <span className="text-ink">{site.name}</span>
      <span className="text-xs text-ink-faint">{counts.plots.length} plots · {counts.trees} trees</span>
      {canManage && <button className="ml-auto underline text-xs text-forest" onClick={restore}>Restore</button>}
      {role === 'admin' && empty && <button className="underline text-xs text-red-700" onClick={remove}>Delete</button>}
      {err && <span className="w-full text-xs text-red-700">{err}</span>}
    </li>
  );
}

function Site({ site, open, onToggle }) {
  const { canManage, reload, trees } = useTrees();
  const counts = useSiteCounts(site);
  const [edit, setEdit] = useState(false);
  return (
    <section className="rounded-xl border border-sand-dark/50 bg-white">
      <button className="w-full flex flex-wrap items-center gap-2 justify-between p-4 text-left" onClick={onToggle} aria-expanded={open}>
        <span>
          <span className="font-display font-bold text-lg text-forest">{site.name}</span>
          <span className="block font-sans text-xs text-ink-muted">{[site.ward, site.sub_county, site.county].filter(Boolean).join(', ')} · {counts.plots.length} plot{counts.plots.length === 1 ? '' : 's'} · {counts.trees} trees</span>
        </span>
        <span className="font-sans text-xs">
          {site.latitude == null ? <span className="text-amber-800">No GPS point yet</span>
            : <span className="text-ink-muted">{site.latitude.toFixed(5)}, {site.longitude.toFixed(5)} · geofence {site.geofence_m || DEFAULT_GEOFENCE_M} m</span>}
          <span aria-hidden="true" className="ml-2">{open ? '▴' : '▾'}</span>
        </span>
      </button>
      {open && (
        <div className="border-t border-sand-dark/40 p-4 space-y-4">
          {edit ? <SiteForm site={site} onDone={() => { setEdit(false); reload(); }} onCancel={() => setEdit(false)} /> : (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm text-ink-muted">
              {site.contact_name && <span>Contact: {site.contact_name}{site.contact_phone ? ` · ${site.contact_phone}` : ''}</span>}
              {site.agreement_ref && <span>Agreement: {site.agreement_ref}{site.agreement_on ? ` (${fmtDate(site.agreement_on)})` : ''}</span>}
              <SiteActions site={site} counts={counts} onEdit={() => setEdit(true)} />
            </div>
          )}
          {site.latitude == null && !edit && canManage && <Notice kind="warn">Add this school’s GPS centre (Edit site) so the app can recognise when the field team is here.</Notice>}
          {(site.latitude != null || counts.plots.some((p) => p.boundary)) && !edit && (
            <TreeMap height={280} sites={[site]} plots={counts.plots} trees={trees.filter((t) => counts.plots.some((p) => p.id === t.plot_id))}
              focus={site.latitude != null && !counts.plots.some((p) => p.boundary) ? [site.latitude, site.longitude] : undefined} />
          )}
          <div className="space-y-3">
            {counts.plots.map((p) => <Plot key={p.id} plot={p} site={site} />)}
            {counts.plots.length === 0 && <p className="font-sans text-sm text-ink-muted">No plots yet.</p>}
          </div>
          {canManage && <NewPlot siteId={site.id} onDone={reload} />}
        </div>
      )}
    </section>
  );
}

function SiteForm({ site = {}, onDone, onCancel }) {
  const [f, setF] = useState({
    name: site.name || '', code: site.code || '', kind: site.kind || 'school', county: site.county || 'Narok', sub_county: site.sub_county || '', ward: site.ward || '',
    latitude: site.latitude ?? '', longitude: site.longitude ?? '', geofence_m: site.geofence_m || DEFAULT_GEOFENCE_M,
    contact_name: site.contact_name || '', contact_phone: site.contact_phone || '', agreement_ref: site.agreement_ref || '', agreement_on: site.agreement_on || '',
  });
  const [err, setErr] = useState(''); const [acc, setAcc] = useState(null); const [locating, setLocating] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const here = async () => {
    setLocating(true); setErr('');
    try { const p = await getPosition(); setF((x) => ({ ...x, latitude: p.latitude, longitude: p.longitude })); setAcc(p.accuracy_m); } catch (e) { setErr(e.message); }
    setLocating(false);
  };
  const hasPoint = f.latitude !== '' && f.longitude !== '';
  const preview = hasPoint ? [{ id: 'preview', name: f.name || 'Site centre', latitude: Number(f.latitude), longitude: Number(f.longitude), geofence_m: Number(f.geofence_m) || DEFAULT_GEOFENCE_M }] : [];
  const save = async (e) => {
    e.preventDefault(); setErr('');
    const row = { ...f, code: f.code.trim().toUpperCase() || null, latitude: num(f.latitude), longitude: num(f.longitude), geofence_m: Number(f.geofence_m) || DEFAULT_GEOFENCE_M, agreement_on: f.agreement_on || null };
    for (const k of ['sub_county', 'ward', 'contact_name', 'contact_phone', 'agreement_ref']) row[k] = row[k] || null;
    if ((row.latitude == null) !== (row.longitude == null)) { setErr('Enter both latitude and longitude, or neither.'); return; }
    const { error } = site.id ? await supabase.from('tm_sites').update(row).eq('id', site.id) : await supabase.from('tm_sites').insert(row);
    if (error) setErr(/tm_sites_code_key|duplicate/i.test(error.message) ? 'Another site already uses that short code.' : error.message); else onDone();
  };
  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Name"><input className="input-field" required minLength={2} value={f.name} onChange={set('name')} /></Field>
        <Field label="Short code" hint="Capitals, e.g. NTULELE"><input className="input-field uppercase" value={f.code} onChange={set('code')} pattern="[A-Za-z0-9-]{2,20}" /></Field>
        <Field label="Kind"><select className="input-field" value={f.kind} onChange={set('kind')}><option value="school">School</option><option value="community">Community land</option><option value="public_land">Public land</option><option value="other">Other</option></select></Field>
        <Field label="County"><input className="input-field" value={f.county} onChange={set('county')} /></Field>
        <Field label="Sub-county"><input className="input-field" value={f.sub_county} onChange={set('sub_county')} /></Field>
        <Field label="Ward"><input className="input-field" value={f.ward} onChange={set('ward')} /></Field>
      </div>
      <div className="rounded-lg bg-sand-light/60 p-3 space-y-3">
        <p className="font-sans text-sm font-semibold text-forest">Location and geofence</p>
        <p className="font-sans text-xs text-ink-muted">Stand in the middle of the school compound and tap <strong>Use my location</strong>, or tap the map to place the centre. The geofence is the circle around it: anyone inside it is treated as being at this site.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Latitude"><input type="number" step="any" min="-90" max="90" className="input-field" value={f.latitude} onChange={set('latitude')} /></Field>
          <Field label="Longitude"><input type="number" step="any" min="-180" max="180" className="input-field" value={f.longitude} onChange={set('longitude')} /></Field>
          <Field label={`Geofence radius: ${f.geofence_m} m`} hint="A school compound is usually 100–300 m across">
            <input type="range" min="50" max="1000" step="25" className="w-full mt-3 accent-[#C4622D]" value={f.geofence_m} onChange={set('geofence_m')} aria-label="Geofence radius in metres" />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={here} disabled={locating}>{locating ? 'Getting a fix…' : '📍 Use my location'}</button>
          {acc != null && <Accuracy m={acc} />}
        </div>
        <TreeMap height={260} sites={preview} focus={hasPoint ? [Number(f.latitude), Number(f.longitude)] : undefined}
          onMapClick={({ lat, lng }) => setF((x) => ({ ...x, latitude: +lat.toFixed(7), longitude: +lng.toFixed(7) }))} />
        <p className="font-sans text-[11px] text-ink-faint">Tip: switch to Satellite and zoom in to find the school buildings, then tap the centre.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Contact (head teacher / patron)"><input className="input-field" value={f.contact_name} onChange={set('contact_name')} /></Field>
        <Field label="Contact phone"><input className="input-field" inputMode="tel" value={f.contact_phone} onChange={set('contact_phone')} /></Field>
        <div className="hidden sm:block" />
        <Field label="Land agreement / MOU ref"><input className="input-field" value={f.agreement_ref} onChange={set('agreement_ref')} /></Field>
        <Field label="Agreement date"><input type="date" className="input-field" value={f.agreement_on} onChange={set('agreement_on')} /></Field>
      </div>
      <div className="flex gap-2"><button className="btn-primary text-sm">Save site</button>{onCancel && <button type="button" className="btn-secondary text-sm" onClick={onCancel}>Cancel</button>}</div>
      {err && <p className="font-sans text-sm text-red-700" role="alert">{err}</p>}
    </form>
  );
}

function NewSite({ onDone }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button className="btn-secondary text-sm" onClick={() => setOpen(true)}>+ Add a site</button>;
  return <Card title="New site"><SiteForm onDone={() => { setOpen(false); onDone(); }} onCancel={() => setOpen(false)} /></Card>;
}

function NewPlot({ siteId, onDone }) {
  const [f, setF] = useState({ name: '', soil_type: '', land_use_before: '' });
  const [err, setErr] = useState('');
  const save = async (e) => {
    e.preventDefault(); setErr('');
    const { error } = await supabase.from('tm_plots').insert({ site_id: siteId, name: f.name.trim(), soil_type: f.soil_type || null, land_use_before: f.land_use_before || null });
    if (error) setErr(/unique|duplicate/i.test(error.message) ? 'There is already a plot with that name here.' : error.message);
    else { setF({ name: '', soil_type: '', land_use_before: '' }); onDone(); }
  };
  return (
    <form onSubmit={save} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end rounded-lg bg-sand-light/60 p-3">
      <Field label="New plot name"><input className="input-field" required value={f.name} placeholder="e.g. School boundary row" onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Soil"><input className="input-field" value={f.soil_type} placeholder="e.g. sandy loam" onChange={(e) => setF({ ...f, soil_type: e.target.value })} /></Field>
      <Field label="Land use before"><input className="input-field" value={f.land_use_before} placeholder="e.g. bare playground edge" onChange={(e) => setF({ ...f, land_use_before: e.target.value })} /></Field>
      <button className="btn-primary text-sm">Add plot</button>
      {err && <p className="sm:col-span-4 font-sans text-sm text-red-700">{err}</p>}
    </form>
  );
}

function Plot({ plot, site }) {
  const { canManage, role, reload, trees } = useTrees();
  const [mode, setMode] = useState(null); // null | 'walk' | 'draw'
  const [pts, setPts] = useState([]); // [[lng, lat, accuracy?], …]
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showBase, setShowBase] = useState(false);
  const plotTrees = trees.filter((t) => t.plot_id === plot.id);
  const ring = plot.boundary?.coordinates?.[0];
  const outside = ring ? plotTrees.filter((t) => !inRing(t.longitude, t.latitude, ring)).length : 0;

  const start = (m) => { setMode(m); setPts([]); setErr(''); };
  const addCorner = async () => {
    setBusy(true); setErr('');
    try { const p = await getPosition(); setPts((x) => [...x, [p.longitude, p.latitude, p.accuracy_m]]); } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const saveShape = async () => {
    const r = pts.map(([lng, lat]) => [lng, lat]);
    const off = site?.latitude != null ? r.filter(([lng, lat]) => inSite(site, lat, lng) === false).length : 0;
    if (off && !window.confirm(`${off} corner${off > 1 ? 's are' : ' is'} outside ${site.name}’s geofence. Save anyway?`)) return;
    const boundary = { type: 'Polygon', coordinates: [[...r, r[0]]] };
    const { error } = await supabase.from('tm_plots').update({ boundary, area_ha: Math.round(ringAreaHa(r) * 10000) / 10000 }).eq('id', plot.id);
    if (error) setErr(error.message); else { setMode(null); setPts([]); reload(); }
  };
  const removePlot = async () => {
    if (!window.confirm(`Delete plot “${plot.name}”? This can’t be undone.`)) return;
    const { error } = await supabase.from('tm_plots').delete().eq('id', plot.id);
    if (error) setErr(friendly(error.message)); else reload();
  };

  return (
    <div className="rounded-lg border border-sand-dark/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-sans font-semibold text-forest">{plot.name}</p>
          <p className="font-sans text-xs text-ink-muted">
            {plotTrees.length} trees{plot.area_ha != null ? ` · ${Number(plot.area_ha).toFixed(3)} ha` : ''}{plot.soil_type ? ` · ${plot.soil_type}` : ''}{plot.land_use_before ? ` · was ${plot.land_use_before}` : ''}
          </p>
          {outside > 0 && <p className="font-sans text-xs text-amber-800">{outside} tree{outside > 1 ? 's are' : ' is'} registered outside this plot’s boundary.</p>}
        </div>
        <div className="flex flex-wrap gap-2 font-sans text-xs">
          <span className={`rounded-full px-2 py-1 font-semibold ${plot.baseline_locked_at ? 'bg-forest/10 text-forest' : 'bg-amber-100 text-amber-900'}`}>{plot.baseline_locked_at ? `Baseline locked ${fmtDate(plot.baseline_locked_at)}` : 'Baseline not locked'}</span>
          <button className="underline text-ink-muted" onClick={() => setShowBase(!showBase)}>{showBase ? 'Hide baseline' : 'Baseline'}</button>
          {canManage && !mode && <button className="underline text-ink-muted" onClick={() => start('walk')}>{plot.boundary ? 'Re-walk boundary' : 'Walk boundary'}</button>}
          {canManage && !mode && <button className="underline text-ink-muted" onClick={() => start('draw')}>Draw on map</button>}
          {role === 'admin' && !plotTrees.length && !plot.baseline_locked_at && <button className="underline text-red-700" onClick={removePlot}>Delete</button>}
        </div>
      </div>
      {mode && (
        <div className="mt-3 rounded-lg bg-sand-light/60 p-3 space-y-2">
          {mode === 'walk'
            ? <p className="font-sans text-sm">Walk to each corner of the plot and tap <strong>Add corner</strong>. At least 3 corners.</p>
            : <p className="font-sans text-sm">Tap each corner of the plot on the satellite map, in order. At least 3 corners. Walking it with GPS is more accurate when you’re on site.</p>}
          {mode === 'draw' && <TreeMap height={320} sites={site ? [site] : []} plots={[]} draft={pts}
            focus={pts.length ? undefined : (site?.latitude != null ? [site.latitude, site.longitude] : undefined)}
            onMapClick={({ lat, lng }) => setPts((x) => [...x, [+lng.toFixed(7), +lat.toFixed(7)]])} />}
          <div className="flex flex-wrap gap-2 items-center">
            {mode === 'walk' && <button className="btn-primary text-sm" onClick={addCorner} disabled={busy}>{busy ? 'Getting fix…' : `📍 Add corner ${pts.length + 1}`}</button>}
            {pts.length > 0 && <button className="btn-secondary text-sm" onClick={() => setPts(pts.slice(0, -1))}>Undo last</button>}
            {pts.length >= 3 && <button className={mode === 'draw' ? 'btn-primary text-sm' : 'btn-secondary text-sm'} onClick={saveShape}>Save boundary · {ringAreaHa(pts).toFixed(3)} ha</button>}
            <button className="text-sm underline text-ink-muted" onClick={() => { setMode(null); setPts([]); }}>Cancel</button>
          </div>
          {mode === 'walk' && pts.length > 0 && <ol className="font-sans text-xs text-ink-muted list-decimal pl-5">{pts.map(([lng, lat, a], i) => <li key={i}>{lat.toFixed(6)}, {lng.toFixed(6)} <Accuracy m={a} />{site?.latitude != null && ` · ${fmtDistance(siteDistance(site, lat, lng))} from centre`}</li>)}</ol>}
        </div>
      )}
      {err && <p className="font-sans text-sm text-red-700 mt-2">{err}</p>}
      {showBase && <Baseline plot={plot} />}
    </div>
  );
}

function BaselinePhoto({ path }) {
  const [url, setUrl] = useState(null);
  useEffect(() => { photoUrl(path).then(setUrl); }, [path]);
  return url ? <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="Baseline" className="w-20 h-20 object-cover rounded-lg border" /></a> : <span className="w-20 h-20 rounded-lg bg-sand-light inline-block" />;
}

function Baseline({ plot }) {
  const { reload } = useTrees();
  const [b, setB] = useState(undefined);
  const [f, setF] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => supabase.from('tm_baselines').select('*').eq('plot_id', plot.id).maybeSingle().then(({ data }) => {
    setB(data);
    setF({ recorded_on: data?.recorded_on || today(), existing_trees: data?.existing_trees ?? '', canopy_cover_pct: data?.canopy_cover_pct ?? '', land_use_history: data?.land_use_history || '', degradation_notes: data?.degradation_notes || '', additionality_notes: data?.additionality_notes || '', photo_paths: data?.photo_paths || [] });
  });
  useEffect(() => { load(); }, [plot.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (b === undefined || !f) return <p className="font-sans text-sm text-ink-muted mt-3">Loading…</p>;
  const locked = !!b?.locked_at;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const addPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true); setErr('');
    try {
      const blob = await compressPhoto(file);
      const path = `baseline/${plot.id}/${uuid()}.jpg`;
      const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
      if (error) throw error;
      setF({ ...f, photo_paths: [...f.photo_paths, path] });
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  const save = async (lock) => {
    setErr('');
    if (lock && !window.confirm('Lock this baseline? After locking nobody can change it — it becomes the evidence of the plot before planting.')) return;
    const row = { plot_id: plot.id, recorded_on: f.recorded_on, existing_trees: num(f.existing_trees), canopy_cover_pct: num(f.canopy_cover_pct), land_use_history: f.land_use_history || null, degradation_notes: f.degradation_notes || null, additionality_notes: f.additionality_notes || null, photo_paths: f.photo_paths };
    const { error } = b ? await supabase.from('tm_baselines').update({ ...row, ...(lock ? { locked_at: new Date().toISOString() } : {}) }).eq('plot_id', plot.id)
      : await supabase.from('tm_baselines').insert({ ...row, ...(lock ? { locked_at: new Date().toISOString() } : {}) });
    if (error) setErr(error.message); else { load(); if (lock) reload(); }
  };

  if (locked) {
    return (
      <div className="mt-3 rounded-lg bg-forest/5 p-3 font-sans text-sm space-y-1">
        <p className="text-xs text-forest font-semibold">🔒 Locked {fmtDate(b.locked_at)} by {b.locked_by} · recorded {fmtDate(b.recorded_on)}</p>
        <p>Existing trees: {b.existing_trees ?? '—'} · Canopy cover: {b.canopy_cover_pct != null ? `${Number(b.canopy_cover_pct)}%` : '—'}</p>
        {b.land_use_history && <p><strong>Land use history:</strong> {b.land_use_history}</p>}
        {b.degradation_notes && <p><strong>Degradation:</strong> {b.degradation_notes}</p>}
        {b.additionality_notes && <p><strong>Why planting adds value:</strong> {b.additionality_notes}</p>}
        {b.photo_paths.length > 0 && <div className="flex flex-wrap gap-2 pt-1">{b.photo_paths.map((p) => <BaselinePhoto key={p} path={p} />)}</div>}
      </div>
    );
  }
  return (
    <div className="mt-3 rounded-lg bg-sand-light/60 p-3 space-y-3">
      <p className="font-sans text-xs text-ink-muted">Record the plot as it is <strong>before</strong> planting. Once locked it can’t be edited — buyers and verifiers rely on that.</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Recorded on"><input type="date" className="input-field" max={today()} value={f.recorded_on} onChange={set('recorded_on')} /></Field>
        <Field label="Existing trees on plot"><input type="number" min="0" className="input-field" value={f.existing_trees} onChange={set('existing_trees')} /></Field>
        <Field label="Canopy cover (%)"><input type="number" min="0" max="100" className="input-field" value={f.canopy_cover_pct} onChange={set('canopy_cover_pct')} /></Field>
      </div>
      <Field label="Land use in the last 10 years"><textarea className="input-field" rows={2} value={f.land_use_history} onChange={set('land_use_history')} /></Field>
      <Field label="Signs of degradation" hint="Erosion, overgrazing, charcoal burning…"><textarea className="input-field" rows={2} value={f.degradation_notes} onChange={set('degradation_notes')} /></Field>
      <Field label="Why these trees wouldn’t be planted without the project" hint="Additionality"><textarea className="input-field" rows={2} value={f.additionality_notes} onChange={set('additionality_notes')} /></Field>
      <div className="flex flex-wrap items-center gap-2">
        {f.photo_paths.map((p) => <BaselinePhoto key={p} path={p} />)}
        <label className="btn-secondary text-sm cursor-pointer">{busy ? 'Uploading…' : '📷 Add landscape photo'}<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={addPhoto} disabled={busy} /></label>
      </div>
      <p className="font-sans text-xs text-ink-faint">Photograph the land only — no children or faces.</p>
      {err && <p className="font-sans text-sm text-red-700">{err}</p>}
      <div className="flex flex-wrap gap-2"><button className="btn-secondary text-sm" onClick={() => save(false)}>Save draft</button><button className="btn-primary text-sm" onClick={() => save(true)}>🔒 Save & lock</button></div>
    </div>
  );
}
