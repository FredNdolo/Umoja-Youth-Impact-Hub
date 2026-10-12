-- ════════════════════════════════════════════════════════════════════
-- Align the Orientation quiz and the Green Futures starter tasks with the
-- Green Futures proposal (August 2026): delivered with the Kenya Girl Guides
-- Association, Girl Guides trained to run the school nurseries. Seedlings:
-- a 1,000–5,000 starter stock (Phase 1), nurseries growing towards ~10,000
-- per school, 5,000+ planted in the pilot, 75% survival target.
-- ════════════════════════════════════════════════════════════════════

-- ── Orientation quiz ────────────────────────────────────────────────
update public.course_questions
   set options = array['It pays volunteers’ allowances', 'It is sent to Nairobi', 'It buys sanitary products for girls, and the surplus grows the nursery', 'It is saved for a school trip'],
       explanation = 'Profits fund sanitary products for girls (preferably reusable pads); the surplus is reinvested in expanding the nursery.'
 where course_code = 'orientation' and position = 6;

update public.course_questions
   set question = 'Who does UYIH deliver Green Futures with, and who is trained to run each school nursery?',
       options = array['The Kenya Girl Guides Association; Girl Guides in each school', 'The county government; the head teachers', 'A seedling company; its own staff', 'Nobody; UYIH runs every nursery alone'],
       correct = 0,
       explanation = 'Green Futures is delivered with the Kenya Girl Guides Association. Girl Guides are trained in nursery management and propagation, with UYIH members on site handling the technical work and passing on their training.'
 where course_code = 'orientation' and position = 8;


-- ── Green Futures tasks ─────────────────────────────────────────────
update public.tasks
   set title = 'Green Futures: set up a school nursery',
       description = 'Help set up the nursery at one of the pilot schools (Ntulele, Ongata Naado or Mosiro): beds, shade, water and storage, so training can begin as soon as schools reopen.

Safeguarding Basics must be completed first.',
       skills = array['Tree nursery management', 'Working with schools', 'Construction', 'Teamwork']
 where title = 'Green Futures: school needs assessment visit';

update public.tasks
   set title = 'Green Futures: Girl Guides nursery training assistant',
       description = 'Assist at hands-on nursery training for the Girl Guides at a pilot school: setting up beds, potting, sowing indigenous and fruit tree seeds, watering and labelling. You learn alongside them and help pass the training on.

Safeguarding Basics must be completed first.',
       skills = array['Tree nursery management', 'Seedling propagation', 'Indigenous trees', 'Workshop facilitation', 'Environmental education']
 where title = 'Green Futures: nursery workshop assistant';

update public.tasks
   set description = 'Visit a pilot school nursery (or call the Girl Guide unit leader) and log the week''s numbers: seedlings alive, newly sown, sold and lost, and the survival rate against the 75% target. Note anything the nursery needs (water, shade net, seeds).

Safeguarding Basics must be completed first for school visits.'
 where title = 'Green Futures: seedling care check-in';

update public.tasks
   set description = 'Set up a simple record for each pilot nursery: seedlings in stock, sales (date, buyer type, number, price, M-Pesa or cash) and money spent on sanitary products. Keep it simple enough for a Girl Guide unit to fill in.'
 where title = 'Green Futures: seedling stock and sales record';

update public.tasks
   set description = 'Help collect a starting point in a pilot school so we can show change later: how often girls miss school during their periods and what sanitary products they can get (with the school''s permission), plus tree cover on the school land. Anonymous answers only, no names.

Safeguarding Basics must be completed first.'
 where title = 'Green Futures: baseline survey';

insert into public.tasks (title, description, kind, project_id, skills, points, is_open)
select 'Green Futures: find seedling suppliers',
       'Phase 1 needs a starter stock of 1,000–5,000 indigenous and fruit tree seedlings across the three pilot schools; the nurseries then propagate their own. List at least 5 suppliers in and around Narok (Kenya Forest Service and community or private nurseries): species available, price per seedling, minimum order and delivery.',
       'task', p.id, array['Research', 'Procurement', 'Indigenous trees', 'Negotiation'], 2, true
  from public.projects p
 where p.slug = 'green-futures'
   and not exists (select 1 from public.tasks t where t.title = 'Green Futures: find seedling suppliers');
