// File: src/pages/TreeMonitoring.jsx
// Public showcase of the UYIH Tree Monitor (/treemonitoringapp): live
// numbers, the public map and what the app does — for partners such as KFS.
// The working app lives in the member area at /me/trees.
import React, { Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicTreeSummary, publicTreeSites, publicTrees } from '../lib/publicApi';
import { UYIH_WHATSAPP_NUMBER } from '../lib/config';
import fieldImg from '../assets/environment.webp';

const TreeMap = React.lazy(() => import('../trees/ui').then((m) => ({ default: m.TreeMap })));

const FEATURES = [
  { icon: '🏷️', title: 'Every tree, its own ID', text: 'Each tree gets a QR label and a unique code. Scanning it opens the tree’s record, in the field or from anywhere.' },
  { icon: '📍', title: 'GPS at planting', text: 'The phone records the planting point and its accuracy. Plot boundaries are walked with GPS to give area in hectares.' },
  { icon: '📈', title: 'Regular health checks', text: 'Trained members record health, height, stem diameter and a photo of the tree on a regular cycle, building a growth history.' },
  { icon: '📶', title: 'Works offline', text: 'Registrations and check-ins save on the phone where there is no network and sync automatically when it returns.' },
  { icon: '🔒', title: 'Evidence you can trust', text: 'Plot baselines are locked before planting, every change is logged, and only administrators can delete a record.' },
  { icon: '🌱', title: 'Nursery to sale', text: 'Batches are tracked from seed source to germination and transplanting; seedling sales and the pads they fund are recorded in a ledger.' },
  { icon: '📊', title: 'Partner-ready reports', text: 'Quarterly reports, survival by site and species, and exports to CSV, GeoJSON and KML for GIS and Google Earth.' },
  { icon: '🛡️', title: 'Safe by design', text: 'Only trained adult members have accounts. No child is photographed or named, and the public map shows approximate locations only.' },
];

function Num({ value, label, hint }) {
  return (
    <div className="rounded-xl border border-sand-dark/50 bg-white p-5">
      <p className="font-display font-bold text-3xl md:text-4xl text-forest leading-none">{value ?? '—'}</p>
      <p className="font-sans text-sm font-semibold text-ink mt-2">{label}</p>
      {hint && <p className="font-sans text-xs text-ink-muted mt-0.5">{hint}</p>}
    </div>
  );
}

