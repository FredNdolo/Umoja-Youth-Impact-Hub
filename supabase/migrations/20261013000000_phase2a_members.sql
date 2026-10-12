-- ════════════════════════════════════════════════════════════════════
-- UYIH Phase 2A: member logins, "get to know you" profiles, tasks and
-- the membership checklist.
--
-- Access model
-- • Members log in (email link or a WhatsApp link from the admin). Their
--   login is linked to their row in public.people via people.user_id.
-- • Members never read public.people directly (it holds admin notes).
--   They read their own data through get_my_dashboard() and change it
--   through a few small functions. Their own profile row is readable and
--   writable directly (member_profiles), protected by row level security.
-- • Admins keep full access to everything.
-- ════════════════════════════════════════════════════════════════════

-- ── Link people to logins ────────────────────────────────────────────
alter table public.people
  add column user_id uuid unique references auth.users (id) on delete set null,
  add column deletion_requested_at timestamptz,
  add column last_login_at timestamptz;

create or replace function public.my_person_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.people where user_id = auth.uid();
$$;


-- ── "Get to know you" profiles ───────────────────────────────────────
create table public.member_profiles (
  person_id        uuid primary key references public.people (id) on delete cascade,
  bio              text check (bio is null or char_length(bio) <= 600),
  current_status   text check (current_status in ('student', 'employed', 'self_employed', 'looking_for_work', 'other')),
  field            text check (field is null or char_length(field) <= 120),
  skills           text[] not null default '{}' check (cardinality(skills) <= 40),
  languages        text[] not null default '{}' check (cardinality(languages) <= 10),
  availability     text[] not null default '{}' check (availability <@ array['weekday_daytime', 'weekday_evenings', 'weekends']),
  hours_per_month  text check (hours_per_month in ('under_5', '5_10', '10_20', 'over_20')),
  goals            text[] not null default '{}' check (cardinality(goals) <= 10),
  resources        text[] not null default '{}' check (cardinality(resources) <= 10),
  profile_consented_at     timestamptz,
  safeguarding_declared_at timestamptz,
  completed_at     timestamptz,
  updated_at       timestamptz not null default now()
);

-- Each skill / language / goal entry is a short label
create or replace function public.short_labels_ok(arr text[], maxlen int)
returns boolean
language sql
immutable
as $$
  select coalesce(bool_and(char_length(x) between 1 and maxlen), true) from unnest(arr) as x;
$$;
alter table public.member_profiles
  add constraint skills_short    check (public.short_labels_ok(skills, 60)),
  add constraint languages_short check (public.short_labels_ok(languages, 40)),
  add constraint goals_short     check (public.short_labels_ok(goals, 60)),
  add constraint resources_short check (public.short_labels_ok(resources, 60));

-- Keep timestamps honest: completed_at is set by the database when the
-- essentials are filled in. The safeguarding declaration can only be set by
-- submit_task() (or an admin), never directly by the member.
create or replace function public.tg_member_profiles_before()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if coalesce(current_setting('uyih.allow_declaration', true), '') <> 'on' and not public.is_admin() then
    if tg_op = 'UPDATE' then
      new.safeguarding_declared_at := old.safeguarding_declared_at;
    else
      new.safeguarding_declared_at := null;
    end if;
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
create trigger member_profiles_before
  before insert or update on public.member_profiles
  for each row execute function public.tg_member_profiles_before();


-- ── Tasks ────────────────────────────────────────────────────────────
create table public.tasks (
  id          bigint generated always as identity primary key,
  title       text not null check (char_length(title) between 2 and 120),
  description text check (description is null or char_length(description) <= 2000),
  kind        text not null default 'task' check (kind in ('task', 'course', 'content')),
  code        text unique check (code is null or code ~ '^[a-z0-9_]+$'),  -- fixed tasks used by the checklist
  project_id  smallint references public.projects (id),
  skills      text[] not null default '{}' check (cardinality(skills) <= 15),
  points      smallint not null default 1 check (points between 0 and 100),
  due_on      date,
  is_open     boolean not null default false,  -- any member can claim it
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.task_assignments (
  id           bigint generated always as identity primary key,
  task_id      bigint not null references public.tasks (id) on delete cascade,
  person_id    uuid   not null references public.people (id) on delete cascade,
  status       text   not null default 'todo' check (status in ('todo', 'submitted', 'done', 'returned')),
  source       text   not null default 'assigned' check (source in ('assigned', 'claimed')),
  member_note  text check (member_note is null or char_length(member_note) <= 1000),
  admin_note   text check (admin_note is null or char_length(admin_note) <= 1000),
  created_at   timestamptz not null default now(),
  submitted_at timestamptz,
  completed_at timestamptz,
  unique (task_id, person_id)
);
create index task_assignments_person_idx on public.task_assignments (person_id);
create index task_assignments_status_idx on public.task_assignments (status);

create or replace function public.tg_task_assignments_before()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'done' and new.completed_at is null then new.completed_at := now(); end if;
  if new.status <> 'done' then new.completed_at := null; end if;
  if new.status = 'submitted' and (tg_op = 'INSERT' or old.status <> 'submitted') then new.submitted_at := now(); end if;
  return new;
end;
$$;
create trigger task_assignments_before
  before insert or update on public.task_assignments
  for each row execute function public.tg_task_assignments_before();

-- Fixed tasks behind three of the membership criteria
insert into public.tasks (title, description, kind, code, is_open, points) values
  ('UYIH Orientation',
   'Learn about UYIH''s mission, how we work, our constitution and code of conduct. Until the online course is ready, this is completed at an orientation session with a UYIH lead.',
   'course', 'orientation', true, 3),
  ('Safeguarding Basics',
   'Learn how UYIH keeps children and young people safe, and sign the safeguarding declaration. Until the online course is ready, this is completed at a briefing with a UYIH lead.',
   'course', 'safeguarding', true, 3),
  ('Share UYIH''s work on social media',
   'Create or share a post, photo, video or story about a UYIH activity. Add the link when you submit.',
   'content', 'social_content', true, 1);


-- ── Membership checklist ─────────────────────────────────────────────
-- Criteria agreed for Volunteer → Member (90-day trial):
--   attend 2 activities · a named role at an event · a project + 3 project
--   tasks · get-to-know-you profile · Orientation · Safeguarding (+ declaration)
--   · social media content · membership fee
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
    jsonb_build_object('key', 'fee', 'label', 'Pay the membership fee (Ksh 1,000)',
      'done', coalesce(v_fee, false), 'count', case when coalesce(v_fee, false) then 1 else 0 end, 'target', 1,
      'hint', 'Due at the end of your 90-day trial.')
  );
