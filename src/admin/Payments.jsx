// File: src/admin/Payments.jsx
// M-Pesa codes sent in for donations and membership fees. Check each code
// against the paybill statement, then confirm or reject it. Confirming a
// membership fee ticks "fee paid" on that person's record automatically.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, q } from './supabase';
import { Panel, ErrorNote, fmtDateTime, btnGhost } from './ui';
import { prettyPhone } from '../lib/phone';

const KIND = { donation: 'Donation', membership_fee: 'Membership fee' };
const STATUS_CLS = {
  pending:   'bg-terracotta/15 text-terracotta-dark',
  confirmed: 'bg-forest/10 text-forest',
  rejected:  'bg-red-50 text-red-700',
};
const ksh = (n) => `Ksh ${Number(n || 0).toLocaleString('en-KE')}`;
const thisMonth = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' }).slice(0, 7);
const monthOf = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' }).slice(0, 7);

export default function Payments() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending'); // pending | all | donation | membership_fee

  const load = useCallback(async () => {
    try {
      setRows(await q(supabase.from('payments').select('*').order('created_at', { ascending: false })));
      setError('');
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (r, status) => {
    let admin_note = r.admin_note;
    if (status === 'rejected') {
      const n = window.prompt('Why are you rejecting this code? (The member sees this for membership fees.)', 'Not found on the paybill statement');
      if (n === null) return;
      admin_note = n.trim() || null;
    }
    if (status === 'confirmed' && r.kind === 'membership_fee' &&
        !window.confirm(`Confirm ${r.mpesa_code} (${ksh(r.amount)}) from ${r.name}? This marks their membership fee as paid.`)) return;
    try { await q(supabase.from('payments').update({ status, admin_note }).eq('id', r.id)); load(); }
    catch (e) { setError(e.message); }
  };
  const remove = async (r) => {
    if (!window.confirm(`Delete the record for ${r.mpesa_code}?`)) return;
    try { await q(supabase.from('payments').delete().eq('id', r.id)); load(); }
    catch (e) { setError(e.message); }
  };

  const totals = useMemo(() => {
    const confirmed = rows.filter((r) => r.status === 'confirmed');
    const month = confirmed.filter((r) => monthOf(r.created_at) === thisMonth());
    return {
      pending: rows.filter((r) => r.status === 'pending').length,
      donationsMonth: month.filter((r) => r.kind === 'donation').reduce((s, r) => s + r.amount, 0),
      feesMonth: month.filter((r) => r.kind === 'membership_fee').reduce((s, r) => s + r.amount, 0),
      donationsAll: confirmed.filter((r) => r.kind === 'donation').reduce((s, r) => s + r.amount, 0),
    };
  }, [rows]);

  const shown = rows.filter((r) =>
    filter === 'all' ? true : filter === 'pending' ? r.status === 'pending' : r.kind === filter);

  return (
    <div className="space-y-6">
      <ErrorNote error={error} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[['To check', totals.pending, ''], ['Donations this month', ksh(totals.donationsMonth), 'confirmed'],
          ['Fees this month', ksh(totals.feesMonth), 'confirmed'], ['Donations all time', ksh(totals.donationsAll), 'confirmed']].map(([l, v, s]) => (
          <div key={l} className="bg-white rounded-lg border border-sand-dark/50 p-4">
            <p className="font-sans text-xs text-ink-muted">{l}</p>
            <p className="font-display font-bold text-2xl text-forest mt-1 tabular-nums">{v}</p>
            {s && <p className="font-sans text-[11px] text-ink-faint">{s}</p>}
          </div>
        ))}
      </div>

      <Panel title="M-Pesa payments" action={
        <div className="flex flex-wrap gap-1.5">
          {[['pending', 'To check'], ['all', 'All'], ['donation', 'Donations'], ['membership_fee', 'Fees']].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border ${filter === k ? 'bg-forest text-cream border-forest' : 'border-sand-dark text-ink-muted'}`}>{l}</button>
          ))}
        </div>
      }>
        <p className="font-sans text-xs text-ink-muted mb-4">
          Find each code on your paybill statement (M-Pesa org portal or the statement SMS/email). Confirm if the code and amount match; reject if not.
        </p>
        {shown.length === 0 ? <p className="font-sans text-sm text-ink-muted">Nothing here.</p> : (
          <ul className="divide-y divide-sand-dark/40">
            {shown.map((r) => (
              <li key={r.id} className="py-4 flex flex-wrap gap-x-6 gap-y-2 items-start">
                <div className="min-w-[10rem]">
                  <p className="font-mono font-bold text-forest tracking-wider">{r.mpesa_code}</p>
                  <p className="font-sans text-xs text-ink-muted">{fmtDateTime(r.created_at)}</p>
                </div>
                <div className="flex-1 min-w-[12rem] font-sans text-sm">
                  <p><strong className="text-forest">{ksh(r.amount)}</strong> · {KIND[r.kind]}</p>
                  <p className="text-ink-muted">
                    {r.name || 'Anonymous'}{r.phone ? ` · ${prettyPhone(r.phone)}` : ''}{r.email ? ` · ${r.email}` : ''}
                  </p>
                  {r.message && <p className="text-ink mt-1 italic">“{r.message}”</p>}
                  {r.admin_note && <p className="text-xs text-ink-faint mt-1">Note: {r.admin_note}</p>}
                  {r.handled_at && <p className="text-xs text-ink-faint mt-1">{r.status === 'confirmed' ? 'Confirmed' : 'Rejected'} {fmtDateTime(r.handled_at)}{r.handled_by ? ` by ${r.handled_by}` : ''}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[r.status]}`}>{r.status}</span>
                  {r.status === 'pending' ? (
                    <>
                      <button className="rounded-md bg-forest text-cream text-xs font-semibold px-3 py-1.5" onClick={() => setStatus(r, 'confirmed')}>Confirm</button>
                      <button className={btnGhost} onClick={() => setStatus(r, 'rejected')}>Reject</button>
                    </>
                  ) : (
                    <button className={btnGhost} onClick={() => setStatus(r, 'pending')}>Undo</button>
                  )}
                  <button className="text-xs text-red-700 underline" onClick={() => remove(r)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
