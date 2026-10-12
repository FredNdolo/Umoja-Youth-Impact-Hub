-- The two trigger functions are only meant to run from their triggers.
-- Supabase grants EXECUTE on new functions to the API roles by default, so
-- remove it; triggers still fire normally (Postgres doesn't check EXECUTE
-- when a trigger runs).
revoke execute on function public.tg_people_before()    from public, anon, authenticated;
revoke execute on function public.tg_people_stage_log() from public, anon, authenticated;
