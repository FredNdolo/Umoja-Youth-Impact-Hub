-- ════════════════════════════════════════════════════════════════════
-- UYIH Tree Monitor (Green Futures)
--
-- Follows every tree from nursery to long-term survival, built so the
-- records can stand up to a forestry or carbon audit (KFS, Plan Vivo,
-- Verra, NEMA): planting evidence, locked baselines, a change log on every
-- important record, and standard exports (done in the app).
--
--   site (school / community site)
--     ├── plot  ── baseline (locked once captured)
--     │     └── tree ── check-ins (health, height, photo, GPS)
--     └── nursery ── seed batches ── seedling sales
--   pad distributions (what the seedling sales paid for)
--
-- Who can do what:
--   • admin (public.admins)        everything
--   • coordinator (tm_team)        manage sites, plots, nurseries, sales, team
--   • field (tm_team)              register trees, check-ins, nursery records
--   • everyone, incl. the public   headline numbers and a map via tm_public_*()
-- Only UYIH members assigned to the field team get access. Children (e.g.
-- Girl Guides) never have accounts; their work is recorded by the member.
-- ════════════════════════════════════════════════════════════════════

-- ── Roles ────────────────────────────────────────────────────────────
create table public.tm_team (
  person_id  uuid primary key references public.people (id) on delete cascade,
  role       text not null default 'field' check (role in ('field', 'coordinator')),
  active     boolean not null default true,
  added_at   timestamptz not null default now(),
  added_by   text default (auth.jwt() ->> 'email')
);

create or replace function public.tm_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_admin() then 'admin'
    else (select role from public.tm_team where person_id = public.my_person_id() and active)
  end;
$$;
create or replace function public.tm_can_field()
returns boolean language sql stable security definer set search_path = public
as $$ select public.tm_role() is not null $$;
create or replace function public.tm_can_manage()
returns boolean language sql stable security definer set search_path = public
as $$ select public.tm_role() in ('admin', 'coordinator') $$;

-- ── Places ───────────────────────────────────────────────────────────
create table public.tm_sites (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 120),
  code          text unique check (code is null or code ~ '^[A-Z0-9-]{2,20}$'),
  kind          text not null default 'school' check (kind in ('school', 'community', 'public_land', 'other')),
  county        text not null default 'Narok',
  sub_county    text,
  ward          text,
  latitude      double precision check (latitude between -90 and 90),
  longitude     double precision check (longitude between -180 and 180),
  contact_name  text,
  contact_phone text,
  agreement_ref text,            -- land / MOU reference
  agreement_on  date,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.tm_plots (
  id                 uuid primary key default gen_random_uuid(),
  site_id            uuid not null references public.tm_sites (id) on delete restrict,
  name               text not null check (char_length(name) between 1 and 120),
  code               text,
  area_ha            numeric(10,4) check (area_ha is null or area_ha >= 0),
  boundary           jsonb,      -- GeoJSON Polygon (lng, lat)
  soil_type          text,
  land_use_before    text,
  notes              text,
  baseline_locked_at timestamptz,
  created_at         timestamptz not null default now(),
  unique (site_id, name)
);

-- Pre-planting evidence. Locked once captured: nobody can change it after.
create table public.tm_baselines (
  plot_id               uuid primary key references public.tm_plots (id) on delete restrict,
  recorded_on           date not null default (now() at time zone 'Africa/Nairobi')::date,
  recorded_by           uuid references public.people (id) on delete set null,
  existing_trees        integer check (existing_trees is null or existing_trees >= 0),
  canopy_cover_pct      numeric(5,2) check (canopy_cover_pct is null or canopy_cover_pct between 0 and 100),
  land_use_history      text,
  degradation_notes     text,
  additionality_notes   text,
  photo_paths           text[] not null default '{}',
  locked_at             timestamptz,
  locked_by             text,
  created_at            timestamptz not null default now()
);

