// File: src/member/MemberApp.jsx
// Member area at /me: login (email link or WhatsApp link from UYIH),
// get-to-know-you profile, progress, tasks and history.
import React, { Suspense, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { supabase, loginLink } from '../lib/supabase';
import { UYIH_WHATSAPP_NUMBER } from '../lib/config';
import Course from './Course';
import PayFee from './PayFee';
import MemberLayout, { PageTitle } from './MemberLayout';
import Home from './pages/Home';
import Learning from './pages/Learning';
import TasksPanel from './TasksPage';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';
import MyDocuments from './MyDocuments';
import { useMember } from './MemberLayout';

// The Tree Monitor brings in maps and the camera, so it loads on demand
const TreeApp = React.lazy(() => import('../trees/TreeApp'));

// Member pages use a clean white layout
export function MemberHero({ eyebrow, title, children }) {
  return (
    <section className="relative pt-24 md:pt-28 pb-6 md:pb-8 bg-white border-b border-sand-dark/40">
      <div className="container-narrow max-w-4xl">
        {eyebrow && <span className="eyebrow mb-3 block">{eyebrow}</span>}
        <h1 className="font-display font-bold text-display-md md:text-display-lg text-forest">{title}</h1>
        {children}
      </div>
    </section>
  );
}

const Shell = ({ children }) => <div className="bg-white min-h-screen">{children}</div>;

function Documents() {
  const { dash } = useMember();
  return (
    <>
      <PageTitle title="Documents">UYIH’s key documents, and your verification documents for safeguarding checks.</PageTitle>
      <div className="rounded-xl border border-sand-dark/50 bg-white p-5 md:p-6"><MyDocuments personId={dash.person.id} /></div>
    </>
  );
}

export default function MemberApp() {
  return (
    <Routes>
      <Route path="activate" element={<Activate />} />
      <Route path="course/:code" element={<Course />} />
      <Route path="pay" element={<PayFee />} />
      <Route element={<MemberLayout />}>
        <Route index element={<Home />} />
        <Route path="learning" element={<Learning />} />
        <Route path="tasks" element={<TasksPanel />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="trees/*" element={<Suspense fallback={<p className="font-sans text-ink-muted">Loading the Tree Monitor…</p>}><TreeApp /></Suspense>} />
        <Route path="documents" element={<Documents />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
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
        <p className="font-sans text-ink-muted mt-2 max-w-lg">See your progress, tasks and events, and tell us about your skills.</p>
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
