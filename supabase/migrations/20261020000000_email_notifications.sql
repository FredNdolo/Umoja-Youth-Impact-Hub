-- ════════════════════════════════════════════════════════════════════
-- Email notifications and reminders
--
-- Every admin action that affects someone emails them, and everything that
-- comes in from the public site emails the UYIH admins. The database decides
-- WHAT to send (triggers below queue messages in email_outbox); the
-- send-emails Edge Function does the sending, within seconds of the change
-- and again every few minutes for retries.
--
--   member hears about                       admins hear about
--   ─────────────────────────────────────    ─────────────────────────────────
--   welcome after joining                    new sign-up on the website
--   a task assigned to them                  a contact-form message (reply-to set)
--   task approved / changes requested        a document request
--   certificate issued / revoked / restored  an M-Pesa code sent in (donation, fee)
--   ID / police clearance verified/rejected  a task submitted for review
--   membership fee confirmed / rejected      a member document uploaded
--   stage change (volunteer, member, lead)   a safeguarding declaration (also DSL)
--   added to an event, given a role there    a request to delete someone's data
--   added to a project                       daily digest of things waiting
--   Tree Monitor team added / role / removed
--   safeguarding declaration countersigned
--   donors: receipt when a donation is confirmed
--   contact / document-request senders: "we got it", and a polite note if declined
--
--   Reminders (daily, 07:00 Nairobi): tasks due in 2 days, overdue tasks,
--   open tasks untouched for a week (at most 3 nudges), events tomorrow,
--   Monday Tree Monitor round-up for the field team, and the admin digest.
--   Members can turn reminders off; notices about their own records always go.
--
-- Emails are never sent to people without an email or to the internal
-- placeholder addresses. A failure to queue an email never blocks the action
-- that caused it.
-- ════════════════════════════════════════════════════════════════════

-- ── Preferences and recipients ───────────────────────────────────────
alter table public.people add column if not exists email_reminders boolean not null default true;
alter table public.signatories add column if not exists email text
  check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- ── Outbox ───────────────────────────────────────────────────────────
create table if not exists public.email_outbox (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  kind        text not null,                    -- e.g. task_assigned, admin_contact
  to_email    text not null,
  to_name     text,
  reply_to    text,
  subject     text not null,
  html        text not null,
  body_text   text not null,
  person_id   uuid references public.people (id) on delete set null,
  dedupe_key  text unique,                      -- stops the same reminder twice
  status      text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  attempts    smallint not null default 0,
  last_error  text,
  sent_at     timestamptz,
  next_try_at timestamptz not null default now()  -- retries back off: 5 min, 15 min, 1 h, 4 h
);
alter table public.email_outbox add column if not exists next_try_at timestamptz not null default now();
alter table public.email_outbox drop constraint if exists email_outbox_status_check;
alter table public.email_outbox add constraint email_outbox_status_check check (status in ('pending', 'sending', 'sent', 'failed', 'cancelled'));
create index if not exists email_outbox_pending_idx on public.email_outbox (created_at) where status = 'pending';
create index if not exists email_outbox_person_idx on public.email_outbox (person_id);
alter table public.email_outbox enable row level security;
drop policy if exists admin_read on public.email_outbox;
create policy admin_read on public.email_outbox for select to authenticated using (public.is_admin());
drop policy if exists admin_update on public.email_outbox;
create policy admin_update on public.email_outbox for update to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.email_outbox from anon;

-- ── Building blocks ──────────────────────────────────────────────────
create or replace function public.uyih_site_url()
returns text language sql immutable set search_path = public
as $$ select 'https://umoja-youth-impact-hub.vercel.app' $$;

