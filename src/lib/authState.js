// File: src/lib/authState.js
// Is someone signed in? Read straight from the session Supabase keeps in
// localStorage, so the public site can show "My UYIH" instead of "Log in"
// without downloading the Supabase library for every visitor.
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SUPABASE_URL } from './config';

const KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
const ADMIN_KEY = 'uyih-admin-email';
export const AUTH_EVENT = 'uyih-auth-change';

export function readSession() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    const sess = s?.currentSession || s;
    if (!sess?.access_token) return null;
    // An expired access token is fine while there's a refresh token to renew it
    if (!sess.refresh_token && sess.expires_at && sess.expires_at * 1000 < Date.now()) return null;
    const email = sess.user?.email || '';
    let admin = false;
    try { admin = !!email && window.sessionStorage.getItem(ADMIN_KEY) === email; } catch { /* ignore */ }
    return { email, admin };
  } catch {
    return null;
  }
}

// The admin dashboard remembers (for this browser tab) that this login is an admin
export function rememberAdmin(email, isAdmin) {
  try {
    if (isAdmin && email) window.sessionStorage.setItem(ADMIN_KEY, email);
    else window.sessionStorage.removeItem(ADMIN_KEY);
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function useSignedIn() {
  const { pathname } = useLocation();
  const [session, setSession] = useState(() => (typeof window === 'undefined' ? null : readSession()));
  useEffect(() => { setSession(readSession()); }, [pathname]);
  useEffect(() => {
    const update = () => setSession(readSession());
    window.addEventListener('storage', update);     // other tabs
    window.addEventListener(AUTH_EVENT, update);    // this tab (see lib/supabase.js)
    window.addEventListener('focus', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener(AUTH_EVENT, update);
      window.removeEventListener('focus', update);
    };
  }, []);
  return session;
}

export async function signOut() {
  const { supabase } = await import('./supabase');
  await supabase.auth.signOut();
  rememberAdmin('', false);
}