create table public.tm_nurseries (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references public.tm_sites (id) on delete restrict,
  name       text not null check (char_length(name) between 2 and 120),
  capacity   integer check (capacity is null or capacity >= 0),
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  unique (site_id, name)
);

create table public.tm_species (
  id              uuid primary key default gen_random_uuid(),
  scientific_name text not null unique,
  common_name     text not null,
  swahili_name    text,
  maa_name        text,
  is_native       boolean not null default true,
  category        text not null default 'indigenous' check (category in ('indigenous', 'fruit', 'agroforestry', 'exotic')),
  uses            text,
  notes           text,
  created_at      timestamptz not null default now()
);

-- ── Nursery ──────────────────────────────────────────────────────────
create table public.tm_batches (
  id           uuid primary key default gen_random_uuid(),
  nursery_id   uuid not null references public.tm_nurseries (id) on delete restrict,
  species_id   uuid not null references public.tm_species (id),
  code         text not null,
  seed_source  text,                 -- provenance, e.g. KFS seed centre
  sown_on      date,
  sown         integer check (sown is null or sown >= 0),
  germinated   integer check (germinated is null or germinated >= 0),
  ready        integer check (ready is null or ready >= 0),
  transplanted integer not null default 0 check (transplanted >= 0),
  lost         integer not null default 0 check (lost >= 0),
  status       text not null default 'sown' check (status in ('sown', 'germinating', 'growing', 'ready', 'finished')),
  notes        text,
  created_by   uuid references public.people (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (nursery_id, code),
  check (germinated is null or sown is null or germinated <= sown)
);

-- ── Green Futures loop: seedling sales → sanitary products ───────────
create table public.tm_sales (
  id          uuid primary key default gen_random_uuid(),
  nursery_id  uuid not null references public.tm_nurseries (id) on delete restrict,
  sold_on     date not null default (now() at time zone 'Africa/Nairobi')::date,
  species_id  uuid references public.tm_species (id),
  quantity    integer not null check (quantity > 0),
  amount_kes  numeric(12,2) not null check (amount_kes >= 0),
  buyer_type  text not null default 'community' check (buyer_type in ('community', 'farmer', 'school', 'organisation', 'government', 'other')),
  buyer_name  text,
  payment     text not null default 'mpesa' check (payment in ('mpesa', 'cash', 'bank', 'other')),
  reference   text,
  notes       text,
  recorded_by uuid references public.people (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.tm_distributions (
  id                uuid primary key default gen_random_uuid(),
  site_id           uuid not null references public.tm_sites (id) on delete restrict,
  distributed_on    date not null default (now() at time zone 'Africa/Nairobi')::date,
  product           text not null default 'reusable_pads' check (product in ('reusable_pads', 'disposable_pads', 'other')),
  packs             integer not null check (packs > 0),
  girls_reached     integer check (girls_reached is null or girls_reached >= 0),   -- a count only, never names
  cost_kes          numeric(12,2) check (cost_kes is null or cost_kes >= 0),
  funded_from_sales boolean not null default true,
  notes             text,
  recorded_by       uuid references public.people (id) on delete set null,
  created_at        timestamptz not null default now()
);

-- ── Trees ────────────────────────────────────────────────────────────
-- Codes avoid look-alike characters (0/O, 1/I) so they're easy to read off a label
create or replace function public.tm_new_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  c text;
begin
  loop
    select 'UYIH-' || string_agg(substr('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 1 + floor(random() * 32)::int, 1), '')
      into c from generate_series(1, 6);
    exit when not exists (select 1 from public.tm_trees where code = c);
  end loop;
  return c;
end;
$$;

create table public.tm_trees (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique check (code ~ '^UYIH-[2-9A-HJ-NP-Z]{6}$'),
  plot_id           uuid not null references public.tm_plots (id) on delete restrict,
  species_id        uuid not null references public.tm_species (id),
  batch_id          uuid references public.tm_batches (id) on delete set null,
  planted_on        date not null default (now() at time zone 'Africa/Nairobi')::date,
  latitude          double precision not null check (latitude between -90 and 90),
  longitude         double precision not null check (longitude between -180 and 180),
  accuracy_m        numeric(7,2) check (accuracy_m is null or accuracy_m >= 0),
  status            text not null default 'planted' check (status in ('planted', 'alive', 'stressed', 'dead', 'missing', 'replaced')),
  height_cm         numeric(8,2) check (height_cm is null or height_cm >= 0),
  dbh_cm            numeric(8,2) check (dbh_cm is null or dbh_cm >= 0),
  last_checked_at   timestamptz,
  replaces_tree_id  uuid references public.tm_trees (id),
  sponsor_name      text,                       -- shown publicly if set
  notes             text,
  client_id         text unique,                -- offline sync idempotency
  registered_by     uuid references public.people (id) on delete set null,
  registered_at     timestamptz not null default now()
);
create index tm_trees_plot_idx on public.tm_trees (plot_id);
create index tm_trees_status_idx on public.tm_trees (status);
alter table public.tm_trees alter column code set default public.tm_new_code();

create table public.tm_checkins (
  id          uuid primary key default gen_random_uuid(),
  tree_id     uuid not null references public.tm_trees (id) on delete cascade,
  checked_at  timestamptz not null default now(),
  checked_by  uuid references public.people (id) on delete set null,
  health      text not null check (health in ('healthy', 'stressed', 'diseased', 'damaged', 'dead', 'missing')),
  height_cm   numeric(8,2) check (height_cm is null or height_cm between 0 and 10000),
  dbh_cm      numeric(8,2) check (dbh_cm is null or dbh_cm between 0 and 1000),
  latitude    double precision check (latitude is null or latitude between -90 and 90),
  longitude   double precision check (longitude is null or longitude between -180 and 180),
  accuracy_m  numeric(7,2),
  photo_path  text,
  notes       text check (notes is null or char_length(notes) <= 1000),
  client_id   text unique,                      -- offline sync idempotency
  offline     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index tm_checkins_tree_idx on public.tm_checkins (tree_id, checked_at desc);

-- ── Audit trail ──────────────────────────────────────────────────────
create table public.tm_change_log (
  id         bigint generated always as identity primary key,
  table_name text not null,
  record_id  text not null,
  action     text not null,
  old_data   jsonb,
  new_data   jsonb,
  changed_by text,
  changed_at timestamptz not null default now()
);
create index tm_change_log_record_idx on public.tm_change_log (table_name, record_id);

create or replace function public.tm_log_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tm_change_log (table_name, record_id, action, old_data, new_data, changed_by)
  values (tg_table_name,
          coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'id',
                   (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'plot_id',
                   (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'person_id'),
          tg_op,
          case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
          coalesce(auth.jwt() ->> 'email', 'system'));
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['tm_sites', 'tm_plots', 'tm_baselines', 'tm_trees', 'tm_checkins', 'tm_batches', 'tm_sales', 'tm_distributions', 'tm_team'] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.tm_log_change()', t || '_log', t);
  end loop;
end $$;

-- ── Integrity rules ──────────────────────────────────────────────────
-- Who registered / checked / recorded is set by the database, not the app
create or replace function public.tm_stamp_person()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.my_person_id();
begin
  if tg_table_name = 'tm_trees' then
    new.registered_by := coalesce(me, new.registered_by);
    new.code := upper(coalesce(nullif(trim(new.code), ''), public.tm_new_code()));
  elsif tg_table_name = 'tm_checkins' then
    new.checked_by := coalesce(me, new.checked_by);
    if new.checked_at > now() + interval '10 minutes' then new.checked_at := now(); end if;
  elsif tg_table_name = 'tm_baselines' then
    new.recorded_by := coalesce(me, new.recorded_by);
  else
    new.recorded_by := coalesce(me, new.recorded_by);
  end if;
  return new;
end;
$$;
create trigger tm_trees_stamp       before insert on public.tm_trees       for each row execute function public.tm_stamp_person();
create trigger tm_checkins_stamp    before insert on public.tm_checkins    for each row execute function public.tm_stamp_person();
create trigger tm_baselines_stamp   before insert on public.tm_baselines   for each row execute function public.tm_stamp_person();
create trigger tm_sales_stamp       before insert on public.tm_sales       for each row execute function public.tm_stamp_person();
create trigger tm_dist_stamp        before insert on public.tm_distributions for each row execute function public.tm_stamp_person();

create or replace function public.tm_batches_before()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then new.created_by := coalesce(public.my_person_id(), new.created_by); end if;
  return new;
end;
$$;
create trigger tm_batches_before before insert or update on public.tm_batches for each row execute function public.tm_batches_before();

-- A check-in updates the tree's current state (only if it's the latest one)
create or replace function public.tm_apply_checkin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.tm_checkins c where c.tree_id = new.tree_id and c.checked_at > new.checked_at and c.id <> new.id) then
    return new;   -- an older observation synced late: keep it in history only
  end if;
  update public.tm_trees t
     set status = case
                    when t.status = 'replaced' then 'replaced'
                    when new.health = 'healthy' then 'alive'
                    when new.health in ('stressed', 'diseased', 'damaged') then 'stressed'
                    else new.health    -- dead / missing
                  end,
         height_cm = coalesce(new.height_cm, t.height_cm),
         dbh_cm = coalesce(new.dbh_cm, t.dbh_cm),
         last_checked_at = new.checked_at
   where t.id = new.tree_id;
  return new;
end;
$$;
create trigger tm_checkins_apply after insert on public.tm_checkins for each row execute function public.tm_apply_checkin();

-- Locked baselines can never change; locking also marks the plot
create or replace function public.tm_baseline_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.locked_at is not null then raise exception 'This baseline is locked and can''t be deleted.' using errcode = 'P0001'; end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and old.locked_at is not null then
    raise exception 'This baseline is locked and can''t be changed.' using errcode = 'P0001';
  end if;
  if new.locked_at is not null then
    new.locked_by := coalesce(auth.jwt() ->> 'email', 'system');
    new.locked_at := now();
    update public.tm_plots set baseline_locked_at = new.locked_at where id = new.plot_id;
  end if;
  return new;
end;
$$;
create trigger tm_baselines_guard before insert or update or delete on public.tm_baselines for each row execute function public.tm_baseline_guard();

-- Nobody but an admin can delete planting or monitoring evidence
create or replace function public.tm_no_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only an admin can delete monitoring records.' using errcode = '42501';
  end if;
  return old;
end;
$$;
create trigger tm_trees_nodelete    before delete on public.tm_trees    for each row execute function public.tm_no_delete();
create trigger tm_checkins_nodelete before delete on public.tm_checkins for each row execute function public.tm_no_delete();

revoke execute on function public.tm_log_change(), public.tm_stamp_person(), public.tm_batches_before(),
  public.tm_apply_checkin(), public.tm_baseline_guard(), public.tm_no_delete() from public, anon, authenticated;

-- ── Access rules ─────────────────────────────────────────────────────
alter table public.tm_team          enable row level security;
alter table public.tm_sites         enable row level security;
alter table public.tm_plots         enable row level security;
alter table public.tm_baselines     enable row level security;
alter table public.tm_nurseries     enable row level security;
alter table public.tm_species       enable row level security;
alter table public.tm_batches       enable row level security;
alter table public.tm_sales         enable row level security;
alter table public.tm_distributions enable row level security;
alter table public.tm_trees         enable row level security;
alter table public.tm_checkins      enable row level security;
alter table public.tm_change_log    enable row level security;

-- Field team and admins can read everything in the tree monitor
do $$
declare t text;
begin
  foreach t in array array['tm_sites', 'tm_plots', 'tm_baselines', 'tm_nurseries', 'tm_species', 'tm_batches',
                           'tm_sales', 'tm_distributions', 'tm_trees', 'tm_checkins'] loop
    execute format('create policy field_read on public.%I for select to authenticated using (public.tm_can_field())', t);
  end loop;
end $$;

-- Team: everyone on it can see the team; managers change it
create policy team_read   on public.tm_team for select to authenticated using (public.tm_can_field());
create policy team_admin  on public.tm_team for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy team_coord  on public.tm_team for insert to authenticated with check (public.tm_can_manage() and role = 'field');

-- Managers (admin / coordinator) set up places, species and nursery sites
do $$
declare t text;
begin
  foreach t in array array['tm_sites', 'tm_plots', 'tm_nurseries', 'tm_species'] loop
    execute format('create policy manage_insert on public.%I for insert to authenticated with check (public.tm_can_manage())', t);
    execute format('create policy manage_update on public.%I for update to authenticated using (public.tm_can_manage()) with check (public.tm_can_manage())', t);
    execute format('create policy admin_delete on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- Field team records the work
do $$
declare t text;
begin
  foreach t in array array['tm_baselines', 'tm_batches', 'tm_sales', 'tm_distributions', 'tm_trees', 'tm_checkins'] loop
    execute format('create policy field_insert on public.%I for insert to authenticated with check (public.tm_can_field())', t);
  end loop;
end $$;
-- Baselines (until locked), nursery batches: field team can update
create policy field_update on public.tm_baselines for update to authenticated using (public.tm_can_field()) with check (public.tm_can_field());
create policy field_update on public.tm_batches   for update to authenticated using (public.tm_can_field()) with check (public.tm_can_field());
-- Trees, sales and distributions: managers correct them (every change is logged)
create policy manage_update on public.tm_trees         for update to authenticated using (public.tm_can_manage()) with check (public.tm_can_manage());
create policy manage_update on public.tm_sales         for update to authenticated using (public.tm_can_manage()) with check (public.tm_can_manage());
create policy manage_update on public.tm_distributions for update to authenticated using (public.tm_can_manage()) with check (public.tm_can_manage());
create policy admin_delete on public.tm_trees          for delete to authenticated using (public.is_admin());
create policy admin_delete on public.tm_checkins       for delete to authenticated using (public.is_admin());
create policy admin_delete on public.tm_batches        for delete to authenticated using (public.is_admin());
create policy admin_delete on public.tm_sales          for delete to authenticated using (public.is_admin());
create policy admin_delete on public.tm_distributions  for delete to authenticated using (public.is_admin());
create policy admin_delete on public.tm_baselines      for delete to authenticated using (public.is_admin());
-- Change log: managers can read it; nobody edits it
create policy manage_read on public.tm_change_log for select to authenticated using (public.tm_can_manage());

revoke all on public.tm_team, public.tm_sites, public.tm_plots, public.tm_baselines, public.tm_nurseries,
  public.tm_species, public.tm_batches, public.tm_sales, public.tm_distributions, public.tm_trees,
  public.tm_checkins, public.tm_change_log from anon;

-- ── Photos (private) ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('tree-photos', 'tree-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy tree_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'tree-photos' and public.tm_can_field());
create policy tree_photos_select on storage.objects for select to authenticated
  using (bucket_id = 'tree-photos' and public.tm_can_field());
create policy tree_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'tree-photos' and public.is_admin());

-- ── For the member area: my role and the team ───────────────────────
create or replace function public.tm_me()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('role', public.tm_role(), 'person_id', public.my_person_id());
$$;

-- Managers add members to the field team by person (admins can make coordinators)
create or replace function public.tm_member_directory()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.tm_can_manage() then coalesce((
    select jsonb_agg(jsonb_build_object('person_id', p.id, 'full_name', p.full_name, 'stage', p.stage,
                     'team_role', t.role, 'active', t.active,
                     'safeguarding', mp.safeguarding_declared_at is not null) order by p.full_name)
      from public.people p
      left join public.tm_team t on t.person_id = p.id
      left join public.member_profiles mp on mp.person_id = p.id
     where p.stage in ('volunteer', 'member', 'lead') or t.person_id is not null), '[]'::jsonb)
  else '[]'::jsonb end;
$$;

-- ── Public numbers and map (no names, no photos) ─────────────────────
create or replace function public.tm_public_summary()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with t as (select status from public.tm_trees where status <> 'replaced')
  select jsonb_build_object(
    'trees_planted', (select count(*) from public.tm_trees),
    'trees_living', (select count(*) from t where status in ('alive', 'stressed', 'planted')),
    'trees_checked', (select count(*) from public.tm_trees where last_checked_at is not null),
    'survival_pct', (select round(100.0 * count(*) filter (where status in ('alive', 'stressed'))
                                  / nullif(count(*) filter (where status in ('alive', 'stressed', 'dead', 'missing')), 0), 1) from t),
    'species', (select count(distinct species_id) from public.tm_trees),
    'sites', (select count(*) from public.tm_sites where active),
    'checkins', (select count(*) from public.tm_checkins),
    'seedlings_raised', (select coalesce(sum(coalesce(ready, germinated, 0)), 0) from public.tm_batches),
    'seedlings_sold', (select coalesce(sum(quantity), 0) from public.tm_sales),
    'sales_kes', (select coalesce(sum(amount_kes), 0) from public.tm_sales),
    'pad_packs', (select coalesce(sum(packs), 0) from public.tm_distributions),
    'girls_reached', (select coalesce(sum(girls_reached), 0) from public.tm_distributions),
    'updated_at', greatest((select max(checked_at) from public.tm_checkins), (select max(registered_at) from public.tm_trees))
  );
$$;

create or replace function public.tm_public_sites()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'name', s.name, 'kind', s.kind, 'county', s.county, 'sub_county', s.sub_county,
           'latitude', s.latitude, 'longitude', s.longitude,
           'trees', (select count(*) from public.tm_trees tr join public.tm_plots p on p.id = tr.plot_id where p.site_id = s.id),
           'living', (select count(*) from public.tm_trees tr join public.tm_plots p on p.id = tr.plot_id where p.site_id = s.id and tr.status in ('alive', 'stressed', 'planted')),
           'survival_pct', (select round(100.0 * count(*) filter (where tr.status in ('alive', 'stressed'))
                                  / nullif(count(*) filter (where tr.status in ('alive', 'stressed', 'dead', 'missing')), 0), 1)
                              from public.tm_trees tr join public.tm_plots p on p.id = tr.plot_id where p.site_id = s.id)
         ) order by s.name), '[]'::jsonb)
    from public.tm_sites s where s.active;
$$;

-- Tree points for the public map (rounded to ~10 m)
create or replace function public.tm_public_trees()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'code', t.code, 'lat', round(t.latitude::numeric, 4), 'lng', round(t.longitude::numeric, 4),
           'status', t.status, 'species', sp.common_name, 'site', s.name, 'planted_on', t.planted_on)), '[]'::jsonb)
    from public.tm_trees t
    join public.tm_species sp on sp.id = t.species_id
    join public.tm_plots p on p.id = t.plot_id
    join public.tm_sites s on s.id = p.site_id
   where t.status <> 'replaced';
