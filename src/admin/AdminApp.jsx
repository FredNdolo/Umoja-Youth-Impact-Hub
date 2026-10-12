// File: src/admin/AdminApp.jsx
// Admin dashboard: magic-link login, then People / Events / Messages / Metrics.
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NavLink, Route, Routes, Link } from 'react-router-dom';
import { supabase } from './supabase';
import { btnPrimary, inputCls, labelCls, ErrorNote } from './ui';
import People from './People';
import Events from './Events';
import Messages from './Messages';
import Metrics from './Metrics';
import logo from '../assets/logo.jpg';

export default function AdminApp() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    document.title = 'UYIH Admin';
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setIsAdmin(null); return; }
    supabase.rpc('is_admin').then(({ data, error }) => setIsAdmin(!error && data === true));
  }, [session]);

  if (session === undefined || (session && isAdmin === null)) {
    return <Centered><p className="text-ink-muted text-sm">Loading…</p></Centered>;
  }
  if (!session) return <Login />;
  if (!isAdmin) {
    return (
      <Centered>
        <h1 className="font-display font-bold text-display-sm text-forest mb-2">Not an admin account</h1>
        <p className="text-sm text-ink-muted mb-6">{session.user.email} is signed in but isn’t on the admin list.</p>
        <button className={btnPrimary} onClick={() => supabase.auth.signOut()}>Sign out</button>
      </Centered>
    );
  }
  return <Shell email={session.user.email} />;
}

function Centered({ children }) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-lg border border-sand-dark/50 shadow-card p-8 text-center">{children}</div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState('');

  const send = async (e) => {
    e.preventDefault();
    setError('');
    setState('sending');
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/admin` },
    });
    if (err) {
      setState('idle');
      setError(/signups not allowed|not found/i.test(err.message)
        ? 'That email is not set up as an admin.'
        : err.message);
    } else {
      setState('sent');
    }
  };

  return (
    <Centered>
      <img src={logo} alt="" className="w-14 h-14 mx-auto rounded-lg mb-4" />
      <h1 className="font-display font-bold text-display-sm text-forest">UYIH Admin</h1>
      {state === 'sent' ? (
        <p className="text-sm text-ink-muted mt-4">
          Check <strong>{email}</strong> for a sign-in link. You can open it on this or any other device.
        </p>
      ) : (
        <form onSubmit={send} className="text-left mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className={labelCls}>Admin email</label>
            <input id="admin-email" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </div>
          <ErrorNote error={error} />
          <button className={`${btnPrimary} w-full py-3`} disabled={state === 'sending'}>
            {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
          </button>
        </form>
      )}
      <Link to="/" className="block text-xs text-ink-faint underline mt-6">Back to the website</Link>
    </Centered>
  );
}

const TABS = [
  { to: '/admin',          label: 'People',   end: true },
  { to: '/admin/events',   label: 'Events'   },
  { to: '/admin/messages', label: 'Messages' },
  { to: '/admin/metrics',  label: 'Metrics'  },
];

function useInboxCount() {
  const [n, setN] = useState(0);
  const { pathname } = useLocation();
  useEffect(() => {
    Promise.all([
      supabase.from('document_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('handled', false),
    ]).then(([a, b]) => setN((a.count || 0) + (b.count || 0)));
  }, [pathname]);
  return n;
}

function Shell({ email }) {
  const inbox = useInboxCount();
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-forest text-cream sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <img src={logo} alt="" className="w-8 h-8 rounded-md" />
            <span className="font-display font-bold text-lg">UYIH Admin</span>
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline text-cream/60">{email}</span>
            <button onClick={() => supabase.auth.signOut()} className="rounded-md border border-cream/30 px-3 py-1.5 hover:bg-cream/10">
              Sign out
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-2 flex gap-1 overflow-x-auto" aria-label="Admin sections">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end}
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  isActive ? 'border-terracotta text-cream' : 'border-transparent text-cream/60 hover:text-cream'}`}>
              {t.label}
              {t.label === 'Messages' && inbox > 0 && (
                <span className="ml-1.5 inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-[11px] text-white">{inbox}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route index element={<People />} />
          <Route path="events" element={<Events />} />
          <Route path="messages" element={<Messages />} />
          <Route path="metrics" element={<Metrics />} />
          <Route path="*" element={<People />} />
        </Routes>
      </main>
    </div>
  );
}
