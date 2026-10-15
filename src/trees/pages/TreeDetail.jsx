// File: src/trees/pages/TreeDetail.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTrees } from '../TreeApp';
import { Card, StatusPill, TreeMap, GrowthChart, QR, Notice, Accuracy } from '../ui';
import { loadTree, photoUrl, fmtDate, HEALTH, STATUS, treeUrl, daysSince } from '../api';

function Photo({ path }) {
  const [url, setUrl] = useState(null);
  useEffect(() => { photoUrl(path).then(setUrl); }, [path]);
  if (!url) return <span className="block w-24 h-24 rounded-lg bg-sand-light animate-pulse" />;
  return <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="Tree photo" className="w-24 h-24 object-cover rounded-lg border border-sand-dark/50" loading="lazy" /></a>;
}

export default function TreeDetail() {
  const { code } = useParams();
  const { lookups, canManage, reload } = useTrees();
  const [data, setData] = useState(undefined);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState('');

  const load = useCallback(() => loadTree(code).then((d) => { setData(d); if (d) setForm({ status: d.tree.status, sponsor_name: d.tree.sponsor_name || '', notes: d.tree.notes || '' }); }), [code]);
  useEffect(() => { load(); }, [load]);

  if (data === undefined) return <p className="font-sans text-ink-muted">Loading…</p>;
  if (!data) return <Notice kind="warn">No tree with code <strong>{code}</strong>. <Link to="/me/trees/scan" className="underline">Scan again</Link></Notice>;
  const { tree: t, checkins } = data;
  const plot = lookups.plot[t.plot_id]; const site = lookups.site[plot?.site_id]; const sp = lookups.species[t.species_id];
  const age = daysSince(t.planted_on);

  const save = async () => {
    const { error } = await supabase.from('tm_trees').update({ status: form.status, sponsor_name: form.sponsor_name || null, notes: form.notes || null }).eq('id', t.id);
    if (error) { setMsg(error.message); return; }
    setEdit(false); setMsg('Saved. The change is recorded in the audit log.'); load(); reload();
  };

  return (
    <div className="space-y-5">
      <Link to="/me/trees/list" className="font-sans text-sm text-ink-muted underline">← All trees</Link>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <Card>
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-[200px]">
                <p className="font-mono font-bold text-2xl text-forest">{t.code}</p>
                <p className="font-display font-bold text-xl text-forest mt-1">{sp?.common_name} <span className="font-sans font-normal italic text-sm text-ink-muted">{sp?.scientific_name}</span></p>
                <p className="font-sans text-sm text-ink-muted mt-1">{site?.name} · {plot?.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3"><StatusPill status={t.status} />{t.sponsor_name && <span className="font-sans text-xs text-ink-muted">Sponsored by {t.sponsor_name}</span>}</div>
              </div>
              <Link to={`/me/trees/check-in/${t.code}`} className="btn-primary">Check in</Link>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 font-sans text-sm">
              <div><dt className="text-xs text-ink-muted">Planted</dt><dd className="font-semibold">{fmtDate(t.planted_on)}{age != null && <span className="block text-xs font-normal text-ink-faint">{age < 60 ? `${age} days` : `${Math.round(age / 30.4)} months`} ago</span>}</dd></div>
              <div><dt className="text-xs text-ink-muted">Height</dt><dd className="font-semibold">{t.height_cm != null ? `${Number(t.height_cm)} cm` : '—'}</dd></div>
              <div><dt className="text-xs text-ink-muted">Stem diameter</dt><dd className="font-semibold">{t.dbh_cm != null ? `${Number(t.dbh_cm)} cm` : '—'}</dd></div>
              <div><dt className="text-xs text-ink-muted">Last check</dt><dd className="font-semibold">{t.last_checked_at ? fmtDate(t.last_checked_at) : 'Never'}</dd></div>
            </dl>
            {t.notes && <p className="font-sans text-sm text-ink mt-4 whitespace-pre-wrap">{t.notes}</p>}
          </Card>

          <Card title="Growth"><GrowthChart points={checkins.map((c) => ({ at: c.checked_at, height_cm: c.height_cm }))} /></Card>

          <Card title={`Check-in history · ${checkins.length}`}>
            {checkins.length === 0 ? <p className="font-sans text-sm text-ink-muted">No check-ins yet.</p> : (
              <ol className="space-y-4">
                {checkins.map((c) => {
                  const h = HEALTH.find((x) => x.value === c.health);
                  return (
                    <li key={c.id} className="flex gap-3 border-l-2 border-sand-dark/60 pl-4 relative">
                      <span className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-forest" aria-hidden="true" />
                      <div className="flex-1 min-w-0 font-sans text-sm">
                        <p><strong className="text-forest">{h?.icon} {h?.label}</strong>{c.height_cm != null && ` · ${Number(c.height_cm)} cm`}{c.dbh_cm != null && ` · ⌀ ${Number(c.dbh_cm)} cm`}</p>
                        <p className="text-xs text-ink-muted">{new Date(c.checked_at).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short' })}{c.people?.full_name ? ` · ${c.people.full_name}` : ''}{c.offline ? ' · synced later' : ''}</p>
                        {c.notes && <p className="text-ink mt-1 whitespace-pre-wrap">{c.notes}</p>}
                      </div>
                      {c.photo_path && <Photo path={c.photo_path} />}
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <TreeMap height={240} trees={[{ ...t, species: sp?.common_name }]} plots={plot ? [plot] : []} focus={[t.latitude, t.longitude]} />
          <p className="font-sans text-xs text-ink-muted -mt-3">{t.latitude.toFixed(6)}, {t.longitude.toFixed(6)} <Accuracy m={t.accuracy_m} /></p>
          <Card title="Label">
            <div className="flex items-center gap-4">
              <QR text={treeUrl(t.code)} size={110} />
              <div className="font-sans text-sm">
                <p className="font-mono font-bold text-forest">{t.code}</p>
                <p className="text-xs text-ink-muted mt-1">Scanning opens this tree’s public page.</p>
                <Link to={`/me/trees/labels?tree=${t.code}`} className="text-terracotta underline text-xs">Print label</Link>
              </div>
            </div>
          </Card>
          {canManage && (
            <Card title="Manage" action={!edit && <button className="text-sm underline text-ink-muted" onClick={() => setEdit(true)}>Edit</button>}>
              {msg && <p className="font-sans text-xs text-forest mb-2">{msg}</p>}
              {!edit ? <p className="font-sans text-sm text-ink-muted">Correct status, add a sponsor name (shown publicly) or notes. Every change is logged.</p> : (
                <div className="space-y-3">
                  <label className="block"><span className="input-label">Status</span>
                    <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select></label>
                  <label className="block"><span className="input-label">Sponsor (public)</span>
                    <input className="input-field" value={form.sponsor_name} maxLength={80} onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })} /></label>
                  <label className="block"><span className="input-label">Notes</span>
                    <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
                  <div className="flex gap-2"><button className="btn-primary text-sm" onClick={save}>Save</button><button className="btn-secondary text-sm" onClick={() => setEdit(false)}>Cancel</button></div>
                </div>
              )}
            </Card>
          )}
          <Link to={`/t/${t.code}`} className="block font-sans text-sm text-terracotta underline">View public page →</Link>
        </div>
      </div>
    </div>
  );
}