$$;

-- One tree's public page (what a QR scan opens)
create or replace function public.tm_public_tree(p_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
           'code', t.code, 'status', t.status, 'planted_on', t.planted_on,
           'height_cm', t.height_cm, 'last_checked_at', t.last_checked_at, 'sponsor_name', t.sponsor_name,
           'species', sp.common_name, 'scientific_name', sp.scientific_name, 'swahili_name', sp.swahili_name,
           'maa_name', sp.maa_name, 'is_native', sp.is_native,
           'site', s.name, 'county', s.county,
           'lat', round(t.latitude::numeric, 4), 'lng', round(t.longitude::numeric, 4),
           'checkins', (select count(*) from public.tm_checkins c where c.tree_id = t.id),
           'growth', (select coalesce(jsonb_agg(jsonb_build_object('at', c.checked_at, 'height_cm', c.height_cm) order by c.checked_at), '[]'::jsonb)
                        from public.tm_checkins c where c.tree_id = t.id and c.height_cm is not null))
    from public.tm_trees t
    join public.tm_species sp on sp.id = t.species_id
    join public.tm_plots p on p.id = t.plot_id
    join public.tm_sites s on s.id = p.site_id
   where t.code = upper(trim(p_code));
$$;

revoke execute on function public.tm_public_summary(), public.tm_public_sites(), public.tm_public_trees(), public.tm_public_tree(text) from public;
grant  execute on function public.tm_public_summary(), public.tm_public_sites(), public.tm_public_trees(), public.tm_public_tree(text) to anon, authenticated;
revoke execute on function public.tm_me(), public.tm_member_directory(), public.tm_role(), public.tm_can_field(),
  public.tm_can_manage(), public.tm_new_code() from public, anon;
