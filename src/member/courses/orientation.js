// UYIH Orientation: who we are, what we do and how membership works.
// Drawn from the UYIH Organisation Profile and the Green Futures proposal (Aug 2026).
// The quiz questions and answers live in the database
// (supabase/migrations/…_orientation_course.sql) so they're checked on the server.
//
// If the mission, team or membership checklist changes, update these lessons
// and the quiz together.

export const LESSONS = [
  {
    icon: '👋',
    title: 'Who we are',
    ref: 'Organisation profile',
    points: [
      'Umoja Youth Impact Hub (UYIH) is a youth-led community-based organisation in Narok East, Kenya.',
      'It was founded in 2024 by a group of young professionals. “Umoja” means unity in Kiswahili.',
      'We work where three things meet: community health, the environment and youth empowerment.',
      'Our core belief: local solutions, led by passionate youth and supported by strategic partnerships, create the most lasting change.',
    ],
  },
  {
    icon: '🎯',
    title: 'Our mission and vision',
    ref: 'Organisation profile',
    points: [
      'Mission: to empower residents of underserved communities by providing access to healthcare, environmental solutions and economic opportunities, thereby enhancing quality of life and promoting sustainable development.',
      'Vision: to foster healthier, more educated and environmentally sustainable communities through integrated youth-led initiatives that create lasting positive change.',
      'In short: the mission is what we do every day; the vision is the Narok we are working towards.',
    ],
  },
  {
    icon: '💚',
    title: 'Our five values',
    ref: 'Organisation profile',
    points: [
      'Community ownership: lasting change comes from within the community. We work with people, not for them.',
      'Innovation: we look for creative answers to hard problems, like a tree nursery that pays for sanitary pads.',
      'Integrity: we are transparent and accountable. Record what you spend, sell and hand out, honestly.',
      'Inclusion: our work serves everyone, whatever their age, gender or background.',
      'Environmental stewardship: we conserve and act sustainably in everything we do, even at a one-day event.',
    ],
  },
  {
    icon: '🌍',
    title: 'What we do',
    ref: 'Programmes',
    points: [
      'Green Futures Initiative (our flagship): school tree nurseries whose seedling sales fund sanitary products for girls.',
      'Youth Health Access: sanitary product drives, menstrual health education and school health talks. So far we have reached 6 schools through pad donations and over 1,200 students.',
      'Environmental Stewardship: tree planting, school eco-clubs, waste education and clean-ups. More than 3,500 trees planted since 2024.',
      'Leadership & Skills: workshops, bootcamps and mentorship for young people.',
      'Events & Partnerships: open days, forums and community gatherings with our partners.',
    ],
  },
  {
    icon: '🌱',
    title: 'Green Futures in 60 seconds',
    ref: 'Green Futures proposal',
    points: [
      'Two problems keep each other going in Narok East: degraded land, and girls missing school because they lack sanitary products.',
      'The loop: grow indigenous and fruit tree seedlings in a school nursery → sell them to local markets → profits buy sanitary products for girls (preferably reusable pads) → the surplus grows the nursery.',
      'It is built to sustain itself. One-off pad drives run out; a nursery keeps producing.',
      'We deliver it with the Kenya Girl Guides Association (KGGA). Girl Guides in each school are trained to run the nursery; UYIH members on site handle the technical nursery work and pass their training on to the Girl Guides.',
      'The 3 pilot schools are in Narok East: Ntulele Primary, Ongata Naado Junior and Primary, and Mosiro Day and Boarding Primary. Each aims for about 10,000 seedlings with at least 75% surviving.',
      'Pilot-year targets: 5,000+ trees planted, 20–30% less absenteeism among girls, and KES 100,000–500,000 in seedling sales.',
    ],
  },
  {
    icon: '🧭',
    title: 'How we work, and your path to membership',
    ref: 'Membership checklist',
    points: [
      'Everyone starts as a volunteer. Our WhatsApp community is where activities, events and news are shared first.',
      'Your member page lists tasks. Some are assigned to you based on the skills in your profile; open tasks can be picked up by anyone. Submit a task when it’s done and a UYIH lead confirms it.',
      'To become a member within your 90-day trial: attend 2 activities, take a named role at an event, join a project and complete 3 project tasks, complete your profile, Orientation and Safeguarding Basics (with the declaration), create or share content about UYIH, and pay the membership fee (Ksh 1,000).',
      'Anything involving schools or children needs Safeguarding Basics first.',
      'Representing UYIH: be respectful and punctual, never share anyone’s personal details or children’s photos without consent, and ask a lead before speaking to the media or partners on UYIH’s behalf.',
      'UYIH’s constitution sets out members’ rights and duties. Ask a UYIH lead if you’d like a copy.',
    ],
  },
  {
    icon: '👥',
    title: 'Who’s who',
    ref: 'Organisation profile',
    points: [
      'Fred Ndolo: Executive Director.',
      'Joseph Ndolo: Operations and Finance Manager.',
      'Annette Kuseo: Director of Health Initiatives.',
      'Nicki Cherotich: Director of Environmental Programs.',
      'Questions? Message us on WhatsApp (+254 783 218 081) or email umojayouthhub@gmail.com.',
    ],
  },
];
