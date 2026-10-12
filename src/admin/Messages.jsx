// File: src/admin/Messages.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { supabase, q } from './supabase';
import { Panel, ErrorNote, fmtDateTime, btnGhost } from './ui';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [subs, setSubs]         = useState([]);
  const [showDone, setShowDone] = useState(false);
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, s] = await Promise.all([
        q(supabase.from('contact_messages').select('*').order('created_at', { ascending: false })),
        q(supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false })),
      ]);
      setMessages(m); setSubs(s); setError('');
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const setHandled = async (id, handled) => {
    try { await q(supabase.from('contact_messages').update({ handled }).eq('id', id)); load(); }
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
        <p className="text-sm text-ink-muted">From the website’s Contact form and newsletter sign-up.</p>
      </div>
      <ErrorNote error={error} />

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
