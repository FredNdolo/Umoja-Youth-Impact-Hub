-- ════════════════════════════════════════════════════════════════════
-- Member documents: national ID and police clearance certificate.
--
-- Members upload them on their page for UYIH's safeguarding checks (people
-- who work with children). Files live in a PRIVATE storage bucket, in a
-- folder named after the person's id:
--   • a member can upload to, see and delete only their own folder
--   • only the admin can open anyone's files (through short-lived links)
-- The member_documents table records each upload and the admin's check.
-- Also: the membership fee is annual (Constitution, Article 4).
-- ════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-documents', 'member-documents', false, 5242880,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy member_docs_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'member-documents'
              and (storage.foldername(name))[1] = public.my_person_id()::text);

create policy member_docs_select_own_or_admin on storage.objects
  for select to authenticated
  using (bucket_id = 'member-documents'
         and ((storage.foldername(name))[1] = public.my_person_id()::text or public.is_admin()));

create policy member_docs_delete_own_or_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'member-documents'
         and ((storage.foldername(name))[1] = public.my_person_id()::text or public.is_admin()));


create table public.member_documents (
  id           bigint generated always as identity primary key,
  person_id    uuid not null references public.people (id) on delete cascade,
  doc_type     text not null check (doc_type in ('national_id', 'police_clearance')),
  file_path    text not null unique,
  file_name    text check (file_name is null or char_length(file_name) <= 200),
  mime_type    text,
  size_bytes   integer,
  issued_on    date,
  status       text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  admin_note   text check (admin_note is null or char_length(admin_note) <= 500),
  uploaded_at  timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  text,
  unique (person_id, doc_type)
);
create index member_documents_status_idx on public.member_documents (status);

alter table public.member_documents enable row level security;
create policy admin_all on public.member_documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.member_documents from anon;

create or replace function public.member_documents_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'pending' then
      new.reviewed_at := null; new.reviewed_by := null;
    else
      new.reviewed_at := now(); new.reviewed_by := auth.jwt() ->> 'email';
    end if;
  end if;
  return new;
end;
$$;
create trigger member_documents_stamp before update on public.member_documents
  for each row execute function public.member_documents_stamp();
revoke execute on function public.member_documents_stamp() from public, anon, authenticated;

-- Record an upload (after the file is in storage). Replaces any earlier
-- document of the same type and returns the old file's path so the page can
-- delete it from storage.
create or replace function public.record_my_document(
  p_doc_type  text,
  p_file_path text,
  p_file_name text default null,
  p_mime_type text default null,
  p_size      integer default null,
  p_issued_on date default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id  uuid := public.my_person_id();
  v_old text;
begin
  if v_id is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if p_doc_type not in ('national_id', 'police_clearance') then
    raise exception 'Unknown document type.' using errcode = 'P0001';
  end if;
  if split_part(p_file_path, '/', 1) <> v_id::text then
    raise exception 'That file isn''t in your folder.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'member-documents' and name = p_file_path) then
    raise exception 'The upload didn''t finish. Please try again.' using errcode = 'P0001';
  end if;
  if p_issued_on is not null and p_issued_on > (now() at time zone 'Africa/Nairobi')::date then
    raise exception 'The issue date can''t be in the future.' using errcode = 'P0001';
  end if;

  select file_path into v_old from public.member_documents where person_id = v_id and doc_type = p_doc_type;
  delete from public.member_documents where person_id = v_id and doc_type = p_doc_type;
  insert into public.member_documents (person_id, doc_type, file_path, file_name, mime_type, size_bytes, issued_on)
  values (v_id, p_doc_type, p_file_path, left(p_file_name, 200), p_mime_type, p_size,
          case when p_doc_type = 'police_clearance' then p_issued_on end);
  return v_old;
end;
$$;

-- The member's own documents
create or replace function public.get_my_documents()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'doc_type', doc_type, 'file_path', file_path, 'file_name', file_name,
           'issued_on', issued_on, 'status', status, 'admin_note', admin_note,
           'uploaded_at', uploaded_at, 'reviewed_at', reviewed_at) order by doc_type), '[]'::jsonb)
    from public.member_documents
   where person_id = public.my_person_id();
$$;

