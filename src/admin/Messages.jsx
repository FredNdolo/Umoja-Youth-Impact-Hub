// File: src/admin/Messages.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { supabase, q } from './supabase';
import { Panel, ErrorNote, fmtDateTime, btnGhost } from './ui';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [docReqs, setDocReqs]   = useState([]);
  const [showDoneDocs, setShowDoneDocs] = useState(false);
  const [subs, setSubs]         = useState([]);
  const [showDone, setShowDone] = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, s, d] = await Promise.all([
        q(supabase.from('contact_messages').select('*').order('created_at', { ascending: false })),
        q(supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false })),
        q(supabase.from('document_requests').select('*').order('created_at', { ascending: false })),
      ]);
      setMessages(m); setSubs(s); setDocReqs(d); setError('');
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setHandled = async (id, handled) => {
    try { await q(supabase.from('contact_messages').update({ handled }).eq('id', id)); load(); }
    catch (e) { setError(e.message); }
  };
  const setDocStatus = async (id, status) => {
    try {
      await q(supabase.from('document_requests')
        .update({ status, handled_at: status === 'pending' ? null : new Date().toISOString() }).eq('id', id));
      load();
    } catch (e) { setError(e.message); }
  };
  const removeDoc = async (id) => {
    if (!window.confirm('Delete this request?')) return;
    try { await q(supabase.from('document_requests').delete().eq('id', id)); load(); }
    catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try { await q(supabase.from('contact_messages').delete().eq('id', id)); load(); }
    catch (e) { setError(e.message); }
  };
  const unsubscribe = async (email) => {
    if (!window.confirm(`Remove ${email} from the mailing list?`)) return;
    try { await q(supabase.from('newsletter_subscribers').delete().eq('email', email)); load(); }
    catch (e) { setError(e.message); }
  };

  const pendingDocs = docReqs.filter((d) => d.status === 'pending');
  const shownDocs = showDoneDocs ? docReqs : pendingDocs;
  const open = messages.filter((m) => !m.handled);
  const shown = showDone ? messages : open;
  const activeSubs = subs.filter((s) => !s.unsubscribed_at);

  const copyEmails = async () => {
    try {
      await navigator.clipboard.writeText(activeSubs.map((s) => s.email).join(', '));
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    } catch { setError('Could not copy. Select the addresses manually.'); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-display-sm text-forest">Messages</h1>
        <p className="text-sm text-ink-muted">Document requests, the Contact form and newsletter sign-ups.</p>
      </div>
      <ErrorNote error={error} />

      <Panel title={`Document requests${pendingDocs.length ? ` · ${pendingDocs.length} waiting` : ''}`}
        action={<label className="text-xs flex items-center gap-1.5 text-ink-muted"><input type="checkbox" checked={showDoneDocs} onChange={(e) => setShowDoneDocs(e.target.checked)} /> Show handled</label>}>
        {shownDocs.length === 0 ? <p className="text-sm text-ink-muted">{docReqs.length ? 'All requests handled.' : 'No document requests yet.'}</p> : (
          <ul className="space-y-4">
            {shownDocs.map((d) => {
              const first = d.name.split(/\s+/)[0];
              const body = `Hi ${first},\n\nThank you for your interest in Umoja Youth Impact Hub. Please find attached "${d.document_title}".\n\nKind regards,\nUmoja Youth Impact Hub`;
              const mailto = `mailto:${d.email}?subject=${encodeURIComponent(d.document_title)}&body=${encodeURIComponent(body)}`;
              return (
                <li key={d.id} className={`rounded-md border p-4 ${d.status === 'pending' ? 'border-sand-dark' : 'border-sand-dark/40 bg-sand-light/50'}`}>
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span><strong className="text-forest">{d.document_title}</strong></span>
                    <span className="text-xs text-ink-muted">{fmtDateTime(d.created_at)}</span>
                  </div>
                  <p className="text-sm mt-1">
                    {d.name}{d.organisation ? <span className="text-ink-muted"> · {d.organisation}</span> : null}
                  </p>
                  <p className="text-sm text-ink mt-2 whitespace-pre-wrap"><span className="text-ink-muted">Purpose: </span>{d.purpose}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                    <a className="text-terracotta underline" href={mailto}>Email {d.email}</a>
                    {d.status !== 'pending' && <span className="text-ink-muted">Marked {d.status} {d.handled_at ? fmtDateTime(d.handled_at) : ''}</span>}
                    <span className="flex-1" />
                    {d.status === 'pending' ? (
                      <>
                        <button className={btnGhost} onClick={() => setDocStatus(d.id, 'sent')}>Mark sent</button>
                        <button className="text-ink-faint underline" onClick={() => setDocStatus(d.id, 'declined')}>Decline</button>
                      </>
                    ) : (
                      <button className="text-ink-faint underline" onClick={() => setDocStatus(d.id, 'pending')}>Reopen</button>
                    )}
                    <button className="text-ink-faint underline" onClick={() => removeDoc(d.id)}>Delete</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title={`Contact form${open.length ? ` · ${open.length} to answer` : ''}`}
        action={<label className="text-xs flex items-center gap-1.5 text-ink-muted"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show answered</label>}>
        {shown.length === 0 ? <p className="text-sm text-ink-muted">{messages.length ? 'All messages answered.' : 'No messages yet.'}</p> : (
          <ul className="space-y-4">
            {shown.map((m) => (
              <li key={m.id} className={`rounded-md border p-4 ${m.handled ? 'border-sand-dark/40 bg-sand-light/50' : 'border-sand-dark'}`}>
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span><strong className="text-forest">{m.name}</strong> <span className="text-ink-muted">· {m.subject}</span></span>
                  <span className="text-xs text-ink-muted">{fmtDateTime(m.created_at)}</span>
                </div>
                <p className="text-sm text-ink mt-2 whitespace-pre-wrap">{m.message}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                  <a className="text-terracotta underline" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>Reply to {m.email}</a>
                  {m.phone && <span className="text-ink-muted">{m.phone}</span>}
                  <span className="flex-1" />
                  <button className={btnGhost} onClick={() => setHandled(m.id, !m.handled)}>{m.handled ? 'Mark unanswered' : 'Mark answered'}</button>
                  <button className="text-ink-faint underline" onClick={() => remove(m.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={`Newsletter · ${activeSubs.length}`}
        action={activeSubs.length > 0 && <button className={btnGhost} onClick={copyEmails}>{copied ? 'Copied ✓' : 'Copy all emails'}</button>}>
        {activeSubs.length === 0 ? <p className="text-sm text-ink-muted">No subscribers yet.</p> : (
          <>
            <p className="text-xs text-ink-muted mb-3">Paste the copied list into the BCC field so subscribers don’t see each other’s addresses.</p>
            <ul className="divide-y divide-sand-dark/40 text-sm">
              {activeSubs.map((s) => (
                <li key={s.email} className="flex justify-between gap-3 py-2">
                  <span>{s.email}</span>
                  <span className="flex gap-3 items-center text-xs text-ink-muted">
                    {fmtDateTime(s.subscribed_at)}
                    <button className="underline" onClick={() => unsubscribe(s.email)}>Remove</button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </div>
  );
}
