// Skill suggestions for the get-to-know-you profile and task tags.
// Members can also add their own; this list just makes typing quick.
// Grouped for readability; the picker searches across all of them.

const GROUPS = {
  'Communication & media': [
    'Public speaking', 'Presentation skills', 'Storytelling', 'Writing', 'Creative writing', 'Report writing',
    'Proposal writing', 'Grant writing', 'Copywriting', 'Blogging', 'Journalism', 'Editing', 'Proofreading',
    'Translation', 'Interpretation', 'Social media management', 'Content creation', 'Instagram', 'TikTok',
    'Facebook', 'X (Twitter)', 'LinkedIn', 'WhatsApp community management', 'Community management',
    'Digital marketing', 'Email marketing', 'Search engine optimisation (SEO)', 'Public relations',
    'Media relations', 'Radio presenting', 'Podcasting', 'MC / event hosting', 'Debate', 'Advocacy',
    'Campaign planning', 'Communication strategy', 'Newsletter writing', 'Customer service', 'Negotiation',
  ],
  'Creative & design': [
    'Photography', 'Event photography', 'Videography', 'Video editing', 'Drone photography', 'Graphic design',
    'Canva', 'Adobe Photoshop', 'Adobe Illustrator', 'Adobe Premiere Pro', 'CapCut', 'Figma', 'Poster design',
    'Logo design', 'Illustration', 'Drawing', 'Painting', 'Mural painting', 'Animation', 'Motion graphics',
    'UI/UX design', 'Branding', 'Music', 'Singing', 'Songwriting', 'Playing an instrument', 'Sound engineering',
    'DJing', 'Drama', 'Acting', 'Scriptwriting', 'Poetry', 'Spoken word', 'Dance', 'Choreography',
    'Fashion design', 'Tailoring', 'Beadwork', 'Crafts', 'Interior decoration', 'Set and stage design',
  ],
  'Education & training': [
    'Teaching', 'Tutoring', 'Mentoring', 'Coaching', 'Training of trainers', 'Facilitation',
    'Workshop facilitation', 'Curriculum development', 'Lesson planning', 'Early childhood education',
    'Primary education', 'Secondary education', 'Special needs education', 'Adult education', 'Life skills training',
    'Peer education', 'Career guidance', 'Study skills', 'E-learning', 'Online course design', 'Quiz design',
    'Mathematics', 'Science', 'English', 'Kiswahili', 'Literacy', 'Computer literacy training', 'Sports coaching',
    'Scouting', 'Girl Guides', 'Youth work',
  ],
  'Events & logistics': [
    'Event planning', 'Event management', 'Logistics', 'Procurement', 'Inventory management', 'Stock taking',
    'Registration desk', 'Ushering', 'Crowd management', 'Timekeeping', 'Catering', 'Cooking', 'Baking',
    'Venue setup', 'Sound and PA setup', 'Transport coordination', 'Driving', 'Motorbike riding', 'First aid',
    'Health and safety', 'Distribution management', 'Volunteer coordination', 'Scheduling', 'Travel planning',
  ],
  'Leadership & management': [
    'Leadership', 'Team leadership', 'Project management', 'Programme management', 'Planning', 'Strategic planning',
    'Operations', 'Decision making', 'Problem solving', 'Conflict resolution', 'Mediation', 'Teamwork',
    'Time management', 'Delegation', 'Meeting facilitation', 'Minute taking', 'Governance', 'Board membership',
    'Policy development', 'Change management', 'Risk management', 'Quality assurance', 'Human resources',
    'Recruitment', 'Volunteer management', 'Stakeholder engagement', 'Community mobilisation', 'Organising',
    'Entrepreneurship', 'Business planning', 'Small business management', 'Sales', 'Marketing',
  ],
  'Fundraising & partnerships': [
    'Fundraising', 'Resource mobilisation', 'Donor relations', 'Partnership building', 'Networking',
    'Sponsorship', 'Crowdfunding', 'M-Changa', 'Concept note writing', 'Budgeting for proposals',
    'Corporate social responsibility (CSR)', 'Government liaison', 'MOU drafting', 'Pitching',
  ],
  'Research & data': [
    'Research', 'Needs assessment', 'Survey design', 'Data collection', 'Kobo Toolbox', 'ODK', 'Google Forms',
    'Interviewing', 'Focus group discussions', 'Data entry', 'Data analysis', 'Data visualisation',
    'Monitoring and evaluation (M&E)', 'Impact measurement', 'Report analysis', 'Microsoft Excel',
    'Google Sheets', 'SPSS', 'STATA', 'R', 'Python', 'Power BI', 'GIS mapping', 'QGIS', 'Literature review',
    'Statistics', 'Qualitative research', 'Documentation',
  ],
  'Technology': [
    'Computer skills', 'Microsoft Word', 'Microsoft PowerPoint', 'Google Workspace', 'Typing',
    'IT support', 'Computer repair', 'Phone repair', 'Networking (IT)', 'Web development', 'WordPress',
    'HTML and CSS', 'JavaScript', 'React', 'App development', 'Database management', 'Cybersecurity',
    'Digital literacy', 'Online safety', 'AI tools', 'Website management', 'Zoom / online meetings',
  ],
  'Finance & admin': [
    'Accounting', 'Bookkeeping', 'Budgeting', 'Financial reporting', 'Financial literacy training',
    'M-Pesa management', 'Payroll', 'Auditing', 'Tax compliance', 'Administration', 'Office management',
    'Filing and records', 'Secretarial skills', 'Reception', 'Legal research', 'Contract review',
    'Compliance', 'Data protection',
  ],
  'Health & wellbeing': [
    'Nursing', 'Clinical medicine', 'Pharmacy', 'Public health', 'Community health', 'Health education',
    'Health promotion', 'Menstrual health education', 'Sexual and reproductive health education',
    'Nutrition', 'Mental health awareness', 'Psychosocial support', 'Counselling', 'Peer support',
    'HIV awareness', 'Hygiene promotion', 'WASH (water, sanitation and hygiene)', 'Disability inclusion',
    'Child protection', 'Safeguarding', 'Gender equality', 'Gender-based violence prevention',
    'Fitness training', 'Sports', 'Football', 'Athletics', 'Netball', 'Volleyball', 'Yoga',
  ],
  'Environment & agriculture': [
    'Tree planting', 'Tree nursery management', 'Seedling propagation', 'Agroforestry', 'Indigenous trees',
    'Reforestation', 'Conservation', 'Wildlife conservation', 'Environmental education', 'Climate action',
    'Climate change awareness', 'Waste management', 'Recycling', 'Composting', 'Clean-up campaigns',
    'Water conservation', 'Rainwater harvesting', 'Soil conservation', 'Farming', 'Kitchen gardening',
    'Organic farming', 'Beekeeping', 'Poultry keeping', 'Livestock keeping', 'Irrigation', 'Horticulture',
    'Landscaping', 'Gardening', 'Renewable energy', 'Solar installation', 'Clean cooking', 'Eco-club leadership',
  ],
  'Community & social work': [
    'Community outreach', 'Community engagement', 'Social work', 'Volunteering', 'Door-to-door outreach',
    'Home visits', 'Youth mentorship', 'Child care', 'Elderly care', 'Working with schools',
    'Working with parents', 'Working with local leaders', 'Faith community engagement', 'Cultural liaison',
    'Human rights', 'Civic education', 'Peacebuilding', 'Inclusion and diversity', 'Refugee support',
    'Disaster response', 'Emergency response',
  ],
  'Practical & trades': [
    'Carpentry', 'Masonry', 'Plumbing', 'Electrical work', 'Welding', 'Painting and decorating', 'Construction',
    'Mechanics', 'Hairdressing', 'Barbering', 'Make-up', 'Soap making', 'Sanitary pad making',
    'Reusable pad sewing', 'Sewing', 'Knitting', 'Shoe making', 'Hospitality', 'Housekeeping', 'Security',
  ],
};

