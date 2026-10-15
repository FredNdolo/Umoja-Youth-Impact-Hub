// File: src/trees/pages/Nursery.jsx
// Nursery batches, the seedling sales ledger and pad distributions —
// the Green Futures loop from seed to sale to girls in school.
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTrees } from '../TreeApp';
import { Card, Field, Notice, Stat } from '../ui';
import { fmtDate, today, download, toCsv } from '../api';

const BATCH_STATUS = ['sown', 'germinating', 'growing', 'ready', 'finished'];
const num = (v) => (v === '' || v == null ? null : Number(v));
const kes = (n) => `KES ${Number(n || 0).toLocaleString('en-KE')}`;

export default function Nursery() {
  const { ref, lookups, reload, canManage } = useTrees();
  const [tab, setTab] = useState('batches');
  const [sales, setSales] = useState([]);
  const [dist, setDist] = useState([]);
  const loadLedgers = () => Promise.all([
    supabase.from('tm_sales').select('*').order('sold_on', { ascending: false }),
    supabase.from('tm_distributions').select('*').order('distributed_on', { ascending: false }),
  ]).then(([s, d]) => { setSales(s.data || []); setDist(d.data || []); });
  useEffect(() => { loadLedgers(); }, []);

  const totals = useMemo(() => ({
    sown: ref.batches.reduce((a, b) => a + (b.sown || 0), 0),
    ready: ref.batches.reduce((a, b) => a + (b.ready || 0), 0),
    sold: sales.reduce((a, s) => a + s.quantity, 0),
    kes: sales.reduce((a, s) => a + Number(s.amount_kes), 0),
    packs: dist.reduce((a, d) => a + d.packs, 0),
    spent: dist.filter((d) => d.funded_from_sales).reduce((a, d) => a + Number(d.cost_kes || 0), 0),
  }), [ref, sales, dist]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Seeds sown" value={totals.sown} />
        <Stat label="Seedlings ready" value={totals.ready} />
        <Stat label="Seedlings sold" value={totals.sold} hint={kes(totals.kes)} />
        <Stat label="Pad packs given" value={totals.packs} hint={`${kes(totals.spent)} from sales`} accent="text-terracotta" />
      </div>
      {totals.kes > 0 && <p className="font-sans text-sm text-ink-muted">Balance from sales not yet spent on products: <strong className="text-forest">{kes(totals.kes - totals.spent)}</strong></p>}

      <div className="flex gap-1 rounded-lg bg-sand-light p-1 font-sans text-sm max-w-lg" role="tablist">
        {[['batches', 'Batches'], ['sales', 'Sales'], ['dist', 'Pad distributions']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`flex-1 rounded-md py-2 font-semibold ${tab === k ? 'bg-white text-forest shadow-sm' : 'text-ink-muted'}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {!ref.nurseries.length && <NewNursery canManage={canManage} sites={ref.sites} onDone={reload} />}
      {tab === 'batches' && ref.nurseries.length > 0 && <Batches ref_={ref} lookups={lookups} reload={reload} canManage={canManage} />}
      {tab === 'sales' && ref.nurseries.length > 0 && <Sales rows={sales} ref_={ref} lookups={lookups} reload={loadLedgers} />}
      {tab === 'dist' && <Distributions rows={dist} ref_={ref} lookups={lookups} reload={loadLedgers} />}
      {ref.nurseries.length > 0 && canManage && <details className="font-sans text-sm"><summary className="cursor-pointer text-ink-muted underline">Add another nursery</summary><div className="mt-3"><NewNursery canManage sites={ref.sites} onDone={reload} /></div></details>}
    </div>
  );
}

function NewNursery({ canManage, sites, onDone }) {
  const [f, setF] = useState({ site_id: '', name: '', capacity: '' });
  const [err, setErr] = useState('');
  if (!canManage) return <Notice kind="info">No nursery recorded yet. Ask a coordinator to add the school nursery.</Notice>;
  const save = async (e) => {
    e.preventDefault(); setErr('');
    const { error } = await supabase.from('tm_nurseries').insert({ site_id: f.site_id, name: f.name.trim(), capacity: num(f.capacity) });
    if (error) setErr(error.message); else { setF({ site_id: '', name: '', capacity: '' }); onDone(); }
  };
  return (
    <Card title="Add a nursery">
      <form onSubmit={save} className="grid sm:grid-cols-[1fr_1fr_8rem_auto] gap-3 items-end">
        <Field label="Site"><select className="input-field" required value={f.site_id} onChange={(e) => setF({ ...f, site_id: e.target.value })}><option value="">Choose…</option>{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Name"><input className="input-field" required minLength={2} value={f.name} placeholder="School nursery" onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Capacity"><input type="number" min="0" className="input-field" value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field>
        <button className="btn-primary">Add</button>
      </form>
      {err && <p className="font-sans text-sm text-red-700 mt-2">{err}</p>}
    </Card>
  );
}

function Batches({ ref_: ref, lookups, reload }) {
  const blank = { nursery_id: ref.nurseries[0]?.id || '', species_id: '', code: '', seed_source: '', sown_on: today(), sown: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);
  const add = async (e) => {
    e.preventDefault(); setErr('');
    const { error } = await supabase.from('tm_batches').insert({ ...f, code: f.code.trim(), seed_source: f.seed_source || null, sown: num(f.sown) });
    if (error) setErr(/unique|duplicate/i.test(error.message) ? 'That batch code is already used in this nursery.' : error.message);
    else { setF(blank); reload(); }
  };
  const update = async (b, patch) => {
    const { error } = await supabase.from('tm_batches').update(patch).eq('id', b.id);
    if (error) setErr(error.message); else { setEditing(null); reload(); }
  };
  return (
    <div className="space-y-4">
      <Card title="New batch">
        <form onSubmit={add} className="grid sm:grid-cols-3 gap-3">
          <Field label="Nursery"><select className="input-field" value={f.nursery_id} onChange={(e) => setF({ ...f, nursery_id: e.target.value })}>{ref.nurseries.map((n) => <option key={n.id} value={n.id}>{n.name} · {lookups.site[n.site_id]?.name}</option>)}</select></Field>
          <Field label="Species"><select className="input-field" required value={f.species_id} onChange={(e) => setF({ ...f, species_id: e.target.value })}><option value="">Choose…</option>{ref.species.map((s) => <option key={s.id} value={s.id}>{s.common_name}</option>)}</select></Field>
          <Field label="Batch code" hint="e.g. 2026-11-CROTON"><input className="input-field" required value={f.code} maxLength={40} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>
          <Field label="Seed source" hint="Provenance, e.g. KFS seed centre"><input className="input-field" value={f.seed_source} onChange={(e) => setF({ ...f, seed_source: e.target.value })} /></Field>
          <Field label="Sown on"><input type="date" className="input-field" value={f.sown_on} max={today()} onChange={(e) => setF({ ...f, sown_on: e.target.value })} /></Field>
          <Field label="Seeds sown"><input type="number" min="0" className="input-field" value={f.sown} onChange={(e) => setF({ ...f, sown: e.target.value })} /></Field>
          <div className="sm:col-span-3"><button className="btn-primary">Add batch</button></div>
        </form>
        {err && <p className="font-sans text-sm text-red-700 mt-2">{err}</p>}
      </Card>

      {ref.batches.length === 0 ? <p className="font-sans text-sm text-ink-muted">No batches yet.</p> : (
        <div className="rounded-xl border border-sand-dark/50 bg-white overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead className="bg-sand-light text-left text-xs text-ink-muted"><tr><th className="px-3 py-2.5">Batch</th><th className="px-3">Species</th><th className="px-3">Sown</th><th className="px-3">Germ.</th><th className="px-3">Ready</th><th className="px-3">Planted</th><th className="px-3">Lost</th><th className="px-3">Status</th><th /></tr></thead>
            <tbody className="divide-y divide-sand-dark/40">
              {ref.batches.map((b) => (editing?.id === b.id ? (
                <tr key={b.id} className="bg-sand-light/40">
                  <td className="px-3 py-2 font-semibold">{b.code}</td><td className="px-3">{lookups.species[b.species_id]?.common_name}</td>
                  {['sown', 'germinated', 'ready', 'transplanted', 'lost'].map((k) => (
                    <td key={k} className="px-1"><input type="number" min="0" aria-label={k} className="input-field py-1 px-2 w-20" value={editing[k] ?? ''} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })} /></td>
                  ))}
                  <td className="px-1"><select className="input-field py-1 px-2" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>{BATCH_STATUS.map((s) => <option key={s}>{s}</option>)}</select></td>
                  <td className="px-2 whitespace-nowrap"><button className="text-forest font-semibold text-xs mr-2" onClick={() => update(b, { sown: num(editing.sown), germinated: num(editing.germinated), ready: num(editing.ready), transplanted: num(editing.transplanted) ?? 0, lost: num(editing.lost) ?? 0, status: editing.status })}>Save</button><button className="text-xs text-ink-muted" onClick={() => setEditing(null)}>Cancel</button></td>
                </tr>
              ) : (
                <tr key={b.id}>
                  <td className="px-3 py-2.5"><span className="font-semibold text-forest">{b.code}</span><span className="block text-xs text-ink-faint">{fmtDate(b.sown_on)}{b.seed_source ? ` · ${b.seed_source}` : ''}</span></td>
                  <td className="px-3">{lookups.species[b.species_id]?.common_name}</td>
                  <td className="px-3">{b.sown ?? '—'}</td>
                  <td className="px-3">{b.germinated ?? '—'}{b.sown && b.germinated != null ? <span className="block text-xs text-ink-faint">{Math.round((100 * b.germinated) / b.sown)}%</span> : null}</td>
                  <td className="px-3">{b.ready ?? '—'}</td><td className="px-3">{b.transplanted}</td><td className="px-3">{b.lost}</td>
                  <td className="px-3 capitalize">{b.status}</td>
                  <td className="px-3"><button className="text-xs underline text-ink-muted" onClick={() => setEditing({ ...b })}>Update</button></td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Sales({ rows, ref_: ref, lookups, reload }) {
  const { canManage } = useTrees();
  const blank = { nursery_id: ref.nurseries[0]?.id || '', sold_on: today(), species_id: '', quantity: '', amount_kes: '', buyer_type: 'community', buyer_name: '', payment: 'mpesa', reference: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const add = async (e) => {
    e.preventDefault(); setErr('');
    const { error } = await supabase.from('tm_sales').insert({ ...f, species_id: f.species_id || null, quantity: Number(f.quantity), amount_kes: Number(f.amount_kes), buyer_name: f.buyer_name || null, reference: f.reference || null });
    if (error) setErr(error.message); else { setF(blank); reload(); }
  };
  const exportCsv = () => download(`uyih-seedling-sales-${today()}.csv`, toCsv(rows, [
    { label: 'Date', get: (r) => r.sold_on }, { label: 'Nursery', get: (r) => lookups.nursery[r.nursery_id]?.name },
    { label: 'Species', get: (r) => lookups.species[r.species_id]?.common_name || '' }, { label: 'Quantity', get: (r) => r.quantity },
    { label: 'Amount KES', get: (r) => r.amount_kes }, { label: 'Buyer type', get: (r) => r.buyer_type }, { label: 'Buyer', get: (r) => r.buyer_name || '' },
    { label: 'Payment', get: (r) => r.payment }, { label: 'Reference', get: (r) => r.reference || '' },
  ]), 'text/csv');
  return (
    <div className="space-y-4">
      <Card title="Record a sale">
        <form onSubmit={add} className="grid sm:grid-cols-3 gap-3">
          <Field label="Date"><input type="date" className="input-field" max={today()} value={f.sold_on} onChange={set('sold_on')} /></Field>
          <Field label="Nursery"><select className="input-field" value={f.nursery_id} onChange={set('nursery_id')}>{ref.nurseries.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}</select></Field>
          <Field label="Species"><select className="input-field" value={f.species_id} onChange={set('species_id')}><option value="">Mixed</option>{ref.species.map((s) => <option key={s.id} value={s.id}>{s.common_name}</option>)}</select></Field>
          <Field label="Seedlings"><input type="number" min="1" required className="input-field" value={f.quantity} onChange={set('quantity')} /></Field>
          <Field label="Amount (KES)"><input type="number" min="0" step="1" required className="input-field" value={f.amount_kes} onChange={set('amount_kes')} /></Field>
          <Field label="Buyer type"><select className="input-field" value={f.buyer_type} onChange={set('buyer_type')}>{['community', 'farmer', 'school', 'organisation', 'government', 'other'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Buyer (optional)" hint="Adults or organisations only"><input className="input-field" maxLength={120} value={f.buyer_name} onChange={set('buyer_name')} /></Field>
          <Field label="Payment"><select className="input-field" value={f.payment} onChange={set('payment')}>{['mpesa', 'cash', 'bank', 'other'].map((x) => <option key={x} value={x}>{x === 'mpesa' ? 'M-Pesa' : x}</option>)}</select></Field>
          <Field label="Reference" hint="M-Pesa code or receipt no."><input className="input-field uppercase" maxLength={40} value={f.reference} onChange={set('reference')} /></Field>
          <div className="sm:col-span-3"><button className="btn-primary">Save sale</button></div>
        </form>
        {err && <p className="font-sans text-sm text-red-700 mt-2">{err}</p>}
      </Card>
      <Ledger rows={rows} onExport={exportCsv} cols={['Date', 'Species', 'Qty', 'KES', 'Buyer', 'Payment']} render={(r) => [
        fmtDate(r.sold_on), lookups.species[r.species_id]?.common_name || 'Mixed', r.quantity, Number(r.amount_kes).toLocaleString('en-KE'),
        `${r.buyer_type}${r.buyer_name ? ` · ${r.buyer_name}` : ''}`, `${r.payment === 'mpesa' ? 'M-Pesa' : r.payment}${r.reference ? ` · ${r.reference}` : ''}`,
      ]} note={canManage ? null : 'Only coordinators can correct entries.'} />
    </div>
  );
}

function Distributions({ rows, ref_: ref, lookups, reload }) {
  const blank = { site_id: ref.sites[0]?.id || '', distributed_on: today(), product: 'reusable_pads', packs: '', girls_reached: '', cost_kes: '', funded_from_sales: true, notes: '' };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const add = async (e) => {
    e.preventDefault(); setErr('');
    const { error } = await supabase.from('tm_distributions').insert({ ...f, packs: Number(f.packs), girls_reached: num(f.girls_reached), cost_kes: num(f.cost_kes), notes: f.notes || null });
    if (error) setErr(error.message); else { setF(blank); reload(); }
  };
  const label = { reusable_pads: 'Reusable pads', disposable_pads: 'Disposable pads', other: 'Other' };
  return (
    <div className="space-y-4">
      <Notice kind="info">Record numbers only. Never write girls’ names, classes or photos here.</Notice>
      <Card title="Record a distribution">
        <form onSubmit={add} className="grid sm:grid-cols-3 gap-3">
          <Field label="School"><select className="input-field" value={f.site_id} onChange={set('site_id')}>{ref.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          <Field label="Date"><input type="date" className="input-field" max={today()} value={f.distributed_on} onChange={set('distributed_on')} /></Field>
          <Field label="Product"><select className="input-field" value={f.product} onChange={set('product')}>{Object.entries(label).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Packs"><input type="number" min="1" required className="input-field" value={f.packs} onChange={set('packs')} /></Field>
          <Field label="Girls reached (number)"><input type="number" min="0" className="input-field" value={f.girls_reached} onChange={set('girls_reached')} /></Field>
          <Field label="Cost (KES)"><input type="number" min="0" className="input-field" value={f.cost_kes} onChange={set('cost_kes')} /></Field>
          <label className="flex items-center gap-2 font-sans text-sm sm:col-span-3"><input type="checkbox" checked={f.funded_from_sales} onChange={(e) => setF({ ...f, funded_from_sales: e.target.checked })} /> Paid for from seedling sales</label>
          <div className="sm:col-span-3"><button className="btn-primary">Save distribution</button></div>
        </form>
        {err && <p className="font-sans text-sm text-red-700 mt-2">{err}</p>}
      </Card>
      <Ledger rows={rows} cols={['Date', 'School', 'Product', 'Packs', 'Girls', 'KES']} render={(r) => [
        fmtDate(r.distributed_on), lookups.site[r.site_id]?.name, label[r.product], r.packs, r.girls_reached ?? '—',
        r.cost_kes != null ? `${Number(r.cost_kes).toLocaleString('en-KE')}${r.funded_from_sales ? '' : ' (other funds)'}` : '—',
      ]} />
    </div>
  );
}

function Ledger({ rows, cols, render, onExport, note }) {
  if (!rows.length) return <p className="font-sans text-sm text-ink-muted">Nothing recorded yet.</p>;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center font-sans text-xs text-ink-muted"><span>{rows.length} entries{note ? ` · ${note}` : ''}</span>{onExport && <button className="underline" onClick={onExport}>Download CSV</button>}</div>
      <div className="rounded-xl border border-sand-dark/50 bg-white overflow-x-auto">
        <table className="w-full font-sans text-sm">
          <thead className="bg-sand-light text-left text-xs text-ink-muted"><tr>{cols.map((c) => <th key={c} className="px-3 py-2.5">{c}</th>)}</tr></thead>
          <tbody className="divide-y divide-sand-dark/40">{rows.map((r) => <tr key={r.id}>{render(r).map((v, i) => <td key={i} className="px-3 py-2.5">{v}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