create or replace function public.html_escape(t text)
returns text language sql immutable set search_path = public
as $$ select replace(replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;') $$;

-- A real inbox? (not empty, not the internal placeholder logins)
create or replace function public.email_ok(e text)
returns boolean language sql immutable set search_path = public
as $$ select e is not null and e ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and e !~* '\.invalid$' $$;

-- Branded email. body_html may contain simple tags; anything that came from
-- a person must already be passed through html_escape().
create or replace function public.email_layout(p_heading text, p_body_html text, p_cta_label text default null,
                                               p_cta_url text default null, p_footer text default null)
returns text
language sql
immutable
set search_path = public
as $$
  select '<!doctype html><html><body style="margin:0;padding:0;background:#F7F2E8;">'
      || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F2E8;padding:24px 12px;"><tr><td align="center">'
      || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#2B2B2B;">'
      || '<tr><td style="background:#1A3C2A;padding:18px 28px;color:#F7F2E8;font-size:16px;font-weight:bold;letter-spacing:.3px;">Umoja Youth Impact Hub<div style="font-size:11px;font-weight:normal;color:#E8A27A;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Narok, Kenya</div></td></tr>'
      || '<tr><td style="height:4px;background:#C4622D;"></td></tr>'
      || '<tr><td style="padding:28px;">'
      || '<h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:22px;line-height:1.3;color:#1A3C2A;">' || public.html_escape(p_heading) || '</h1>'
      || '<div style="font-size:15px;line-height:1.6;color:#2B2B2B;">' || p_body_html || '</div>'
      || case when p_cta_url is not null then
           '<p style="margin:24px 0 4px;"><a href="' || public.html_escape(p_cta_url) || '" style="display:inline-block;background:#C4622D;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:6px;">'
           || public.html_escape(coalesce(p_cta_label, 'Open')) || '</a></p>' else '' end
      || '</td></tr>'
      || '<tr><td style="padding:16px 28px 22px;border-top:1px solid #EDE5D6;font-size:12px;line-height:1.5;color:#6B6B6B;">'
      || coalesce(p_footer || '<br>', '')
      || 'Umoja Youth Impact Hub · Narok East, Kenya · <a href="' || public.uyih_site_url() || '" style="color:#C4622D;">umoja-youth-impact-hub.vercel.app</a>'
      || '</td></tr></table></td></tr></table></body></html>'
$$;

-- Plain-text version for mail apps that don't show HTML
create or replace function public.email_text(p_heading text, p_body_html text, p_cta_label text, p_cta_url text)
returns text language sql immutable set search_path = public
as $$
  select p_heading || E'\n\n'
      || btrim(replace(replace(replace(replace(replace(
           regexp_replace(regexp_replace(regexp_replace(replace(replace(replace(p_body_html, '</p>', E'\n\n'), '<br>', E'\n'), '</li>', E'\n'),
                                             '<li[^>]*>', '- ', 'g'), '<[^>]+>', '', 'g'), E'\n{3,}', E'\n\n', 'g'),
           '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#39;', ''''), '&amp;', '&'), E' \n\r\t')
      || case when p_cta_url is not null then E'\n\n' || coalesce(p_cta_label, 'Open') || ': ' || p_cta_url else '' end
      || E'\n\n—\nUmoja Youth Impact Hub · Narok East, Kenya'
$$;

-- Queue one email. Returns false when it was skipped (bad address, duplicate).
create or replace function public.queue_email(p_kind text, p_to text, p_to_name text, p_subject text, p_heading text,
                                              p_body_html text, p_cta_label text default null, p_cta_url text default null,
                                              p_person uuid default null, p_dedupe text default null,
                                              p_reply_to text default null, p_footer text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if not public.email_ok(p_to) then return false; end if;
  insert into public.email_outbox (kind, to_email, to_name, reply_to, subject, html, body_text, person_id, dedupe_key)
  values (p_kind, lower(trim(p_to)), p_to_name, case when public.email_ok(p_reply_to) then p_reply_to end, left(p_subject, 200),
          public.email_layout(p_heading, p_body_html, p_cta_label, p_cta_url, p_footer),
          public.email_text(p_heading, p_body_html, p_cta_label, p_cta_url),
          p_person, p_dedupe)
  on conflict (dedupe_key) do nothing;
  get diagnostics n = row_count;
  return n > 0;
exception when others then
  raise warning 'queue_email(%) failed: %', p_kind, sqlerrm;
  return false;
end;
$$;

-- To a person on our records. Reminders respect their opt-out.
create or replace function public.notify_person(p_person uuid, p_kind text, p_subject text, p_heading text, p_body_html text,
                                                p_cta_label text default null, p_cta_url text default null,
                                                p_dedupe text default null, p_reminder boolean default false)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.people;
  footer text;
begin
  select * into p from public.people where id = p_person;
  if not found or not public.email_ok(p.email) then return false; end if;
  if p_reminder and not p.email_reminders then return false; end if;
  footer := case when p_reminder
    then 'You get reminders because you’re a UYIH member. <a href="' || public.uyih_site_url() || '/me/profile" style="color:#C4622D;">Turn reminders off</a>.'
    else 'You’re getting this because you’re part of UYIH.' end;
  return public.queue_email(p_kind, p.email, p.full_name, p_subject, p_heading,
           '<p>Hi ' || public.html_escape(split_part(p.full_name, ' ', 1)) || ',</p>' || p_body_html,
           p_cta_label, p_cta_url, p.id, p_dedupe, null, footer);
end;
$$;

-- To every admin (and, for safeguarding, the Designated Safeguarding Lead)
create or replace function public.notify_admins(p_kind text, p_subject text, p_heading text, p_body_html text,
                                                p_cta_label text default 'Open the admin dashboard', p_cta_url text default null,
                                                p_reply_to text default null, p_dedupe text default null, p_include_dsl boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select distinct lower(email) as email from (
      select email from public.admins
      union all
      select email from public.signatories where p_include_dsl and role = 'dsl'
    ) x where public.email_ok(email)
  loop
    perform public.queue_email(p_kind, r.email, null, p_subject, p_heading, p_body_html, p_cta_label,
                               coalesce(p_cta_url, public.uyih_site_url() || '/admin'), null,
                               case when p_dedupe is null then null else p_dedupe || ':' || r.email end,
                               p_reply_to, 'Admin notification from the UYIH website.');
  end loop;
exception when others then
  raise warning 'notify_admins(%) failed: %', p_kind, sqlerrm;
end;
$$;

revoke execute on function public.queue_email(text, text, text, text, text, text, text, text, uuid, text, text, text),
  public.notify_person(uuid, text, text, text, text, text, text, text, boolean),
  public.notify_admins(text, text, text, text, text, text, text, text, boolean) from public, anon, authenticated;

-- Small helpers for wording
create or replace function public.fmt_date_ke(d timestamptz)
returns text language sql stable set search_path = public
as $$ select to_char(d at time zone 'Africa/Nairobi', 'FMDay FMDD FMMonth YYYY, HH24:MI') $$;
create or replace function public.para(t text)
returns text language sql immutable set search_path = public
as $$ select case when coalesce(trim(t), '') = '' then '' else '<p>' || replace(public.html_escape(trim(t)), E'\n', '<br>') || '</p>' end $$;

-- ════════════════════════════════════════════════════════════════════
-- Triggers: what each change sends
-- ════════════════════════════════════════════════════════════════════

-- People: welcome, new sign-up, stage change, deletion request
create or replace function public.tg_email_people()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  site text := public.uyih_site_url();
  stage_text text;
begin
  if tg_op = 'INSERT' then
    perform public.notify_person(new.id, 'welcome', 'Karibu to Umoja Youth Impact Hub',
      'Karibu to UYIH!',
      '<p>Thank you for joining Umoja Youth Impact Hub. You’re now a <strong>newcomer</strong>, the first step on the path to becoming a volunteer and a member.</p>'
      || '<p>Your member page has two short online courses (UYIH Orientation and Safeguarding Basics) and your first tasks. To log in at any time, go to the member page and ask for a login link to this email.</p>',
      'Go to my member page', site || '/me', 'welcome:' || new.id);
    if new.source = 'website' then
      perform public.notify_admins('admin_new_join', 'New sign-up: ' || new.full_name, 'New sign-up on the website',
        '<p><strong>' || public.html_escape(new.full_name) || '</strong> joined UYIH online.</p><ul>'
        || '<li>WhatsApp: ' || public.html_escape(new.phone) || '</li>'
        || '<li>Email: ' || public.html_escape(coalesce(new.email, '—')) || '</li>'
        || '<li>Age group: ' || public.html_escape(coalesce(new.age_band, '—')) || '</li>'
        || '<li>Area: ' || public.html_escape(coalesce(new.area, '—')) || '</li>'
        || '<li>Interested in: ' || public.html_escape(coalesce(nullif(array_to_string(new.interests, ', '), ''), '—')) || '</li></ul>'
        || '<p>Follow up within 48 hours and add them to the WhatsApp community.</p>',
        'Open People', site || '/admin');
    end if;
    return new;
  end if;

  if new.stage is distinct from old.stage then
    stage_text := case new.stage::text
      when 'volunteer' then 'You’re now a <strong>UYIH Volunteer</strong>. Your 90-day volunteer trial has started: come to activities, take on tasks and work through your membership checklist.'
      when 'member' then 'You’re now a full <strong>UYIH Member</strong>, with a vote in the organisation. Thank you for everything you’ve done to get here.'
      when 'lead' then 'You’re now a <strong>UYIH Lead</strong>. You can lead projects and mentor newcomers. Thank you for stepping up.'
      else 'Your UYIH stage has been updated to <strong>' || public.html_escape(new.stage::text) || '</strong>.' end;
    perform public.notify_person(new.id, 'stage_changed',
      case new.stage::text when 'volunteer' then 'You’re a UYIH Volunteer' when 'member' then 'Welcome, UYIH Member' when 'lead' then 'You’re a UYIH Lead' else 'Your UYIH stage has changed' end,
      case new.stage::text when 'newcomer' then 'Your UYIH stage has changed' else 'Congratulations!' end,
      '<p>' || stage_text || '</p>', 'See my progress', site || '/me', 'stage:' || new.id || ':' || new.stage::text || ':' || to_char(now(), 'YYYYMMDD'));
  end if;

  if new.deletion_requested_at is not null and old.deletion_requested_at is null then
    perform public.notify_admins('admin_deletion_request', 'Data deletion request: ' || new.full_name, 'Someone asked for their data to be deleted',
      '<p><strong>' || public.html_escape(new.full_name) || '</strong> asked UYIH to delete their personal data.</p>'
      || '<p>Under the Kenya Data Protection Act, act on this without undue delay: delete their record from People (or explain what must be kept and why).</p>',
      'Open People', site || '/admin');
  end if;
  return new;
exception when others then
  raise warning 'tg_email_people: %', sqlerrm;
  return new;
end;
$$;
drop trigger if exists people_email on public.people;
create trigger people_email after insert or update of stage, deletion_requested_at on public.people
  for each row execute function public.tg_email_people();

-- Tasks: assigned by an admin, submitted for review, approved, returned
create or replace function public.tg_email_task_assignments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.tasks;
  pname text;
  site text := public.uyih_site_url();
  due text;
begin
  select * into t from public.tasks where id = new.task_id;
  due := case when t.due_on is not null then '<p><strong>Due:</strong> ' || to_char(t.due_on, 'FMDay FMDD FMMonth YYYY') || '</p>' else '' end;

  if tg_op = 'INSERT' then
    -- Only tasks an admin gave them (not ones they picked, or the starter tasks every joiner gets)
    if new.source = 'assigned' and public.is_admin()
       and not exists (select 1 from public.people where id = new.person_id and created_at > now() - interval '5 minutes') then
      perform public.notify_person(new.person_id, 'task_assigned', 'New task for you: ' || t.title, 'You have a new task',
        '<p>UYIH has assigned you a task:</p>'
        || '<p style="padding:12px 16px;background:#F7F2E8;border-left:4px solid #C4622D;border-radius:4px;"><strong>' || public.html_escape(t.title) || '</strong>'
        || case when coalesce(t.description, '') <> '' then '<br>' || replace(public.html_escape(left(t.description, 600)), E'\n', '<br>') else '' end || '</p>'
        || due
        || case when t.points > 0 then '<p>Completing it earns you <strong>' || t.points || ' points</strong>.</p>' else '' end,
        'Open my tasks', site || '/me/tasks', 'assigned:' || new.id);
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    if new.status = 'submitted' then
      select full_name into pname from public.people where id = new.person_id;
      perform public.notify_admins('admin_task_submitted', 'Task to review: ' || t.title, 'A task is waiting for your review',
        '<p><strong>' || public.html_escape(pname) || '</strong> submitted <strong>' || public.html_escape(t.title) || '</strong>.</p>'
        || public.para(new.member_note)
        || case when new.submission_url is not null then '<p>Link: ' || public.html_escape(new.submission_url) || '</p>' else '' end
        || case when new.submission_file_name is not null then '<p>File: ' || public.html_escape(new.submission_file_name) || '</p>' else '' end,
        'Review in Tasks', site || '/admin/tasks', null, 'submitted:' || new.id || ':' || coalesce(new.submitted_at, now())::text);
    elsif new.status = 'done' and old.status = 'submitted' and public.is_admin() then
      perform public.notify_person(new.person_id, 'task_approved', 'Task approved: ' || t.title, 'Well done!',
        '<p>UYIH reviewed and approved your task <strong>' || public.html_escape(t.title) || '</strong>.'
        || case when t.points > 0 then ' You’ve earned <strong>' || t.points || ' points</strong>.' else '' end || '</p>'
        || public.para(new.admin_note),
        'See my achievements', site || '/me/achievements', 'approved:' || new.id);
    elsif new.status = 'done' and old.status <> 'submitted' and public.is_admin() then
      perform public.notify_person(new.person_id, 'task_done', 'Task marked complete: ' || t.title, 'Task complete',
        '<p>UYIH marked <strong>' || public.html_escape(t.title) || '</strong> as complete on your record.</p>',
        'See my progress', site || '/me', 'done:' || new.id);
    elsif new.status = 'returned' then
      perform public.notify_person(new.person_id, 'task_returned', 'Changes requested: ' || t.title, 'Almost there',
        '<p>UYIH looked at your task <strong>' || public.html_escape(t.title) || '</strong> and has asked for a few changes:</p>'
        || coalesce(nullif(public.para(new.admin_note), ''), '<p>Please check the task on your member page.</p>')
        || '<p>Update it and send it again when you’re ready.</p>',
        'Open my tasks', site || '/me/tasks', 'returned:' || new.id || ':' || to_char(now(), 'YYYYMMDDHH24MI'));
    end if;
  end if;
  return new;
exception when others then
  raise warning 'tg_email_task_assignments: %', sqlerrm;
  return new;
end;
$$;
drop trigger if exists task_assignments_email on public.task_assignments;
create trigger task_assignments_email after insert or update of status on public.task_assignments
  for each row execute function public.tg_email_task_assignments();

-- Certificates: issued, revoked, restored
create or replace function public.tg_email_certificates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  url text := public.uyih_site_url() || '/certificates/' || new.code;
begin
  if tg_op = 'INSERT' then
    perform public.notify_person(new.person_id, 'certificate_issued', 'Your certificate: ' || new.title, 'Congratulations on your certificate!',
      '<p>You completed <strong>' || public.html_escape(new.title) || '</strong>. Your certificate is ready to view, download as a PDF or share.</p>'
      || '<p>Certificate number: <strong>' || new.code || '</strong>. Anyone can check it’s genuine at the link below.</p>',
      'View my certificate', url, 'cert:' || new.id);
  elsif new.revoked_at is not null and old.revoked_at is null then
    perform public.notify_person(new.person_id, 'certificate_revoked', 'Your certificate has been revoked', 'Certificate revoked',
      '<p>UYIH has revoked your certificate for <strong>' || public.html_escape(new.title) || '</strong> (' || new.code || ').</p>'
      || coalesce(nullif('<p><strong>Reason:</strong> ' || public.html_escape(new.revoked_reason) || '</p>', '<p><strong>Reason:</strong> </p>'), '')
      || '<p>If you think this is a mistake, reply to UYIH on WhatsApp or by email.</p>',
      null, null, 'certrev:' || new.id || ':' || to_char(now(), 'YYYYMMDDHH24MI'));
  elsif new.revoked_at is null and old.revoked_at is not null then
    perform public.notify_person(new.person_id, 'certificate_restored', 'Your certificate has been restored', 'Certificate restored',
      '<p>Your certificate for <strong>' || public.html_escape(new.title) || '</strong> is valid again.</p>',
      'View my certificate', url, 'certres:' || new.id || ':' || to_char(now(), 'YYYYMMDDHH24MI'));
  end if;
  return new;
exception when others then
  raise warning 'tg_email_certificates: %', sqlerrm;
  return new;
end;
$$;
drop trigger if exists certificates_email on public.certificates;
create trigger certificates_email after insert or update of revoked_at on public.certificates
  for each row execute function public.tg_email_certificates();

-- Member documents (ID, police clearance): uploaded → admins; reviewed → member
create or replace function public.tg_email_member_documents()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  label text := case new.doc_type when 'national_id' then 'national ID' else 'police clearance certificate' end;
  pname text;
begin
  if new.status = 'pending' and (tg_op = 'INSERT' or old.status <> 'pending' or old.file_path is distinct from new.file_path) then
    select full_name into pname from public.people where id = new.person_id;
    perform public.notify_admins('admin_document_uploaded', 'Document to check: ' || pname, 'A member uploaded a document',
      '<p><strong>' || public.html_escape(pname) || '</strong> uploaded their <strong>' || label || '</strong> for checking.</p>'
      || '<p>Open their record under People to view and verify it.</p>',
      'Open People', public.uyih_site_url() || '/admin');
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status and new.status = 'verified' then
    perform public.notify_person(new.person_id, 'document_verified', 'Your ' || label || ' has been verified', 'Document verified',
      '<p>Thank you. UYIH has checked and verified your <strong>' || label || '</strong>.</p>',
      'See my documents', public.uyih_site_url() || '/me/documents', 'docok:' || new.id || ':' || to_char(now(), 'YYYYMMDDHH24MI'));
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status and new.status = 'rejected' then
    perform public.notify_person(new.person_id, 'document_rejected', 'Please upload your ' || label || ' again', 'Please upload your document again',
      '<p>UYIH couldn’t accept the <strong>' || label || '</strong> you uploaded.</p>'
      || coalesce(nullif(public.para(new.admin_note), ''), '')
      || '<p>Please upload a clear, complete copy from your member page.</p>',
      'Upload again', public.uyih_site_url() || '/me/documents', 'docno:' || new.id || ':' || to_char(now(), 'YYYYMMDDHH24MI'));
  end if;
  return new;
exception when others then
  raise warning 'tg_email_member_documents: %', sqlerrm;
  return new;
end;
$$;
drop trigger if exists member_documents_email on public.member_documents;
create trigger member_documents_email after insert or update of status, file_path on public.member_documents
  for each row execute function public.tg_email_member_documents();

-- Payments: code sent in → admins; confirmed / rejected → payer
create or replace function public.tg_email_payments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ksh text := 'KSh ' || to_char(new.amount, 'FM999,999,999');
  what text := case new.kind when 'membership_fee' then 'membership fee' else 'donation' end;
  site text := public.uyih_site_url();
  to_addr text;
  who text;
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    perform public.notify_admins('admin_payment', 'M-Pesa ' || what || ' to check: ' || ksh, 'An M-Pesa code was sent in',
      '<ul><li>Type: ' || what || '</li><li>Amount: <strong>' || ksh || '</strong></li><li>M-Pesa code: <strong>' || public.html_escape(new.mpesa_code) || '</strong></li>'
      || '<li>From: ' || public.html_escape(coalesce(new.name, 'Anonymous')) || coalesce(' · ' || public.html_escape(new.phone), '') || '</li></ul>'
      || public.para(new.message)
      || '<p>Check the code against the paybill statement, then confirm or reject it.</p>',
      'Open Payments', site || '/admin/payments');
    return new;
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status and new.status in ('confirmed', 'rejected') then
    if new.kind = 'membership_fee' and new.person_id is not null then
      if new.status = 'confirmed' then
        perform public.notify_person(new.person_id, 'fee_confirmed', 'Membership fee received', 'Asante! Your membership fee is confirmed',
          '<p>We’ve confirmed your membership fee of <strong>' || ksh || '</strong> (M-Pesa ' || public.html_escape(new.mpesa_code) || '). It’s ticked off on your membership checklist.</p>',
          'See my progress', site || '/me', 'fee:' || new.id || ':confirmed');
      else
        perform public.notify_person(new.person_id, 'fee_rejected', 'We couldn’t confirm your M-Pesa payment', 'We couldn’t confirm your payment',
          '<p>We couldn’t match the M-Pesa code <strong>' || public.html_escape(new.mpesa_code) || '</strong> (' || ksh || ') to our paybill statement.</p>'
          || coalesce(nullif(public.para(new.admin_note), ''), '')
          || '<p>Please check the code in your M-Pesa message and send it again, or contact UYIH.</p>',
          'Send the code again', site || '/me/pay', 'fee:' || new.id || ':rejected');
      end if;
    elsif new.kind = 'donation' and new.status = 'confirmed' then
      to_addr := new.email;
      who := coalesce(split_part(new.name, ' ', 1), 'friend');
      perform public.queue_email('donation_receipt', to_addr, new.name, 'Thank you for your donation to UYIH', 'Thank you for your donation',
        '<p>Hi ' || public.html_escape(who) || ',</p><p>We’ve received your donation of <strong>' || ksh || '</strong> (M-Pesa ' || public.html_escape(new.mpesa_code) || ', '
        || to_char(new.created_at at time zone 'Africa/Nairobi', 'FMDD FMMonth YYYY') || '). Thank you for supporting young people in Narok East.</p>'
        || '<p>Please keep this email as your receipt.</p>',
        'See what we do', site || '/programs', null, 'donation:' || new.id, null, 'Umoja Youth Impact Hub, a youth-led community group in Narok, Kenya.');
    end if;
  end if;
  return new;
exception when others then
  raise warning 'tg_email_payments: %', sqlerrm;
  return new;
end;
$$;
drop trigger if exists payments_email on public.payments;
create trigger payments_email after insert or update of status on public.payments
  for each row execute function public.tg_email_payments();

-- Contact form: admins (reply goes straight to the sender) + a receipt
create or replace function public.tg_email_contact()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.notify_admins('admin_contact', 'Contact form: ' || coalesce(new.subject, 'New message'), 'New message from the website',
    '<p><strong>' || public.html_escape(new.name) || '</strong> (' || public.html_escape(new.email) || coalesce(', ' || public.html_escape(new.phone), '') || ') wrote:</p>'
    || '<p style="padding:12px 16px;background:#F7F2E8;border-radius:4px;"><strong>' || public.html_escape(coalesce(new.subject, '')) || '</strong><br>'
    || replace(public.html_escape(new.message), E'\n', '<br>') || '</p>'
    || '<p>Reply to this email to answer them directly, then mark it answered under Messages.</p>',
    'Open Messages', public.uyih_site_url() || '/admin/messages', new.email);
  perform public.queue_email('contact_receipt', new.email, new.name, 'We got your message', 'Thank you for getting in touch',
    '<p>Hi ' || public.html_escape(split_part(new.name, ' ', 1)) || ',</p><p>Thank you for contacting Umoja Youth Impact Hub. We’ve received your message'
    || coalesce(' about “' || public.html_escape(new.subject) || '”', '') || ' and will get back to you soon, usually within two working days.</p>',
    null, null, null, 'contact:' || new.id);
  return new;
exception when others then
  raise warning 'tg_email_contact: %', sqlerrm;
  return new;
end;
$$;
drop trigger if exists contact_messages_email on public.contact_messages;
create trigger contact_messages_email after insert on public.contact_messages
  for each row execute function public.tg_email_contact();

-- Document requests: admins + a receipt; a polite note if declined
create or replace function public.tg_email_document_requests()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.notify_admins('admin_document_request', 'Document request: ' || new.document_title, 'Someone requested a document',
      '<ul><li>Document: <strong>' || public.html_escape(new.document_title) || '</strong></li>'
      || '<li>From: ' || public.html_escape(new.name) || ' (' || public.html_escape(new.email) || ')</li>'
      || '<li>Organisation: ' || public.html_escape(coalesce(new.organisation, '—')) || '</li></ul>'
      || '<p><strong>How they’ll use it:</strong></p>' || public.para(new.purpose)
      || '<p>Reply to this email with the document attached, then mark it sent under Messages.</p>',
      'Open Messages', public.uyih_site_url() || '/admin/messages', new.email);
    perform public.queue_email('document_request_receipt', new.email, new.name, 'Your request: ' || new.document_title, 'We received your request',
      '<p>Hi ' || public.html_escape(split_part(new.name, ' ', 1)) || ',</p><p>Thank you for your interest in <strong>' || public.html_escape(new.document_title)
      || '</strong>. We review every request and will email you the document, usually within three working days.</p>',
      null, null, null, 'docreq:' || new.id);
  elsif new.status is distinct from old.status and new.status = 'declined' then
    perform public.queue_email('document_request_declined', new.email, new.name, 'About your request: ' || new.document_title, 'About your document request',
      '<p>Hi ' || public.html_escape(split_part(new.name, ' ', 1)) || ',</p><p>Thank you for your interest in <strong>' || public.html_escape(new.document_title)
      || '</strong>. We’re sorry, but we aren’t able to share this document at the moment.</p>'
      || '<p>If you’d like to talk about working with UYIH, please get in touch through our website.</p>',
      'Contact UYIH', public.uyih_site_url() || '/contact', null, 'docreqno:' || new.id, null, null);
  end if;
  return new;
exception when others then
  raise warning 'tg_email_document_requests: %', sqlerrm;
  return new;
end;
$$;
drop trigger if exists document_requests_email on public.document_requests;
create trigger document_requests_email after insert or update of status on public.document_requests
  for each row execute function public.tg_email_document_requests();

-- Events: added to an event, given a role
create or replace function public.tg_email_attendance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  e public.events;
  details text;
begin
  if not public.is_admin() then return new; end if;
  select * into e from public.events where id = new.event_id;
  if e.starts_at < now() then return new; end if;   -- recording a past event: no email
  details := '<ul><li><strong>' || public.html_escape(e.title) || '</strong></li><li>When: ' || public.fmt_date_ke(e.starts_at) || '</li>'
          || coalesce('<li>Where: ' || public.html_escape(e.location) || '</li>', '') || '</ul>'
          || public.para(e.notes);
  if tg_op = 'INSERT' then
    perform public.notify_person(new.person_id, 'event_added', 'You’re on the list: ' || e.title, 'See you there!',
      '<p>UYIH has added you to an upcoming activity:</p>' || details
      || case when new.role is not null then '<p>Your role: <strong>' || public.html_escape(new.role) || '</strong></p>' else '' end
      || '<p>We’ll send you a reminder the day before.</p>',
      'Open my member page', public.uyih_site_url() || '/me', 'event:' || new.event_id || ':' || new.person_id);
  elsif new.role is distinct from old.role and new.role is not null then
    perform public.notify_person(new.person_id, 'event_role', 'Your role at ' || e.title || ': ' || new.role, 'You have a role',
      '<p>You’ll be <strong>' || public.html_escape(new.role) || '</strong> at:</p>' || details,
      'Open my member page', public.uyih_site_url() || '/me', 'eventrole:' || new.event_id || ':' || new.person_id || ':' || md5(new.role));
  end if;
  return new;
exception when others then
  raise warning 'tg_email_attendance: %', sqlerrm;
  return new;
end;
$$;
drop trigger if exists attendance_email on public.attendance;
create trigger attendance_email after insert or update of role on public.attendance
  for each row execute function public.tg_email_attendance();

-- Projects: added to a project team
create or replace function public.tg_email_assignments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pr public.projects;
begin
  if not public.is_admin() then return new; end if;
  select * into pr from public.projects where id = new.project_id;
  perform public.notify_person(new.person_id, 'project_added', 'You’ve joined ' || pr.name, 'Welcome to the team',
    '<p>UYIH has added you to the <strong>' || public.html_escape(pr.name) || '</strong> project'
    || case when new.role is not null then ' as <strong>' || public.html_escape(new.role) || '</strong>' else '' end || '.</p>'
    || public.para(pr.description),
    'Open my member page', public.uyih_site_url() || '/me', 'project:' || new.id);
  return new;
exception when others then
  raise warning 'tg_email_assignments: %', sqlerrm;
  return new;
end;
$$;
drop trigger if exists assignments_email on public.assignments;
create trigger assignments_email after insert on public.assignments
  for each row execute function public.tg_email_assignments();

-- Tree Monitor team
create or replace function public.tg_email_tm_team()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  url text := public.uyih_site_url() || '/me/trees';
begin
  if tg_op = 'INSERT' or (new.active and not old.active) then
    perform public.notify_person(new.person_id, 'tm_added', 'You’re on the Tree Monitor field team', 'Welcome to the field team',
      '<p>You can now use the <strong>UYIH Tree Monitor</strong> to register trees, check on them and record nursery work'
      || case when new.role = 'coordinator' then ', and as a <strong>coordinator</strong> you can also manage sites, plots, sales and the team' else '' end || '.</p>'
      || '<p>Open it from your member page. On your phone, use “Add to Home screen” so it works offline in the field.</p>',
      'Open the Tree Monitor', url, 'tm:' || new.person_id || ':' || to_char(now(), 'YYYYMMDDHH24MI'));
  elsif not new.active and old.active then
    perform public.notify_person(new.person_id, 'tm_removed', 'Your Tree Monitor access has ended', 'Tree Monitor access ended',
      '<p>Your access to the Tree Monitor has been switched off. Thank you for the work you did in the field. If you think this is a mistake, contact UYIH.</p>',
      null, null, 'tmoff:' || new.person_id || ':' || to_char(now(), 'YYYYMMDDHH24MI'));
  elsif new.role is distinct from old.role then
    perform public.notify_person(new.person_id, 'tm_role', 'Your Tree Monitor role: ' || new.role, 'Your Tree Monitor role changed',
      '<p>You’re now a Tree Monitor <strong>' || new.role || '</strong>.'
      || case when new.role = 'coordinator' then ' You can manage sites, plots, nursery sales and the field team.' else '' end || '</p>',
      'Open the Tree Monitor', url, 'tmrole:' || new.person_id || ':' || new.role || ':' || to_char(now(), 'YYYYMMDDHH24MI'));
  end if;
  return new;
exception when others then
  raise warning 'tg_email_tm_team: %', sqlerrm;
  return new;
end;
$$;
drop trigger if exists tm_team_email on public.tm_team;
create trigger tm_team_email after insert or update of active, role on public.tm_team
  for each row execute function public.tg_email_tm_team();

-- Safeguarding: declaration signed → admins + DSL; countersigned → member
create or replace function public.tg_email_safeguarding()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pname text;
begin
  select full_name into pname from public.people where id = new.person_id;
  if new.safeguarding_declared_at is not null and (tg_op = 'INSERT' or old.safeguarding_declared_at is null) then
    perform public.notify_admins('admin_safeguarding_declared', 'Safeguarding declaration to countersign: ' || pname,
      'A safeguarding declaration needs countersigning',
      '<p><strong>' || public.html_escape(pname) || '</strong> passed Safeguarding Basics and signed UYIH’s safeguarding declaration.</p>'
      || '<p>As Designated Safeguarding Lead, please review and countersign it on the admin Tasks page.</p>',
      'Open Tasks', public.uyih_site_url() || '/admin/tasks', null, 'sgdecl:' || new.person_id, true);
  end if;
  if tg_op = 'UPDATE' and new.safeguarding_countersigned_at is not null and old.safeguarding_countersigned_at is null then
    perform public.notify_person(new.person_id, 'safeguarding_countersigned', 'Your safeguarding declaration is countersigned',
      'Safeguarding declaration countersigned',
      '<p>UYIH’s Designated Safeguarding Lead has countersigned your safeguarding declaration. Thank you for helping keep children and young people safe.</p>',
      'See my progress', public.uyih_site_url() || '/me', 'sgcs:' || new.person_id);
  end if;
  return new;
exception when others then
  raise warning 'tg_email_safeguarding: %', sqlerrm;
  return new;
end;
$$;
drop trigger if exists member_profiles_email on public.member_profiles;
create trigger member_profiles_email after insert or update of safeguarding_declared_at, safeguarding_countersigned_at on public.member_profiles
  for each row execute function public.tg_email_safeguarding();

revoke execute on function public.tg_email_people(), public.tg_email_task_assignments(), public.tg_email_certificates(),
  public.tg_email_member_documents(), public.tg_email_payments(), public.tg_email_contact(), public.tg_email_document_requests(),
  public.tg_email_attendance(), public.tg_email_assignments(), public.tg_email_tm_team(), public.tg_email_safeguarding()
  from public, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- Daily reminders (run by pg_cron at 07:00 Nairobi, see below)
-- ════════════════════════════════════════════════════════════════════
create or replace function public.queue_daily_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n int := 0;
  today date := (now() at time zone 'Africa/Nairobi')::date;
  site text := public.uyih_site_url();
  digest text := '';
  c int;
begin
  -- Tasks due in two days
  for r in
    select ta.id, ta.person_id, t.title, t.due_on from public.task_assignments ta join public.tasks t on t.id = ta.task_id
     where ta.status in ('todo', 'returned') and t.due_on = today + 2
  loop
    if public.notify_person(r.person_id, 'reminder_due_soon', 'Reminder: “' || r.title || '” is due in 2 days', 'Your task is due soon',
         '<p>Just a reminder that <strong>' || public.html_escape(r.title) || '</strong> is due on <strong>' || to_char(r.due_on, 'FMDay FMDD FMMonth') || '</strong>.</p>',
         'Open my tasks', site || '/me/tasks', 'due:' || r.id || ':' || r.due_on, true) then n := n + 1; end if;
  end loop;

  -- Overdue (once)
  for r in
    select ta.id, ta.person_id, t.title, t.due_on from public.task_assignments ta join public.tasks t on t.id = ta.task_id
     where ta.status in ('todo', 'returned') and t.due_on < today and t.due_on >= today - 14
  loop
    if public.notify_person(r.person_id, 'reminder_overdue', 'Overdue: ' || r.title, 'A task is overdue',
         '<p><strong>' || public.html_escape(r.title) || '</strong> was due on ' || to_char(r.due_on, 'FMDay FMDD FMMonth') || '. If you’re stuck or can’t do it any more, just let UYIH know.</p>',
         'Open my tasks', site || '/me/tasks', 'overdue:' || r.id, true) then n := n + 1; end if;
  end loop;

  -- Open tasks with no due date, untouched for a week: weekly, at most 3 times
  for r in
    select ta.id, ta.person_id, t.title, ta.created_at from public.task_assignments ta join public.tasks t on t.id = ta.task_id
     where ta.status in ('todo', 'returned') and t.due_on is null and t.active
       and ta.created_at < now() - interval '7 days' and ta.created_at > now() - interval '30 days'
       and extract(dow from now() at time zone 'Africa/Nairobi') = extract(dow from ta.created_at at time zone 'Africa/Nairobi')
  loop
    if public.notify_person(r.person_id, 'reminder_open_task', 'Still on your list: ' || r.title, 'A gentle reminder',
         '<p><strong>' || public.html_escape(r.title) || '</strong> is still open on your UYIH task list. Have a look when you have a moment.</p>',
         'Open my tasks', site || '/me/tasks', 'stale:' || r.id || ':' || to_char(now(), 'IYYY-IW'), true) then n := n + 1; end if;
  end loop;

  -- Events tomorrow
  for r in
    select a.person_id, a.role, e.id as event_id, e.title, e.starts_at, e.location from public.attendance a join public.events e on e.id = a.event_id
     where (e.starts_at at time zone 'Africa/Nairobi')::date = today + 1
  loop
    if public.notify_person(r.person_id, 'reminder_event', 'Tomorrow: ' || r.title, 'See you tomorrow',
         '<p>A reminder that <strong>' || public.html_escape(r.title) || '</strong> is tomorrow, ' || public.fmt_date_ke(r.starts_at)
         || coalesce(', at ' || public.html_escape(r.location), '') || '.</p>'
         || case when r.role is not null then '<p>Your role: <strong>' || public.html_escape(r.role) || '</strong></p>' else '' end,
         'Open my member page', site || '/me', 'eventrem:' || r.event_id || ':' || r.person_id, true) then n := n + 1; end if;
  end loop;

  -- Mondays: Tree Monitor round-up for the field team
  if extract(isodow from now() at time zone 'Africa/Nairobi') = 1 then
    select count(*) into c from public.tm_trees t
     where t.status in ('planted', 'alive', 'stressed') and coalesce(t.last_checked_at, t.planted_on::timestamptz) < now() - interval '30 days';
    if c > 0 then
      for r in select person_id from public.tm_team where active loop
        if public.notify_person(r.person_id, 'reminder_trees', c || ' trees are due for a check-in', 'Trees due for a check-in',
             '<p><strong>' || c || '</strong> trees haven’t been checked in the last 30 days. Use <strong>Near me</strong> in the Tree Monitor on your next school visit to find them quickly.</p>',
             'Open the Tree Monitor', site || '/me/trees/list?filter=due', 'trees:' || r.person_id || ':' || to_char(now(), 'IYYY-IW'), true) then n := n + 1; end if;
      end loop;
    end if;
  end if;

  -- Admin digest of things waiting
  select count(*) into c from public.task_assignments where status = 'submitted';
  if c > 0 then digest := digest || '<li><strong>' || c || '</strong> task submission(s) to review</li>'; end if;
  select count(*) into c from public.member_documents where status = 'pending';
  if c > 0 then digest := digest || '<li><strong>' || c || '</strong> member document(s) to check</li>'; end if;
  select count(*) into c from public.payments where status = 'pending';
  if c > 0 then digest := digest || '<li><strong>' || c || '</strong> M-Pesa code(s) to confirm</li>'; end if;
  select count(*) into c from public.contact_messages where not handled;
  if c > 0 then digest := digest || '<li><strong>' || c || '</strong> contact message(s) not yet answered</li>'; end if;
  select count(*) into c from public.document_requests where status = 'pending';
  if c > 0 then digest := digest || '<li><strong>' || c || '</strong> document request(s) waiting</li>'; end if;
  select count(*) into c from public.member_profiles where safeguarding_declared_at is not null and safeguarding_countersigned_at is null;
  if c > 0 then digest := digest || '<li><strong>' || c || '</strong> safeguarding declaration(s) to countersign</li>'; end if;
  select count(*) into c from public.people where deletion_requested_at is not null;
  if c > 0 then digest := digest || '<li><strong>' || c || '</strong> data deletion request(s)</li>'; end if;
  select count(*) into c from public.people where next_follow_up_at < now() and stage = 'newcomer';
  if c > 0 then digest := digest || '<li><strong>' || c || '</strong> newcomer follow-up(s) overdue</li>'; end if;
  if digest <> '' then
    perform public.notify_admins('admin_digest', 'UYIH: things waiting for you today', 'Waiting for you today',
      '<ul>' || digest || '</ul>', 'Open the admin dashboard', site || '/admin', null, 'digest:' || today, false);
  end if;
  return n;
end;
$$;
revoke execute on function public.queue_daily_reminders() from public, anon, authenticated;

-- ════════════════════════════════════════════════════════════════════
-- Members: turn reminders on or off
-- ════════════════════════════════════════════════════════════════════
create or replace function public.set_my_email_reminders(p_on boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := public.my_person_id();
begin
  if v_id is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  update public.people set email_reminders = coalesce(p_on, true) where id = v_id;
  return coalesce(p_on, true);
end;
$$;
create or replace function public.get_my_email_settings()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('email', case when public.email_ok(email) then email end, 'reminders', email_reminders)
    from public.people where id = public.my_person_id();
$$;
revoke execute on function public.set_my_email_reminders(boolean), public.get_my_email_settings() from public, anon;
grant  execute on function public.set_my_email_reminders(boolean), public.get_my_email_settings() to authenticated;

-- Admin: resend a failed email
create or replace function public.retry_email(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.email_outbox set status = 'pending', attempts = 0, last_error = null, next_try_at = now() where id = p_id and status in ('failed', 'cancelled');
  perform public.kick_email_sender();
end;
$$;

-- ════════════════════════════════════════════════════════════════════
-- Delivery: wake the send-emails Edge Function
-- The function's URL and a shared secret live in Supabase Vault
-- (names: email_sender_url, email_cron_secret). Until they're set, emails
-- simply wait in the outbox.
-- ════════════════════════════════════════════════════════════════════

-- The Edge Function reads the shared secret from here (service role only),
-- so it never has to be copied into Edge Function secrets by hand.
create or replace function public.email_sender_secret()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v text;
begin
  begin
    execute $q$select decrypted_secret from vault.decrypted_secrets where name = 'email_cron_secret'$q$ into v;
  exception when others then v := null;
  end;
  return v;
end;
$$;
revoke all on function public.email_sender_secret() from public, anon, authenticated;
grant execute on function public.email_sender_secret() to service_role;

create or replace function public.kick_email_sender()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url text; v_secret text;
begin
  begin
    execute $q$select decrypted_secret from vault.decrypted_secrets where name = 'email_sender_url'$q$ into v_url;
    execute $q$select decrypted_secret from vault.decrypted_secrets where name = 'email_cron_secret'$q$ into v_secret;
  exception when others then return; end;
  if v_url is null or v_secret is null then return; end if;
  execute 'select net.http_post(url := $1, headers := $2, body := $3, timeout_milliseconds := 10000)'
    using v_url, jsonb_build_object('Content-Type', 'application/json', 'x-uyih-secret', v_secret), '{}'::jsonb;
exception when others then
  raise warning 'kick_email_sender: %', sqlerrm;
end;
$$;
revoke execute on function public.kick_email_sender(), public.retry_email(bigint) from public, anon;
grant  execute on function public.retry_email(bigint) to authenticated;

-- The sender takes a batch at a time; two runs can never take the same email.
-- Emails stuck in 'sending' for 10 minutes (a crashed run) go back in the queue.
create or replace function public.claim_emails(p_limit int default 25)
returns setof public.email_outbox
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.email_outbox set status = 'pending'
   where status = 'sending' and coalesce(sent_at, created_at) < now() - interval '10 minutes';
  return query
  update public.email_outbox o set status = 'sending', attempts = o.attempts + 1, sent_at = now()
   where o.id in (select id from public.email_outbox where status = 'pending' and attempts < 5 and next_try_at <= now()
                   order by created_at limit greatest(1, least(p_limit, 100)) for update skip locked)
  returning o.*;
end;
$$;
drop function if exists public.finish_email(bigint, boolean, text);
-- p_free: the failure wasn't this email's fault (the mail server was down or
-- the login was wrong), so it doesn't use up one of its 5 tries.
create or replace function public.finish_email(p_id bigint, p_ok boolean, p_error text default null, p_free boolean default false)
returns void
language sql
security definer
set search_path = public
as $$
  update public.email_outbox
     set attempts = case when not p_ok and p_free then greatest(attempts - 1, 0) else attempts end,
         status = case when p_ok then 'sent' when not p_free and attempts >= 5 then 'failed' else 'pending' end,
         sent_at = case when p_ok then now() else null end,
         next_try_at = case when p_ok then next_try_at
                            when p_free then now() + interval '5 minutes'
                            else now() + (array[5, 15, 60, 240, 240])[least(greatest(attempts, 1), 5)] * interval '1 minute' end,
         last_error = case when p_ok then null else left(p_error, 500) end
   where id = p_id;
$$;
revoke execute on function public.claim_emails(int), public.finish_email(bigint, boolean, text, boolean) from public, anon, authenticated;
grant  execute on function public.claim_emails(int), public.finish_email(bigint, boolean, text, boolean) to service_role;

-- Send right away after anything is queued (once per statement)
create or replace function public.tg_email_outbox_kick()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.kick_email_sender();
  return null;
end;
$$;
drop trigger if exists email_outbox_kick on public.email_outbox;
create trigger email_outbox_kick after insert on public.email_outbox
  for each statement execute function public.tg_email_outbox_kick();
revoke execute on function public.tg_email_outbox_kick() from public, anon, authenticated;

-- Schedules (only where pg_cron is available, i.e. on Supabase)
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net;
  end if;
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.unschedule(jobid) from cron.job where jobname in ('uyih-send-emails', 'uyih-daily-reminders');
    -- retry anything still waiting every 5 minutes
    perform cron.schedule('uyih-send-emails', '*/5 * * * *', 'select public.kick_email_sender()');
    -- 04:00 UTC = 07:00 Nairobi
    perform cron.schedule('uyih-daily-reminders', '0 4 * * *', 'select public.queue_daily_reminders()');
  end if;
end $$;
