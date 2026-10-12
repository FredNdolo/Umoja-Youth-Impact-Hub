-- ════════════════════════════════════════════════════════════════════
-- Starter task library, drawn from the Green Futures concept note and the
-- UYIH organisation profile. Skills use the same names as the skills list on
-- the member profile, so "Matches your skills" and skill-based assignment work.
--
-- • Open tasks: any member can pick them up (desk work, no contact with children).
-- • Assigned tasks: involve schools, children, money or coordination, so the
--   admin assigns them (to people who have done Safeguarding Basics where noted).
-- • Tasks with a project count towards "3 project tasks"; content tasks count
--   towards "create or share content".
-- All of them can be edited, switched off or deleted in /admin → Tasks.
-- ════════════════════════════════════════════════════════════════════

with lib (title, description, kind, project, skills, points, is_open) as (values
  -- ── Green Futures ───────────────────────────────────────────────────
  ('Green Futures: school needs assessment visit',
   'Join a UYIH lead on a visit to a pilot school to agree where the nursery goes, who looks after it (club, teachers) and what the school needs. Take notes on land, water and storage.

Safeguarding Basics must be completed first.',
   'task', 'green-futures', array['Needs assessment', 'Working with schools', 'Interviewing', 'Documentation'], 3, false),

  ('Green Futures: baseline survey',
   'Help collect the Phase 1 baseline in a pilot school: tree cover and land condition, and (with the school''s permission) how often girls miss school during their periods and what sanitary products they can get. Anonymous answers only, no names.

Safeguarding Basics must be completed first.',
   'task', 'green-futures', array['Survey design', 'Data collection', 'Google Forms', 'Kobo Toolbox', 'Menstrual health education'], 3, false),

  ('Green Futures: tidy up the baseline data',
   'Enter the baseline survey forms into the shared sheet, check for gaps and typos, and make a one-page summary with 3–5 headline numbers.',
   'task', 'green-futures', array['Data entry', 'Data analysis', 'Microsoft Excel', 'Google Sheets', 'Data visualisation'], 2, false),

  ('Green Futures: nursery workshop assistant',
   'Assist at a hands-on nursery workshop for students and teachers: setting up beds, potting, sowing indigenous and fruit tree seeds, watering and labelling.

Safeguarding Basics must be completed first.',
   'task', 'green-futures', array['Tree nursery management', 'Seedling propagation', 'Indigenous trees', 'Workshop facilitation', 'Environmental education'], 3, false),

  ('Green Futures: seedling care check-in',
   'Visit a school nursery (or call the club patron) and log the week''s numbers: seedlings alive, newly sown, sold and lost, plus anything the nursery needs (water, shade net, seeds).

Safeguarding Basics must be completed first for school visits.',
   'task', 'green-futures', array['Tree nursery management', 'Seedling propagation', 'Inventory management', 'Documentation'], 2, false),

  ('Green Futures: seedling stock and sales record',
   'Set up a simple record for each pilot nursery: seedlings in stock, sales (date, buyer type, number, price, M-Pesa or cash) and money spent on sanitary products. Keep it simple enough for a school club to fill in.',
   'task', 'green-futures', array['Bookkeeping', 'Inventory management', 'Google Sheets', 'Microsoft Excel', 'Financial reporting'], 2, true),

  ('Green Futures: find seedling buyers',
   'List at least 10 possible buyers for school seedlings in and around Narok: farmers'' groups, churches, schools, county and NGO tree-planting drives, hotels, landscapers. Add a contact, what trees they might want and when.',
   'task', 'green-futures', array['Sales', 'Marketing', 'Networking', 'Research'], 2, true),

  ('Green Futures: sanitary product price survey',
   'Compare prices and suppliers in Narok for disposable and reusable sanitary pads (including local pad makers). Note price per girl per year, minimum order, delivery and quality. This decides how far each shilling of seedling sales goes.',
   'task', 'green-futures', array['Research', 'Procurement', 'Reusable pad sewing', 'Budgeting'], 2, true),

  ('Green Futures: parents'' association briefing note',
   'Write a one-page, plain-language note (English and Kiswahili) explaining Green Futures to parents and the parent–teacher association: what the nursery is, where the money goes, and how parents can help.',
   'task', 'green-futures', array['Writing', 'Kiswahili', 'Translation', 'Communication strategy', 'Working with parents'], 2, true),

  ('Green Futures: quarterly impact numbers',
   'Pull together the quarter''s numbers for each pilot school: trees raised and planted, people trained, seedling income, and sanitary products bought and distributed. Use the nursery records and visit notes.',
   'task', 'green-futures', array['Monitoring and evaluation (M&E)', 'Impact measurement', 'Data analysis', 'Report writing'], 3, false),

  -- ── School visits & pad distribution ────────────────────────────────
  ('Pad distribution: plan the logistics',
   'For an upcoming school visit: confirm numbers with the school, pack and count the products, arrange transport and keep a hand-over sheet signed by the school (counts only, no girls'' names).',
   'task', 'school-visits', array['Logistics', 'Distribution management', 'Inventory management', 'Transport coordination', 'Planning'], 2, false),

  ('School visit: support team',
   'Be part of the UYIH team at a school visit: registration, setting up, handing out materials and helping the facilitator. Follow the safeguarding rules at all times, including on photos.

Safeguarding Basics must be completed first.',
   'task', 'school-visits', array['Working with schools', 'Volunteer coordination', 'Venue setup', 'Teamwork'], 2, false),

  -- ── MHM curriculum ──────────────────────────────────────────────────
  ('MHM: gather good teaching materials',
   'Find 5–10 free, trustworthy menstrual health resources suitable for Kenyan primary and secondary pupils (Kenya Ministry of Health, UNICEF, WASH partners and similar). Add a link and one line on each.',
   'task', 'mhm-curriculum', array['Research', 'Menstrual health education', 'Health education', 'Literature review'], 2, true),

  ('MHM: draft a 40-minute session plan',
   'Draft a 40-minute menstrual health session for upper primary or lower secondary: aims, an ice-breaker, key messages, a hands-on activity and how to answer common questions. Keep it age-appropriate and respectful.',
   'task', 'mhm-curriculum', array['Lesson planning', 'Curriculum development', 'Menstrual health education', 'Facilitation'], 3, true),

  -- ── Content (counts towards "create or share content") ──────────────
  ('Write a short impact story',
   'Write a 150–300 word story about a UYIH activity you took part in: what happened, who it helped and why it matters. No children''s names, and only photos where consent was given. Add the link or document when you submit.',
   'content', null, array['Storytelling', 'Writing', 'Blogging', 'Content creation'], 2, true),

  ('Design a Green Futures poster',
   'Design a poster or social media graphic explaining Green Futures in one picture: “One seed. Two crises solved.” Use UYIH''s greens and terracotta. Add the link when you submit.',
   'content', null, array['Graphic design', 'Canva', 'Poster design', 'Branding'], 2, true),

  ('Make a 30-second Green Futures video',
   'Make a short vertical video (Reels/TikTok/Status) explaining how a school nursery pays for girls'' sanitary products. Show hands, seedlings and places, not children''s faces. Add the link when you submit.',
   'content', null, array['Video editing', 'CapCut', 'TikTok', 'Instagram', 'Content creation'], 2, true),

  -- ── General ─────────────────────────────────────────────────────────
  ('Event photographer',
   'Take photos at a UYIH event and share the best 20 in the UYIH folder. Ask permission before photographing adults; photograph children only where the school has given consent, never in a way that identifies them by name or location.

Safeguarding Basics must be completed first for events with children.',
   'task', null, array['Photography', 'Event photography', 'Documentation'], 2, false),

  ('Translate key messages into Kiswahili and Maa',
   'Translate UYIH''s short description, the Green Futures loop and the safeguarding contact line into Kiswahili and/or Maa so we can share them in schools and communities.',
   'task', null, array['Translation', 'Kiswahili', 'Interpretation', 'Cultural liaison'], 2, true),

  ('Map potential partners in Narok',
   'List organisations UYIH could partner with in Narok County: county departments, schools, CBOs, NGOs, faith groups, businesses. For each: what they do, how we could work together, and a public contact.',
   'task', null, array['Research', 'Partnership building', 'Stakeholder engagement', 'Networking'], 2, true),

  ('Find funding opportunities',
   'Find 5 open grants, competitions or sponsorships that fit Green Futures, menstrual health or youth environmental work in Kenya. Note the funder, amount, deadline, eligibility and link.',
   'task', null, array['Grant writing', 'Fundraising', 'Resource mobilisation', 'Research'], 2, true),

  ('Plan a community clean-up or tree-planting day',
   'Draft a plan for a one-day clean-up or tree-planting activity: place, date, partners, materials, volunteer roles, safety and how we''ll count results (bags collected, trees planted).',
   'task', null, array['Event planning', 'Clean-up campaigns', 'Tree planting', 'Community mobilisation', 'Volunteer coordination'], 2, true)
)
insert into public.tasks (title, description, kind, project_id, skills, points, is_open)
select l.title, l.description, l.kind, p.id, l.skills, l.points, l.is_open
  from lib l
  left join public.projects p on p.slug = l.project
 where not exists (select 1 from public.tasks t where t.title = l.title);
