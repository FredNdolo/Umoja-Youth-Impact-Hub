// File: src/member/MemberLayout.jsx
// The signed-in member area: a white, course-site style layout with a header
// (name, stage, medal, points) and a section menu (sidebar on wide screens,
// scrolling tabs on phones). Loads the member's data once and shares it.
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { STAGES, UYIH_WHATSAPP_NUMBER } from '../lib/config';
import { MemberHero, Login } from './MemberApp';
import GetToKnowYou from './GetToKnowYou';
import { currentMedal } from './achievements';

const MemberCtx = createContext(null);
export const useMember = () => useContext(MemberCtx);

export const NAV = [
  { to: '/me',              label: 'Home',          icon: '🏠', end: true },
  { to: '/me/learning',     label: 'My learning',   icon: '🎓' },
  { to: '/me/tasks',        label: 'Tasks',         icon: '✅' },
  { to: '/me/achievements', label: 'Achievements',  icon: '🏅' },
  { to: '/me/trees',        label: 'Tree Monitor',  icon: '🌳' },
  { to: '/me/documents',    label: 'Documents',     icon: '📁' },
  { to: '/me/profile',      label: 'Profile',       icon: '👤' },
];

const Shell = ({ children }) => <div className="bg-white min-h-screen">{children}</div>;
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

export default function MemberLayout() {
  const [session, setSession] = useState(undefined);
  const [dash, setDash] = useState(undefined); // undefined = loading, null = not linked
  const [learning, setLearning] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const reload = useCallback(async () => {
    const [d, l] = await Promise.all([supabase.rpc('get_my_dashboard'), supabase.rpc('get_my_learning')]);
    if (d.error) { setError(d.error.message); setDash(null); return; }
    setDash(d.data); setLearning(l.data || []); setError('');
  }, []);

  useEffect(() => {
    if (!session) { setDash(undefined); return; }
    reload();
    supabase.rpc('touch_my_login').then(() => {}); // supabase-js only sends once then'd
  }, [session, reload]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  useEffect(() => {
    const item = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));
    document.title = `${item?.label || 'My UYIH'} · My UYIH`;
  }, [pathname]);

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

  const editProfile = () => { setEditing(true); window.scrollTo({ top: 0 }); };

  // First visit: ask for the get-to-know-you profile (they can skip)
  if (editing || !dash.profile) {
    return (
      <Shell>
        <GetToKnowYou
          person={dash.person} profile={dash.profile} firstTime={!dash.profile}
          onDone={async () => { setEditing(false); await reload(); window.scrollTo({ top: 0 }); }}
          onSkip={dash.profile ? () => setEditing(false) : async () => {
            await supabase.from('member_profiles').insert({ person_id: dash.person.id });
            await reload();
          }}
        />
      </Shell>
    );
  }

  const { person, achievements: ach } = dash;
  const stage = STAGES.find((s) => s.value === person.stage)?.label;
  const medal = currentMedal(ach);

  return (
    <MemberCtx.Provider value={{ dash, learning: learning || [], reload, editProfile }}>
      <Shell>
        {/* Header */}
        <header className="pt-20 md:pt-24 bg-white border-b border-sand-dark/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 md:py-6 flex items-center gap-4">
            <span className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-forest text-cream font-display font-bold text-xl flex items-center justify-center flex-shrink-0" aria-hidden="true">
              {initials(person.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-2xl md:text-3xl text-forest truncate">Habari, {person.full_name.split(/\s+/)[0]}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1 font-sans text-xs">
                <span className="rounded-full bg-terracotta text-white font-semibold px-2.5 py-0.5">{stage}</span>
                {medal && <span className="rounded-full bg-sand-light border border-sand-dark/60 text-forest font-semibold px-2.5 py-0.5">{medal.icon} {medal.name}</span>}
                <span className="text-ink-muted"><strong className="text-forest">{ach.points}</strong> points</span>
              </div>
            </div>
            <button className="hidden sm:inline font-sans text-sm text-ink-muted underline" onClick={() => supabase.auth.signOut()}>Log out</button>
          </div>
          {/* Phone: scrolling tabs */}
          <nav className="lg:hidden max-w-6xl mx-auto px-2 sm:px-4 flex gap-1 overflow-x-auto" aria-label="Member sections">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}
                className={({ isActive }) => `flex-shrink-0 px-3 py-3 font-sans text-sm font-medium border-b-2 transition-colors ${
                  isActive ? 'border-terracotta text-forest' : 'border-transparent text-ink-muted hover:text-forest'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
          {/* Wide screens: sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1" aria-label="Member sections">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end}
                  className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm transition-colors ${
                    isActive ? 'bg-forest/[0.07] text-forest font-semibold shadow-[inset_3px_0_0_#C4622D]' : 'text-ink-muted hover:bg-sand-light hover:text-forest'}`}>
                  <span aria-hidden="true">{n.icon}</span>{n.label}
                </NavLink>
              ))}
              <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm text-ink-muted hover:bg-sand-light w-full" onClick={() => supabase.auth.signOut()}>
                <span aria-hidden="true">↩</span>Log out
              </button>
            </nav>
          </aside>
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
        <div className="sm:hidden text-center pb-8">
          <button className="font-sans text-sm text-ink-muted underline" onClick={() => supabase.auth.signOut()}>Log out</button>
        </div>
      </Shell>
    </MemberCtx.Provider>
  );
}

// Shared look for member-area blocks
export function Block({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-sand-dark/50 bg-white p-5 md:p-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="font-display font-bold text-xl md:text-2xl text-forest">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageTitle({ title, children }) {
  return (
    <div className="mb-6">
      <h1 className="font-display font-bold text-display-sm md:text-display-md text-forest">{title}</h1>
      {children && <p className="font-sans text-ink-muted mt-1 max-w-2xl">{children}</p>}
    </div>
  );
}
