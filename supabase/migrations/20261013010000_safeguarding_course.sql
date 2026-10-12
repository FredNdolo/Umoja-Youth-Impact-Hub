-- ════════════════════════════════════════════════════════════════════
-- Online courses, starting with Safeguarding Basics (from the UYIH Child
-- Protection and Safeguarding Policy).
--
-- • Questions and the answer key live here, never in the website code.
-- • Members answer through answer_course_question(), which tells them right
--   or wrong (with an explanation) once they have committed to an answer.
-- • finish_course_quiz() scores the attempt; a fail clears the answers so
--   they can retake. Passing is required before Safeguarding Basics can be
--   submitted; the admin's confirmation then acts as the Designated
--   Safeguarding Lead's countersignature (policy Annex 1).
-- ════════════════════════════════════════════════════════════════════

create table public.courses (
  code      text primary key check (code ~ '^[a-z0-9_]+$'),
  title     text not null,
  pass_mark smallint not null check (pass_mark > 0)
);

create table public.course_questions (
  id          bigint generated always as identity primary key,
  course_code text not null references public.courses (code) on delete cascade,
  position    smallint not null,
  question    text not null,
  options     text[] not null check (cardinality(options) between 2 and 6),
  correct     smallint not null,
  explanation text not null,
  policy_ref  text,
  unique (course_code, position),
  check (correct >= 0 and correct < cardinality(options))
);

-- Answers in the current attempt: {"<position>": <choice>}
create table public.course_progress (
  person_id   uuid not null references public.people (id) on delete cascade,
  course_code text not null references public.courses (code) on delete cascade,
  answers     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (person_id, course_code)
);

create table public.course_attempts (
  id          bigint generated always as identity primary key,
  person_id   uuid not null references public.people (id) on delete cascade,
  course_code text not null references public.courses (code) on delete cascade,
  score       smallint not null,
  total       smallint not null,
  passed      boolean not null,
  created_at  timestamptz not null default now()
);
create index course_attempts_person_idx on public.course_attempts (person_id, course_code);

alter table public.courses          enable row level security;
alter table public.course_questions enable row level security;
alter table public.course_progress  enable row level security;
alter table public.course_attempts  enable row level security;
create policy admin_all on public.courses          for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.course_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.course_progress  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.course_attempts  for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.courses, public.course_questions, public.course_progress, public.course_attempts from anon;


-- ── Safeguarding Basics ──────────────────────────────────────────────
insert into public.courses (code, title, pass_mark) values ('safeguarding', 'Safeguarding Basics', 12);

insert into public.course_questions (course_code, position, question, options, correct, explanation, policy_ref) values
('safeguarding', 1,
 'Under UYIH’s policy, who counts as a “child”?',
 array['Anyone under 13', 'Anyone under 16', 'Anyone under 18', 'Anyone still in school'], 2,
 'A child is anyone under 18, in line with the Constitution of Kenya, 2010 and the Children Act, 2022.', 'Section 3'),

('safeguarding', 2,
 'Whose job is it to keep children safe during UYIH activities?',
 array['Only the Designated Safeguarding Lead', 'Only the teachers at the school', 'Everyone acting for UYIH: office bearers, staff, members and volunteers', 'Only people who work directly with children every day'], 2,
 'Safeguarding is everyone’s responsibility, not only the Designated Safeguarding Lead’s.', 'Sections 1 and 6'),

('safeguarding', 3,
 'During a school visit, a girl quietly tells you something worrying and asks you to promise to keep it a secret. What do you do?',
 array['Promise, so she keeps trusting you', 'Gently explain that you can’t keep it secret because you need to tell someone who can help', 'Tell her to speak to her teacher instead', 'Change the subject and report it if it happens again'], 1,
 'Never promise confidentiality. Explain, in a way the child understands, that you need to tell someone who can help.', 'Section 11'),

('safeguarding', 4,
 'A pupil starts to tell you about something that may be abuse. Which of these should you NOT do?',
 array['Stay calm and listen', 'Reassure them it isn’t their fault', 'Ask lots of detailed questions to find out exactly what happened', 'Write down what they said in their own words afterwards'], 2,
 'Don’t investigate or interrogate. Let the child speak in their own words; the Safeguarding Lead and authorities handle the rest.', 'Section 11'),

('safeguarding', 5,
 'You have a safeguarding concern but you’re not sure it is “serious enough”. What should you do?',
 array['Wait until you’re sure', 'Report it to the Designated Safeguarding Lead the same day', 'Discuss it with other volunteers first', 'Ask the child’s friends what they know'], 1,
 'Your duty is to report, not to judge how serious it is or to sort it out yourself. Report to the DSL the same day using the Concern/Incident Report Form.', 'Sections 5 and 12'),

('safeguarding', 6,
 'A child is in immediate danger. What comes first?',
 array['Fill in the Concern/Incident Report Form', 'Call the Kenya Police on 999 or 112 (or the Gender & Children Protection Desk)', 'Email the Executive Director', 'Wait for the next team meeting'], 1,
 'In immediate danger, call the police (999/112) without delay, then tell the DSL or Executive Director as soon as it is safe.', 'Section 12, Step 3a'),

