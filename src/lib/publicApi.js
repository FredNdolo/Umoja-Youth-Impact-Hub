// Tiny client for the public forms. Uses plain fetch against Supabase's
// REST API so visitors don't download the full Supabase library.
import { SUPABASE_URL, SUPABASE_ANON_KEY, FALLBACK_PROJECTS } from './config';

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

const GENERIC_ERROR = 'Something went wrong. Please check your connection and try again.';

async function rpc(name, args) {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(args),
    });
  } catch {
    throw new Error(GENERIC_ERROR);
  }
  if (!res.ok) {
    let body = {};
    try { body = await res.json(); } catch { /* ignore */ }
    // Messages raised on purpose by our database functions (code P0001) are
    // written for visitors; anything else gets a generic message.
    throw new Error(body.code === 'P0001' && body.message ? body.message : GENERIC_ERROR);
  }
}

export function submitJoin(form) {
  return rpc('submit_join', {
    p_full_name: form.fullName,
    p_phone: form.phone,
    p_age_band: form.ageBand,
    p_is_adult: form.isAdult,
    p_consent_version: form.consentVersion,
    p_email: form.email || null,
    p_area: form.area || null,
    p_interests: form.interests,
    p_heard_from: form.heardFrom || null,
    p_website: form.website || null,
  });
}

export function submitContact(form) {
  return rpc('submit_contact', {
    p_name: form.name,
    p_email: form.email,
    p_subject: form.subject,
    p_message: form.message,
    p_phone: form.phone || null,
    p_website: form.website || null,
  });
}

export function submitDocumentRequest(form) {
  return rpc('submit_document_request', {
    p_document_slug: form.slug,
    p_document_title: form.title,
    p_name: form.name,
    p_email: form.email,
    p_purpose: form.purpose,
    p_organisation: form.organisation || null,
    p_website: form.website || null,
  });
}

export function subscribeNewsletter(email, website) {
  return rpc('subscribe_newsletter', { p_email: email, p_website: website || null });
}

export async function fetchProjects() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/projects?select=slug,name,description&order=sort_order`,
      { headers }
    );
    if (!res.ok) throw new Error();
    const rows = await res.json();
    return rows.length ? rows : FALLBACK_PROJECTS;
  } catch {
    return FALLBACK_PROJECTS;
  }
}

export function submitDonation(form) {
  return rpc('submit_donation', {
    p_amount: Number(form.amount),
    p_mpesa_code: form.code,
    p_name: form.name || null,
    p_phone: form.phone || null,
    p_email: form.email || null,
    p_message: form.message || null,
    p_website: form.website || null,
  });
}
