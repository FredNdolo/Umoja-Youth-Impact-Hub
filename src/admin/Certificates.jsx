// File: src/admin/Certificates.jsx
// Register of every certificate UYIH has issued: who, which course, when,
// who signed it, and (for Safeguarding Basics) whether the DSL has
// countersigned the declaration. Admins can revoke a certificate with a
// reason, export the register, and update who signs future certificates.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, q } from './supabase';
import { Panel, ErrorNote, fmtDate, btnGhost, btnPrimary, inputCls, labelCls } from './ui';

const monthOf = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' }).slice(0, 7);
const thisMonth = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' }).slice(0, 7);

function toCsv(rows) {
  const cols = ['Certificate code', 'Name', 'Course', 'Issued', 'Signed by', 'DSL countersigned', 'Status', 'Revoked reason'];
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(','), ...rows.map((r) => [
    r.code, r.full_name, r.title, new Date(r.issued_at).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' }),
    (r.signatories || []).map((s) => `${s.name} (${s.title})`).join('; '),
    r.course_code === 'safeguarding' ? (r.countersigned_at ? new Date(r.countersigned_at).toLocaleDateString('en-CA') : 'Not yet') : 'n/a',
    r.revoked_at ? 'Revoked' : 'Valid', r.revoked_reason || '',
  ].map(esc).join(','))].join('\n');
}

