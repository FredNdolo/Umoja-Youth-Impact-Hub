// File: src/trees/ui.jsx
// Shared pieces for the Tree Monitor: status pills, QR codes, maps, charts.
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import QRCode from 'qrcode';
import { STATUS } from './api';

export function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.planted;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.cls}`}>
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} aria-hidden="true" />{s.label}
  </span>;
}

export function Stat({ label, value, hint, accent }) {
  return (
    <div className="rounded-xl border border-sand-dark/50 bg-white p-4">
      <p className="font-sans text-xs text-ink-muted">{label}</p>
      <p className={`font-display font-bold text-3xl tabular-nums mt-0.5 ${accent || 'text-forest'}`}>{value}</p>
      {hint && <p className="font-sans text-[11px] text-ink-faint mt-0.5">{hint}</p>}
    </div>
  );
}

export function Card({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-sand-dark/50 bg-white p-4 md:p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-3">
          {title && <h2 className="font-display font-bold text-xl text-forest">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="input-label">{label}</span>
      {children}
      {hint && <span className="block font-sans text-xs text-ink-faint mt-1">{hint}</span>}
    </label>
  );
}

export function Notice({ kind = 'info', children }) {
  const cls = { info: 'bg-sand-light text-ink border-sand-dark/50', ok: 'bg-forest/10 text-forest border-forest/20', warn: 'bg-amber-50 text-amber-900 border-amber-200', error: 'bg-red-50 text-red-800 border-red-200' }[kind];
  return <div className={`rounded-lg border px-4 py-3 font-sans text-sm ${cls}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>;
}

// QR code image (data URL) for a piece of text
export function QR({ text, size = 160, className = '' }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    QRCode.toDataURL(text, { margin: 1, width: size * 2, errorCorrectionLevel: 'M', color: { dark: '#1A3C2A', light: '#ffffff' } })
      .then(setSrc).catch(() => setSrc(''));
  }, [text, size]);
  return src ? <img src={src} width={size} height={size} alt={`QR code for ${text}`} className={className} /> : <span style={{ width: size, height: size }} className={`inline-block bg-sand-light ${className}`} />;
}

// GPS accuracy badge
export function Accuracy({ m }) {
  if (m == null) return null;
  const good = m <= 10; const ok = m <= 25;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${good ? 'bg-forest/10 text-forest' : ok ? 'bg-amber-100 text-amber-800' : 'bg-red-50 text-red-700'}`}>±{Math.round(m)} m {good ? '· good' : ok ? '· fair' : '· weak'}</span>;
}

const TILES = {
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Imagery © Esri, Maxar, Earthstar Geographics' },
  streets: { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '© OpenStreetMap contributors' },
};

// Map of trees (points), plots (polygons) and sites. Markers are coloured by status.
export function TreeMap({ trees = [], plots = [], sites = [], height = 420, onTree, focus, className = '' }) {
  const el = useRef(null);
  const map = useRef(null);
  const layers = useRef({});
  const [base, setBase] = useState('satellite');

  useEffect(() => {
    if (!el.current || map.current) return undefined;
    map.current = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([-1.09, 35.87], 9);
    layers.current.group = L.featureGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    layers.current.tiles?.remove();
    layers.current.tiles = L.tileLayer(TILES[base].url, { attribution: TILES[base].attribution, maxZoom: 20, maxNativeZoom: 19 }).addTo(map.current);
    layers.current.tiles.bringToBack();
  }, [base]);

  useEffect(() => {
    const g = layers.current.group;
    if (!g) return;
    g.clearLayers();
    plots.filter((p) => p.boundary?.coordinates?.[0]?.length > 2).forEach((p) => {
      L.geoJSON(p.boundary, { style: { color: '#C4622D', weight: 2, fillOpacity: 0.08 } })
        .bindTooltip(p.name, { sticky: true }).addTo(g);
    });
    sites.filter((s) => s.latitude != null && s.longitude != null).forEach((s) => {
      L.circleMarker([s.latitude, s.longitude], { radius: 9, color: '#fff', weight: 2, fillColor: '#C4622D', fillOpacity: 1 })
        .bindTooltip(`${s.name}${s.trees != null ? ` · ${s.trees} trees` : ''}`).addTo(g);
    });
    trees.forEach((t) => {
      const lat = t.latitude ?? t.lat; const lng = t.longitude ?? t.lng;
      if (lat == null || lng == null) return;
      const m = L.circleMarker([lat, lng], { radius: 6, color: '#fff', weight: 1.5, fillColor: (STATUS[t.status] || STATUS.planted).color, fillOpacity: 0.95 });
      m.bindTooltip(`${t.code || ''} ${t.species ? `· ${t.species}` : ''}`.trim());
      if (onTree) m.on('click', () => onTree(t));
      m.addTo(g);
    });
    const b = g.getBounds();
    if (focus) map.current.setView(focus, 18);
    else if (b.isValid()) map.current.fitBounds(b.pad(0.2), { maxZoom: 18 });
  }, [trees, plots, sites, onTree, focus]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-sand-dark/50 ${className}`}>
      <div ref={el} style={{ height }} className="w-full z-0" />
      <div className="absolute top-2 right-2 z-[400] flex rounded-md overflow-hidden shadow border border-sand-dark/60 bg-white font-sans text-xs">
        {['satellite', 'streets'].map((k) => (
          <button key={k} onClick={() => setBase(k)} className={`px-2.5 py-1.5 capitalize ${base === k ? 'bg-forest text-cream' : 'text-forest'}`}>{k}</button>
        ))}
      </div>
      <div className="absolute bottom-6 left-2 z-[400] flex flex-wrap gap-x-3 gap-y-1 rounded-md bg-white/90 px-2.5 py-1.5 font-sans text-[11px] shadow">
        {['planted', 'alive', 'stressed', 'dead', 'missing'].map((k) => (
          <span key={k} className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS[k].color }} />{STATUS[k].label}</span>
        ))}
      </div>
    </div>
  );
}