-- Remove one of your own documents (record + returns the path to delete)
create or replace function public.delete_my_document(p_doc_type text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
begin
  if public.my_person_id() is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  delete from public.member_documents
   where person_id = public.my_person_id() and doc_type = p_doc_type
  returning file_path into v_old;
  return v_old;
end;
$$;

revoke execute on function public.record_my_document(text, text, text, text, integer, date),
  public.get_my_documents(), public.delete_my_document(text) from public, anon;
grant execute on function public.record_my_document(text, text, text, text, integer, date),
  public.get_my_documents(), public.delete_my_document(text) to authenticated;


-- ── Membership fee is annual ─────────────────────────────────────────
create or replace function public.membership_progress(p_person uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_attended   int;
  v_roles      int;
  v_project    boolean;
  v_proj_tasks int;
  v_profile    boolean;
  v_declared   boolean;
  v_fee        boolean;
  done_code    text[];
  v_content    int;
begin
  if not (public.is_admin() or p_person = public.my_person_id()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  select count(*) filter (where attended),
         count(*) filter (where attended and role is not null)
    into v_attended, v_roles
    from public.attendance where person_id = p_person;

  select exists (select 1 from public.assignments where person_id = p_person and ended_on is null) into v_project;

  select count(*) into v_proj_tasks
    from public.task_assignments ta join public.tasks t on t.id = ta.task_id
   where ta.person_id = p_person and ta.status = 'done' and t.project_id is not null;

  select coalesce(array_agg(t.code), '{}') into done_code
    from public.task_assignments ta join public.tasks t on t.id = ta.task_id
   where ta.person_id = p_person and ta.status = 'done' and t.code is not null;

  select count(*) into v_content
    from public.task_assignments ta join public.tasks t on t.id = ta.task_id
   where ta.person_id = p_person and ta.status = 'done' and t.kind = 'content';

  select completed_at is not null, safeguarding_declared_at is not null
    into v_profile, v_declared
    from public.member_profiles where person_id = p_person;

  select fee_paid into v_fee from public.people where id = p_person;

  return jsonb_build_array(
    jsonb_build_object('key', 'activities', 'label', 'Attend 2 UYIH activities',
      'done', v_attended >= 2, 'count', least(v_attended, 2), 'target', 2,
      'hint', 'Come to events and activities; we tick you off on the day.'),
    jsonb_build_object('key', 'named_role', 'label', 'Take a named role at an event',
      'done', v_roles >= 1, 'count', least(v_roles, 1), 'target', 1,
      'hint', 'Be the photographer, facilitator, registration desk… at least once.'),
    jsonb_build_object('key', 'project_tasks', 'label', 'Join a project and complete 3 project tasks',
      'done', v_project and v_proj_tasks >= 3, 'count', least(v_proj_tasks, 3), 'target', 3,
      'hint', case when v_project then 'Complete tasks in your project.' else 'We''ll place you in a project that fits your skills.' end),
    jsonb_build_object('key', 'profile', 'label', 'Complete your get-to-know-you profile',
      'done', coalesce(v_profile, false), 'count', case when coalesce(v_profile, false) then 1 else 0 end, 'target', 1,
      'hint', 'Tell us about your skills and availability.'),
    jsonb_build_object('key', 'orientation', 'label', 'Complete UYIH Orientation',
      'done', 'orientation' = any(done_code), 'count', case when 'orientation' = any(done_code) then 1 else 0 end, 'target', 1,
      'hint', 'Our mission, constitution and code of conduct.'),
    jsonb_build_object('key', 'safeguarding', 'label', 'Complete Safeguarding Basics and sign the declaration',
      'done', 'safeguarding' = any(done_code) and coalesce(v_declared, false),
      'count', case when 'safeguarding' = any(done_code) and coalesce(v_declared, false) then 1 else 0 end, 'target', 1,
      'hint', 'Required because our work takes us into schools.'),
    jsonb_build_object('key', 'content', 'label', 'Create or share content about UYIH',
      'done', v_content >= 1, 'count', least(v_content, 1), 'target', 1,
      'hint', 'A post, photo, video or story about a UYIH activity.'),
    jsonb_build_object('key', 'fee', 'label', 'Pay the annual membership fee (Ksh 1,000)',
      'done', coalesce(v_fee, false), 'count', case when coalesce(v_fee, false) then 1 else 0 end, 'target', 1,
      'hint', 'Due at the end of your 90-day trial, then once a year (Constitution, Article 4).')
  );
end;
$$;