export const SKILL_GROUPS = GROUPS;

// Flat, de-duplicated list
export const ALL_SKILLS = [...new Set(Object.values(GROUPS).flat())];

// Shown before the person types anything
export const POPULAR_SKILLS = [
  'Photography', 'Social media management', 'Public speaking', 'Event planning', 'Teaching',
  'Tree planting', 'Graphic design', 'Writing', 'Community outreach', 'Data collection',
  'Menstrual health education', 'First aid', 'Fundraising', 'Videography', 'Facilitation',
];

export const LANGUAGES = ['English', 'Kiswahili', 'Maa', 'Kalenjin', 'Kikuyu', 'Luo', 'Luhya', 'Kamba', 'Kisii', 'Sign language (KSL)', 'French'];

const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// LinkedIn-style matching: words that start with what you typed rank first,
// then anywhere-in-the-word matches. Skips skills already chosen.
export function suggestSkills(query, chosen = [], limit = 8, pool = ALL_SKILLS) {
  const taken = new Set(chosen.map(norm));
  const q = norm(query);
  if (!q) return POPULAR_SKILLS.filter((s) => !taken.has(norm(s))).slice(0, limit);
  const scored = [];
  for (const skill of pool) {
    const n = norm(skill);
    if (taken.has(n)) continue;
    let score = -1;
    if (n === q) score = 0;
    else if (n.startsWith(q)) score = 1;
    else if (n.split(' ').some((w) => w.startsWith(q))) score = 2;
    else if (n.includes(q)) score = 3;
    if (score >= 0) scored.push([score, n.length, skill]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return scored.slice(0, limit).map((s) => s[2]);
}

// Tidy a free-typed skill: trim, collapse spaces, capitalise the first letter,
// and reuse the list's spelling if it matches an existing skill.
export function cleanSkill(raw) {
  const s = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (!s) return '';
  const existing = ALL_SKILLS.find((k) => norm(k) === norm(s));
  return existing || s.charAt(0).toUpperCase() + s.slice(1);
}

export const sameSkill = (a, b) => norm(a) === norm(b);

// ── Suggestions from what someone tells us about themselves ──────────────
// Words in their job/studies and bio point to skills they probably have:
// a nursing student likely knows first aid and health education, a boda boda
// rider knows motorbikes and the area. These are suggestions to tap, never
// added automatically.
const KEYWORD_SKILLS = [
  [/nurs/, ['Nursing', 'First aid', 'Health education', 'Community health', 'Health promotion']],
  [/clinic|medic|doctor|\bmbchb\b|hospital/, ['Clinical medicine', 'First aid', 'Health education', 'Public health']],
  [/pharm/, ['Pharmacy', 'Health education', 'Public health', 'Health promotion']],
  [/public health|epidemiol|\bchv\b|community health/, ['Public health', 'Community health', 'Health promotion', 'Data collection', 'Monitoring and evaluation (M&E)']],
  [/nutrition|diet/, ['Nutrition', 'Health education', 'Cooking']],
  [/counsel|psycholog|mental health|therap/, ['Counselling', 'Psychosocial support', 'Mental health awareness', 'Peer support']],
  [/social work|sociolog|community develop/, ['Social work', 'Community outreach', 'Community mobilisation', 'Home visits']],
  [/teach|tutor|\bp1\b|\becde\b|lectur|\bb ?ed\b|education/, ['Teaching', 'Lesson planning', 'Tutoring', 'Mentoring', 'Facilitation']],
  [/student|university|college|\btti\b|\btvet\b|polytechnic|campus/, ['Research', 'Peer education', 'Data collection', 'Writing']],
  [/boda|motorbike|motorcycle|rider/, ['Motorbike riding', 'Transport coordination', 'Logistics', 'Community outreach']],
  [/driv|matatu|taxi|transport/, ['Driving', 'Transport coordination', 'Logistics']],
  [/farm|agri|shamba|livestock|herd|pastoral|maasai|cattle|goat/, ['Farming', 'Livestock keeping', 'Tree nursery management', 'Agroforestry', 'Soil conservation']],
  [/forest|environment|conserv|tree|climate|wildlife|ecolog|\bkfs\b/, ['Tree planting', 'Tree nursery management', 'Conservation', 'Environmental education', 'Climate action']],
  [/bee|honey/, ['Beekeeping']],
  [/poultry|chicken/, ['Poultry keeping']],
  [/account|financ|bank|book ?keep|audit|commerce|\bcpa\b|sacco/, ['Accounting', 'Bookkeeping', 'Budgeting', 'Financial reporting', 'Microsoft Excel']],
  [/business|shop|trader|entrepreneur|mama mboga|hustle|vendor|kiosk|sales/, ['Entrepreneurship', 'Sales', 'Small business management', 'M-Pesa management', 'Customer service']],
  [/software|develop|programm|coding|coder|computer science|\bit\b|\bict\b|tech/, ['Web development', 'JavaScript', 'IT support', 'Computer skills', 'Database management']],
  [/cyber|security analyst/, ['Cybersecurity', 'Online safety']],
  [/design|graphic|creative|artist|\bart\b/, ['Graphic design', 'Canva', 'Branding', 'Poster design', 'Illustration']],
  [/photo|camera/, ['Photography', 'Event photography', 'Video editing']],
  [/video|film|cinema|youtube/, ['Videography', 'Video editing', 'CapCut', 'Content creation']],
  [/music|sing|choir|\bdj\b|band|guitar|piano/, ['Music', 'Singing', 'Playing an instrument', 'Sound engineering']],
  [/drama|theat|act(or|ing)|poet|spoken word/, ['Drama', 'Acting', 'Poetry', 'Spoken word', 'Scriptwriting']],
  [/dance/, ['Dance', 'Choreography']],
  [/journal|media|mass comm|communication|radio|reporter|\bpr\b|public relations/, ['Writing', 'Journalism', 'Social media management', 'Public relations', 'Content creation']],
  [/social media|tiktok|instagram|influenc|content creat|blog|youtuber/, ['Social media management', 'Content creation', 'TikTok', 'Instagram', 'Video editing']],
  [/writ|author|editor/, ['Writing', 'Creative writing', 'Editing', 'Proofreading']],
  [/law|legal|paralegal|advocate|attorney/, ['Legal research', 'Contract review', 'Human rights', 'Advocacy', 'Compliance']],
  [/human rights|activis|advoca|gender|feminis/, ['Advocacy', 'Human rights', 'Gender equality', 'Campaign planning']],
  [/hospitality|hotel|chef|cook|catering|restaurant|baker/, ['Cooking', 'Catering', 'Baking', 'Hospitality']],
  [/tailor|fashion|sew|dressmak/, ['Tailoring', 'Sewing', 'Reusable pad sewing', 'Fashion design']],
  [/salon|hair|beauty|barber|make ?up|nails/, ['Hairdressing', 'Barbering', 'Make-up']],
  [/electric|solar/, ['Electrical work', 'Solar installation', 'Renewable energy']],
  [/construct|mason|build|civil eng/, ['Construction', 'Masonry', 'Carpentry']],
  [/plumb/, ['Plumbing']], [/weld|fabricat/, ['Welding']], [/mechanic|garage/, ['Mechanics']], [/carpent|joiner|furniture/, ['Carpentry']],
  [/church|faith|mosque|choir|pastor|youth group|ministry/, ['Faith community engagement', 'Youth work', 'Community mobilisation', 'Mentoring']],
  [/sport|football|athlet|coach|netball|volleyball|gym|fitness/, ['Sports', 'Sports coaching', 'Fitness training', 'Teamwork']],
  [/data|statistic|research|survey|\bm ?& ?e\b|monitoring|evaluation|analyst/, ['Data collection', 'Data analysis', 'Research', 'Survey design', 'Monitoring and evaluation (M&E)']],
  [/girl guide|scout/, ['Girl Guides', 'Scouting', 'Youth work', 'Mentoring']],
  [/leader|chair|captain|prefect|president|secretary|treasurer|manager/, ['Leadership', 'Team leadership', 'Meeting facilitation', 'Public speaking']],
  [/event|\bmc\b|wedding|planner/, ['Event planning', 'Event management', 'MC / event hosting']],
  [/volunteer|ngo|cbo|charity/, ['Volunteering', 'Community outreach', 'Volunteer coordination']],
  [/\bhr\b|human resource|recruit/, ['Human resources', 'Recruitment']],
  [/procure|supply chain|logistic|store|warehouse/, ['Procurement', 'Logistics', 'Inventory management']],
  [/admin|secretar|reception|office/, ['Administration', 'Office management', 'Filing and records', 'Microsoft Word']],
  [/customer|call centre|call center/, ['Customer service', 'Communication strategy']],
  [/mentor|youth|child/, ['Mentoring', 'Youth mentorship', 'Youth work']],
  [/period|menstrua|sanitary|pad/, ['Menstrual health education', 'Sanitary pad making', 'Reusable pad sewing']],
  [/translat|interpret|language/, ['Translation', 'Interpretation']],
  [/fundrais|grant|donor|proposal/, ['Fundraising', 'Grant writing', 'Proposal writing', 'Donor relations']],
];

export function skillsFromKeywords(text, chosen = [], limit = 10) {
  const t = ` ${String(text || '').toLowerCase()} `;
  if (!t.trim()) return [];
  const taken = new Set(chosen.map(norm));
  const out = [];
  const push = (s) => { if (!taken.has(norm(s)) && !out.includes(s)) out.push(s); };
  // Skills mentioned by name ("I do photography and graphic design")
  const words = ` ${norm(t)} `;
  ALL_SKILLS.filter((s) => norm(s).length >= 4 && words.includes(` ${norm(s)} `)).forEach(push);
  // Skills that go with their work, studies or interests
  KEYWORD_SKILLS.forEach(([re, skills]) => { if (re.test(t)) skills.forEach(push); });
  return out.slice(0, limit);
}
