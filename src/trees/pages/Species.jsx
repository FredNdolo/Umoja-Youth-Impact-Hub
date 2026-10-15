// File: src/trees/pages/Species.jsx
import React, { useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTrees } from '../TreeApp';
import { Card, Field } from '../ui';
import { survival, isLiving } from './Overview';

const CATS = { indigenous: 'Indigenous', fruit: 'Fruit', agroforestry: 'Agroforestry', exotic: 'Exotic' };
const blank = { scientific_name: '', common_name: '', swahili_name: '', maa_name: '', category: 'indigenous', is_native: true, uses: '', notes: '' };

export default function Species() {
  const { ref, trees, canManage, reload } = useTrees();
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState('');
  const stats = useMemo(() => Object.fromEntries(ref.species.map((s) => {
    const list = trees.filter((t) => t.species_id === s.id);
    return [s.id, { n: list.length, living: list.filter((t) => isLiving(t.status)).length, surv: survival(list) }];
  })), [ref, trees]);

  const save = async (e) => {
    e.preventDefault(); setErr('');
    const row = { ...editing };
    for (const k of ['swahili_name', 'maa_name', 'uses', 'notes']) row[k] = row[k] || null;
    delete row.id; delete row.created_at;
    const { error } = editing.id ? await supabase.from('tm_species').update(row).eq('id', editing.id) : await supabase.from('tm_species').insert(row);
    if (error) setErr(/unique|duplicate/i.test(error.message) ? 'That species is already in the list.' : error.message);
    else { setEditing(null); reload(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <p className="font-sans text-sm text-ink-muted">{ref.species.length} species · {ref.species.filter((s) => s.is_native).length} native to Kenya</p>
        {canManage && !editing && <button className="btn-secondary text-sm" onClick={() => setEditing({ ...blank })}>+ Add species</button>}
      </div>
      {editing && (
        <Card title={editing.id ? `Edit ${editing.common_name}` : 'New species'}>
          <form onSubmit={save} className="grid sm:grid-cols-2 gap-3">
            <Field label="Scientific name"><input className="input-field italic" required value={editing.scientific_name} onChange={(e) => setEditing({ ...editing, scientific_name: e.target.value })} /></Field>
            <Field label="Common name"><input className="input-field" required value={editing.common_name} onChange={(e) => setEditing({ ...editing, common_name: e.target.value })} /></Field>
            <Field label="Kiswahili name"><input className="input-field" value={editing.swahili_name || ''} onChange={(e) => setEditing({ ...editing, swahili_name: e.target.value })} /></Field>
            <Field label="Maa name"><input className="input-field" value={editing.maa_name || ''} onChange={(e) => setEditing({ ...editing, maa_name: e.target.value })} /></Field>
            <Field label="Category"><select className="input-field" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <label className="flex items-center gap-2 font-sans text-sm self-end pb-3"><input type="checkbox" checked={editing.is_native} onChange={(e) => setEditing({ ...editing, is_native: e.target.checked })} /> Native to Kenya</label>
            <Field label="Uses"><input className="input-field" value={editing.uses || ''} onChange={(e) => setEditing({ ...editing, uses: e.target.value })} /></Field>
            <Field label="Growing notes"><input className="input-field" value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></Field>
            <div className="sm:col-span-2 flex gap-2"><button className="btn-primary text-sm">Save</button><button type="button" className="btn-secondary text-sm" onClick={() => setEditing(null)}>Cancel</button></div>
            {err && <p className="sm:col-span-2 font-sans text-sm text-red-700">{err}</p>}
          </form>
        </Card>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ref.species.map((s) => (
          <article key={s.id} className="rounded-xl border border-sand-dark/50 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-forest">{s.common_name}</h3>
                <p className="font-sans text-xs italic text-ink-muted">{s.scientific_name}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 font-sans text-[11px] font-semibold ${s.is_native ? 'bg-forest/10 text-forest' : 'bg-sand-light text-ink-muted'}`}>{CATS[s.category]}</span>
            </div>
            {(s.swahili_name || s.maa_name) && <p className="font-sans text-xs text-ink-muted mt-1">{[s.swahili_name && `Kiswahili: ${s.swahili_name}`, s.maa_name && `Maa: ${s.maa_name}`].filter(Boolean).join(' · ')}</p>}
            {s.uses && <p className="font-sans text-sm text-ink mt-2">{s.uses}</p>}
            {s.notes && <p className="font-sans text-xs text-ink-muted mt-1">{s.notes}</p>}
            <p className="font-sans text-xs text-ink-muted mt-3 pt-2 border-t border-sand-dark/40">
              {stats[s.id].n} planted · {stats[s.id].living} living{stats[s.id].surv != null ? ` · ${stats[s.id].surv}% survival` : ''}
              {canManage && <button className="float-right underline" onClick={() => setEditing({ ...s })}>Edit</button>}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
