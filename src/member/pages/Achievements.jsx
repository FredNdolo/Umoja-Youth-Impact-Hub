// File: src/member/pages/Achievements.jsx
// Points, medals and certificates.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMember, PageTitle, Block } from '../MemberLayout';
import { MedalBadge, nextMedal, currentMedal, ProgressBar } from '../achievements';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' });

export function NextMedalCard({ ach }) {
  const next = nextMedal(ach);
  const cur = currentMedal(ach);
  return (
    <div className="flex items-center gap-4">
      <MedalBadge medal={cur || { ...(ach.medals[0] || { code: 'seedling', name: 'Seedling', icon: '🌱' }), earned: false }} size={64} />
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm text-ink-muted">{cur ? 'Current medal' : 'First medal'}</p>
        <p className="font-display font-bold text-xl text-forest">{cur ? cur.name : (next?.name || '')}</p>
        {next ? (
          <>
            <ProgressBar pct={next.pct} className="mt-2" />
            <p className="font-sans text-xs text-ink-muted mt-1.5">
              {next.pointsLeft > 0 ? `${next.pointsLeft} more points to ${next.name}` : `Points reached for ${next.name}`}
              {next.needsMember ? ' · needs full membership' : ''}
            </p>
          </>
        ) : <p className="font-sans text-xs text-forest mt-1">Every medal earned. Asante! 🌲</p>}
      </div>
    </div>
  );
}

function CopyLink({ code }) {
  const [ok, setOk] = useState(false);
  const url = `${window.location.origin}/certificates/${code}`;
  return (
    <button className="font-sans text-xs text-terracotta underline" onClick={async () => {
      try { await navigator.clipboard.writeText(url); setOk(true); setTimeout(() => setOk(false), 1800); } catch { /* ignore */ }
    }}>{ok ? 'Link copied ✓' : 'Copy share link'}</button>
  );
}

export default function Achievements() {
  const { dash } = useMember();
  const ach = dash.achievements;
  const b = ach.breakdown;
  return (
    <>
      <PageTitle title="Achievements">Earn points by completing tasks and courses and taking part in activities. Points unlock medals.</PageTitle>

      <div className="grid md:grid-cols-[1fr_1.4fr] gap-5">
        <Block>
          <p className="font-sans text-sm text-ink-muted">Your points</p>
          <p className="font-display font-bold text-6xl text-forest tabular-nums leading-none mt-1">{ach.points}</p>
          <dl className="mt-5 space-y-2 font-sans text-sm">
            <div className="flex justify-between"><dt className="text-ink-muted">Tasks and courses</dt><dd className="font-semibold text-forest tabular-nums">{b.tasks}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">Activities attended ({b.events_count})</dt><dd className="font-semibold text-forest tabular-nums">{b.events}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">Named roles ({b.roles_count})</dt><dd className="font-semibold text-forest tabular-nums">{b.roles}</dd></div>
          </dl>
        </Block>
        <Block title="Next medal">
          <NextMedalCard ach={ach} />
          <details className="mt-5 font-sans text-sm">
            <summary className="cursor-pointer text-terracotta font-semibold">How to earn points</summary>
            <ul className="mt-3 space-y-1.5 text-ink-muted">
              <li>• Each task and course has its own points (shown on the task).</li>
              {ach.rules.map((r) => <li key={r.key}>• {r.label}: <strong className="text-forest">{r.points}</strong></li>)}
            </ul>
          </details>
        </Block>
      </div>

      <Block title="Medals" className="mt-5">
        <ol className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {ach.medals.map((m) => (
            <li key={m.code} className="text-center">
              <MedalBadge medal={m} size={84} />
              <p className="font-display font-bold text-lg text-forest mt-3">{m.name}</p>
              <p className="font-sans text-xs text-ink-muted">{m.min_points} points{m.requires_member ? ' + full member' : ''}</p>
              {m.description && <p className="font-sans text-xs text-ink-faint mt-1">{m.description}</p>}
            </li>
          ))}
        </ol>
      </Block>

      <Block title="Certificates" className="mt-5">
        {ach.certificates.length === 0 ? (
          <p className="font-sans text-sm text-ink-muted">Complete a course to earn your first certificate. <Link to="/me/learning" className="underline">Go to My learning</Link></p>
        ) : (
          <ul className="grid sm:grid-cols-2 gap-4">
            {ach.certificates.map((c) => (
              <li key={c.code} className="rounded-lg border border-sand-dark/60 p-4 flex gap-4 items-start bg-[linear-gradient(135deg,#FBF8F2,#fff)]">
                <span className="text-3xl" aria-hidden="true">🎓</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-lg text-forest leading-snug">{c.title}</p>
                  <p className="font-sans text-xs text-ink-muted">Issued {fmtDate(c.issued_at)} · {c.code}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Link to={`/certificates/${c.code}`} className="btn-primary text-xs px-3 py-1.5">View & download</Link>
                    <CopyLink code={c.code} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Block>
    </>
  );
}
