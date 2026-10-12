-- ════════════════════════════════════════════════════════════════════
-- UYIH Phase 1: membership pipeline
--
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run only on an empty project (it creates tables).
--
-- Design notes
-- • The public (anon key) can NOT read or write any table directly.
--   Visitors can only call three functions: submit_join, submit_contact
--   and subscribe_newsletter. Those validate input and never reveal
--   whether someone is already registered.
-- • Everything else is visible only to emails listed in public.admins
--   who have logged in with a magic link.
-- • Data minimisation (Kenya Data Protection Act 2019): no ID numbers,
--   no dates of birth (only an age band), no location finer than an area.
-- ════════════════════════════════════════════════════════════════════

-- ── Types ────────────────────────────────────────────────────────────
create type public.person_stage as enum ('newcomer', 'volunteer', 'member', 'lead');


-- ── Admins ───────────────────────────────────────────────────────────
create table public.admins (
  email      text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;


-- ── Projects (the placement menu) ────────────────────────────────────
create table public.projects (
  id          smallint generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name        text not null,
  description text,
  active      boolean not null default true,
  sort_order  int not null default 0
);

insert into public.projects (slug, name, description, sort_order) values
  ('school-visits',  'School visits & pad distribution', 'Visit schools, distribute sanitary pads and support health talks.', 1),
  ('green-futures',  'Green Futures',                    'School tree nurseries that fund girls'' sanitary supplies.',          2),
  ('mhm-curriculum', 'MHM curriculum',                   'Help design and pilot the menstrual health management curriculum.',  3);


-- ── People (everyone in the pipeline) ────────────────────────────────
create table public.people (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null check (char_length(full_name) between 2 and 80),
  phone             text not null unique check (phone ~ '^\+[1-9][0-9]{7,14}$'),  -- E.164, WhatsApp number
  email             text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  age_band          text not null check (age_band in ('18-24', '25-29', '30-35', '36+')),
  area              text check (area is null or char_length(area) <= 80),
  interests         text[] not null default '{}',   -- project slugs
  heard_from        text check (heard_from in ('whatsapp', 'instagram', 'school_visit', 'event', 'friend', 'other')),

  stage             public.person_stage not null default 'newcomer',
  stage_changed_at  timestamptz not null default now(),
  in_whatsapp       boolean not null default false,  -- ticked by the admin once they are in the community
  next_follow_up_at timestamptz default (now() + interval '48 hours'),
  fee_paid          boolean not null default false,
  fee_paid_on       date,
  notes             text,

  consent_version   text not null,
  consented_at      timestamptz not null default now(),
  source            text not null default 'website' check (source in ('website', 'admin')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint fee_date_needs_fee check (fee_paid or fee_paid_on is null)
);

create index people_stage_idx     on public.people (stage);
create index people_follow_up_idx on public.people (next_follow_up_at);
create index people_created_idx   on public.people (created_at);


-- ── Stage history (audit trail; drives the 90-day trial clock) ──────
create table public.stage_changes (
  id         bigint generated always as identity primary key,
  person_id  uuid not null references public.people (id) on delete cascade,
  from_stage public.person_stage,
  to_stage   public.person_stage not null,
  changed_at timestamptz not null default now(),
  changed_by text
);
create index stage_changes_person_idx on public.stage_changes (person_id);


-- ── Follow-up log ────────────────────────────────────────────────────
create table public.follow_ups (
  id         bigint generated always as identity primary key,
  person_id  uuid not null references public.people (id) on delete cascade,
  channel    text not null default 'whatsapp' check (channel in ('whatsapp', 'call', 'in_person')),
  note       text check (note is null or char_length(note) <= 1000),
  done_at    timestamptz not null default now(),
  done_by    text default (auth.jwt() ->> 'email')
);
create index follow_ups_person_idx on public.follow_ups (person_id);


-- ── Project placements ───────────────────────────────────────────────
create table public.assignments (
  id         bigint generated always as identity primary key,
  person_id  uuid not null references public.people (id) on delete cascade,
  project_id smallint not null references public.projects (id),
  role       text check (role is null or char_length(role) <= 80),
  started_on date not null default current_date,
  ended_on   date,
  check (ended_on is null or ended_on >= started_on)
);
create index assignments_person_idx on public.assignments (person_id);


-- ── Events and attendance ────────────────────────────────────────────
create table public.events (
  id         bigint generated always as identity primary key,
  title      text not null check (char_length(title) between 2 and 120),
  starts_at  timestamptz not null,
  location   text,
  project_id smallint references public.projects (id),
  notes      text,
  created_at timestamptz not null default now()
);
create index events_starts_idx on public.events (starts_at);

create table public.attendance (
  event_id  bigint not null references public.events (id) on delete cascade,
  person_id uuid   not null references public.people (id) on delete cascade,
  role      text check (role is null or char_length(role) <= 80),  -- the "named role" for first events
  attended  boolean not null default false,
  primary key (event_id, person_id)
);


-- ── Contact form and newsletter ──────────────────────────────────────
create table public.contact_messages (
  id         bigint generated always as identity primary key,
  name       text not null check (char_length(name) between 2 and 80),
  email      text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone      text check (phone is null or char_length(phone) <= 20),
  subject    text not null check (char_length(subject) <= 60),
  message    text not null check (char_length(message) between 2 and 3000),
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  email           text primary key check (email = lower(email) and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  subscribed_at   timestamptz not null default now(),
  unsubscribed_at timestamptz
);


-- ── Triggers ─────────────────────────────────────────────────────────
create or replace function public.tg_people_before()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' and new.stage is distinct from old.stage then
    new.stage_changed_at := now();
  end if;
  if new.fee_paid and new.fee_paid_on is null then
    new.fee_paid_on := current_date;
  end if;
  if not new.fee_paid then
    new.fee_paid_on := null;
  end if;
  return new;
end;
$$;

create trigger people_before
  before insert or update on public.people
  for each row execute function public.tg_people_before();

create or replace function public.tg_people_stage_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    insert into public.stage_changes (person_id, from_stage, to_stage, changed_by)
    values (new.id,
            case when tg_op = 'UPDATE' then old.stage end,
            new.stage,
            coalesce(auth.jwt() ->> 'email', 'website'));
  end if;
  return null;
end;
$$;

create trigger people_stage_log
  after insert or update of stage on public.people
  for each row execute function public.tg_people_stage_log();


-- ── Public functions (the only things the anon key can do) ───────────

-- Join form. Returns nothing, whether the number is new or already known,
-- so the form can't be used to check who is registered.
create or replace function public.submit_join(
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
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone     text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_interests text[];
begin
  if coalesce(p_website, '') <> '' then
    return;  -- bot
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

  -- Basic flood protection
  if (select count(*) from public.people where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'We are receiving a lot of sign-ups right now. Please try again in a few minutes.' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(distinct i), '{}')
    into v_interests
    from unnest(coalesce(p_interests, '{}')) as i
   where i in (select slug from public.projects where active);

  insert into public.people (full_name, phone, email, age_band, area, interests, heard_from, consent_version)
  values (
    trim(p_full_name),
    v_phone,
    nullif(lower(trim(coalesce(p_email, ''))), ''),
    p_age_band,
    nullif(trim(coalesce(p_area, '')), ''),
    v_interests,
    p_heard_from,
    p_consent_version
  )
  on conflict (phone) do update set
    full_name       = excluded.full_name,
    email           = coalesce(excluded.email, people.email),
    age_band        = excluded.age_band,
    area            = coalesce(excluded.area, people.area),
    interests       = (select coalesce(array_agg(distinct x), '{}')
                         from unnest(people.interests || excluded.interests) as x),
    consent_version = excluded.consent_version,
    consented_at    = now(),
    next_follow_up_at = coalesce(people.next_follow_up_at, now() + interval '48 hours');
end;
$$;

create or replace function public.submit_contact(
  p_name    text,
  p_email   text,
  p_subject text,
  p_message text,
  p_phone   text default null,
  p_website text default null   -- honeypot
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(p_website, '') <> '' then
    return;
  end if;
  if (select count(*) from public.contact_messages where created_at > now() - interval '10 minutes') >= 20 then
    raise exception 'Too many messages right now. Please try again in a few minutes.' using errcode = 'P0001';
  end if;
  insert into public.contact_messages (name, email, phone, subject, message)
  values (trim(p_name), lower(trim(p_email)), nullif(trim(coalesce(p_phone, '')), ''), p_subject, trim(p_message));
end;
$$;

create or replace function public.subscribe_newsletter(
  p_email   text,
  p_website text default null   -- honeypot
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(p_website, '') <> '' then
    return;
  end if;
  insert into public.newsletter_subscribers (email)
  values (lower(trim(p_email)))
  on conflict (email) do update set subscribed_at = now(), unsubscribed_at = null;
end;
$$;


-- ── Admin helper: retention clean-up ─────────────────────────────────
-- Deletes people who signed up more than 12 months ago and never moved
-- past Newcomer (as promised in the privacy notice). Admin only.
create or replace function public.purge_stale_newcomers()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  delete from public.people
   where stage = 'newcomer'
     and created_at < now() - interval '12 months';
  get diagnostics n = row_count;
  return n;
end;
$$;


-- ── Monthly metrics (by sign-up month / event month, Nairobi time) ───
create or replace view public.monthly_metrics
with (security_invoker = true)
as
with months as (
  select date_trunc('month', created_at at time zone 'Africa/Nairobi')::date as month from public.people
  union
  select date_trunc('month', starts_at at time zone 'Africa/Nairobi')::date from public.events
),
signups as (
  select date_trunc('month', p.created_at at time zone 'Africa/Nairobi')::date as month,
         count(*)                                                    as signups,
         count(*) filter (where p.in_whatsapp)                       as whatsapp_joined,
         count(*) filter (where exists (select 1 from public.assignments a where a.person_id = p.id)) as placed
    from public.people p
   group by 1
),
att as (
  select date_trunc('month', e.starts_at at time zone 'Africa/Nairobi')::date as month,
         count(distinct e.id)                   as events,
         count(a.person_id)                     as expected,
         count(a.person_id) filter (where a.attended) as attended
    from public.events e
    left join public.attendance a on a.event_id = e.id
   group by 1
)
select m.month,
       coalesce(s.signups, 0)          as signups,
       coalesce(s.whatsapp_joined, 0)  as whatsapp_joined,
       coalesce(s.placed, 0)           as placed_in_project,
       case when s.signups > 0 then round(100.0 * s.placed / s.signups) end           as project_uptake_pct,
       coalesce(a.events, 0)           as events,
       coalesce(a.expected, 0)         as expected_attendees,
       coalesce(a.attended, 0)         as attended,
       case when a.expected > 0 then round(100.0 * a.attended / a.expected) end       as attendance_pct
  from months m
  left join signups s using (month)
  left join att a     using (month)
 order by m.month desc;


-- ── Row level security ───────────────────────────────────────────────
alter table public.admins                 enable row level security;
alter table public.projects               enable row level security;
alter table public.people                 enable row level security;
alter table public.stage_changes          enable row level security;
alter table public.follow_ups             enable row level security;
alter table public.assignments            enable row level security;
alter table public.events                 enable row level security;
alter table public.attendance             enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Admins: full access to everything
create policy admin_all on public.projects               for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.people                 for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.stage_changes          for select to authenticated using (public.is_admin());
create policy admin_all on public.follow_ups             for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.assignments            for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.events                 for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.attendance             for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.contact_messages       for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.newsletter_subscribers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_read on public.admins                for select to authenticated using (public.is_admin());

-- Public: may read the list of active projects (for the Join form), nothing else
create policy public_read_active on public.projects for select to anon, authenticated using (active);

-- Belt and braces: the anon role gets no direct table rights at all
revoke all on all tables    in schema public from anon;
revoke all on all sequences in schema public from anon;
grant select (id, slug, name, description, sort_order, active) on public.projects to anon;

-- Functions: only the three submit functions are callable by visitors
revoke execute on all functions in schema public from public, anon;
grant execute on function public.submit_join(text, text, text, boolean, text, text, text, text[], text, text) to anon, authenticated;
grant execute on function public.submit_contact(text, text, text, text, text, text)                         to anon, authenticated;
grant execute on function public.subscribe_newsletter(text, text)                                            to anon, authenticated;
grant execute on function public.is_admin()                                                                  to authenticated;
grant execute on function public.purge_stale_newcomers()                                                     to authenticated;
