-- ════════════════════════════════════════════════════════════════════
-- Document requests: visitors ask for a copy of a publication; the admin
-- sees the request in the dashboard (Messages) and replies by email.
-- Same pattern as the contact form: the public can only call the submit
-- function, never read the table.
-- ════════════════════════════════════════════════════════════════════

create table public.document_requests (
  id             bigint generated always as identity primary key,
  document_slug  text not null check (document_slug ~ '^[a-z0-9-]{2,80}$'),
  document_title text not null check (char_length(document_title) between 2 and 150),
  name           text not null check (char_length(name) between 2 and 80),
  email          text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  organisation   text check (organisation is null or char_length(organisation) <= 120),
  purpose        text not null check (char_length(purpose) between 2 and 1000),
  status         text not null default 'pending' check (status in ('pending', 'sent', 'declined')),
  handled_at     timestamptz,
  created_at     timestamptz not null default now()
);
create index document_requests_status_idx on public.document_requests (status, created_at desc);

alter table public.document_requests enable row level security;
create policy admin_all on public.document_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.document_requests from anon;

create or replace function public.submit_document_request(
  p_document_slug  text,
  p_document_title text,
  p_name           text,
  p_email          text,
  p_purpose        text,
  p_organisation   text default null,
  p_website        text default null   -- honeypot
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(p_website, '') <> '' then
    return;  -- bot
  end if;
  if (select count(*) from public.document_requests where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'Too many requests right now. Please try again in a few minutes.' using errcode = 'P0001';
  end if;
  insert into public.document_requests (document_slug, document_title, name, email, organisation, purpose)
  values (
    p_document_slug,
    trim(p_document_title),
    trim(p_name),
    lower(trim(p_email)),
    nullif(trim(coalesce(p_organisation, '')), ''),
    trim(p_purpose)
  );
end;
$$;

revoke execute on function public.submit_document_request(text, text, text, text, text, text, text) from public;
grant  execute on function public.submit_document_request(text, text, text, text, text, text, text) to anon, authenticated;