export default function Certificates() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [course, setCourse] = useState('all');
  const [status, setStatus] = useState('valid');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const [certs, profiles] = await Promise.all([
        q(supabase.from('certificates').select('*').order('issued_at', { ascending: false })),
        q(supabase.from('member_profiles').select('person_id, safeguarding_countersigned_at, safeguarding_countersigned_by').not('safeguarding_countersigned_at', 'is', null)),
      ]);
      const cs = Object.fromEntries(profiles.map((p) => [p.person_id, p]));
      setRows(certs.map((c) => ({ ...c, countersigned_at: cs[c.person_id]?.safeguarding_countersigned_at, countersigned_by: cs[c.person_id]?.safeguarding_countersigned_by })));
      setError('');
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const courses = useMemo(() => [...new Map(rows.map((r) => [r.course_code, r.title])).entries()], [rows]);
  const shown = rows
    .filter((r) => course === 'all' || r.course_code === course)
    .filter((r) => status === 'all' || (status === 'valid' ? !r.revoked_at : !!r.revoked_at))
    .filter((r) => !search.trim() || `${r.full_name} ${r.code}`.toLowerCase().includes(search.trim().toLowerCase()));

  const valid = rows.filter((r) => !r.revoked_at);
  const stats = [
    ['Certificates issued', valid.length],
    ['This month', valid.filter((r) => monthOf(r.issued_at) === thisMonth()).length],
    ...courses.map(([code, title]) => [title, valid.filter((r) => r.course_code === code).length]),
  ].slice(0, 4);

  const revoke = async (r) => {
    const reason = window.prompt(`Revoke certificate ${r.code} for ${r.full_name}? Anyone who checks the code will see it is revoked.\n\nReason:`);
    if (reason === null) return;
    if (!reason.trim()) { setError('Give a reason for revoking the certificate.'); return; }
    try { await q(supabase.from('certificates').update({ revoked_at: new Date().toISOString(), revoked_reason: reason.trim() }).eq('id', r.id)); load(); }
    catch (e) { setError(e.message); }
  };
  const restore = async (r) => {
    if (!window.confirm(`Restore certificate ${r.code} for ${r.full_name}?`)) return;
    try { await q(supabase.from('certificates').update({ revoked_at: null }).eq('id', r.id)); load(); }
    catch (e) { setError(e.message); }
  };
  const exportCsv = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([toCsv(shown)], { type: 'text/csv' }));
    a.download = `uyih-certificates-${new Date().toLocaleDateString('en-CA')}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="space-y-6">
      <ErrorNote error={error} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(([l, v]) => (
          <div key={l} className="bg-white rounded-lg border border-sand-dark/50 p-4">
            <p className="font-sans text-xs text-ink-muted">{l}</p>
            <p className="font-display font-bold text-2xl text-forest mt-1 tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <Panel title="Certificates register" action={<button className={btnGhost} onClick={exportCsv} disabled={!shown.length}>Download CSV</button>}>
        <div className="flex flex-wrap gap-2 mb-4">
          <input className={`${inputCls} sm:w-56`} placeholder="Search name or code" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search certificates" />
          <select className={`${inputCls} w-auto`} value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Course">
            <option value="all">All courses</option>
            {courses.map(([code, title]) => <option key={code} value={code}>{title}</option>)}
          </select>
          <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="valid">Valid</option><option value="revoked">Revoked</option><option value="all">All</option>
          </select>
        </div>
        <p className="font-sans text-xs text-ink-muted mb-3">
          Certificates are issued automatically when a member completes a course. Each one keeps the names that signed it on the day it was issued.
        </p>
        {shown.length === 0 ? <p className="font-sans text-sm text-ink-muted">No certificates here yet.</p> : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full font-sans text-sm">
              <thead className="bg-sand-light text-left text-xs text-ink-muted">
                <tr><th className="px-5 py-2.5">Certificate</th><th className="px-3">Member</th><th className="px-3">Course</th><th className="px-3">Issued</th><th className="px-3">Signed by</th><th className="px-3">DSL countersigned</th><th className="px-5" /></tr>
              </thead>
              <tbody className="divide-y divide-sand-dark/40">
                {shown.map((r) => (
                  <tr key={r.id} className={r.revoked_at ? 'bg-red-50/50' : ''}>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <a href={`/certificates/${r.code}`} target="_blank" rel="noopener noreferrer" className="font-mono font-semibold text-forest underline">{r.code}</a>
                      {r.revoked_at && <span className="block text-xs text-red-700">Revoked {fmtDate(r.revoked_at)}{r.revoked_reason ? `: ${r.revoked_reason}` : ''}</span>}
                    </td>
                    <td className="px-3">{r.full_name}</td>
                    <td className="px-3">{r.title}</td>
                    <td className="px-3 whitespace-nowrap">{fmtDate(r.issued_at)}</td>
                    <td className="px-3 text-xs text-ink-muted">{(r.signatories || []).map((s) => s.name).join(', ') || '—'}</td>
                    <td className="px-3 text-xs">
                      {r.course_code !== 'safeguarding' ? <span className="text-ink-faint">n/a</span>
                        : r.countersigned_at ? <span className="text-forest">✓ {fmtDate(r.countersigned_at)}</span>
                        : <span className="text-terracotta-dark">Waiting (Tasks page)</span>}
                    </td>
                    <td className="px-5 text-right whitespace-nowrap">
                      {r.revoked_at
                        ? <button className="text-xs underline text-ink-muted" onClick={() => restore(r)}>Restore</button>
                        : <button className="text-xs underline text-red-700" onClick={() => revoke(r)}>Revoke</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Signatories setError={setError} />
    </div>
  );
}

// Who signs future certificates (already-issued ones keep their names)
function Signatories({ setError }) {
  const [rows, setRows] = useState([]);
  const [saved, setSaved] = useState('');
  const load = useCallback(async () => {
    try { setRows(await q(supabase.from('signatories').select('*').order('role', { ascending: false }))); }
    catch (e) { setError(e.message); }
  }, [setError]);
  useEffect(() => { load(); }, [load]);
  const save = async (r) => {
    try {
      await q(supabase.from('signatories').update({ name: r.name.trim(), title: r.title.trim(), updated_at: new Date().toISOString() }).eq('role', r.role));
      setSaved(r.role); setTimeout(() => setSaved(''), 2000); load();
    } catch (e) { setError(e.message); }
  };
  const set = (role, k, v) => setRows((all) => all.map((x) => (x.role === role ? { ...x, [k]: v } : x)));
  return (
    <Panel title="Who signs certificates">
      <p className="font-sans text-xs text-ink-muted mb-4">
        The Executive Director signs every certificate. The Designated Safeguarding Lead also signs Safeguarding Basics
        (the Child Protection and Safeguarding Policy course). Changes apply to certificates issued from now on.
      </p>
      <div className="grid md:grid-cols-2 gap-4">
        {rows.map((r) => (
          <div key={r.role} className="rounded-md border border-sand-dark/50 p-4 space-y-3">
            <p className="font-sans text-xs font-semibold text-forest">{r.role === 'dsl' ? 'Designated Safeguarding Lead' : 'Executive Director'}</p>
            <label className="block"><span className={labelCls}>Name</span><input className={inputCls} value={r.name} onChange={(e) => set(r.role, 'name', e.target.value)} /></label>
            <label className="block"><span className={labelCls}>Title</span><input className={inputCls} value={r.title} onChange={(e) => set(r.role, 'title', e.target.value)} /></label>
            <button className={btnPrimary} onClick={() => save(r)}>{saved === r.role ? 'Saved ✓' : 'Save'}</button>
          </div>
        ))}
      </div>
    </Panel>
  );
}
