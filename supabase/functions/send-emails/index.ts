// UYIH email sender
//
// Sends the emails the database queues in public.email_outbox (task
// assigned, contact messages, reminders and so on). It's woken up by the
// database straight after something is queued, and every 5 minutes by
// pg_cron to retry anything that failed. Each email is tried up to 5 times.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   EMAIL_CRON_SECRET  optional; by default read from Vault (email_cron_secret)
//   SMTP_USER          the Gmail address that sends (umojayouthhub@gmail.com)
//   SMTP_PASS          a Gmail App Password for that account (not the normal password)
//   EMAIL_FROM_NAME    optional, default "Umoja Youth Impact Hub"
//   SMTP_HOST / SMTP_PORT  optional, default smtp.gmail.com / 465
// or, once UYIH has its own domain:
//   RESEND_API_KEY + EMAIL_FROM ("UYIH <hello@your-domain.org>")
//
// Deployed with verify_jwt = false: it checks EMAIL_CRON_SECRET instead.

import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SECRET = Deno.env.get("EMAIL_CRON_SECRET") ?? "";
const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "465");
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "umojayouthhub@gmail.com";
const SMTP_PASS = Deno.env.get("SMTP_PASS") ?? "";
const FROM_NAME = Deno.env.get("EMAIL_FROM_NAME") ?? "Umoja Youth Impact Hub";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "";

type Email = {
  id: number; to_email: string; to_name: string | null; reply_to: string | null;
  subject: string; html: string; body_text: string;
};

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const smtp = SMTP_PASS
  ? nodemailer.createTransport({
      host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      pool: true, maxConnections: 1, maxMessages: 50,
    })
  : null;

async function send(e: Email) {
  const to = e.to_name ? `"${e.to_name.replace(/"/g, "")}" <${e.to_email}>` : e.to_email;
  if (RESEND_API_KEY && EMAIL_FROM) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM, to: [to], subject: e.subject, html: e.html, text: e.body_text,
        ...(e.reply_to ? { reply_to: e.reply_to } : {}),
      }),
    });
    if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return;
  }
  if (!smtp) throw new Error("Email sending is not set up yet (add SMTP_PASS in Edge Function secrets).");
  await smtp.sendMail({
    from: `"${FROM_NAME}" <${SMTP_USER}>`,
    to, subject: e.subject, html: e.html, text: e.body_text,
    ...(e.reply_to ? { replyTo: e.reply_to } : {}),
  });
}

// Problems with the mail server itself (vs. one bad address)
function isServerProblem(err: unknown) {
  const e = err as { code?: string; responseCode?: number; message?: string };
  return ["EAUTH", "ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ECONNREFUSED"].includes(e?.code ?? "")
    || e?.responseCode === 535 || e?.responseCode === 421 || /Resend 5\d\d|Resend 401|Resend 403/.test(e?.message ?? "");
}

// Shared secret: EMAIL_CRON_SECRET if set, otherwise read from Vault
let vaultSecret = "";
async function sharedSecret() {
  if (SECRET) return SECRET;
  if (!vaultSecret) {
    const { data } = await db.rpc("email_sender_secret");
    vaultSecret = typeof data === "string" ? data : "";
  }
  return vaultSecret;
}

Deno.serve(async (req) => {
  const secret = await sharedSecret();
  if (!secret || req.headers.get("x-uyih-secret") !== secret) {
    return new Response(JSON.stringify({ ok: false, message: "Not allowed" }), { status: 401 });
  }
  const configured = Boolean(smtp || (RESEND_API_KEY && EMAIL_FROM));
  if (!configured) {
    // Leave everything queued (no attempts used up) until a sender is set up
    return new Response(JSON.stringify({ ok: true, configured: false, message: "Add SMTP_PASS (or RESEND_API_KEY) to start sending." }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  let sent = 0; let failed = 0;
  // Up to 4 batches per wake-up, so a burst (e.g. the daily reminders) clears quickly
  for (let round = 0; round < 4; round += 1) {
    const { data, error } = await db.rpc("claim_emails", { p_limit: 25 });
    if (error) return new Response(JSON.stringify({ ok: false, message: error.message }), { status: 500 });
    const batch = (data ?? []) as Email[];
    if (!batch.length) break;
    let serverDown = "";
    for (const e of batch) {
      if (serverDown) {   // hand the rest back untouched
        await db.rpc("finish_email", { p_id: e.id, p_ok: false, p_error: serverDown, p_free: true });
        continue;
      }
      try {
        await send(e);
        await db.rpc("finish_email", { p_id: e.id, p_ok: true });
        sent += 1;
      } catch (err) {
        const msg = String((err as Error)?.message ?? err);
        // Login or connection problems aren't the email's fault: stop and try later
        if (isServerProblem(err)) serverDown = msg;
        await db.rpc("finish_email", { p_id: e.id, p_ok: false, p_error: msg, p_free: Boolean(serverDown) });
        failed += 1;
      }
    }
    if (serverDown) {
      return new Response(JSON.stringify({ ok: false, configured: true, sent, failed, message: serverDown }), {
        status: 502, headers: { "Content-Type": "application/json" },
      });
    }
  }
  return new Response(JSON.stringify({ ok: true, configured, sent, failed }), {
    headers: { "Content-Type": "application/json" },
  });
});
