-- ════════════════════════════════════════════════════════════════════
-- Tree Monitor: site geofences, check-in distances, archiving sites
--
-- Each site gets a geofence: a circle around its GPS centre (radius in
-- metres, default 250 m — about the size of a school compound). With it
-- the app can tell which school a field member is standing in, pick the
-- plot from its walked boundary, list the trees around them, and flag
-- records taken somewhere unexpected.
--
-- Every check-in now records how far the phone was from the tree's
-- registered point (distance_m). It's computed by the database, so it
-- can't be edited, and reports can flag check-ins made far from the tree.
--
-- Sites can be archived (active = false) when work there ends; archived
-- sites drop out of the field app and public pages but keep their history.
-- Admins can delete a site or plot only while nothing has been recorded
-- against it (the foreign keys already enforce this).
-- ════════════════════════════════════════════════════════════════════

alter table public.tm_sites
  add column if not exists geofence_m integer not null default 250 check (geofence_m between 20 and 5000);

-- Great-circle distance in metres between two points
create or replace function public.tm_distance_m(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision
language sql
immutable
set search_path = public
as $$
  select case when lat1 is null or lng1 is null or lat2 is null or lng2 is null then null else
    2 * 6371008.8 * asin(least(1, sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2))))
  end;
$$;

alter table public.tm_checkins add column if not exists distance_m numeric(9,1);

-- Stamp who recorded it (as before) and, for check-ins, the distance from the tree
create or replace function public.tm_stamp_person()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := public.my_person_id();
  t  record;
begin
  if tg_table_name = 'tm_trees' then
    new.registered_by := coalesce(me, new.registered_by);
    new.code := upper(coalesce(nullif(trim(new.code), ''), public.tm_new_code()));
  elsif tg_table_name = 'tm_checkins' then
    new.checked_by := coalesce(me, new.checked_by);
    if new.checked_at > now() + interval '10 minutes' then new.checked_at := now(); end if;
    select latitude, longitude into t from public.tm_trees where id = new.tree_id;
    new.distance_m := round(public.tm_distance_m(new.latitude, new.longitude, t.latitude, t.longitude)::numeric, 1);
  elsif tg_table_name = 'tm_baselines' then
    new.recorded_by := coalesce(me, new.recorded_by);
  else
    new.recorded_by := coalesce(me, new.recorded_by);
  end if;
  return new;
end;
$$;
revoke execute on function public.tm_stamp_person() from public, anon, authenticated;

-- Existing check-ins
update public.tm_checkins c
   set distance_m = round(public.tm_distance_m(c.latitude, c.longitude, t.latitude, t.longitude)::numeric, 1)
  from public.tm_trees t
 where t.id = c.tree_id and c.distance_m is null and c.latitude is not null;

-- Public map: archived sites stay hidden (tm_public_sites already filters
-- on active); trees at archived sites stay visible as part of the record.

-- ── Housekeeping from the October 2026 audit ─────────────────────────
-- Pin the search path of a helper used in check constraints
alter function public.short_labels_ok(text[], integer) set search_path = public;

-- Indexes for the lookups the app and reports use most (foreign keys
-- that had no covering index)
create index if not exists attendance_person_idx        on public.attendance (person_id);
create index if not exists tm_trees_species_idx         on public.tm_trees (species_id);
create index if not exists tm_trees_batch_idx           on public.tm_trees (batch_id);
create index if not exists tm_checkins_checked_by_idx   on public.tm_checkins (checked_by);
create index if not exists tm_sales_nursery_idx         on public.tm_sales (nursery_id);
create index if not exists tm_distributions_site_idx    on public.tm_distributions (site_id);
create index if not exists tm_batches_species_idx       on public.tm_batches (species_id);
create index if not exists certificates_course_idx      on public.certificates (course_code);
create index if not exists tasks_project_idx            on public.tasks (project_id);
create index if not exists events_project_idx           on public.events (project_id);
create index if not exists assignments_project_idx      on public.assignments (project_id);