end;
$$;

-- Admin overview: how many criteria each person has met
create or replace view public.membership_overview
with (security_invoker = true)
as
select p.id as person_id,
       (select count(*) from jsonb_array_elements(public.membership_progress(p.id)) e where (e ->> 'done')::boolean) as criteria_done,
       (select count(*) from jsonb_array_elements(public.membership_progress(p.id)) e
         where (e ->> 'done')::boolean and e ->> 'key' <> 'fee') as criteria_done_excl_fee,
       8 as criteria_total
  from public.people p;


-- ── Member-facing functions ──────────────────────────────────────────
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
                                          'admin_note', ta.admin_note, 'completed_at', ta.completed_at)
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
         and not exists (select 1 from public.task_assignments ta where ta.task_id = t.id and ta.person_id = v_id)), '[]'::jsonb)
  );
end;
$$;

-- Records a login (called by the member page after sign-in)
create or replace function public.touch_my_login()
returns void
language sql
security definer
set search_path = public
as $$
  update public.people set last_login_at = now() where id = public.my_person_id();
$$;

create or replace function public.update_my_details(p_full_name text, p_area text, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := public.my_person_id();
begin
  if v_id is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  update public.people set
    full_name = trim(p_full_name),
    area      = nullif(trim(coalesce(p_area, '')), ''),
    email     = nullif(lower(trim(coalesce(p_email, ''))), '')
  where id = v_id;
end;
$$;

create or replace function public.request_my_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.my_person_id() is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  update public.people set deletion_requested_at = coalesce(deletion_requested_at, now())
   where id = public.my_person_id();
end;
$$;

create or replace function public.claim_task(p_task_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := public.my_person_id();
begin
  if v_id is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if not exists (select 1 from public.tasks where id = p_task_id and active and is_open) then
    raise exception 'This task is not open for claiming.' using errcode = 'P0001';
  end if;
  insert into public.task_assignments (task_id, person_id, source)
  values (p_task_id, v_id, 'claimed')
  on conflict (task_id, person_id) do nothing;
end;
$$;

-- Member marks a task as done (the admin then confirms it).
-- For Safeguarding Basics the declaration must be accepted.
create or replace function public.submit_task(p_assignment_id bigint, p_note text default null, p_declaration boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid := public.my_person_id();
  v_code text;
begin
  if v_id is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  select t.code into v_code
    from public.task_assignments ta join public.tasks t on t.id = ta.task_id
   where ta.id = p_assignment_id and ta.person_id = v_id and ta.status in ('todo', 'returned');
  if not found then
    raise exception 'This task can''t be submitted right now.' using errcode = 'P0001';
  end if;
  if v_code = 'safeguarding' then
    if p_declaration is not true then
      raise exception 'Please read and accept the safeguarding declaration.' using errcode = 'P0001';
    end if;
    insert into public.member_profiles (person_id) values (v_id) on conflict (person_id) do nothing;
    -- bypass the trigger guard: only this function may set the declaration
    perform set_config('uyih.allow_declaration', 'on', true);
    update public.member_profiles set safeguarding_declared_at = now() where person_id = v_id;
  end if;
  update public.task_assignments
     set status = 'submitted', member_note = nullif(trim(coalesce(p_note, '')), '')
   where id = p_assignment_id;
end;
$$;

-- ── Row level security ───────────────────────────────────────────────
alter table public.member_profiles  enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_assignments enable row level security;

create policy admin_all on public.member_profiles  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.tasks            for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.task_assignments for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Members: their own profile only
create policy member_own_select on public.member_profiles for select to authenticated
  using (person_id = public.my_person_id());
create policy member_own_insert on public.member_profiles for insert to authenticated
  with check (person_id = public.my_person_id());
create policy member_own_update on public.member_profiles for update to authenticated
  using (person_id = public.my_person_id()) with check (person_id = public.my_person_id());

revoke all on public.member_profiles, public.tasks, public.task_assignments from anon;
revoke all on public.membership_overview from anon;

-- Functions: lock everything down, then open what's needed
revoke execute on function public.my_person_id(), public.short_labels_ok(text[], int),
  public.tg_member_profiles_before(), public.tg_task_assignments_before(),
  public.membership_progress(uuid), public.get_my_dashboard(), public.touch_my_login(),
  public.update_my_details(text, text, text), public.request_my_deletion(),
  public.claim_task(bigint), public.submit_task(bigint, text, boolean)
  from public, anon;
revoke execute on function public.tg_member_profiles_before(), public.tg_task_assignments_before() from authenticated;
grant execute on function public.my_person_id(), public.short_labels_ok(text[], int),
  public.membership_progress(uuid), public.get_my_dashboard(), public.touch_my_login(),
  public.update_my_details(text, text, text), public.request_my_deletion(),
  public.claim_task(bigint), public.submit_task(bigint, text, boolean)
  to authenticated;
