// Site-wide settings for the membership pipeline.
//
// The Supabase anon key is meant to be public: it ships in every visitor's
// browser and can only call the three submit functions (see
// supabase/migrations). Environment variables override these defaults,
// e.g. to point a local copy at a test project.

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://kyrgwdvobbshsyofkjfu.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5cmd3ZHZvYmJzaHN5b2ZramZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MTk3NjksImV4cCI6MjEwNzM5NTc2OX0.VvPl5tHKlMsYXVJvTsIvDG4LrFlaSfi05wGhCKK1M7o';

// WhatsApp stays the main channel
export const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/KOnWtiNorr4EBVmiG8FHy6';
export const UYIH_WHATSAPP_NUMBER = '254783218081'; // follow-up number, international format without "+"

export const CONTACT_EMAIL = 'umojayouthhub@gmail.com';

// M-Pesa paybill for donations and membership fees (one account for both).
// People pay, then enter their M-Pesa confirmation code so UYIH can match it
// to the paybill statement in /admin → Payments.
export const PAYBILL = {
  number: import.meta.env.VITE_PAYBILL_NUMBER || '891300',            // business number
  account: import.meta.env.VITE_PAYBILL_ACCOUNT || '150176',          // account number to enter
  registeredName: import.meta.env.VITE_PAYBILL_NAME || '',      // name M-Pesa shows on the confirmation screen
};
export const MEMBERSHIP_FEE = 1000; // Ksh

// Who signs course certificates. Every certificate carries the Executive
// Director; only the Child Protection and Safeguarding Policy course
// (Safeguarding Basics) also carries the Designated Safeguarding Lead.
export const EXECUTIVE_DIRECTOR = { name: 'Fred Ndolo', title: 'Executive Director' };
export const SAFEGUARDING_LEAD = { name: 'Emmanuella Aya', title: 'Designated Safeguarding Lead' };
export const DSL_SIGNED_COURSES = ['safeguarding'];
export const certificateSignatories = (courseCode) =>
  (DSL_SIGNED_COURSES.includes(courseCode) ? [EXECUTIVE_DIRECTOR, SAFEGUARDING_LEAD] : [EXECUTIVE_DIRECTOR]);

// Bump this whenever the wording of the consent text or privacy notice changes,
// so each person's record shows which version they agreed to.
export const CONSENT_VERSION = '2026-10d';

export const AGE_BANDS = [
  { value: '18-24', label: '18–24' },
  { value: '25-29', label: '25–29' },
  { value: '30-35', label: '30–35' },
  { value: '36+',   label: '36 or older' },
];

export const HEARD_FROM = [
  { value: 'whatsapp',     label: 'WhatsApp' },
  { value: 'instagram',    label: 'Instagram' },
  { value: 'school_visit', label: 'A school visit' },
  { value: 'event',        label: 'A UYIH event' },
  { value: 'friend',       label: 'A friend or member' },
  { value: 'other',        label: 'Somewhere else' },
];

export const STAGES = [
  { value: 'newcomer',  label: 'Newcomer'  },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'member',    label: 'Member'    },
  { value: 'lead',      label: 'Lead'      },
];

// Shown if the projects list can't be loaded from the database
export const FALLBACK_PROJECTS = [
  { slug: 'school-visits',  name: 'School visits & pad distribution', description: 'Visit schools, distribute sanitary pads and support health talks.' },
  { slug: 'green-futures',  name: 'Green Futures',                    description: "School tree nurseries that fund girls' sanitary supplies." },
  { slug: 'mhm-curriculum', name: 'MHM curriculum',                   description: 'Help design and pilot the menstrual health management curriculum.' },
];
