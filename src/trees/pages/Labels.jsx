// File: src/trees/pages/Labels.jsx
// Printable QR labels — for registered trees, or fresh codes to pre-print
// before a planting day (type the label's code when registering).
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTrees } from '../TreeApp';
import { QR, Field } from '../ui';
import { newTreeCode, treeUrl } from '../api';

export const PRINT_CSS = `
@media print {
  @page { margin: 10mm; }
  body * { visibility: hidden !important; }
  .tm-print, .tm-print * { visibility: visible !important; }
  .tm-print { position: absolute; left: 0; top: 0; width: 100%; }
  .tm-noprint { display: none !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

export default function Labels() {
  const { trees, ref, lookups } = useTrees();
  const [params] = useSearchParams();
  const one = params.get('tree');
  const [mode, setMode] = useState('trees');
  const [site, setSite] = useState('');
  const [plot, setPlot] = useState('');
  const [blank, setBlank] = useState(24);
  const [fresh, setFresh] = useState(() => Array.from({ length: 24 }, newTreeCode));
  const [size, setSize] = useState('m');

  const list = useMemo(() => {
    if (one) {
      const t = trees.find((x) => x.code === one);
      return [t ? { code: t.code, species: lookups.species[t.species_id]?.common_name, place: lookups.site[lookups.plot[t.plot_id]?.site_id]?.name } : { code: one }];
    }
    if (mode === 'blank') return fresh.map((code) => ({ code }));
    return trees
      .filter((t) => !site || lookups.plot[t.plot_id]?.site_id === site)
      .filter((t) => !plot || t.plot_id === plot)
      .map((t) => ({ code: t.code, species: lookups.species[t.species_id]?.common_name, place: lookups.site[lookups.plot[t.plot_id]?.site_id]?.name }));
  }, [one, mode, fresh, trees, site, plot, lookups]);

  const dims = { s: { w: 'w-[46mm]', qr: 110 }, m: { w: 'w-[62mm]', qr: 150 }, l: { w: 'w-[90mm]', qr: 230 } }[size];

  return (
    <div className="space-y-4">
      <style>{PRINT_CSS}</style>
      <div className="tm-noprint space-y-3">
        {!one && (
          <div className="flex gap-1 rounded-lg bg-sand-light p-1 font-sans text-sm max-w-md" role="tablist">
            {[['trees', 'Registered trees'], ['blank', 'Blank codes to pre-print']].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={mode === k} className={`flex-1 rounded-md py-2 font-semibold ${mode === k ? 'bg-white text-forest shadow-sm' : 'text-ink-muted'}`} onClick={() => setMode(k)}>{l}</button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-3 items-end">
          {!one && mode === 'trees' && (
            <>
              <Field label="Site"><select className="input-field py-2" value={site} onChange={(e) => { setSite(e.target.value); setPlot(''); }}><option value="">All</option>{ref.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              <Field label="Plot"><select className="input-field py-2" value={plot} onChange={(e) => setPlot(e.target.value)} disabled={!site}><option value="">All</option>{ref.plots.filter((p) => p.site_id === site).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
            </>
          )}
          {!one && mode === 'blank' && (
            <Field label="How many">
              <span className="flex gap-2"><input type="number" min="1" max="200" className="input-field py-2 w-24" value={blank} onChange={(e) => setBlank(e.target.value)} />
                <button className="btn-secondary text-sm" onClick={() => setFresh(Array.from({ length: Math.min(200, Math.max(1, Number(blank) || 1)) }, newTreeCode))}>New codes</button></span>
            </Field>
          )}
          <Field label="Label size"><select className="input-field py-2" value={size} onChange={(e) => setSize(e.target.value)}><option value="s">Small (46 mm)</option><option value="m">Medium (62 mm)</option><option value="l">Large (90 mm)</option></select></Field>
          <button className="btn-primary" onClick={() => window.print()} disabled={!list.length}>🖨 Print {list.length} label{list.length === 1 ? '' : 's'}</button>
        </div>
        <p className="font-sans text-xs text-ink-muted">Print on waterproof sticker paper or laminate, then fix to a stake or aluminium tag beside the tree. Scanning a label opens the tree’s public page; field team members can check in from there.</p>
        {mode === 'blank' && !one && <p className="font-sans text-xs text-amber-800">These codes aren’t registered yet. When planting, type the label’s code in the Register form.</p>}
      </div>

      <div className="tm-print flex flex-wrap gap-2">
        {list.map((l) => (
          <div key={l.code} className={`${dims.w} border border-dashed border-ink-faint rounded-md p-2 text-center break-inside-avoid bg-white`}>
            <p className="font-sans text-[9px] font-bold tracking-wider text-forest uppercase">UYIH · Green Futures</p>
            <div className="flex justify-center my-1"><QR text={treeUrl(l.code)} size={dims.qr} /></div>
            <p className="font-mono font-bold text-forest text-sm">{l.code}</p>
            {(l.species || l.place) && <p className="font-sans text-[9px] text-ink-muted leading-tight">{[l.species, l.place].filter(Boolean).join(' · ')}</p>}
          </div>
        ))}
        {!list.length && <p className="font-sans text-sm text-ink-muted tm-noprint">No trees to label.</p>}
      </div>
    </div>
  );
}
