// File: src/pages/PublicTree.jsx
// What a tree's QR label opens (/t/:code). Public: species, place, status
// and growth — never who checked it, notes or photos.
import React, { Suspense, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { publicTree } from '../lib/publicApi';
import { supabase } from '../lib/supabase';

const TreeMap = React.lazy(() => import('../trees/ui').then((m) => ({ default: m.TreeMap })));
const GrowthChart = React.lazy(() => import('../trees/ui').then((m) => ({ default: m.GrowthChart })));

const STATUS = {
  planted: ['Newly planted', 'bg-[#7FB069]/15 text-[#3d6b2a]'],
  alive: ['Growing well', 'bg-forest/10 text-forest'],
  stressed: ['Needs care', 'bg-amber-100 text-amber-900'],
  dead: ['Did not survive', 'bg-red-100 text-red-800'],
  missing: ['Missing', 'bg-slate-100 text-slate-700'],
  replaced: ['Replaced', 'bg-slate-100 text-slate-700'],
};
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { dateStyle: 'medium', timeZone: 'Africa/Nairobi' }) : '—');

export default function PublicTree() {
  const { code: raw } = useParams();
  const code = (raw || '').toUpperCase();
  const [t, setT] = useState(undefined);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    document.title = `${code} · UYIH Tree Monitor`;
    publicTree(code).then((x) => setT(x || null)).catch(() => setT(null));
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, [code]);

  const age = t?.planted_on ? Math.floor((Date.now() - new Date(t.planted_on)) / 86400000) : null;

  return (
    <div className="bg-cream min-h-screen pt-24 md:pt-28 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {t === undefined && <p className="font-sans text-ink-muted">Loading…</p>}
        {t === null && (
          <div className="rounded-2xl border border-sand-dark/50 bg-white p-6 text-center">
            <p className="font-mono font-bold text-xl text-forest">{code}</p>
            <p className="font-sans text-ink-muted mt-2">We couldn’t find this tree. It may not be registered yet.</p>
            {signedIn && <Link to="/me/trees/register" className="btn-primary mt-4 inline-flex">Register a tree</Link>}
            <Link to="/treemonitoringapp" className="block font-sans text-sm text-terracotta underline mt-4">About the Tree Monitor</Link>
          </div>
        )}
        {t && (
          <>
            <span className="eyebrow">UYIH · Green Futures</span>
            <div className="rounded-2xl border border-sand-dark/50 bg-white p-6 mt-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono font-bold text-forest">{t.code}</p>
                  <h1 className="font-display font-bold text-3xl text-forest mt-1">{t.species}</h1>
                  <p className="font-sans text-sm italic text-ink-muted">{t.scientific_name}</p>
                  {(t.swahili_name || t.maa_name) && <p className="font-sans text-sm text-ink-muted mt-1">{[t.swahili_name && `Kiswahili: ${t.swahili_name}`, t.maa_name && `Maa: ${t.maa_name}`].filter(Boolean).join(' · ')}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 font-sans text-sm font-semibold ${STATUS[t.status]?.[1]}`}>{STATUS[t.status]?.[0]}</span>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 font-sans text-sm">
                <div><dt className="text-xs text-ink-muted">Planted</dt><dd className="font-semibold">{fmt(t.planted_on)}{age != null && <span className="block text-xs font-normal text-ink-faint">{age < 60 ? `${age} days ago` : `${Math.round(age / 30.4)} months ago`}</span>}</dd></div>
                <div><dt className="text-xs text-ink-muted">Where</dt><dd className="font-semibold">{t.site}<span className="block text-xs font-normal text-ink-faint">{t.county} County</span></dd></div>
                <div><dt className="text-xs text-ink-muted">Height</dt><dd className="font-semibold">{t.height_cm != null ? `${Number(t.height_cm)} cm` : '—'}</dd></div>
                <div><dt className="text-xs text-ink-muted">Health checks</dt><dd className="font-semibold">{t.checkins}<span className="block text-xs font-normal text-ink-faint">last {fmt(t.last_checked_at)}</span></dd></div>
              </dl>
              {t.sponsor_name && <p className="font-sans text-sm text-forest mt-5 rounded-lg bg-forest/5 px-4 py-2">🌳 Sponsored by <strong>{t.sponsor_name}</strong></p>}
              {t.is_native && <p className="font-sans text-xs text-ink-muted mt-3">An indigenous Kenyan species.</p>}
            </div>

            <Suspense fallback={null}>
              {t.growth?.some((g) => g.height_cm != null) && (
                <div className="rounded-2xl border border-sand-dark/50 bg-white p-6 mt-4">
                  <h2 className="font-display font-bold text-lg text-forest mb-2">Growth</h2>
                  <GrowthChart points={t.growth} />
                </div>
              )}
              {t.lat != null && <div className="mt-4"><TreeMap height={260} trees={[{ code: t.code, latitude: t.lat, longitude: t.lng, status: t.status, species: t.species }]} focus={[t.lat, t.lng]} /></div>}
            </Suspense>
            <p className="font-sans text-xs text-ink-faint mt-2">Location shown to about 10 m.</p>

            {signedIn && (
              <div className="rounded-2xl border-2 border-forest bg-white p-5 mt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="font-sans text-sm text-ink">Field team: record today’s health check for this tree.</p>
                <div className="flex gap-2">
                  <Link to={`/me/trees/check-in/${t.code}`} className="btn-primary text-sm">Check in</Link>
                  <Link to={`/me/trees/tree/${t.code}`} className="btn-secondary text-sm">Full record</Link>
                </div>
              </div>
            )}
            <div className="mt-8 text-center font-sans text-sm">
              <p className="text-ink-muted">This tree is one of many monitored by Umoja Youth Impact Hub in Narok County.</p>
              <div className="flex flex-wrap justify-center gap-3 mt-3">
                <Link to="/treemonitoringapp" className="btn-secondary text-sm">See all trees</Link>
                <Link to="/donate" className="btn-primary text-sm">Sponsor a tree</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