// Height over time (cm)
export function GrowthChart({ points, height = 160 }) {
  const pts = (points || []).filter((p) => p.height_cm != null).map((p) => ({ t: new Date(p.at || p.checked_at).getTime(), h: Number(p.height_cm) }))
    .sort((a, b) => a.t - b.t);
  if (pts.length < 2) return <p className="font-sans text-sm text-ink-muted">The growth chart appears after two height measurements.</p>;
  const W = 600; const H = height; const pad = { l: 40, r: 12, t: 12, b: 26 };
  const t0 = pts[0].t; const t1 = pts[pts.length - 1].t || t0 + 1;
  const hMax = Math.max(...pts.map((p) => p.h)) * 1.15 || 1;
  const x = (t) => pad.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - pad.l - pad.r);
  const y = (h) => H - pad.b - (h / hMax) * (H - pad.t - pad.b);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.h).toFixed(1)}`).join(' ');
  const ticks = [0, 0.5, 1].map((f) => Math.round(hMax * f / 1.15));
  const fmt = (t) => new Date(t).toLocaleDateString('en-KE', { month: 'short', year: '2-digit' });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Tree height over time">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#E8DCC4" strokeDasharray="3 4" />
          <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#6B6B6B">{v}</text>
        </g>
      ))}
      <path d={`${d} L${x(pts[pts.length - 1].t)},${H - pad.b} L${x(t0)},${H - pad.b} Z`} fill="#1F8F4E" opacity="0.08" />
      <path d={d} fill="none" stroke="#1F8F4E" strokeWidth="2.5" strokeLinejoin="round" />
      {pts.map((p) => <circle key={p.t} cx={x(p.t)} cy={y(p.h)} r="4" fill="#fff" stroke="#1F8F4E" strokeWidth="2" />)}
      <text x={pad.l} y={H - 6} fontSize="11" fill="#6B6B6B">{fmt(t0)}</text>
      <text x={W - pad.r} y={H - 6} fontSize="11" fill="#6B6B6B" textAnchor="end">{fmt(t1)}</text>
      <text x={8} y={pad.t + 4} fontSize="10" fill="#6B6B6B">cm</text>
    </svg>
  );
}

// Horizontal bar for survival / progress
export function Bar({ pct, color = '#1F8F4E' }) {
  return <div className="h-2 rounded-full bg-sand-dark/40 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct || 0))}%`, background: color }} /></div>;
}