('safeguarding', 7,
 'What is the free, 24-hour number for Childline Kenya?',
 array['999', '116', '112', '1195'], 1,
 'Childline Kenya is 116: toll-free, 24 hours.', 'Section 12, key contacts'),

('safeguarding', 8,
 'Your concern is about the Designated Safeguarding Lead themself. Who do you report to?',
 array['The DSL anyway', 'The Executive Director', 'Another volunteer', 'Nobody, it’s too sensitive'], 1,
 'If the concern is about the DSL, report directly to the Executive Director. If it is about the Executive Director, report to the Management Committee.', 'Section 12'),

('safeguarding', 9,
 'You took great photos at a sanitary pad distribution and want to post them on UYIH’s Instagram. What do you need first?',
 array['Nothing, as long as faces are blurred', 'Just a verbal OK from a teacher', 'Written consent from a parent/guardian or the school, plus the DSL’s sign-off because it’s a menstrual-health activity', 'Permission from the girls themselves'], 2,
 'Public use of children’s photos needs written consent first, and anything linked to menstrual health or period poverty also needs the DSL’s sign-off.', 'Section 9, Photography'),

('safeguarding', 10,
 'After a session, a pupil asks for your phone number so you can chat on WhatsApp. What do you do?',
 array['Give it; it builds trust', 'Give it but only reply during the day', 'Politely say no; contact goes through the school, a parent/guardian, or the Girl Guide leaders', 'Follow them on social media instead'], 2,
 'UYIH representatives don’t contact children on personal phones or social media. Communication goes through the school, a parent/guardian or the Girl Guide unit’s adult leaders.', 'Section 9, Communication'),

('safeguarding', 11,
 'A pupil keeps disrupting your session. What do you do?',
 array['Punish them yourself so the session can continue', 'Make them stand outside alone', 'Refer it to the school’s teaching staff', 'Ignore it and leave early'], 2,
 'UYIH representatives never discipline a child or use any physical punishment. Behaviour concerns go to the school’s own teachers.', 'Section 9'),

('safeguarding', 12,
 'After an activity, a child needs a lift home and you’re the only one with a car. What’s right?',
 array['Drive them; it’s a short trip', 'Don’t drive them alone: tell the DSL in advance and have a second adult present, or make the arrangement known to the school and a parent/guardian', 'Drive them but stay on the phone with a friend', 'Let them sit in the back seat'], 1,
 'A child should never be transported alone in a private vehicle by one UYIH representative. The DSL must be told in advance and a second adult should be present, or the arrangement made known to the school and a parent/guardian.', 'Section 9, Transport'),

('safeguarding', 13,
 'You took photos of children on your own phone at an event. What should you do with them?',
 array['Keep them; they’re your photos', 'Post the best ones on your personal account', 'Move them to secure UYIH storage and delete them from your phone as soon as possible', 'Send them to the children’s parents directly'], 2,
 'Use official UYIH devices where possible. If you use a personal device, transfer the images to secure UYIH storage and delete them from your phone soon.', 'Section 9, Photography'),

('safeguarding', 14,
 'You report a concern in good faith, but it turns out to be unfounded. What happens to you?',
 array['You face disciplinary action', 'Nothing bad: nobody who raises a concern in good faith faces retaliation', 'You lose your membership', 'You can’t report again for a year'], 1,
 'No one who raises a concern in good faith faces retaliation, even if it isn’t substantiated. Only deliberately false or malicious reports are a disciplinary matter.', 'Section 17');

-- Spread the right answers across A–D so there's no pattern to guess:
-- rotate each question's options so the correct one lands on the target slot.
with target(position, slot) as (values
  (1,2),(2,0),(3,3),(4,1),(5,0),(6,2),(7,3),(8,1),(9,3),(10,0),(11,1),(12,2),(13,0),(14,3))
update public.course_questions q
   set options = (select array_agg(q.options[((i - ((t.slot - q.correct + 4) % 4) + 4) % 4) + 1] order by i)
                    from generate_series(0, 3) i),
       correct = t.slot
  from target t
 where q.course_code = 'safeguarding' and q.position = t.position and cardinality(q.options) = 4;

update public.tasks
   set description = 'A short online course on UYIH’s Child Protection and Safeguarding Policy: 7 quick lessons and a 14-question quiz (pass mark 12). Then sign the policy’s declaration. The Designated Safeguarding Lead confirms (countersigns) it afterwards.'
 where code = 'safeguarding';


