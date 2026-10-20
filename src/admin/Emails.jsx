// File: src/admin/Emails.jsx
// Every email the website sends: notices to members when an admin does
// something that affects them, receipts to the public, alerts and the
// daily digest to admins, and reminders. Failed emails can be resent.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, q } from './supabase';
import { Panel, ErrorNote, fmtDateTime, btnGhost, inputCls } from './ui';

export const EMAIL_KINDS = {
  welcome: 'Welcome',
  task_assigned: 'Task assigned',
  task_approved: 'Task approved',
  task_done: 'Task marked complete',
  task_returned: 'Task returned',
  certificate_issued: 'Certificate issued',
  certificate_revoked: 'Certificate revoked',
  certificate_restored: 'Certificate restored',
  document_verified: 'Document verified',
  document_rejected: 'Document rejected',
  fee_confirmed: 'Fee confirmed',
  fee_rejected: 'Fee code rejected',
  donation_receipt: 'Donation receipt',
  stage_changed: 'Stage changed',
  event_added: 'Added to event',
  event_role: 'Event role',
  project_added: 'Added to project',
  tm_added: 'Tree Monitor: added',
  tm_removed: 'Tree Monitor: removed',
  tm_role: 'Tree Monitor: role',
  safeguarding_countersigned: 'Safeguarding countersigned',
  contact_receipt: 'Contact receipt',
  document_request_receipt: 'Document request receipt',
  document_request_declined: 'Document request declined',
  reminder_due_soon: 'Reminder: due soon',
  reminder_overdue: 'Reminder: overdue',
  reminder_open_task: 'Reminder: open task',
  reminder_event: 'Reminder: event tomorrow',
  reminder_trees: 'Reminder: trees due',
  admin_new_join: 'Admin: new sign-up',
  admin_contact: 'Admin: contact message',
  admin_document_request: 'Admin: document request',
  admin_payment: 'Admin: M-Pesa code',
  admin_task_submitted: 'Admin: task to review',
  admin_document_uploaded: 'Admin: document to check',
  admin_safeguarding_declared: 'Admin: declaration to countersign',
  admin_deletion_request: 'Admin: deletion request',
  admin_digest: 'Admin: daily digest',
};
const STATUS_CLS = {
  sent: 'bg-forest/10 text-forest',
  pending: 'bg-terracotta/15 text-terracotta-dark',
  sending: 'bg-terracotta/15 text-terracotta-dark',
  failed: 'bg-red-50 text-red-700',
  cancelled: 'bg-sand text-ink-muted',
};
const label = (k) => EMAIL_KINDS[k] || k;

export default function Emails() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setRows(await q(supabase.from('email_outbox')
        .select('id, created_at, kind, to_email, to_name, subject, status, attempts, last_error, sent_at')
        .order('created_at', { ascending: false }).limit(300)));
      setError('');
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
    const day = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
    const waiting = rows.filter((r) => r.status === 'pending' || r.status === 'sending');
    const oldest = waiting.reduce((m, r) => Math.min(m, new Date(r.created_at).getTime()), Infinity);
    return {
      sentToday: rows.filter((r) => r.status === 'sent' && day(r.sent_at) === today).length,
      waiting: waiting.length,
      failed: rows.filter((r) => r.status === 'failed').length,
      stuck: waiting.length > 0 && Date.now() - oldest > 15 * 60000,
      notSetUp: waiting.some((r) => /not set up|Invalid login|535/i.test(r.last_error || '')) || (waiting.length > 0 && !rows.some((r) => r.status === 'sent') && Date.now() - oldest > 15 * 60000),
      lastError: waiting.find((r) => r.last_error)?.last_error,
    };
  }, [rows]);

  const shown = rows
    .filter((r) => status === 'all' || (status === 'waiting' ? ['pending', 'sending'].includes(r.status) : r.status === status))
    .filter((r) => !search.trim() || `${r.to_email} ${r.to_name || ''} ${r.subject} ${label(r.kind)}`.toLowerCase().includes(search.trim().toLowerCase()));

  const retry = async (r) => {
    try { await q(supabase.rpc('retry_email', { p_id: r.id })); load(); } catch (e) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <ErrorNote error={error} />
      {stats.notSetUp && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 font-sans text-sm text-amber-900" role="status">
          <strong>Emails are waiting to be sent.</strong> Email sending isn’t working yet, so {stats.waiting} email{stats.waiting === 1 ? ' is' : 's are'} queued.
          Check the Gmail App Password in Supabase (Edge Functions → Secrets → <code>SMTP_PASS</code>).
          {stats.lastError && <span className="block text-xs mt-1">Last error: {stats.lastError}</span>}
        </div>
      )}
      {!stats.notSetUp && stats.stuck && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 font-sans text-sm text-amber-900" role="status">
          Some emails have been waiting more than 15 minutes. They’ll keep retrying automatically.
          {stats.lastError && <span className="block text-xs mt-1">Last error: {stats.lastError}</span>}
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        {[['Sent today', stats.sentToday], ['Waiting', stats.waiting], ['Failed', stats.failed]].map(([l, v]) => (
          <div key={l} className="bg-white rounded-lg border border-sand-dark/50 p-4">
            <p className="font-sans text-xs text-ink-muted">{l}</p>
            <p className={`font-display font-bold text-2xl mt-1 tabular-nums ${l === 'Failed' && v ? 'text-red-700' : 'text-forest'}`}>{v}</p>
          </div>
        ))}
      </div>

      <Panel title="Emails sent by the website" action={
        <div className="flex flex-wrap gap-1.5">
          {[['all', 'All'], ['sent', 'Sent'], ['waiting', 'Waiting'], ['failed', 'Failed']].map(([k, l]) => (
            <button key={k} onClick={() => setStatus(k)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border ${status === k ? 'bg-forest text-cream border-forest' : 'border-sand-dark text-ink-muted'}`}>{l}</button>
          ))}
        </div>
      }>
        <p className="font-sans text-xs text-ink-muted mb-3">
          Members get an email whenever an admin does something that affects them (a task assigned or reviewed, a document checked,
          a certificate, an event, a payment). Admins get every contact message, document request, sign-up and M-Pesa code, plus a
          daily digest at 7:00. Reminders go out at 7:00 too; members can turn reminders off on their profile.
        </p>
        <input className={`${inputCls} sm:w-72 mb-3`} placeholder="Search by email, name or subject" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search emails" />
        {shown.length === 0 ? <p className="font-sans text-sm text-ink-muted">No emails here.</p> : (
          <ul className="divide-y divide-sand-dark/40">
            {shown.map((r) => (
              <li key={r.id} className="py-3 flex flex-wrap gap-x-5 gap-y-1 items-start font-sans text-sm">
                <div className="min-w-[8.5rem] text-xs text-ink-muted">{fmtDateTime(r.created_at)}<span className="block">{label(r.kind)}</span></div>
                <div className="flex-1 min-w-[14rem]">
                  <p className="text-forest font-semibold">{r.subject}</p>
                  <p className="text-xs text-ink-muted">To {r.to_name ? `${r.to_name} · ` : ''}{r.to_email}</p>
                  {r.last_error && r.status !== 'sent' && <p className="text-xs text-red-700 mt-0.5">{r.last_error}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[r.status]}`}>{r.status === 'sending' ? 'sending' : r.status}</span>
                  {['failed', 'cancelled'].includes(r.status) && <button className={btnGhost} onClick={() => retry(r)}>Send again</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
