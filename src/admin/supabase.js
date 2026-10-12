import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/config';

// Only the admin area imports this file, so public visitors never load it.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Implicit flow lets the magic link work even if it's opened on a
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
