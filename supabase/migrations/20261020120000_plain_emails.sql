-- ════════════════════════════════════════════════════════════════════
-- Emails that land in the inbox, not spam
--
-- Gmail sends newsletter-style emails (coloured banner, big button,
-- full-width layout tables) to Spam or Promotions. Notices like "a task
-- has been assigned to you" should read like a short personal letter:
-- plain paragraphs, one link written out in full, and a sign-off.
-- Only the look changes; every trigger keeps working as before.
-- ════════════════════════════════════════════════════════════════════

-- The heading is kept as a parameter so nothing else has to change, but
-- the subject line already says it, so the letter goes straight to "Hi …".
create or replace function public.email_layout(p_heading text, p_body_html text, p_cta_label text default null,
                                               p_cta_url text default null, p_footer text default null)
returns text
language sql
immutable
set search_path = public
as $$
  select '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>'
      || '<body style="margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#222222;">'
      || '<div style="max-width:560px;">'
      || p_body_html
      || case when p_cta_url is not null then
           '<p>' || public.html_escape(coalesce(p_cta_label, 'Open')) || ': <a href="' || public.html_escape(p_cta_url) || '">'
           || public.html_escape(p_cta_url) || '</a></p>' else '' end
      || '<p>Best wishes,<br>Umoja Youth Impact Hub<br>Narok, Kenya</p>'
      || coalesce('<p style="font-size:12px;color:#777777;margin-top:24px;">' || p_footer || '</p>', '')
      || '</div></body></html>'
$$;

create or replace function public.email_text(p_heading text, p_body_html text, p_cta_label text, p_cta_url text)
returns text language sql immutable set search_path = public
as $$
  select btrim(replace(replace(replace(replace(replace(
           regexp_replace(regexp_replace(regexp_replace(replace(replace(replace(p_body_html, '</p>', E'\n\n'), '<br>', E'\n'), '</li>', E'\n'),
                                             '<li[^>]*>', '- ', 'g'), '<[^>]+>', '', 'g'), E'\n{3,}', E'\n\n', 'g'),
           '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&#39;', ''''), '&amp;', '&'), E' \n\r\t')
      || case when p_cta_url is not null then E'\n\n' || coalesce(p_cta_label, 'Open') || ': ' || p_cta_url else '' end
      || E'\n\nBest wishes,\nUmoja Youth Impact Hub\nNarok, Kenya'
$$;

-- Softer highlight boxes inside the task email (no coloured side bar)
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
    then 'You get these reminders as a UYIH member. To stop them, untick “Send me reminders” on your profile page.'
    else null end;
  return public.queue_email(p_kind, p.email, p.full_name, p_subject, p_heading,
           '<p>Hi ' || public.html_escape(split_part(p.full_name, ' ', 1)) || ',</p>'
           || regexp_replace(p_body_html, '<p style="[^"]*">', '<p>', 'g'),
           p_cta_label, p_cta_url, p.id, p_dedupe, null, footer);
end;
$$;
revoke execute on function public.notify_person(uuid, text, text, text, text, text, text, text, boolean) from public, anon, authenticated;

-- Admin notices: no extra footer line
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
    perform public.queue_email(p_kind, r.email, null, p_subject, p_heading,
                               regexp_replace(p_body_html, '<p style="[^"]*">', '<p>', 'g'), p_cta_label,
                               coalesce(p_cta_url, public.uyih_site_url() || '/admin'), null,
                               case when p_dedupe is null then null else p_dedupe || ':' || r.email end,
                               p_reply_to, null);
  end loop;
exception when others then
  raise warning 'notify_admins(%) failed: %', p_kind, sqlerrm;
end;
$$;
revoke execute on function public.notify_admins(text, text, text, text, text, text, text, text, boolean) from public, anon, authenticated;
