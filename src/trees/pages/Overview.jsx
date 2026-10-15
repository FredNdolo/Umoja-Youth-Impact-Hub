// File: src/trees/pages/Overview.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useTrees } from '../TreeApp';
import { Stat, Card, Bar, StatusPill, TreeMap } from '../ui';
import { daysSince, fmtDate, HEALTH } from '../api';

export const CHECK_EVERY_DAYS = 30;
export const isLiving = (s) => ['planted', 'alive', 'stressed'].includes(s);
export function survival(list) {
  const seen = list.filter((t) => ['alive', 'stressed', 'dead', 'missing'].includes(t.status));
  if (!seen.length) return null;
  return Math.round((1000 * seen.filter((t) => ['alive', 'stressed'].includes(t.status)).length) / seen.length) / 10;
}
export function dueForCheck(t) {
  if (!isLiving(t.status)) return false;
  const d = daysSince(t.last_checked_at || t.planted_on);
  return d == null || d >= CHECK_EVERY_DAYS;
}

export default function Overview() {
  const { trees, ref, lookups } = useTrees();
  const [recent, setRecent] = useState([]);
  const [loop, setLoop] = useState(null);

  useEffect(() => {
    supabase.from('tm_checkins').select('id, checked_at, health, height_cm, tm_trees(code), people:checked_by(full_name)')
      .order('checked_at', { ascending: false }).limit(8).then(({ data }) => setRecent(data || []));
    Promise.all([
      supabase.from('tm_sales').select('quantity, amount_kes'),
      supabase.from('tm_distributions').select('packs, girls_reached, cost_kes'),
    ]).then(([s, d]) => {
      const sales = s.data || []; const dist = d.data || [];
      setLoop({
        sold: sales.reduce((a, r) => a + r.quantity, 0),
        kes: sales.reduce((a, r) => a + Number(r.amount_kes), 0),
        packs: dist.reduce((a, r) => a + r.packs, 0),
        girls: dist.reduce((a, r) => a + (r.girls_reached || 0), 0),
        spent: dist.reduce((a, r) => a + Number(r.cost_kes || 0), 0),
      });
    });
  }, []);

  const stats = useMemo(() => {
    const living = trees.filter((t) => isLiving(t.status)).length;
    const due = trees.filter(dueForCheck);
    const checked30 = trees.filter((t) => daysSince(t.last_checked_at) != null && daysSince(t.last_checked_at) < CHECK_EVERY_DAYS).length;
    return { total: trees.length, living, surv: survival(trees), due, checked30 };
  }, [trees]);

  const bySite = useMemo(() => ref.sites.map((s) => {
    const list = trees.filter((t) => lookups.plot[t.plot_id]?.site_id === s.id);
    return { site: s, total: list.length, living: list.filter((t) => isLiving(t.status)).length, surv: survival(list) };
  }), [ref, trees, lookups]);

  const raised = ref.batches.reduce((a, b) => a + (b.ready ?? b.germinated ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Trees registered" value={stats.total} />
        <Stat label="Living" value={stats.living} />
        <Stat label="Survival" value={stats.surv != null ? `${stats.surv}%` : '—'} hint="Target 75% · of trees checked at least once"
          accent={stats.surv == null ? 'text-forest' : stats.surv >= 75 ? 'text-forest' : 'text-amber-700'} />
        <Stat label="Due for a check-in" value={stats.due.length} hint={`Not checked in ${CHECK_EVERY_DAYS}+ days`} accent={stats.due.length ? 'text-terracotta' : 'text-forest'} />
      </div>

      {trees.length === 0 && (
        <Card>
          <p className="font-sans text-ink"><strong>No trees yet.</strong> Start by adding GPS points and plots for each school under <Link to="/me/trees/sites" className="underline text-terracotta">Sites & plots</Link>, record each plot’s baseline before planting, then register trees as they go in the ground.</p>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <TreeMap height={320} trees={trees.map((t) => ({ ...t, species: lookups.species[t.species_id]?.common_name }))} plots={ref.plots} sites={ref.sites} />
          <Card title="Sites" action={<Link to="/me/trees/sites" className="font-sans text-sm text-terracotta font-semibold">Manage →</Link>}>
            <ul className="divide-y divide-sand-dark/40">
              {bySite.map(({ site, total, living, surv }) => (
                <li key={site.id} className="py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 font-sans text-sm">
                    <span className="font-semibold text-forest">{site.name}</span>
                    <span className="text-ink-muted">{total} trees · {living} living · survival {surv != null ? `${surv}%` : '—'}</span>
                  </div>
                  <div className="mt-2"><Bar pct={surv ?? 0} color={surv == null ? '#E8DCC4' : surv >= 75 ? '#1F8F4E' : '#D99A1E'} /></div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Due for a check-in" action={stats.due.length > 0 && <Link to="/me/trees/list?filter=due" className="font-sans text-sm text-terracotta font-semibold">All →</Link>}>
            {stats.due.length === 0 ? <p className="font-sans text-sm text-ink-muted">All living trees have been checked in the last {CHECK_EVERY_DAYS} days. 🎉</p> : (
              <ul className="space-y-2">
                {stats.due.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center gap-2 font-sans text-sm">
                    <Link to={`/me/trees/tree/${t.code}`} className="font-mono font-semibold text-forest">{t.code}</Link>
                    <span className="text-ink-muted truncate">{lookups.species[t.species_id]?.common_name}</span>
                    <Link to={`/me/trees/check-in/${t.code}`} className="ml-auto text-xs font-semibold text-terracotta whitespace-nowrap">Check in →</Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Green Futures loop" action={<Link to="/me/trees/nursery" className="font-sans text-sm text-terracotta font-semibold">Ledger →</Link>}>
            <dl className="grid grid-cols-2 gap-3 font-sans">
              <div><dt className="text-xs text-ink-muted">Seedlings raised</dt><dd className="font-display font-bold text-2xl text-forest">{raised}</dd></div>
              <div><dt className="text-xs text-ink-muted">Seedlings sold</dt><dd className="font-display font-bold text-2xl text-forest">{loop?.sold ?? '…'}</dd></div>
              <div><dt className="text-xs text-ink-muted">Sales (KES)</dt><dd className="font-display font-bold text-2xl text-forest">{loop ? loop.kes.toLocaleString('en-KE') : '…'}</dd></div>
              <div><dt className="text-xs text-ink-muted">Pad packs given</dt><dd className="font-display font-bold text-2xl text-terracotta">{loop?.packs ?? '…'}</dd></div>
            </dl>
            {loop?.girls > 0 && <p className="font-sans text-xs text-ink-muted mt-2">{loop.girls} girls reached · KES {loop.spent.toLocaleString('en-KE')} spent on products</p>}
          </Card>

          <Card title="Latest check-ins">
            {recent.length === 0 ? <p className="font-sans text-sm text-ink-muted">None yet.</p> : (
              <ul className="space-y-2.5">
                {recent.map((c) => {
                  const h = HEALTH.find((x) => x.value === c.health);
                  return (
                    <li key={c.id} className="flex items-start gap-2 font-sans text-sm">
                      <span aria-hidden="true">{h?.icon}</span>
                      <div className="min-w-0">
                        <Link to={`/me/trees/tree/${c.tm_trees?.code}`} className="font-mono font-semibold text-forest">{c.tm_trees?.code}</Link>
                        <span className="text-ink-muted"> · {h?.label}{c.height_cm != null ? ` · ${c.height_cm} cm` : ''}</span>
                        <p className="text-xs text-ink-faint">{fmtDate(c.checked_at)}{c.people?.full_name ? ` · ${c.people.full_name}` : ''}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
      <p className="font-sans text-xs text-ink-faint">Status key: <StatusPill status="planted" /> not yet checked · <StatusPill status="alive" /> · <StatusPill status="stressed" /> · <StatusPill status="dead" /> · <StatusPill status="missing" /></p>
    </div>
  );
}
