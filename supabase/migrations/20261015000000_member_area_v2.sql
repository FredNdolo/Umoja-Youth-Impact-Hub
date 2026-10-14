-- ════════════════════════════════════════════════════════════════════
-- Member area v2
--   1. Joining signs you straight in (one-time join token), and new joiners
--      get the membership tasks automatically.
--   2. Task submissions: a link and/or an uploaded file (private bucket).
--   3. Online courses clear themselves: pass the quiz (and, for
--      Safeguarding, sign the declaration) and the task is done. The DSL
--      countersigns safeguarding declarations afterwards.
--   4. Lesson progress for "My learning".
--   5. Points, medals (thresholds editable by the admin) and certificates
--      (issued automatically, verifiable by code).
-- ════════════════════════════════════════════════════════════════════


-- ── 1. Join → signed in ───────────────────────────────────────────────
create table public.join_tokens (
  person_id  uuid primary key references public.people (id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null
);
alter table public.join_tokens enable row level security;   -- no policies: nobody reads it directly
revoke all on public.join_tokens from anon, authenticated;

-- Membership tasks every new joiner gets on their list
create or replace function public.assign_membership_tasks(p_person uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.task_assignments (task_id, person_id, source)
  select t.id, p_person, 'assigned'
    from public.tasks t
   where t.active and t.code in ('orientation', 'safeguarding', 'social_content')
  on conflict (task_id, person_id) do nothing;
$$;
revoke execute on function public.assign_membership_tasks(uuid) from public, anon, authenticated;

-- submit_join now returns what happened. Only a brand-new sign-up gets a
-- join token (so knowing someone's phone number never signs you in as them),
-- and re-joining with an existing number no longer changes their name or email.
drop function public.submit_join(text, text, text, boolean, text, text, text, text[], text, text);
create function public.submit_join(
  p_full_name       text,
  p_phone           text,
  p_age_band        text,
  p_is_adult        boolean,
  p_consent_version text,
  p_email           text   default null,
  p_area            text   default null,
  p_interests       text[] default '{}',
  p_heard_from      text   default null,
  p_website         text   default null      -- honeypot: real people leave it empty
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone     text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_email     text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_interests text[];
  v_id        uuid;
  v_token     text;
begin
  if coalesce(p_website, '') <> '' then
    return jsonb_build_object('status', 'ok');  -- bot
  end if;
  if p_is_adult is not true then
    raise exception 'Online joining is for people aged 18 and over.' using errcode = 'P0001';
  end if;
  if coalesce(p_consent_version, '') = '' then
    raise exception 'Consent is required.' using errcode = 'P0001';
  end if;

  -- Normalise Kenyan formats: 07.. / 01.. / 2547.. / +2547..
  if v_phone ~ '^0[17][0-9]{8}$' then
    v_phone := '+254' || substr(v_phone, 2);
  elsif v_phone ~ '^254[17][0-9]{8}$' then
    v_phone := '+' || v_phone;
  end if;
  if v_phone !~ '^\+[1-9][0-9]{7,14}$' then
    raise exception 'Please enter a valid WhatsApp number.' using errcode = 'P0001';
  end if;

  if (select count(*) from public.people where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'We are receiving a lot of sign-ups right now. Please try again in a few minutes.' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(distinct i), '{}')
    into v_interests
    from unnest(coalesce(p_interests, '{}')) as i
   where i in (select slug from public.projects where active);

  -- Already registered with this number: just add any new interests
  select id into v_id from public.people where phone = v_phone;
  if v_id is not null then
    update public.people
       set interests = (select coalesce(array_agg(distinct x), '{}') from unnest(interests || v_interests) as x),
           next_follow_up_at = coalesce(next_follow_up_at, now() + interval '48 hours')
     where id = v_id;
    return jsonb_build_object('status', 'existing');
  end if;

  -- An email already used by someone else is ignored rather than failing the sign-up
  if v_email is not null and exists (select 1 from public.people where email = v_email) then
    v_email := null;
  end if;

  insert into public.people (full_name, phone, email, age_band, area, interests, heard_from, consent_version)
  values (trim(p_full_name), v_phone, v_email, p_age_band, nullif(trim(coalesce(p_area, '')), ''),
          v_interests, p_heard_from, p_consent_version)
  returning id into v_id;

  perform public.assign_membership_tasks(v_id);

  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.join_tokens (person_id, token_hash, expires_at)
  values (v_id, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'), now() + interval '30 minutes');

  return jsonb_build_object('status', 'new', 'person_id', v_id, 'join_token', v_token);
end;
$$;
revoke execute on function public.submit_join(text, text, text, boolean, text, text, text, text[], text, text) from public;
grant  execute on function public.submit_join(text, text, text, boolean, text, text, text, text[], text, text) to anon, authenticated;

-- Used only by the member-login-link function (service role): checks and
-- uses up a join token.
create or replace function public.consume_join_token(p_person uuid, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  delete from public.join_tokens
   where person_id = p_person
     and token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
     and expires_at > now()
  returning true into ok;
  return coalesce(ok, false);
end;
$$;
revoke execute on function public.consume_join_token(uuid, text) from public, anon, authenticated;
grant  execute on function public.consume_join_token(uuid, text) to service_role;

-- Everyone already here gets the membership tasks too
do $$ begin perform public.assign_membership_tasks(id) from public.people; end $$;


-- ── 2. Task submissions ───────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('task-submissions', 'task-submissions', false, 20971520,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'text/plain',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'application/msword', 'application/vnd.ms-excel', 'application/vnd.ms-powerpoint'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy task_files_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'task-submissions'
              and (storage.foldername(name))[1] = public.my_person_id()::text);
create policy task_files_select_own_or_admin on storage.objects
  for select to authenticated
  using (bucket_id = 'task-submissions'
         and ((storage.foldername(name))[1] = public.my_person_id()::text or public.is_admin()));
create policy task_files_delete_own_or_admin on storage.objects
  for delete to authenticated
  using (bucket_id = 'task-submissions'
         and ((storage.foldername(name))[1] = public.my_person_id()::text or public.is_admin()));

alter table public.task_assignments
  add column submission_url       text check (submission_url is null or (submission_url ~* '^https?://' and char_length(submission_url) <= 500)),
  add column submission_file      text,
  add column submission_file_name text check (submission_file_name is null or char_length(submission_file_name) <= 200);


-- ── 3. Courses clear themselves; DSL countersigns ─────────────────────
alter table public.member_profiles
  add column safeguarding_countersigned_at timestamptz,
  add column safeguarding_countersigned_by text;

-- Members can't set the declaration or the countersignature themselves
create or replace function public.tg_member_profiles_before()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if not public.is_admin() then
    if coalesce(current_setting('uyih.allow_declaration', true), '') <> 'on' then
      new.safeguarding_declared_at := case when tg_op = 'UPDATE' then old.safeguarding_declared_at end;
    end if;
    new.safeguarding_countersigned_at := case when tg_op = 'UPDATE' then old.safeguarding_countersigned_at end;
    new.safeguarding_countersigned_by := case when tg_op = 'UPDATE' then old.safeguarding_countersigned_by end;
  end if;
  if new.current_status is not null
     and cardinality(new.skills) >= 3
     and cardinality(new.availability) >= 1
     and new.profile_consented_at is not null then
    new.completed_at := coalesce(case when tg_op = 'UPDATE' then old.completed_at end, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

-- Submit a task: a note, a link and/or an uploaded file. Online courses are
-- completed straight away once passed. Returns the path of a file this
-- submission replaces, so the page can delete it.
drop function public.submit_task(bigint, text, boolean);
create function public.submit_task(
  p_assignment_id bigint,
  p_note          text    default null,
  p_declaration   boolean default false,
  p_link          text    default null,
  p_file_path     text    default null,
  p_file_name     text    default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id     uuid := public.my_person_id();
  v_code   text;
  v_kind   text;
  v_old    text;
  v_link   text := nullif(trim(coalesce(p_link, '')), '');
  v_status text := 'submitted';
begin
  if v_id is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  select t.code, t.kind, ta.submission_file into v_code, v_kind, v_old
    from public.task_assignments ta join public.tasks t on t.id = ta.task_id
   where ta.id = p_assignment_id and ta.person_id = v_id and ta.status in ('todo', 'returned');
  if not found then
    raise exception 'This task can''t be submitted right now.' using errcode = 'P0001';
  end if;

  if v_code in (select code from public.courses) then
    if not exists (select 1 from public.course_attempts
                    where person_id = v_id and course_code = v_code and passed) then
      raise exception 'Please pass the % quiz first.', (select title from public.courses where code = v_code)
        using errcode = 'P0001';
    end if;
    if v_code = 'safeguarding' then
      if p_declaration is not true then
        raise exception 'Please read and accept the safeguarding declaration.' using errcode = 'P0001';
      end if;
      insert into public.member_profiles (person_id) values (v_id) on conflict (person_id) do nothing;
      perform set_config('uyih.allow_declaration', 'on', true);
      update public.member_profiles set safeguarding_declared_at = now() where person_id = v_id;
    end if;
    v_status := 'done';   -- passed online course: cleared automatically
  else
    if v_link is not null and (v_link !~* '^https?://[^\s]+$' or char_length(v_link) > 500) then
      raise exception 'Check the link: it should start with http:// or https://' using errcode = 'P0001';
    end if;
    if p_file_path is not null then
      if split_part(p_file_path, '/', 1) <> v_id::text then
        raise exception 'That file isn''t in your folder.' using errcode = 'P0001';
      end if;
      if not exists (select 1 from storage.objects where bucket_id = 'task-submissions' and name = p_file_path) then
        raise exception 'The upload didn''t finish. Please try again.' using errcode = 'P0001';
      end if;
    end if;
    if v_kind = 'content' and v_link is null and p_file_path is null then
      raise exception 'Add a link to your post or upload the file.' using errcode = 'P0001';
    end if;
  end if;

  update public.task_assignments
     set status = v_status,
         member_note = nullif(trim(coalesce(p_note, '')), ''),
         submission_url = v_link,
         submission_file = coalesce(p_file_path, submission_file),
         submission_file_name = case when p_file_path is not null then left(p_file_name, 200) else submission_file_name end,
         submitted_at = case when v_status = 'done' then now() else submitted_at end
   where id = p_assignment_id;

  return case when p_file_path is not null and v_old is distinct from p_file_path then v_old end;
end;
$$;
revoke execute on function public.submit_task(bigint, text, boolean, text, text, text) from public, anon;
grant  execute on function public.submit_task(bigint, text, boolean, text, text, text) to authenticated;


-- ── 4. Lesson progress ────────────────────────────────────────────────
alter table public.course_progress add column lessons_seen smallint not null default 0;

create or replace function public.mark_lesson_seen(p_code text, p_lesson int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := public.my_person_id();
begin
  if v_id is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if not exists (select 1 from public.courses where code = p_code) then return; end if;
  insert into public.course_progress (person_id, course_code, lessons_seen)
  values (v_id, p_code, greatest(0, least(p_lesson, 50)))
  on conflict (person_id, course_code)
  do update set lessons_seen = greatest(course_progress.lessons_seen, least(excluded.lessons_seen, 50)), updated_at = now();
end;
$$;

-- ── 5. Points, medals, certificates ──────────────────────────────────
create table public.point_rules (
  key         text primary key,
  label       text not null,
  points      smallint not null check (points between 0 and 100)
);
insert into public.point_rules (key, label, points) values
  ('event_attended', 'Attending a UYIH activity', 2),
  ('named_role',     'Taking a named role at an activity (extra)', 3);

create table public.medal_levels (
  code            text primary key check (code ~ '^[a-z_]+$'),
  name            text not null,
  icon            text not null default '🏅',
  min_points      integer not null check (min_points >= 0),
  requires_member boolean not null default false,
  description     text,
  sort_order      smallint not null default 0
);
insert into public.medal_levels (code, name, icon, min_points, requires_member, description, sort_order) values
  ('seedling', 'Seedling', '🌱', 10,  false, 'You’ve started growing with UYIH: courses done and your first activities.', 1),
  ('sapling',  'Sapling',  '🌿', 30,  false, 'A regular volunteer, taking on tasks and turning up.', 2),
  ('tree',     'Tree',     '🌳', 60,  true,  'A full member others can lean on.', 3),
  ('forest',   'Forest',   '🌲', 120, true,  'A leader who grows others: projects, roles and impact.', 4);

alter table public.point_rules  enable row level security;
alter table public.medal_levels enable row level security;
create policy admin_all on public.point_rules  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.medal_levels for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy read_all  on public.medal_levels for select to authenticated using (true);
create policy read_all  on public.point_rules  for select to authenticated using (true);

create table public.certificates (
  id          bigint generated always as identity primary key,
  code        text not null unique,
  person_id   uuid not null references public.people (id) on delete cascade,
  course_code text not null references public.courses (code),
  full_name   text not null,       -- as it was when issued
  title       text not null,
  score       smallint,
  total       smallint,
  issued_at   timestamptz not null default now(),
  unique (person_id, course_code)
);
alter table public.certificates enable row level security;
create policy admin_all on public.certificates for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.certificates from anon;

-- Issue a certificate when a course task is completed (by the member or the admin)
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
  insert into public.certificates (code, person_id, course_code, full_name, title, score, total)
  select 'UYIH-' || to_char(now() at time zone 'Africa/Nairobi', 'YY') || '-' ||
         upper(substr(md5(random()::text || clock_timestamp()::text || new.person_id::text), 1, 8)),
         new.person_id, v_code, p.full_name, v_title, b.score, b.total
    from public.people p where p.id = new.person_id
  on conflict (person_id, course_code) do nothing;
  return new;
end;
$$;
create trigger task_assignments_certificate
  after insert or update of status on public.task_assignments
  for each row execute function public.tg_issue_certificate();
revoke execute on function public.tg_issue_certificate() from public, anon, authenticated;

-- Anyone can check a certificate code (no contact details are shown)
create or replace function public.verify_certificate(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('code', c.code, 'full_name', c.full_name, 'title', c.title, 'course_code', c.course_code,
                            'score', c.score, 'total', c.total, 'issued_at', c.issued_at)
    from public.certificates c where c.code = upper(trim(p_code));
$$;
revoke execute on function public.verify_certificate(text) from public;
grant  execute on function public.verify_certificate(text) to anon, authenticated;

-- Points, medals and certificates for a person (themselves or the admin)
create or replace function public.member_achievements(p_person uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tasks   int;
  v_events  int;
  v_roles   int;
  v_member  boolean;
  v_total   int;
  pe        int := coalesce((select points from public.point_rules where key = 'event_attended'), 0);
  pr        int := coalesce((select points from public.point_rules where key = 'named_role'), 0);
begin
  if not (public.is_admin() or p_person = public.my_person_id()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  select coalesce(sum(t.points), 0) into v_tasks
    from public.task_assignments ta join public.tasks t on t.id = ta.task_id
   where ta.person_id = p_person and ta.status = 'done';
  select count(*) filter (where attended), count(*) filter (where attended and role is not null)
    into v_events, v_roles from public.attendance where person_id = p_person;
  select stage in ('member', 'lead') into v_member from public.people where id = p_person;
  v_total := v_tasks + v_events * pe + v_roles * pr;

  return jsonb_build_object(
    'points', v_total,
    'breakdown', jsonb_build_object('tasks', v_tasks, 'events', v_events * pe, 'roles', v_roles * pr,
                                    'events_count', v_events, 'roles_count', v_roles),
    'is_member', coalesce(v_member, false),
    'rules', (select coalesce(jsonb_agg(jsonb_build_object('key', key, 'label', label, 'points', points)), '[]'::jsonb) from public.point_rules),
    'medals', (select coalesce(jsonb_agg(jsonb_build_object(
                 'code', m.code, 'name', m.name, 'icon', m.icon, 'min_points', m.min_points,
                 'requires_member', m.requires_member, 'description', m.description,
                 'earned', v_total >= m.min_points and (not m.requires_member or coalesce(v_member, false)))
                 order by m.sort_order, m.min_points), '[]'::jsonb) from public.medal_levels m),
    'certificates', (select coalesce(jsonb_agg(jsonb_build_object(
                 'code', c.code, 'title', c.title, 'course_code', c.course_code, 'score', c.score,
                 'total', c.total, 'issued_at', c.issued_at) order by c.issued_at), '[]'::jsonb)
                 from public.certificates c where c.person_id = p_person),
    'safeguarding', (select jsonb_build_object('declared_at', safeguarding_declared_at,
                                               'countersigned_at', safeguarding_countersigned_at)
                       from public.member_profiles where person_id = p_person)
  );
end;
$$;

-- Certificates already due (courses completed before this change)
insert into public.certificates (code, person_id, course_code, full_name, title, score, total, issued_at)
select 'UYIH-' || to_char(coalesce(ta.completed_at, now()) at time zone 'Africa/Nairobi', 'YY') || '-' ||
       upper(substr(md5(random()::text || ta.id::text), 1, 8)),
       ta.person_id, t.code, p.full_name, c.title,
       (select score from public.course_attempts a where a.person_id = ta.person_id and a.course_code = t.code and passed order by score desc limit 1),
       (select total from public.course_attempts a where a.person_id = ta.person_id and a.course_code = t.code and passed order by score desc limit 1),
       coalesce(ta.completed_at, now())
  from public.task_assignments ta
  join public.tasks t on t.id = ta.task_id
  join public.courses c on c.code = t.code
  join public.people p on p.id = ta.person_id
 where ta.status = 'done'
on conflict (person_id, course_code) do nothing;


-- "My learning": every course with the member's progress
create or replace function public.get_my_learning()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'code', c.code, 'title', c.title, 'pass_mark', c.pass_mark,
           'questions', (select count(*) from public.course_questions q where q.course_code = c.code),
           'lessons_seen', coalesce(cp.lessons_seen, 0),
           'answered', coalesce((select count(*) from jsonb_object_keys(cp.answers)), 0),
           'attempts', (select count(*) from public.course_attempts a where a.person_id = me.id and a.course_code = c.code),
           'best', (select jsonb_build_object('score', score, 'total', total, 'passed', passed)
                      from public.course_attempts a where a.person_id = me.id and a.course_code = c.code
                     order by passed desc, score desc limit 1),
           'task_status', (select ta.status from public.task_assignments ta join public.tasks t on t.id = ta.task_id
                            where ta.person_id = me.id and t.code = c.code),
           'certificate', (select code from public.certificates ce where ce.person_id = me.id and ce.course_code = c.code)
         ) order by c.code = 'safeguarding', c.code), '[]'::jsonb)
    from public.courses c
    cross join (select public.my_person_id() as id) me
    left join public.course_progress cp on cp.person_id = me.id and cp.course_code = c.code
   where me.id is not null;
$$;


-- ── Dashboard: include submissions ────────────────────────────────────
create or replace function public.get_my_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id uuid := public.my_person_id();
  p    public.people;
begin
  if v_id is null then
    return null;
  end if;
  select * into p from public.people where id = v_id;

  return jsonb_build_object(
    'person', jsonb_build_object(
      'id', p.id, 'full_name', p.full_name, 'phone', p.phone, 'email', p.email, 'area', p.area,
      'stage', p.stage, 'stage_changed_at', p.stage_changed_at, 'joined_at', p.created_at,
      'fee_paid', p.fee_paid, 'interests', p.interests,
      'deletion_requested_at', p.deletion_requested_at),
    'profile', (select to_jsonb(mp) - 'person_id' from public.member_profiles mp where mp.person_id = v_id),
    'progress', public.membership_progress(v_id),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('title', e.title, 'starts_at', e.starts_at, 'location', e.location,
                                          'role', a.role, 'attended', a.attended) order by e.starts_at desc)
        from public.attendance a join public.events e on e.id = a.event_id
       where a.person_id = v_id), '[]'::jsonb),
    'projects', coalesce((
      select jsonb_agg(jsonb_build_object('name', pr.name, 'role', s.role, 'started_on', s.started_on,
                                          'ended_on', s.ended_on) order by s.started_on desc)
        from public.assignments s join public.projects pr on pr.id = s.project_id
       where s.person_id = v_id), '[]'::jsonb),
    'my_tasks', coalesce((
      select jsonb_agg(jsonb_build_object('assignment_id', ta.id, 'task_id', t.id, 'title', t.title,
                                          'description', t.description, 'kind', t.kind, 'code', t.code,
                                          'project', pr.name, 'skills', t.skills, 'points', t.points,
                                          'due_on', t.due_on, 'status', ta.status, 'member_note', ta.member_note,
                                          'admin_note', ta.admin_note, 'completed_at', ta.completed_at,
                                          'submitted_at', ta.submitted_at, 'submission_url', ta.submission_url,
                                          'submission_file', ta.submission_file, 'submission_file_name', ta.submission_file_name)
                       order by (ta.status = 'done'), t.due_on nulls last, ta.created_at)
        from public.task_assignments ta join public.tasks t on t.id = ta.task_id
        left join public.projects pr on pr.id = t.project_id
       where ta.person_id = v_id), '[]'::jsonb),
    'open_tasks', coalesce((
      select jsonb_agg(jsonb_build_object('task_id', t.id, 'title', t.title, 'description', t.description,
                                          'kind', t.kind, 'code', t.code, 'project', pr.name, 'skills', t.skills,
                                          'points', t.points, 'due_on', t.due_on)
                       order by t.code nulls last, t.created_at desc)
        from public.tasks t left join public.projects pr on pr.id = t.project_id
       where t.active and t.is_open
         and not exists (select 1 from public.task_assignments ta where ta.task_id = t.id and ta.person_id = v_id)), '[]'::jsonb),
    'achievements', public.member_achievements(v_id)
  );
end;
$$;

revoke execute on function public.mark_lesson_seen(text, int), public.get_my_learning(),
  public.member_achievements(uuid) from public, anon;
grant execute on function public.mark_lesson_seen(text, int), public.get_my_learning(),
  public.member_achievements(uuid) to authenticated;

-- Course descriptions now that they clear themselves
update public.tasks
   set description = 'A short online course about UYIH: who we are, our mission and values, what we do, Green Futures in 60 seconds, and your path to membership. 7 quick lessons and a 10-question quiz (pass mark 8). Pass the quiz and it’s done, with a certificate.'
 where code = 'orientation';
update public.tasks
   set description = 'A short online course on UYIH’s Child Protection and Safeguarding Policy: 7 quick lessons and a 14-question quiz (pass mark 12), then sign the policy’s declaration. It completes straight away with a certificate; the Designated Safeguarding Lead countersigns your declaration afterwards.'
 where code = 'safeguarding';
