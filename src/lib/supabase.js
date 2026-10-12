import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Shared by the admin dashboard and the member area. Only those routes import
// this file, so public visitors never download the Supabase library.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Implicit flow lets an email link work even if it's opened on a
    // different device or browser from the one that requested it.
    flowType: 'implicit',
  },
});

// Throw on Supabase errors so callers can use try/catch
export async function q(promise) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
}

// Call the member-login-link Edge Function
export async function loginLink(body) {
  const { data, error } = await supabase.functions.invoke('member-login-link', { body });
  if (error) {
    let msg = 'Something went wrong. Please try again.';
    try { const b = await error.context?.json(); if (b?.message) msg = b.message; } catch { /* ignore */ }
    throw new Error(msg);
  }
  if (data && data.ok === false) throw new Error(data.message);
  return data;
}