-- ── Member functions ─────────────────────────────────────────────────
-- Questions (without answers) and the member's progress
create or replace function public.get_course(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id uuid := public.my_person_id();
  c    public.courses;
  v_answers jsonb;
begin
  if v_id is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  select * into c from public.courses where code = p_code;
  if not found then raise exception 'Course not found.' using errcode = 'P0001'; end if;
  select answers into v_answers from public.course_progress where person_id = v_id and course_code = p_code;
  v_answers := coalesce(v_answers, '{}'::jsonb);

  return jsonb_build_object(
    'code', c.code, 'title', c.title, 'pass_mark', c.pass_mark,
    'questions', (
      select jsonb_agg(jsonb_build_object(
               'position', q.position, 'question', q.question, 'options', q.options, 'policy_ref', q.policy_ref,
               -- feedback only for questions already answered in this attempt
               'answered', case when v_answers ? q.position::text then jsonb_build_object(
                  'choice', (v_answers ->> q.position::text)::int,
                  'correct', (v_answers ->> q.position::text)::int = q.correct,
                  'correct_choice', q.correct,
                  'explanation', q.explanation) end)
             order by q.position)
        from public.course_questions q where q.course_code = p_code),
    'best', (select jsonb_build_object('score', score, 'total', total, 'passed', passed, 'at', created_at)
               from public.course_attempts where person_id = v_id and course_code = p_code
              order by passed desc, score desc, created_at desc limit 1),
    'attempts', (select count(*) from public.course_attempts where person_id = v_id and course_code = p_code)
  );
end;
$$;

-- Lock in an answer; returns whether it was right, with the explanation.
-- Answers can't be changed once given (within an attempt).
create or replace function public.answer_course_question(p_code text, p_position int, p_choice int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := public.my_person_id();
  q    public.course_questions;
  v_answers jsonb;
  v_choice  int;
begin
  if v_id is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  select * into q from public.course_questions where course_code = p_code and position = p_position;
  if not found then raise exception 'Question not found.' using errcode = 'P0001'; end if;
  if p_choice is null or p_choice < 0 or p_choice >= cardinality(q.options) then
    raise exception 'Choose one of the answers.' using errcode = 'P0001';
  end if;

  insert into public.course_progress (person_id, course_code) values (v_id, p_code)
  on conflict (person_id, course_code) do nothing;
  select answers into v_answers from public.course_progress
   where person_id = v_id and course_code = p_code for update;

  if v_answers ? p_position::text then
    v_choice := (v_answers ->> p_position::text)::int;  -- already answered: keep the first answer
  else
    v_choice := p_choice;
    update public.course_progress
       set answers = answers || jsonb_build_object(p_position::text, p_choice), updated_at = now()
     where person_id = v_id and course_code = p_code;
  end if;

  return jsonb_build_object('choice', v_choice, 'correct', v_choice = q.correct,
                            'correct_choice', q.correct, 'explanation', q.explanation);
end;
$$;

-- Score the attempt. A pass is recorded; a fail clears answers for a retake.
create or replace function public.finish_course_quiz(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid := public.my_person_id();
  c       public.courses;
  v_answers jsonb;
  v_total int;
  v_score int;
  v_passed boolean;
begin
  if v_id is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  select * into c from public.courses where code = p_code;
  if not found then raise exception 'Course not found.' using errcode = 'P0001'; end if;
  select answers into v_answers from public.course_progress where person_id = v_id and course_code = p_code;
  select count(*) into v_total from public.course_questions where course_code = p_code;
  if v_answers is null or (select count(*) from jsonb_object_keys(v_answers)) < v_total then
    raise exception 'Please answer every question first.' using errcode = 'P0001';
  end if;

  select count(*) into v_score
    from public.course_questions q
   where q.course_code = p_code and (v_answers ->> q.position::text)::int = q.correct;
  v_passed := v_score >= c.pass_mark;

  insert into public.course_attempts (person_id, course_code, score, total, passed)
  values (v_id, p_code, v_score, v_total, v_passed);
  update public.course_progress set answers = '{}'::jsonb, updated_at = now()
   where person_id = v_id and course_code = p_code;

  return jsonb_build_object('score', v_score, 'total', v_total, 'passed', v_passed, 'pass_mark', c.pass_mark);
end;
$$;

-- Safeguarding Basics can only be submitted after passing the online course.
-- (The admin can still mark it done directly, e.g. after an in-person briefing.)
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
    if not exists (select 1 from public.course_attempts
                    where person_id = v_id and course_code = 'safeguarding' and passed) then
      raise exception 'Please pass the Safeguarding Basics quiz first.' using errcode = 'P0001';
    end if;
    if p_declaration is not true then
      raise exception 'Please read and accept the safeguarding declaration.' using errcode = 'P0001';
    end if;
    insert into public.member_profiles (person_id) values (v_id) on conflict (person_id) do nothing;
    perform set_config('uyih.allow_declaration', 'on', true);
    update public.member_profiles set safeguarding_declared_at = now() where person_id = v_id;
  end if;
  update public.task_assignments
     set status = 'submitted', member_note = nullif(trim(coalesce(p_note, '')), '')
   where id = p_assignment_id;
end;
$$;

revoke execute on function public.get_course(text), public.answer_course_question(text, int, int),
  public.finish_course_quiz(text), public.submit_task(bigint, text, boolean) from public, anon;
grant execute on function public.get_course(text), public.answer_course_question(text, int, int),
  public.finish_course_quiz(text), public.submit_task(bigint, text, boolean) to authenticated;
