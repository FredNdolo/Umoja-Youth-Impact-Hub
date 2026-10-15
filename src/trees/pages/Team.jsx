// File: src/trees/pages/Team.jsx
// Who can use the Tree Monitor. Only adult UYIH members are added — children
// and Girl Guides never get accounts; members record their work.
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useTrees } from '../TreeApp';
import { Card, Notice } from '../ui';

export default function Team() {
  const { role, canManage } = useTrees();
  const isAdmin = role === 'admin';
  const [people, setPeople] = useState(null);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const load = () => supabase.rpc('tm_member_directory').then(({ data, error }) => { if (error) setErr(error.message); setPeople(data || []); });
  useEffect(() => { load(); }, []);

  const team = useMemo(() => (people || []).filter((p) => p.team_role), [people]);
  const others = useMemo(() => (people || []).filter((p) => !p.team_role && (!q || p.full_name.toLowerCase().includes(q.toLowerCase()))), [people, q]);

  if (!canManage) return <Notice kind="info">Only coordinators can manage the team.</Notice>;

  const add = async (p) => {
    setErr('');
    if (!p.safeguarding && !window.confirm(`${p.full_name} hasn’t completed Safeguarding Basics yet. Field work happens in schools — add anyway?`)) return;
    const { error } = await supabase.from('tm_team').insert({ person_id: p.person_id, role: 'field' });
    if (error) setErr(error.message); else load();
  };
  const update = async (p, patch) => {
    setErr('');
    const { error } = await supabase.from('tm_team').update(patch).eq('person_id', p.person_id);
    if (error) setErr(error.message); else load();
  };

  return (
    <div className="space-y-5">
      <Notice kind="info">Add adult UYIH members who go to the field. Children and Girl Guides never get their own accounts — the member they work with records their trees.</Notice>
      {err && <Notice kind="error">{err}</Notice>}
      <Card title={`Field team · ${team.filter((p) => p.active).length} active`}>
        {people === null ? <p className="font-sans text-sm text-ink-muted">Loading…</p> : team.length === 0 ? <p className="font-sans text-sm text-ink-muted">Nobody yet. Add members below.</p> : (
          <ul className="divide-y divide-sand-dark/40">
            {team.map((p) => (
              <li key={p.person_id} className="py-3 flex flex-wrap items-center gap-2 font-sans text-sm">
                <span className={`font-semibold ${p.active ? 'text-forest' : 'text-ink-faint line-through'}`}>{p.full_name}</span>
                <span className="rounded-full bg-sand-light px-2 py-0.5 text-xs capitalize">{p.team_role}</span>
                {!p.safeguarding && <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-xs">Safeguarding not done</span>}
                {isAdmin && (
                  <span className="ml-auto flex gap-3 text-xs">
                    {p.active && <button className="underline text-ink-muted" onClick={() => update(p, { role: p.team_role === 'coordinator' ? 'field' : 'coordinator' })}>{p.team_role === 'coordinator' ? 'Make field' : 'Make coordinator'}</button>}
                    <button className="underline text-ink-muted" onClick={() => update(p, { active: !p.active })}>{p.active ? 'Remove access' : 'Restore'}</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {!isAdmin && <p className="font-sans text-xs text-ink-faint mt-2">Only admins can change roles or remove access.</p>}
      </Card>
      <Card title="Add a member">
        <input className="input-field mb-3" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search members" />
        {others.length === 0 ? <p className="font-sans text-sm text-ink-muted">{q ? 'No match.' : 'Everyone eligible is already on the team.'}</p> : (
          <ul className="divide-y divide-sand-dark/40 max-h-96 overflow-y-auto">
            {others.slice(0, 50).map((p) => (
              <li key={p.person_id} className="py-2.5 flex items-center gap-2 font-sans text-sm">
                <span>{p.full_name}</span>
                <span className="text-xs text-ink-faint capitalize">{p.stage}</span>
                {p.safeguarding ? <span className="text-xs text-forest">✓ safeguarding</span> : <span className="text-xs text-amber-800">no safeguarding</span>}
                <button className="ml-auto btn-secondary text-xs py-1.5 px-3" onClick={() => add(p)}>Add</button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
