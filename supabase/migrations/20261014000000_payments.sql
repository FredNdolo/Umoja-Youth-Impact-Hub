-- ════════════════════════════════════════════════════════════════════
-- M-Pesa payments (manual confirmation).
--
-- People pay to the UYIH paybill, then tell us the M-Pesa confirmation code:
--   • donations: anyone, on /donate (optional; lets us say thank you)
--   • membership fee: logged-in members, on /me/pay
-- The admin checks each code against the paybill statement and confirms it
-- in /admin → Payments. Confirming a membership fee ticks "fee paid" on the
-- person's record. The public can only call the submit functions.
-- ════════════════════════════════════════════════════════════════════

create table public.payments (
  id           bigint generated always as identity primary key,
  kind         text not null check (kind in ('donation', 'membership_fee')),
  person_id    uuid references public.people (id) on delete set null,
  name         text check (name is null or char_length(name) between 2 and 80),
  phone        text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  email        text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  amount       integer not null check (amount between 1 and 10000000),
  mpesa_code   text not null unique check (mpesa_code ~ '^[A-Z0-9]{10}$'),
  message      text check (message is null or char_length(message) <= 500),
  status       text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  admin_note   text check (admin_note is null or char_length(admin_note) <= 500),
  handled_by   text,
  handled_at   timestamptz,
  created_at   timestamptz not null default now(),
  check (kind <> 'membership_fee' or person_id is not null or status <> 'pending')
);
create index payments_status_idx on public.payments (status, created_at desc);
create index payments_person_idx on public.payments (person_id);

alter table public.payments enable row level security;
create policy admin_all on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.payments from anon;

-- Who handled it, and when
create or replace function public.payments_stamp()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'pending' then
      new.handled_at := null; new.handled_by := null;
    else
      new.handled_at := now(); new.handled_by := auth.jwt() ->> 'email';
    end if;
  end if;
  return new;
end;
$$;
create trigger payments_stamp before update on public.payments
  for each row execute function public.payments_stamp();

-- Confirming a membership fee marks the fee as paid on the person's record
create or replace function public.payments_apply_fee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.kind = 'membership_fee' and new.person_id is not null
     and new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    update public.people
       set fee_paid = true, fee_paid_on = coalesce(fee_paid_on, (now() at time zone 'Africa/Nairobi')::date)
     where id = new.person_id and not fee_paid;
  end if;
  return new;
end;
$$;
create trigger payments_apply_fee after update on public.payments
  for each row execute function public.payments_apply_fee();
revoke execute on function public.payments_stamp(), public.payments_apply_fee() from public, anon, authenticated;

-- M-Pesa codes are 10 letters/digits, e.g. SJK4XYZ12A. Accept spaces and lower case.
create or replace function public.clean_mpesa_code(p text)
returns text
language sql
immutable
set search_path = public
as $$ select upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g')) $$;


-- ── Public: tell us about a donation ─────────────────────────────────
create or replace function public.submit_donation(
  p_amount     integer,
  p_mpesa_code text,
  p_name       text default null,
  p_phone      text default null,
  p_email      text default null,
  p_message    text default null,
  p_website    text default null   -- honeypot
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := public.clean_mpesa_code(p_mpesa_code);
begin
  if coalesce(p_website, '') <> '' then
    return;  -- bot
  end if;
  if v_code !~ '^[A-Z0-9]{10}$' then
    raise exception 'Check the M-Pesa code: it has 10 letters and numbers, like SJK4XYZ12A.' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount < 1 then
    raise exception 'Enter the amount you sent.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.payments where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'Too many requests right now. Please try again in a few minutes.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.payments where mpesa_code = v_code) then
    raise exception 'We already have this M-Pesa code. Thank you!' using errcode = 'P0001';
  end if;
  insert into public.payments (kind, name, phone, email, amount, mpesa_code, message)
  values ('donation',
          nullif(trim(coalesce(p_name, '')), ''),
          nullif(trim(coalesce(p_phone, '')), ''),
          nullif(lower(trim(coalesce(p_email, ''))), ''),
          p_amount, v_code,
          nullif(trim(coalesce(p_message, '')), ''));
end;
$$;
revoke execute on function public.submit_donation(integer, text, text, text, text, text, text) from public;
grant  execute on function public.submit_donation(integer, text, text, text, text, text, text) to anon, authenticated;


-- ── Members: membership fee ──────────────────────────────────────────
create or replace function public.submit_fee_payment(p_mpesa_code text, p_amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id   uuid := public.my_person_id();
  v_code text := public.clean_mpesa_code(p_mpesa_code);
begin
  if v_id is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if (select fee_paid from public.people where id = v_id) then
    raise exception 'Your membership fee is already recorded as paid.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.payments where person_id = v_id and kind = 'membership_fee' and status = 'pending') then
    raise exception 'We already have a payment from you waiting to be confirmed.' using errcode = 'P0001';
  end if;
  if v_code !~ '^[A-Z0-9]{10}$' then
    raise exception 'Check the M-Pesa code: it has 10 letters and numbers, like SJK4XYZ12A.' using errcode = 'P0001';
  end if;
  if p_amount is null or p_amount < 1 then
    raise exception 'Enter the amount you sent.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.payments where mpesa_code = v_code) then
    raise exception 'This M-Pesa code has already been used.' using errcode = 'P0001';
  end if;
  insert into public.payments (kind, person_id, name, phone, email, amount, mpesa_code)
  select 'membership_fee', p.id, p.full_name, p.phone,
         case when p.email like '%@members.uyih.invalid' then null else p.email end,
         p_amount, v_code
    from public.people p where p.id = v_id;
end;
$$;

-- The member's own fee payments (latest first)
create or replace function public.get_my_fee_payments()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'amount', amount, 'mpesa_code', mpesa_code, 'status', status,
           'admin_note', admin_note, 'created_at', created_at) order by created_at desc), '[]'::jsonb)
    from public.payments
   where kind = 'membership_fee' and person_id = public.my_person_id();
$$;

revoke execute on function public.submit_fee_payment(text, integer), public.get_my_fee_payments() from public, anon;
grant  execute on function public.submit_fee_payment(text, integer), public.get_my_fee_payments() to authenticated;
