-- ════════════════════════════════════════════════════════════════════
-- UYIH Orientation online course (lessons in src/member/courses/orientation.js).
-- Same engine as Safeguarding Basics: answers checked on the server, retakes
-- allowed. Passing is required before Orientation can be submitted; the admin
-- confirms it (or marks it done directly after an in-person orientation).
-- ════════════════════════════════════════════════════════════════════

insert into public.courses (code, title, pass_mark) values ('orientation', 'UYIH Orientation', 8);

insert into public.course_questions (course_code, position, question, options, correct, explanation, policy_ref) values
('orientation', 1,
 'Where does UYIH do most of its work?',
 array['Nairobi', 'Narok East, Narok County', 'Mombasa', 'Online only'], 1,
 'UYIH is a youth-led community-based organisation based in Narok East, Narok County.', 'Lesson 1'),

('orientation', 2,
 'UYIH works where three things meet. Which three?',
 array['Sport, music and art', 'Banking, farming and transport', 'Community health, the environment and youth empowerment', 'Tourism, wildlife and hotels'], 2,
 'Health, environment and youth empowerment run through everything we do.', 'Lesson 1'),

('orientation', 3,
 'Which statement is UYIH’s mission?',
 array['To empower residents of underserved communities by providing access to healthcare, environmental solutions and economic opportunities',
       'To build schools in every county in Kenya',
       'To give out sanitary pads once a year',
       'To run a tree-selling business for profit'], 0,
 'Our mission: empower underserved communities through access to healthcare, environmental solutions and economic opportunities.', 'Lesson 2'),

('orientation', 4,
 'You are buying supplies for an event. Which UYIH value means you keep receipts and record what you spent honestly?',
 array['Innovation', 'Environmental stewardship', 'Inclusion', 'Integrity'], 3,
 'Integrity: we are transparent and accountable in everything we do, including money and supplies.', 'Lesson 3'),

('orientation', 5,
 'A planning meeting is deciding what a village needs, without asking anyone from that village. Which value is being missed?',
 array['Innovation', 'Community ownership', 'Environmental stewardship', 'Integrity'], 1,
 'Community ownership: lasting change comes from within the community, so we work with people, not for them.', 'Lesson 3'),

('orientation', 6,
 'In the Green Futures loop, what happens to the money from selling seedlings?',
 array['It pays volunteers’ allowances', 'It is sent to Nairobi', 'It buys sanitary products for girls in the same school, and the surplus grows the nursery', 'It is saved for a school trip'], 2,
 'Profits fund sanitary products for girls in the same school; surplus is reinvested in the nursery.', 'Lesson 5'),

('orientation', 7,
 'Why is Green Futures designed around a school nursery rather than one-off pad donations?',
 array['Nurseries are cheaper to photograph', 'Donations are not allowed in schools', 'Seedlings are easier to carry than pads', 'A nursery keeps producing income, so support doesn’t run out'], 3,
 'One-off drives run out. A nursery that sells seedlings keeps funding sanitary products term after term.', 'Lesson 5'),

('orientation', 8,
 'How many pilot schools are in Green Futures Phase 1?',
 array['3', '1', '15', '10'], 0,
 'Phase 1 runs in 3 pilot schools. Scaling to 10 schools is the goal after the first year.', 'Lesson 5'),

('orientation', 9,
 'You’ve been asked to help at a school visit next week. What must you complete first?',
 array['Nothing, just turn up', 'Safeguarding Basics, including the declaration', 'The membership fee', 'A social media post'], 1,
 'Any work involving schools or children needs Safeguarding Basics first.', 'Lesson 6'),

('orientation', 10,
 'Which of these is part of the path from volunteer to member?',
 array['Planting 100 trees on your own', 'Recruiting five new members', 'Attending 2 activities and completing 3 project tasks', 'Paying a monthly fee'], 2,
 'The checklist includes 2 activities, a named role at an event, a project with 3 project tasks, your profile, Orientation, Safeguarding Basics, content about UYIH and the Ksh 1,000 membership fee.', 'Lesson 6');

update public.tasks
   set description = 'A short online course about UYIH: who we are, our mission and values, what we do, Green Futures in 60 seconds, and your path to membership. 7 quick lessons and a 10-question quiz (pass mark 8). A UYIH lead confirms it afterwards.'
 where code = 'orientation';


-- Orientation, like Safeguarding Basics, needs a passed quiz before it can be
-- submitted. (The admin can still mark either done directly.)
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
  if v_code in (select code from public.courses) then
    if not exists (select 1 from public.course_attempts
                    where person_id = v_id and course_code = v_code and passed) then
      raise exception 'Please pass the % quiz first.', (select title from public.courses where code = v_code)
        using errcode = 'P0001';
    end if;
  end if;
  if v_code = 'safeguarding' then
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

revoke execute on function public.submit_task(bigint, text, boolean) from public, anon;
grant execute on function public.submit_task(bigint, text, boolean) to authenticated;
