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
