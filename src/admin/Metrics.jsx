// File: src/admin/Metrics.jsx
// The three numbers tracked monthly, plus the current funnel and data clean-up.
import React, { useCallback, useEffect, useState } from 'react';
import { supabase, q } from './supabase';
import { Panel, ErrorNote, fmtMonth, btnGhost } from './ui';
import { STAGES } from '../lib/config';

const pct = (v) => (v === null || v === undefined ? '—' : `${v}%`);

export default function Metrics() {
  const [rows, setRows]     = useState([]);
  const [funnel, setFunnel] = useState({});
  const [stale, setStale]   = useState(0);
  const [error, setError]   = useState('');
  const [note, setNote]     = useState('');

  const load = useCallback(async () => {
    try {
      const yearAgo = new Date(); yearAgo.setMonth(yearAgo.getMonth() - 12);
      const [m, people, staleCount] = await Promise.all([
        q(supabase.from('monthly_metrics').select('*')),
        q(supabase.from('people').select('stage')),
        supabase.from('people').select('id', { count: 'exact', head: true }).eq('stage', 'newcomer').lt('created_at', yearAgo.toISOString()),
      ]);
      setRows(m);
      const f = {}; STAGES.forEach((s) => { f[s.value] = 0; }); people.forEach((p) => { f[p.stage] += 1; });
      setFunnel(f);
      setStale(staleCount.count || 0);
      setError('');
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Months come back as 'YYYY-MM-01' in Nairobi time
  const nowMonth = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' }).slice(0, 7);
  const thisMonth = rows.find((r) => String(r.month).slice(0, 7) === nowMonth) || null;

  const purge = async () => {
    if (!window.confirm(`Delete ${stale} newcomer record(s) older than 12 months? This follows the retention promise in the privacy notice and cannot be undone.`)) return;
    try {
      const n = await q(supabase.rpc('purge_stale_newcomers'));
      setNote(`Deleted ${n} record(s).`); load();
    } catch (e) { setError(e.message); }
  };

  const tiles = [
    { label: 'Joined this month', value: thisMonth?.signups ?? 0,
      sub: thisMonth ? `${thisMonth.whatsapp_joined} now in the WhatsApp community` : 'No sign-ups yet this month' },
    { label: 'Event attendance', value: pct(thisMonth?.attendance_pct),
      sub: thisMonth?.expected_attendees ? `${thisMonth.attended} of ${thisMonth.expected_attendees} expected came` : 'No attendance lists this month' },
    { label: 'Project uptake', value: pct(thisMonth?.project_uptake_pct),
      sub: thisMonth?.signups ? `${thisMonth.placed_in_project} of ${thisMonth.signups} new joiners placed in a project` : 'Share of this month’s joiners placed' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-display-sm text-forest">Metrics</h1>
        <p className="text-sm text-ink-muted">The three numbers to track each month. Uptake counts people by the month they joined.</p>
      </div>
      <ErrorNote error={error} />
      {note && <p className="text-sm text-forest bg-forest/5 rounded-md px-3 py-2">{note}</p>}

      <div className="grid sm:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-lg border border-sand-dark/50 shadow-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t.label}</p>
            <p className="font-display font-bold text-5xl text-forest mt-2 leading-none tabular-nums">{t.value}</p>
            <p className="text-xs text-ink-muted mt-3">{t.sub}</p>
          </div>
        ))}
      </div>

      <Panel title="Where everyone is now">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STAGES.map((s, i) => (
            <div key={s.value} className="relative">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{s.label}</p>
              <p className="font-display font-bold text-3xl text-forest tabular-nums">{funnel[s.value] ?? 0}</p>
              {i < STAGES.length - 1 && <span className="hidden sm:block absolute right-2 top-5 text-sand-dark text-2xl" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Month by month">
        {rows.length === 0 ? <p className="text-sm text-ink-muted">Numbers appear here once people start joining.</p> : (
          <div className="overflow-x-auto -m-5">
            <table className="w-full text-sm">
              <thead className="bg-sand-light text-left text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold text-right">Joined</th>
                  <th className="px-4 py-3 font-semibold text-right">In WhatsApp</th>
                  <th className="px-4 py-3 font-semibold text-right">Events</th>
                  <th className="px-4 py-3 font-semibold text-right">Attendance</th>
                  <th className="px-4 py-3 font-semibold text-right">Project uptake</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-dark/40 tabular-nums">
                {rows.map((r) => (
                  <tr key={r.month}>
                    <td className="px-4 py-2.5 font-medium text-forest whitespace-nowrap">{fmtMonth(r.month)}</td>
                    <td className="px-4 py-2.5 text-right">{r.signups}</td>
                    <td className="px-4 py-2.5 text-right">{r.whatsapp_joined}</td>
                    <td className="px-4 py-2.5 text-right">{r.events}</td>
                    <td className="px-4 py-2.5 text-right">{pct(r.attendance_pct)} <span className="text-ink-faint text-xs">({r.attended}/{r.expected_attendees})</span></td>
                    <td className="px-4 py-2.5 text-right">{pct(r.project_uptake_pct)} <span className="text-ink-faint text-xs">({r.placed_in_project}/{r.signups})</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Data clean-up">
        <p className="text-sm text-ink-muted mb-3">
          The privacy notice promises to delete sign-ups that stay at Newcomer for more than 12 months.
          {stale > 0 ? ` ${stale} record(s) are due.` : ' Nothing is due right now.'}
        </p>
        <button className={btnGhost} onClick={purge} disabled={stale === 0}>Delete expired newcomer records</button>
      </Panel>
    </div>
  );
}
