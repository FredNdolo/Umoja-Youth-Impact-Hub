// File: src/trees/pages/Sites.jsx
// Sites (schools), their plots, plot boundaries walked with GPS, and the
// before-planting baseline that gets locked as evidence.
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTrees } from '../TreeApp';
import { Card, Field, Notice, TreeMap, Accuracy } from '../ui';
import { getPosition, ringAreaHa, compressPhoto, uuid, PHOTO_BUCKET, photoUrl, fmtDate, today } from '../api';

const num = (v) => (v === '' || v == null ? null : Number(v));

export default function Sites() {
  const { ref, canManage, reload } = useTrees();
  const [open, setOpen] = useState(ref.sites[0]?.id || null);
  return (
    <div className="space-y-4">
      {!canManage && <Notice kind="info">Coordinators manage sites and plots. Field team members can record plot baselines.</Notice>}
      {ref.sites.map((s) => <Site key={s.id} site={s} open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} />)}
      {canManage && <NewSite onDone={reload} />}
    </div>
  );
}

function Site({ site, open, onToggle }) {
  const { ref, canManage, reload, trees } = useTrees();
  const plots = ref.plots.filter((p) => p.site_id === site.id);
  const count = trees.filter((t) => plots.some((p) => p.id === t.plot_id)).length;
  const [edit, setEdit] = useState(false);
  return (
    <section className="rounded-xl border border-sand-dark/50 bg-white">
      <button className="w-full flex flex-wrap items-center gap-2 justify-between p-4 text-left" onClick={onToggle} aria-expanded={open}>
        <span>
          <span className="font-display font-bold text-lg text-forest">{site.name}</span>
          <span className="block font-sans text-xs text-ink-muted">{[site.ward, site.sub_county, site.county].filter(Boolean).join(', ')} · {plots.length} plot{plots.length === 1 ? '' : 's'} · {count} trees</span>
        </span>
        <span className="font-sans text-xs">{site.latitude == null ? <span className="text-amber-800">No GPS point yet</span> : <span className="text-ink-muted">{site.latitude.toFixed(5)}, {site.longitude.toFixed(5)}</span>} <span aria-hidden="true" className="ml-2">{open ? '▴' : '▾'}</span></span>
      </button>
      {open && (
        <div className="border-t border-sand-dark/40 p-4 space-y-4">
          {edit ? <SiteForm site={site} onDone={() => { setEdit(false); reload(); }} onCancel={() => setEdit(false)} /> : (
            <div className="flex flex-wrap gap-x-6 gap-y-1 font-sans text-sm text-ink-muted">
              {site.contact_name && <span>Contact: {site.contact_name}{site.contact_phone ? ` · ${site.contact_phone}` : ''}</span>}
              {site.agreement_ref && <span>Agreement: {site.agreement_ref}{site.agreement_on ? ` (${fmtDate(site.agreement_on)})` : ''}</span>}
              {canManage && <button className="underline" onClick={() => setEdit(true)}>Edit site</button>}
            </div>
          )}
          {(site.latitude != null || plots.some((p) => p.boundary)) && <TreeMap height={260} sites={[site]} plots={plots} trees={trees.filter((t) => plots.some((p) => p.id === t.plot_id))} focus={site.latitude != null ? [site.latitude, site.longitude] : undefined} />}
          <div className="space-y-3">
            {plots.map((p) => <Plot key={p.id} plot={p} />)}
            {plots.length === 0 && <p className="font-sans text-sm text-ink-muted">No plots yet.</p>}
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
    latitude: site.latitude ?? '', longitude: site.longitude ?? '', contact_name: site.contact_name || '', contact_phone: site.contact_phone || '',
    agreement_ref: site.agreement_ref || '', agreement_on: site.agreement_on || '',
  });
  const [err, setErr] = useState(''); const [acc, setAcc] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const here = async () => { try { const p = await getPosition(); setF({ ...f, latitude: p.latitude, longitude: p.longitude }); setAcc(p.accuracy_m); } catch (e) { setErr(e.message); } };
  const save = async (e) => {
    e.preventDefault(); setErr('');
    const row = { ...f, code: f.code.trim().toUpperCase() || null, latitude: num(f.latitude), longitude: num(f.longitude), agreement_on: f.agreement_on || null };
    for (const k of ['sub_county', 'ward', 'contact_name', 'contact_phone', 'agreement_ref']) row[k] = row[k] || null;
    const { error } = site.id ? await supabase.from('tm_sites').update(row).eq('id', site.id) : await supabase.from('tm_sites').insert(row);
    if (error) setErr(error.message); else onDone();
  };
  return (
    <form onSubmit={save} className="grid sm:grid-cols-3 gap-3">
      <Field label="Name"><input className="input-field" required minLength={2} value={f.name} onChange={set('name')} /></Field>
      <Field label="Short code" hint="Capitals, e.g. NTULELE"><input className="input-field uppercase" value={f.code} onChange={set('code')} pattern="[A-Za-z0-9-]{2,20}" /></Field>
      <Field label="Kind"><select className="input-field" value={f.kind} onChange={set('kind')}><option value="school">School</option><option value="community">Community land</option><option value="public_land">Public land</option><option value="other">Other</option></select></Field>
      <Field label="County"><input className="input-field" value={f.county} onChange={set('county')} /></Field>
      <Field label="Sub-county"><input className="input-field" value={f.sub_county} onChange={set('sub_county')} /></Field>
      <Field label="Ward"><input className="input-field" value={f.ward} onChange={set('ward')} /></Field>
      <Field label="Latitude"><input type="number" step="any" min="-90" max="90" className="input-field" value={f.latitude} onChange={set('latitude')} /></Field>
      <Field label="Longitude"><input type="number" step="any" min="-180" max="180" className="input-field" value={f.longitude} onChange={set('longitude')} /></Field>
      <div className="flex items-end gap-2"><button type="button" className="btn-secondary text-sm" onClick={here}>📍 Use my location</button>{acc != null && <Accuracy m={acc} />}</div>
      <Field label="Contact (head teacher / patron)"><input className="input-field" value={f.contact_name} onChange={set('contact_name')} /></Field>
      <Field label="Contact phone"><input className="input-field" inputMode="tel" value={f.contact_phone} onChange={set('contact_phone')} /></Field>
      <div />
      <Field label="Land agreement / MOU ref"><input className="input-field" value={f.agreement_ref} onChange={set('agreement_ref')} /></Field>
      <Field label="Agreement date"><input type="date" className="input-field" value={f.agreement_on} onChange={set('agreement_on')} /></Field>
      <div className="sm:col-span-3 flex gap-2"><button className="btn-primary text-sm">Save site</button>{onCancel && <button type="button" className="btn-secondary text-sm" onClick={onCancel}>Cancel</button>}</div>
      {err && <p className="sm:col-span-3 font-sans text-sm text-red-700">{err}</p>}
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

function Plot({ plot }) {
  const { canManage, reload, trees } = useTrees();
  const [walk, setWalk] = useState(null); // [[lng, lat], …] while walking the boundary
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [showBase, setShowBase] = useState(false);
  const count = trees.filter((t) => t.plot_id === plot.id).length;

  const addCorner = async () => {
    setBusy(true); setErr('');
    try { const p = await getPosition(); setWalk([...(walk || []), [p.longitude, p.latitude, p.accuracy_m]]); } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const saveWalk = async () => {
    const ring = walk.map(([lng, lat]) => [lng, lat]);
    const boundary = { type: 'Polygon', coordinates: [[...ring, ring[0]]] };
    const { error } = await supabase.from('tm_plots').update({ boundary, area_ha: Math.round(ringAreaHa(ring) * 10000) / 10000 }).eq('id', plot.id);
    if (error) setErr(error.message); else { setWalk(null); reload(); }
  };

  return (
    <div className="rounded-lg border border-sand-dark/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-sans font-semibold text-forest">{plot.name}</p>
          <p className="font-sans text-xs text-ink-muted">
            {count} trees{plot.area_ha != null ? ` · ${Number(plot.area_ha).toFixed(3)} ha` : ''}{plot.soil_type ? ` · ${plot.soil_type}` : ''}{plot.land_use_before ? ` · was ${plot.land_use_before}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 font-sans text-xs">
          <span className={`rounded-full px-2 py-1 font-semibold ${plot.baseline_locked_at ? 'bg-forest/10 text-forest' : 'bg-amber-100 text-amber-900'}`}>{plot.baseline_locked_at ? `Baseline locked ${fmtDate(plot.baseline_locked_at)}` : 'Baseline not locked'}</span>
          <button className="underline text-ink-muted" onClick={() => setShowBase(!showBase)}>{showBase ? 'Hide baseline' : 'Baseline'}</button>
          {canManage && !walk && <button className="underline text-ink-muted" onClick={() => setWalk([])}>{plot.boundary ? 'Re-walk boundary' : 'Walk boundary'}</button>}
        </div>
      </div>
      {walk && (
        <div className="mt-3 rounded-lg bg-sand-light/60 p-3 space-y-2">
          <p className="font-sans text-sm">Walk to each corner of the plot and tap <strong>Add corner</strong>. At least 3 corners.</p>
          <div className="flex flex-wrap gap-2 items-center">
            <button className="btn-primary text-sm" onClick={addCorner} disabled={busy}>{busy ? 'Getting fix…' : `📍 Add corner ${walk.length + 1}`}</button>
            {walk.length > 0 && <button className="btn-secondary text-sm" onClick={() => setWalk(walk.slice(0, -1))}>Undo last</button>}
            {walk.length >= 3 && <button className="btn-secondary text-sm" onClick={saveWalk}>Save boundary · {ringAreaHa(walk).toFixed(3)} ha</button>}
            <button className="text-sm underline text-ink-muted" onClick={() => setWalk(null)}>Cancel</button>
          </div>
          {walk.length > 0 && <ol className="font-sans text-xs text-ink-muted list-decimal pl-5">{walk.map(([lng, lat, a], i) => <li key={i}>{lat.toFixed(6)}, {lng.toFixed(6)} <Accuracy m={a} /></li>)}</ol>}
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
