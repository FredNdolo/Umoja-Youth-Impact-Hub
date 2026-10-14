// UYIH member login links
//
// POST { mode: "email", email }
//   Public. If the email belongs to someone in public.people, make sure they
//   have a login, then email them a sign-in link. Always answers the same way,
//   so it can't be used to find out who is registered.
//
// POST { mode: "whatsapp", person_id }
//   Admin only (caller's login must be in public.admins). Makes sure the person
//   has a login and returns a one-time link to /me/activate for the admin to
//   send on WhatsApp. The link goes to our own page with a "Log me in" button,
//   so WhatsApp's link preview can't use it up.
//
// POST { mode: "join", person_id, token }
//   Public. Right after someone joins on the website, the join form gets a
//   one-time token (valid 30 minutes, usable once). This turns it into a login
//   so the new joiner lands on their member page without logging in again.
//   Returns { ok, token_hash } for the page to sign in with.
//
// Uses the service role key, which Supabase provides to Edge Functions
// automatically. It never leaves this function.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const SITE_URL = "https://umoja-youth-impact-hub.vercel.app";
const ALLOWED_ORIGINS = [SITE_URL, "http://localhost:5173", "http://localhost:4173"];

// People without an email get a placeholder address that can never receive
// mail (.invalid is reserved). It is only an internal login identifier.
const placeholderEmail = (personId: string) => `member-${personId}@members.uyih.invalid`;

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : SITE_URL,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type Person = { id: string; full_name: string; email: string | null; user_id: string | null };

// Make sure this person has a login linked to their record; returns the login email.
async function ensureLogin(person: Person): Promise<string> {
  const wanted = person.email ?? placeholderEmail(person.id);

  if (person.user_id) {
    const { data, error } = await admin.auth.admin.getUserById(person.user_id);
    if (!error && data.user) {
      // Keep the login email in step with the email on their record
      if (data.user.email !== wanted) {
        const upd = await admin.auth.admin.updateUserById(person.user_id, { email: wanted, email_confirm: true });
        if (upd.error) throw new Error(`Could not update login email: ${upd.error.message}`);
      }
      return wanted;
    }
  }

  const created = await admin.auth.admin.createUser({
    email: wanted,
    email_confirm: true,
    user_metadata: { person_id: person.id },
  });
  let userId = created.data.user?.id;
  if (created.error) {
    // The login may already exist (e.g. linking was interrupted); find it
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = list?.users.find((u) => u.email?.toLowerCase() === wanted.toLowerCase())?.id;
    if (!userId) throw new Error(`Could not create login: ${created.error.message}`);
  }
  const link = await admin.from("people").update({ user_id: userId }).eq("id", person.id);
  if (link.error) throw new Error(`Could not link login: ${link.error.message}`);
  return wanted;
}

async function handleEmail(body: Record<string, unknown>, origin: string | null) {
  const generic = { ok: true, message: "If this email is registered with UYIH, a sign-in link is on its way." };
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.endsWith(".invalid")) {
    return json({ ok: false, message: "Please enter a valid email address." }, 400, origin);
  }

  const { data: person } = await admin
    .from("people").select("id, full_name, email, user_id").eq("email", email).maybeSingle();
  if (!person) return json(generic, 200, origin);

  await ensureLogin(person as Person);

  const site = origin && ALLOWED_ORIGINS.includes(origin) ? origin : SITE_URL;
  const anon = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
  const { error } = await anon.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${site}/me` },
  });
  if (error) {
    // Most often: asked for another link too soon
    const tooSoon = /seconds|rate|too many/i.test(error.message);
    return json({
      ok: false,
      message: tooSoon
        ? "A link was sent very recently. Please check your email or wait a minute and try again."
        : "We couldn't send the email right now. Please try again later or ask UYIH on WhatsApp for a login link.",
    }, tooSoon ? 429 : 502, origin);
  }
  return json(generic, 200, origin);
}

async function handleWhatsApp(body: Record<string, unknown>, req: Request, origin: string | null) {
  // Check the caller is an admin, using their own login
  const authHeader = req.headers.get("Authorization") ?? "";
  const caller = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: isAdmin, error: adminErr } = await caller.rpc("is_admin");
  if (adminErr || isAdmin !== true) return json({ ok: false, message: "Only the UYIH admin can do this." }, 403, origin);

  const personId = String(body.person_id ?? "");
  const { data: person } = await admin
    .from("people").select("id, full_name, email, user_id").eq("id", personId).maybeSingle();
  if (!person) return json({ ok: false, message: "Person not found." }, 404, origin);

  const loginEmail = await ensureLogin(person as Person);
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: loginEmail });
  if (error || !data.properties?.hashed_token) {
    return json({ ok: false, message: `Could not create the link: ${error?.message ?? "unknown error"}` }, 502, origin);
  }
  const site = origin && ALLOWED_ORIGINS.includes(origin) ? origin : SITE_URL;
  return json({ ok: true, url: `${site}/me/activate#t=${data.properties.hashed_token}` }, 200, origin);
}

async function handleJoin(body: Record<string, unknown>, origin: string | null) {
  const personId = String(body.person_id ?? "");
  const token = String(body.token ?? "");
  if (!/^[0-9a-f-]{36}$/.test(personId) || token.length < 32) {
    return json({ ok: false, message: "This sign-in has expired. Please log in instead." }, 400, origin);
  }
  const { data: valid, error: tokErr } = await admin.rpc("consume_join_token", { p_person: personId, p_token: token });
  if (tokErr || valid !== true) {
    return json({ ok: false, message: "This sign-in has expired. Please log in instead." }, 403, origin);
  }
  const { data: person } = await admin
    .from("people").select("id, full_name, email, user_id").eq("id", personId).maybeSingle();
  if (!person) return json({ ok: false, message: "Person not found." }, 404, origin);

  const loginEmail = await ensureLogin(person as Person);
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: loginEmail });
  if (error || !data.properties?.hashed_token) {
    return json({ ok: false, message: "We couldn't sign you in automatically. Please log in instead." }, 502, origin);
  }
  return json({ ok: true, token_hash: data.properties.hashed_token }, 200, origin);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ ok: false, message: "Method not allowed" }, 405, origin);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty body */ }

  try {
    if (body.mode === "email") return await handleEmail(body, origin);
    if (body.mode === "whatsapp") return await handleWhatsApp(body, req, origin);
    if (body.mode === "join") return await handleJoin(body, origin);
    return json({ ok: false, message: "Unknown request." }, 400, origin);
  } catch (e) {
    console.error(e);
    return json({ ok: false, message: "Something went wrong. Please try again." }, 500, origin);
  }
});
