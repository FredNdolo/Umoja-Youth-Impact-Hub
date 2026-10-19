-- ════════════════════════════════════════════════════════════════════
-- Joining online now needs an email address
--
-- Email is the default way members log in (the login link is sent there),
-- so the Join form asks for it and the database refuses a sign-up without
-- a valid one. Re-joining with a number already on file is unchanged.
-- Admins can still add people without an email (e.g. verbal consent at an
-- event) from the dashboard; this only affects the public Join form.
-- ════════════════════════════════════════════════════════════════════

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
  -- Email is how members log in, so it's required
  if v_email is null or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(v_email) > 120 then
    raise exception 'Please enter a valid email address.' using errcode = 'P0001';
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

  -- Each email logs in one person
  if exists (select 1 from public.people where email = v_email) then
    raise exception 'This email is already used by a UYIH member. Use another email, or log in instead.' using errcode = 'P0001';
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
