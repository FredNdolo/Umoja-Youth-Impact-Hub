// File: src/member/MemberApp.jsx
// Member area at /me: login (email link or WhatsApp link from UYIH),
// get-to-know-you profile, progress, tasks and history.
import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { supabase, loginLink } from '../lib/supabase';
import { UYIH_WHATSAPP_NUMBER } from '../lib/config';
import Dashboard from './Dashboard';
import GetToKnowYou from './GetToKnowYou';
import Course from './Course';

export function MemberHero({ eyebrow, title, children }) {
  return (
    <section className="relative pt-28 pb-10 md:pb-12 bg-forest overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 75% 25%, rgba(196,98,45,0.16) 0%, transparent 55%)',
      }} />
      <div className="container-narrow max-w-4xl relative z-10">
        {eyebrow && <span className="eyebrow text-cream/60 mb-4 block">{eyebrow}</span>}
        <h1 className="font-display font-bold text-display-lg text-cream">{title}</h1>
        {children}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-terracotta" />
    </section>
  );
}

const Shell = ({ children }) => <div className="bg-cream min-h-screen">{children}</div>;

export default function MemberApp() {
  return (
    <Routes>
      <Route index element={<MemberHome />} />
      <Route path="activate" element={<Activate />} />
      <Route path="course/safeguarding" element={<Course />} />
      <Route path="*" element={<MemberHome />} />
    </Routes>
  );
}

function MemberHome() {
  const [session, setSession] = useState(undefined);
  const [dash, setDash] = useState(undefined); // undefined = loading, null = not linked
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    document.title = 'My UYIH';
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('get_my_dashboard');
    if (err) { setError(err.message); setDash(null); return; }
    setDash(data);
    setError('');
  }, []);

  useEffect(() => {
    if (!session) { setDash(undefined); return; }
    load();
    // supabase-js only sends the request once it's awaited/then'd
    supabase.rpc('touch_my_login').then(() => {});
  }, [session, load]);

  if (session === undefined || (session && dash === undefined)) {
    return <Shell><MemberHero eyebrow="My UYIH" title="Loading…" /></Shell>;
  }
  if (!session) return <Shell><Login /></Shell>;
  if (!dash) {
    return (
      <Shell>
        <MemberHero eyebrow="My UYIH" title="We couldn’t find your record" />
        <div className="container-narrow max-w-xl py-12 space-y-4 font-sans text-ink">
          <p>You’re signed in as <strong>{session.user.email}</strong>, but this login isn’t linked to anyone who has joined UYIH.</p>
          <p>If you joined recently, message us on WhatsApp and we’ll send you a login link.</p>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-wrap gap-3 pt-2">
            <a className="btn-primary" href={`https://wa.me/${UYIH_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi UYIH, please send me my member login link.')}`}>Message UYIH</a>
            <button className="btn-secondary" onClick={() => supabase.auth.signOut()}>Sign out</button>
          </div>
        </div>
      </Shell>
    );
  }

  const needsProfile = !dash.profile?.completed_at;
  if (editing || (needsProfile && !dash.profile)) {
    return (
      <Shell>
        <GetToKnowYou
          person={dash.person}
          profile={dash.profile}
          firstTime={!dash.profile}
          onDone={async () => { setEditing(false); await load(); window.scrollTo({ top: 0 }); }}
          onSkip={dash.profile ? () => setEditing(false) : async () => {
            // Save an empty profile so we don't ask again on every visit
            await supabase.from('member_profiles').insert({ person_id: dash.person.id });
            await load();
          }}
        />
      </Shell>
    );
  }
  return <Shell><Dashboard dash={dash} reload={load} onEditProfile={() => { setEditing(true); window.scrollTo({ top: 0 }); }} /></Shell>;
}