grant  execute on function public.tm_me(), public.tm_member_directory(), public.tm_role(), public.tm_can_field(),
  public.tm_can_manage(), public.tm_new_code() to authenticated;

-- ── Starting data ────────────────────────────────────────────────────
-- The three Green Futures pilot schools (add coordinates in the app)
insert into public.tm_sites (name, code, kind, county, sub_county) values
  ('Ntulele Primary School', 'NTULELE', 'school', 'Narok', 'Narok East'),
  ('Ongata Naado Junior and Primary School', 'ONGATA-NAADO', 'school', 'Narok', 'Narok East'),
  ('Mosiro Day and Boarding Primary School', 'MOSIRO', 'school', 'Narok', 'Narok East');

-- Starter species list: common indigenous, agroforestry and fruit trees for
-- the region. Check names and suitability with KFS and add local names.
insert into public.tm_species (scientific_name, common_name, swahili_name, maa_name, is_native, category, uses) values
  ('Croton megalocarpus',   'Croton',               null,  null,       true,  'indigenous',   'Shade, windbreak, fuelwood; drought tolerant'),
  ('Olea europaea subsp. cuspidata', 'African wild olive', 'Mzeituni', 'Oloirien', true, 'indigenous', 'Slow growing, long lived; culturally valued'),
  ('Vachellia xanthophloea', 'Yellow fever tree',   'Mgunga',     null,       true,  'indigenous',   'Riverine and wet areas; fast growing'),
  ('Markhamia lutea',       'Nile tulip',           null,   null,       true,  'indigenous',   'Shade, timber, ornamental'),
  ('Prunus africana',       'African cherry',       null,      null,       true,  'indigenous',   'Highland forest tree; medicinal bark (protected)'),
  ('Juniperus procera',     'African pencil cedar', null,   null,       true,  'indigenous',   'Highland forest tree; durable timber'),
  ('Cordia africana',       'Sudan teak',           null, null,     true,  'indigenous',   'Shade, timber, bee forage'),
  ('Warburgia ugandensis',  'East African greenheart', null, null,       true,  'indigenous',   'Medicinal; slow growing'),
  ('Podocarpus falcatus',   'East African yellowwood', null,      null,       true,  'indigenous',   'Highland forest tree'),
  ('Grevillea robusta',     'Silky oak',            null,   null,       false, 'agroforestry', 'Fast growing boundary and farm tree'),
  ('Mangifera indica',      'Mango',                'Mwembe',     null,       false, 'fruit',        'Fruit, shade'),
  ('Persea americana',      'Avocado',              'Mparachichi', null,      false, 'fruit',        'Fruit, income'),
  ('Psidium guajava',       'Guava',                'Mpera',      null,       false, 'fruit',        'Fruit, hardy');
