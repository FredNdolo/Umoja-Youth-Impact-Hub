// File: src/trees/pages/CheckIn.jsx
// A field check-in: health, size, photo, GPS. Works offline.
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTrees } from '../TreeApp';
import { Card, Field, Notice, StatusPill, Accuracy } from '../ui';
import { HEALTH, checkIn, compressPhoto, getPosition, getQueue, fmtDate } from '../api';

export default function CheckIn() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { trees, lookups, reload } = useTrees();
  const [queuedTree, setQueuedTree] = useState(null);
  const tree = trees.find((t) => t.code === code) || queuedTree;
  const [health, setHealth] = useState('');
  const [height, setHeight] = useState('');
  const [dbh, setDbh] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [gps, setGps] = useState(null);
  const [gpsErr, setGpsErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!trees.find((t) => t.code === code)) {
      getQueue().then((q) => { const it = q.find((x) => x.kind === 'tree' && x.row.code === code); if (it) setQueuedTree({ ...it.row, status: 'planted', queued: true }); });
    }
    getPosition({ timeout: 15000 }).then(setGps).catch((e) => setGpsErr(e.message));
  }, [code, trees]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setErr('');
    try { const blob = await compressPhoto(file); setPhoto(blob); setPreview(URL.createObjectURL(blob)); }
    catch { setErr('Couldn’t read that photo. Try again.'); }
  };

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!health) { setErr('Choose how the tree is doing.'); return; }
    setBusy(true);
    try {
      const row = {
        tree_id: tree?.id || undefined, health,
        height_cm: height === '' ? null : Number(height), dbh_cm: dbh === '' ? null : Number(dbh),
        latitude: gps?.latitude ?? null, longitude: gps?.longitude ?? null, accuracy_m: gps?.accuracy_m ?? null,
        notes: notes || null,
      };
      const res = await checkIn(row, photo, code);
      setDone(res);
      if (!res.queued) reload();
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  if (done) {
    return (
      <div className="max-w-md space-y-4">
        <Notice kind={done.queued ? 'warn' : 'ok'}>{done.queued ? 'Check-in saved on this phone. It will sync when you are back online.' : `Check-in saved for ${code}.`}</Notice>
        <div className="flex flex-wrap gap-2">
          <Link to="/me/trees/scan" className="btn-primary">📷 Scan the next tree</Link>
          <Link to="/me/trees/list?filter=due" className="btn-secondary">Trees due</Link>
          {!done.queued && <Link to={`/me/trees/tree/${code}`} className="btn-secondary">Open tree</Link>}
        </div>
      </div>
    );
  }

  if (!tree) {
    return <Notice kind="warn">No tree with code <strong>{code}</strong> on this phone. <Link to="/me/trees/scan" className="underline">Scan again</Link> or <button className="underline" onClick={() => navigate(-1)}>go back</button>.</Notice>;
  }
  const plot = lookups.plot[tree.plot_id];
  const prevH = tree.height_cm != null ? Number(tree.height_cm) : null;

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5" noValidate>
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono font-bold text-xl text-forest">{tree.code}</p>
          <StatusPill status={tree.status} />
          {tree.queued && <span className="font-sans text-xs text-amber-800">waiting to sync</span>}
        </div>
        <p className="font-sans text-sm text-ink-muted mt-1">
          {lookups.species[tree.species_id]?.common_name} · {lookups.site[plot?.site_id]?.name} · {plot?.name}
          {tree.last_checked_at ? ` · last checked ${fmtDate(tree.last_checked_at)}` : ' · never checked'}
        </p>
      </Card>

      <Card title="How is it doing?">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Health">
          {HEALTH.map((h) => (
            <button key={h.value} type="button" role="radio" aria-checked={health === h.value} onClick={() => setHealth(h.value)}
              className={`rounded-xl border-2 px-3 py-3 font-sans text-sm font-semibold text-left transition ${health === h.value ? h.cls : 'border-sand-dark/60 bg-white text-ink hover:border-forest/50'}`}>
              <span className="text-lg mr-1.5" aria-hidden="true">{h.icon}</span>{h.label}
            </button>
          ))}
        </div>
      </Card>

      {!['dead', 'missing'].includes(health) && (
        <Card title="Measurements">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Height (cm)" hint={prevH != null ? `Last time: ${prevH} cm` : 'Ground to the top bud'}>
              <input type="number" inputMode="decimal" min="0" max="5000" step="0.5" className="input-field" value={height} onChange={(e) => setHeight(e.target.value)} />
            </Field>
            <Field label="Stem diameter (cm)" hint="Optional — at 1.3 m once the tree is tall enough">
              <input type="number" inputMode="decimal" min="0" max="500" step="0.1" className="input-field" value={dbh} onChange={(e) => setDbh(e.target.value)} />
            </Field>
          </div>
          {prevH != null && height !== '' && Number(height) < prevH * 0.7 && <p className="font-sans text-xs text-amber-800 mt-2">That’s much shorter than last time. Double-check, or note browsing or damage below.</p>}
        </Card>
      )}

      <Card title="Photo of the tree">
        <p className="font-sans text-xs text-ink-muted mb-3">Photograph the tree only. Don’t include children or people’s faces.</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="btn-secondary cursor-pointer">
            📷 {photo ? 'Retake' : 'Take photo'}
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pick} />
          </label>
          {preview && <img src={preview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-sand-dark/50" />}
          {photo && <button type="button" className="text-sm underline text-ink-muted" onClick={() => { setPhoto(null); setPreview(null); }}>Remove</button>}
        </div>
      </Card>

      <Card title="Notes & location">
        <Field label="Notes (optional)" hint="Watering, browsing by goats, pests… Don’t write children’s names.">
          <textarea className="input-field" rows={2} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <p className="font-sans text-xs text-ink-muted mt-3">
          {gps ? <>Location recorded <Accuracy m={gps.accuracy_m} /></> : gpsErr ? `No location: ${gpsErr}` : 'Getting your location…'}
        </p>
      </Card>

      {err && <Notice kind="error">{err}</Notice>}
      <button className="btn-primary w-full sm:w-auto" disabled={busy}>{busy ? 'Saving…' : 'Save check-in'}</button>
    </form>
  );
}
