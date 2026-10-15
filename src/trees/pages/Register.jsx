// File: src/trees/pages/Register.jsx
// Register a tree as it goes in the ground: place → species → GPS → label.
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTrees } from '../TreeApp';
import { Card, Field, Notice, QR, Accuracy } from '../ui';
import { getPosition, registerTree, newTreeCode, today, treeUrl } from '../api';

const empty = () => ({ code: newTreeCode(), site: '', plot_id: '', species_id: '', batch_id: '', planted_on: today(), height_cm: '', sponsor_name: '', notes: '' });

export default function Register() {
  const { ref, lookups, reload, canManage } = useTrees();
  const [f, setF] = useState(() => {
    // Remember the last place so a planting day is quick
    try { const last = JSON.parse(localStorage.getItem('tm-last-place') || '{}'); return { ...empty(), ...last }; } catch { return empty(); }
  });
  const [gps, setGps] = useState(null);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const plots = useMemo(() => ref.plots.filter((p) => p.site_id === f.site), [ref, f.site]);
  const batches = useMemo(() => ref.batches.filter((b) => b.species_id === f.species_id && b.status !== 'finished'), [ref, f.species_id]);
  const plot = lookups.plot[f.plot_id];

  const locate = async () => {
    setLocating(true); setErr('');
    try {
      // Take the best of a few readings — phone GPS settles over a few seconds
      let best = null;
      for (let i = 0; i < 3; i += 1) {
        const p = await getPosition({ timeout: 15000 });
        if (!best || p.accuracy_m < best.accuracy_m) best = p;
        setGps(best);
        if (best.accuracy_m <= 5) break;
      }
    } catch (e) { setErr(e.message); }
    setLocating(false);
  };

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (!f.plot_id || !f.species_id) { setErr('Choose the plot and species.'); return; }
    if (!gps) { setErr('Record the GPS point while standing at the tree.'); return; }
    setBusy(true);
    try {
      const row = {
        code: f.code, plot_id: f.plot_id, species_id: f.species_id, batch_id: f.batch_id || null, planted_on: f.planted_on,
        latitude: gps.latitude, longitude: gps.longitude, accuracy_m: gps.accuracy_m,
        height_cm: f.height_cm === '' ? null : Number(f.height_cm),
        sponsor_name: canManage && f.sponsor_name ? f.sponsor_name : null, notes: f.notes || null,
      };
      const res = await registerTree(row);
      try { localStorage.setItem('tm-last-place', JSON.stringify({ site: f.site, plot_id: f.plot_id, species_id: f.species_id, batch_id: f.batch_id, planted_on: f.planted_on })); } catch { /* ignore */ }
      setDone({ code: res.result.code, queued: res.queued });
      if (!res.queued) reload();
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  const next = () => { setDone(null); setGps(null); setF((x) => ({ ...x, code: newTreeCode(), height_cm: '', sponsor_name: '', notes: '' })); };

  if (done) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Notice kind={done.queued ? 'warn' : 'ok'}>
          {done.queued ? 'Saved on this phone. It will sync when you are back online.' : 'Tree registered.'}
        </Notice>
        <Card>
          <div className="text-center">
            <div className="inline-block"><QR text={treeUrl(done.code)} size={200} /></div>
            <p className="font-mono font-bold text-2xl text-forest mt-2">{done.code}</p>
            <p className="font-sans text-sm text-ink-muted mt-1">Write this code on the tree’s tag, or print the label.</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <button className="btn-primary" onClick={next}>Register the next tree</button>
            <Link className="btn-secondary" to={`/me/trees/labels?tree=${done.code}`}>Print label</Link>
            {!done.queued && <Link className="btn-secondary" to={`/me/trees/tree/${done.code}`}>Open tree</Link>}
          </div>
        </Card>
      </div>
    );
  }

  if (!ref.plots.length) {
    return <Notice kind="info">No plots yet. {canManage ? <>Add one under <Link to="/me/trees/sites" className="underline">Sites & plots</Link> first.</> : 'Ask a coordinator to add the site’s plots first.'}</Notice>;
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5" noValidate>
      <Card title="1 · Where">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Site">
            <select className="input-field" value={f.site} onChange={(e) => setF({ ...f, site: e.target.value, plot_id: '' })} required>
              <option value="">Choose…</option>{ref.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Plot">
            <select className="input-field" value={f.plot_id} onChange={set('plot_id')} disabled={!f.site} required>
              <option value="">{f.site && !plots.length ? 'No plots at this site' : 'Choose…'}</option>{plots.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>
        {plot && !plot.baseline_locked_at && <p className="font-sans text-xs text-amber-800 mt-2">This plot’s baseline isn’t locked yet. Record and lock it under Sites & plots so the before-planting state is evidence.</p>}
      </Card>

      <Card title="2 · What">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Species">
            <select className="input-field" value={f.species_id} onChange={(e) => setF({ ...f, species_id: e.target.value, batch_id: '' })} required>
              <option value="">Choose…</option>
              {ref.species.map((s) => <option key={s.id} value={s.id}>{s.common_name}{s.swahili_name ? ` (${s.swahili_name})` : ''}</option>)}
            </select>
          </Field>
          <Field label="Nursery batch" hint="Optional — links the tree to where it was raised">
            <select className="input-field" value={f.batch_id} onChange={set('batch_id')} disabled={!f.species_id}>
              <option value="">Not from a recorded batch</option>{batches.map((b) => <option key={b.id} value={b.id}>{b.code}</option>)}
            </select>
          </Field>
          <Field label="Planted on"><input type="date" className="input-field" value={f.planted_on} max={today()} onChange={set('planted_on')} /></Field>
          <Field label="Height at planting (cm)"><input type="number" inputMode="decimal" min="0" max="5000" step="0.5" className="input-field" value={f.height_cm} onChange={set('height_cm')} /></Field>
        </div>
      </Card>

      <Card title="3 · GPS point">
        <p className="font-sans text-sm text-ink-muted mb-3">Stand right next to the tree, in the open, and tap the button.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-secondary" onClick={locate} disabled={locating}>{locating ? 'Getting a fix…' : gps ? '📍 Take again' : '📍 Record GPS point'}</button>
          {gps && <span className="font-sans text-sm">{gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)} <Accuracy m={gps.accuracy_m} /></span>}
        </div>
        {gps && gps.accuracy_m > 25 && <p className="font-sans text-xs text-amber-800 mt-2">Accuracy is weak. Wait a few seconds away from buildings and trees, then take it again.</p>}
      </Card>

      <Card title="4 · Label">
        <div className="flex items-center gap-4">
          <QR text={treeUrl(f.code)} size={96} />
          <div className="font-sans text-sm">
            <p className="font-mono font-bold text-lg text-forest">{f.code}</p>
            <p className="text-ink-muted text-xs mt-1">If you pre-printed labels, type the code on the label instead.</p>
            <input className="input-field mt-2 font-mono uppercase py-2" aria-label="Tree code" value={f.code} maxLength={11}
              onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().trim() })} pattern="UYIH-[2-9A-HJ-NP-Z]{6}" />
          </div>
        </div>
        {canManage && <div className="mt-3"><Field label="Sponsor name (shown publicly, optional)"><input className="input-field" maxLength={80} value={f.sponsor_name} onChange={set('sponsor_name')} /></Field></div>}
        <div className="mt-3"><Field label="Notes (optional)" hint="Don’t write names of children."><textarea className="input-field" rows={2} maxLength={1000} value={f.notes} onChange={set('notes')} /></Field></div>
      </Card>

      {err && <Notice kind="error">{err}</Notice>}
      {!/^UYIH-[2-9A-HJ-NP-Z]{6}$/.test(f.code) && <Notice kind="warn">Codes look like UYIH-7KQ2MD (no 0, O, 1 or I).</Notice>}
      <button className="btn-primary w-full sm:w-auto" disabled={busy || !/^UYIH-[2-9A-HJ-NP-Z]{6}$/.test(f.code)}>{busy ? 'Saving…' : 'Register tree'}</button>
    </form>
  );
}