export default function TreeMonitoring() {
  const [s, setS] = useState(null);
  const [sites, setSites] = useState([]);
  const [trees, setTrees] = useState([]);
  const [err, setErr] = useState(false);

  useEffect(() => {
    document.title = 'Tree Monitor · Umoja Youth Impact Hub';
    publicTreeSummary().then(setS).catch(() => setErr(true));
    publicTreeSites().then((x) => setSites(x || [])).catch(() => {});
    publicTrees().then((x) => setTrees(x || [])).catch(() => {});
  }, []);

  const fmt = (n) => (n == null ? null : Number(n).toLocaleString('en-KE'));
  const mapTrees = trees.map((t) => ({ ...t, latitude: t.lat, longitude: t.lng }));
  const mapSites = sites.filter((x) => x.latitude != null).map((x, i) => ({ ...x, id: `s${i}` }));

  return (
    <div className="bg-cream min-h-screen pt-24 md:pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <section className="grid lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
          <div>
            <span className="eyebrow">Green Futures · Tree Monitor</span>
            <h1 className="font-display font-bold text-display-md md:text-display-lg text-forest mt-3 leading-tight">Every tree we plant, counted and cared for.</h1>
            <p className="font-sans text-lg text-ink-muted mt-4 max-w-xl">
              The UYIH Tree Monitor follows each tree from the school nursery to a growing tree in Narok County, so partners can see survival,
              growth and impact for themselves — not just planting numbers.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <a href="#map" className="btn-primary">See the live map</a>
              <a className="btn-secondary" href={`https://wa.me/${UYIH_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello UYIH, we’d like to partner on the Tree Monitor / Green Futures.')}`}>Partner with us</a>
              <Link to="/me/trees" className="btn-secondary">Open the field app</Link>
            </div>
          </div>
          <div className="relative">
            <img src={fieldImg} alt="Seedlings in a UYIH tree nursery" className="rounded-2xl w-full aspect-[4/3] object-cover shadow-lg" />
            {s?.survival_pct != null && (
              <div className="absolute -bottom-4 -left-4 rounded-xl bg-white shadow-lg px-4 py-3 border border-sand-dark/50">
                <p className="font-display font-bold text-2xl text-forest">{s.survival_pct}%</p>
                <p className="font-sans text-xs text-ink-muted">survival so far</p>
              </div>
            )}
          </div>
        </section>

        {/* Live numbers */}
        <section className="mt-14" aria-labelledby="numbers">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <h2 id="numbers" className="font-display font-bold text-2xl text-forest">Live numbers</h2>
            {s?.updated_at && <p className="font-sans text-xs text-ink-muted">Updated {new Date(s.updated_at).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</p>}
          </div>
          {err ? <p className="font-sans text-sm text-ink-muted">Live numbers are unavailable right now.</p> : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Num value={fmt(s?.trees_planted)} label="Trees registered" hint="Each with a GPS point and QR label" />
              <Num value={fmt(s?.trees_living)} label="Living" hint={s?.survival_pct != null ? `${s.survival_pct}% survival · target 75%` : 'Survival shows after first checks'} />
              <Num value={fmt(s?.checkins)} label="Field check-ins" hint={`${fmt(s?.trees_checked) ?? 0} trees checked`} />
              <Num value={fmt(s?.species)} label="Species" hint={`Across ${fmt(s?.sites) ?? 0} sites`} />
              <Num value={fmt(s?.seedlings_raised)} label="Seedlings raised" hint="In school nurseries" />
              <Num value={fmt(s?.seedlings_sold)} label="Seedlings sold" hint={s?.sales_kes ? `KES ${fmt(s.sales_kes)}` : null} />
              <Num value={fmt(s?.pad_packs)} label="Pad packs funded" hint="From seedling sales" />
              <Num value={fmt(s?.girls_reached)} label="Girls reached" hint="A count only — no names kept" />
            </div>
          )}
          {s && s.trees_planted === 0 && <p className="font-sans text-sm text-ink-muted mt-3">Planting at the three pilot schools is about to begin — trees will appear here as they are registered.</p>}
        </section>

        {/* Map */}
        <section id="map" className="mt-14 scroll-mt-28" aria-labelledby="maph">
          <h2 id="maph" className="font-display font-bold text-2xl text-forest mb-1">Where the trees are</h2>
          <p className="font-sans text-sm text-ink-muted mb-4">Locations are rounded to about 10 m. Tap a tree for its species and status.</p>
          <Suspense fallback={<div className="h-[460px] rounded-xl bg-sand-light animate-pulse" />}>
            <TreeMap height={460} trees={mapTrees} sites={mapSites} onTree={(t) => { window.location.href = `/t/${t.code}`; }} />
          </Suspense>
          {sites.length > 0 && (
            <div className="grid md:grid-cols-3 gap-3 mt-4">
              {sites.map((x) => (
                <div key={x.name} className="rounded-xl border border-sand-dark/50 bg-white p-4">
                  <p className="font-sans font-semibold text-forest">{x.name}</p>
                  <p className="font-sans text-xs text-ink-muted">{[x.sub_county, x.county].filter(Boolean).join(', ')}</p>
                  <p className="font-sans text-sm mt-2">{x.trees} trees · {x.living} living{x.survival_pct != null ? ` · ${x.survival_pct}% survival` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Features */}
        <section className="mt-16" aria-labelledby="how">
          <h2 id="how" className="font-display font-bold text-2xl text-forest mb-5">How the Tree Monitor works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-sand-dark/50 bg-white p-5">
                <span className="text-2xl" aria-hidden="true">{f.icon}</span>
                <h3 className="font-display font-bold text-forest mt-2">{f.title}</h3>
                <p className="font-sans text-sm text-ink-muted mt-1">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Field flow */}
        <section className="mt-16 rounded-2xl bg-forest text-cream p-6 md:p-10" aria-labelledby="flow">
          <h2 id="flow" className="font-display font-bold text-2xl text-cream">From seed to survival report</h2>
          <ol className="grid md:grid-cols-5 gap-5 mt-6 font-sans">
            {[
              ['Baseline', 'Plot walked with GPS and its condition locked before planting.'],
              ['Nursery', 'Seed source and germination recorded per batch.'],
              ['Planting', 'Tree registered with species, GPS point and QR label.'],
              ['Monitoring', 'Monthly scan-and-check: health, height, photo.'],
              ['Reporting', 'Survival and growth by site and species, exportable.'],
            ].map(([t, d], i) => (
              <li key={t}>
                <span className="inline-flex w-8 h-8 rounded-full bg-terracotta text-white font-bold items-center justify-center">{i + 1}</span>
                <p className="font-semibold mt-2">{t}</p>
                <p className="text-sm text-cream/80 mt-1">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section className="mt-16 grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-sand-dark/50 bg-white p-6">
            <h2 className="font-display font-bold text-xl text-forest">For partners and funders</h2>
            <p className="font-sans text-sm text-ink-muted mt-2">
              Sponsor trees or a school nursery, and receive quarterly survival reports and the underlying data (CSV, GeoJSON, KML).
              We welcome technical guidance from forestry agencies on species and monitoring methods.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <a className="btn-primary text-sm" href={`https://wa.me/${UYIH_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello UYIH, we’d like to partner on the Tree Monitor / Green Futures.')}`}>Talk to us</a>
              <Link to="/green-futures" className="btn-secondary text-sm">About Green Futures</Link>
              <Link to="/donate" className="btn-secondary text-sm">Donate</Link>
            </div>
          </div>
          <div className="rounded-2xl border border-sand-dark/50 bg-white p-6">
            <h2 className="font-display font-bold text-xl text-forest">For UYIH members</h2>
            <p className="font-sans text-sm text-ink-muted mt-2">
              The field app is in your member area. Ask to join the field team once you’ve completed Safeguarding Basics. On your phone, use
              “Add to Home screen” to install it and work offline.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <Link to="/me/trees" className="btn-primary text-sm">Open the field app</Link>
              <Link to="/join" className="btn-secondary text-sm">Become a member</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