export function Login() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent
  const [msg, setMsg] = useState('');

  const send = async (e) => {
    e.preventDefault();
    setMsg(''); setState('sending');
    try {
      const r = await loginLink({ mode: 'email', email: email.trim() });
      setMsg(r.message); setState('sent');
    } catch (err) {
      setMsg(err.message); setState('idle');
    }
  };

  return (
    <>
      <MemberHero eyebrow="My UYIH" title="Log in">
        <p className="font-sans text-cream/75 mt-3 max-w-lg">See your progress, tasks and events, and tell us about your skills.</p>
      </MemberHero>
      <div className="container-narrow max-w-4xl py-12 md:py-16 grid md:grid-cols-2 gap-6">
        <div className="card p-6 md:p-7">
          <h2 className="font-display font-bold text-display-sm text-forest">By email</h2>
          {state === 'sent' ? (
            <p className="font-sans text-ink mt-3" role="status">📬 {msg} The link works once and expires after a while, so use it soon.</p>
          ) : (
            <form onSubmit={send} className="mt-4 space-y-4">
              <div>
                <label htmlFor="m-email" className="input-label">The email you gave UYIH</label>
                <input id="m-email" type="email" required autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="input-field" />
              </div>
              {msg && <p className="font-sans text-sm text-red-700" role="alert">{msg}</p>}
              <button className="btn-primary w-full py-3.5" disabled={state === 'sending'}>
                {state === 'sending' ? 'Sending…' : 'Email me a login link'}
              </button>
            </form>
          )}
        </div>
        <div className="card p-6 md:p-7">
          <h2 className="font-display font-bold text-display-sm text-forest">By WhatsApp</h2>
          <p className="font-sans text-ink-muted mt-3">
            No email, or prefer WhatsApp? Ask us and we’ll send a personal login link to your WhatsApp.
          </p>
          <a className="mt-5 inline-flex items-center justify-center w-full rounded-md px-6 py-3.5 font-sans font-semibold text-white bg-[#1F8F4E] hover:bg-[#187540]"
            href={`https://wa.me/${UYIH_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi UYIH, please send me my member login link.')}`}>
            Ask for a WhatsApp link
          </a>
          <p className="font-sans text-xs text-ink-faint mt-4">
            Not a member yet? <Link to="/join" className="underline">Join UYIH</Link> first.
          </p>
        </div>
      </div>
    </>
  );
}

// Landing page for WhatsApp login links: /me/activate#t=<token>
// The token is only used when the person taps the button, so link previews
// in WhatsApp can't use it up.
function Activate() {
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('t'));
  const [state, setState] = useState('ready'); // ready | working | failed
  const [msg, setMsg] = useState('');

  useEffect(() => {
    document.title = 'Log in · My UYIH';
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname); // keep the token out of history
  }, []);

  const go = async () => {
    setState('working');
    let res = await supabase.auth.verifyOtp({ token_hash: token, type: 'magiclink' });
    if (res.error) res = await supabase.auth.verifyOtp({ token_hash: token, type: 'email' });
    if (res.error) {
      setState('failed');
      setMsg('This link has expired or was already used. Ask UYIH on WhatsApp for a new one.');
      return;
    }
    navigate('/me', { replace: true });
  };

  return (
    <Shell>
      <MemberHero eyebrow="My UYIH" title="Welcome back" />
      <div className="container-narrow max-w-md py-12 text-center">
        {!token ? (
          <p className="font-sans text-ink">This link is incomplete. Please open the full link from your WhatsApp message.</p>
        ) : state === 'failed' ? (
          <>
            <p className="font-sans text-ink" role="alert">{msg}</p>
            <a className="btn-primary mt-6" href={`https://wa.me/${UYIH_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi UYIH, my login link expired. Please send a new one.')}`}>Ask for a new link</a>
          </>
        ) : (
          <>
            <p className="font-sans text-ink-muted mb-6">Tap below to log in to your UYIH member page.</p>
            <button className="btn-primary w-full py-4 text-base" onClick={go} disabled={state === 'working'}>
              {state === 'working' ? 'Logging in…' : 'Log me in'}
            </button>
          </>
        )}
      </div>
    </Shell>
  );
}
