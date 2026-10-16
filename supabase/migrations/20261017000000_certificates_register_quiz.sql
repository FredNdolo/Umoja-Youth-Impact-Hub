-- ════════════════════════════════════════════════════════════════════
-- Certificates register and quiz retakes
--
--   1. Who signs each certificate is kept in the database: the Executive
--      Director signs every certificate; the Designated Safeguarding Lead
--      also signs courses marked dsl_signs (Safeguarding Basics, the Child
--      Protection and Safeguarding Policy course). The names are saved on
--      each certificate when it's issued, so the record stays accurate if a
--      signatory changes later.
--   2. Certificates can be revoked by an admin (with a reason). A revoked
--      certificate shows as revoked when someone checks its code.
--   3. The public certificate check no longer returns the quiz score.
--   4. Members can start a quiz over at any time.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Signatories ───────────────────────────────────────────────────
alter table public.courses add column if not exists dsl_signs boolean not null default false;
update public.courses set dsl_signs = (code = 'safeguarding');

create table if not exists public.signatories (
  role       text primary key check (role in ('executive_director', 'dsl')),
  name       text not null check (char_length(name) between 2 and 120),
  title      text not null,
  updated_at timestamptz not null default now()
);
alter table public.signatories enable row level security;
drop policy if exists admin_all on public.signatories;
create policy admin_all on public.signatories for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.signatories from anon;

insert into public.signatories (role, name, title) values
  ('executive_director', 'Fred Ndolo', 'Executive Director'),
  ('dsl', 'Emmanuella Aya', 'Designated Safeguarding Lead')
on conflict (role) do update set name = excluded.name, title = excluded.title, updated_at = now();

-- Who signs a course's certificate, Executive Director first
create or replace function public.certificate_signatories(p_course text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('role', s.role, 'name', s.name, 'title', s.title)
                            order by case s.role when 'executive_director' then 1 else 2 end), '[]'::jsonb)
    from public.signatories s
   where s.role = 'executive_director'
      or (s.role = 'dsl' and coalesce((select dsl_signs from public.courses where code = p_course), false));
$$;
revoke execute on function public.certificate_signatories(text) from public, anon, authenticated;

-- ── 2. Register columns ──────────────────────────────────────────────
alter table public.certificates
  add column if not exists signatories    jsonb not null default '[]'::jsonb,
  add column if not exists revoked_at     timestamptz,
  add column if not exists revoked_reason text,
  add column if not exists revoked_by     text;

update public.certificates set signatories = public.certificate_signatories(course_code)
 where signatories = '[]'::jsonb;

-- Revoking stamps who did it; un-revoking clears the reason
create or replace function public.tg_certificates_revoke()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.revoked_at is not null and old.revoked_at is null then
    new.revoked_by := coalesce(auth.jwt() ->> 'email', 'system');
    if coalesce(trim(new.revoked_reason), '') = '' then
      raise exception 'Give a reason for revoking the certificate.' using errcode = 'P0001';
    end if;
  elsif new.revoked_at is null then
    new.revoked_by := null; new.revoked_reason := null;
  end if;
  -- the certificate's identity can't be edited
  new.code := old.code; new.person_id := old.person_id; new.course_code := old.course_code; new.issued_at := old.issued_at;
  return new;
end;
$$;
drop trigger if exists certificates_revoke on public.certificates;
create trigger certificates_revoke before update on public.certificates
  for each row execute function public.tg_certificates_revoke();
revoke execute on function public.tg_certificates_revoke() from public, anon, authenticated;

-- Issue a certificate when a course task is completed (now saves signatories)
create or replace function public.tg_issue_certificate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code  text;
  v_title text;
  b       record;
begin
  if new.status <> 'done' or (tg_op = 'UPDATE' and old.status = 'done') then return new; end if;
  select t.code into v_code from public.tasks t where t.id = new.task_id;
  if v_code is null or not exists (select 1 from public.courses where code = v_code) then return new; end if;
  select title into v_title from public.courses where code = v_code;
  select score, total into b from public.course_attempts
   where person_id = new.person_id and course_code = v_code and passed order by score desc limit 1;
  insert into public.certificates (code, person_id, course_code, full_name, title, score, total, signatories)
  select 'UYIH-' || to_char(now() at time zone 'Africa/Nairobi', 'YY') || '-' ||
         upper(substr(md5(random()::text || clock_timestamp()::text || new.person_id::text), 1, 8)),
         new.person_id, v_code, p.full_name, v_title, b.score, b.total, public.certificate_signatories(v_code)
    from public.people p where p.id = new.person_id
  on conflict (person_id, course_code) do nothing;
  return new;
end;
$$;
revoke execute on function public.tg_issue_certificate() from public, anon, authenticated;

-- ── 3. Public check: no score; signatories and revoked status ───────
create or replace function public.verify_certificate(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('code', c.code, 'full_name', c.full_name, 'title', c.title, 'course_code', c.course_code,
                            'issued_at', c.issued_at, 'signatories', c.signatories,
                            'revoked', c.revoked_at is not null)
    from public.certificates c where c.code = upper(trim(p_code));
$$;
revoke execute on function public.verify_certificate(text) from public;
grant  execute on function public.verify_certificate(text) to anon, authenticated;

-- ── 4. Start a quiz over ─────────────────────────────────────────────
-- Clears the answers given so far in the current attempt. Past attempts,
-- a pass and any certificate already issued are kept.
create or replace function public.restart_course_quiz(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := public.my_person_id();
begin
  if v_id is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  update public.course_progress set answers = '{}'::jsonb, updated_at = now()
   where person_id = v_id and course_code = p_code;
end;
$$;
revoke execute on function public.restart_course_quiz(text) from public, anon;
grant  execute on function public.restart_course_quiz(text) to authenticated;
