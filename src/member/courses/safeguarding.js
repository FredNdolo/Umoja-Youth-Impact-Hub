// Safeguarding Basics: plain-language lessons drawn from the UYIH Child
// Protection and Safeguarding Policy. The quiz questions and answers live in
// the database (supabase/migrations/…_safeguarding_course.sql) so they're
// checked on the server.
//
// If the policy changes, update these lessons, the quiz, and DECLARATION.

export const POLICY_PDF = '/docs/uyih-child-protection-safeguarding-policy.pdf';

export const LESSONS = [
  {
    icon: '🛡️',
    title: 'Why this matters',
    ref: 'Sections 1–3, 6',
    points: [
      '“Every child we work with has the right to be safe.” That is the heart of this policy.',
      'A child is anyone under 18, as in the Constitution of Kenya and the Children Act, 2022.',
      'UYIH has zero tolerance for abuse, exploitation or neglect of children by anyone acting for us.',
      'Safeguarding is everyone’s job: office bearers, staff, members and volunteers, not only the Safeguarding Lead.',
      'It covers every kind of contact: in person, by phone, in writing, online, and every photo or video of a child.',
    ],
  },
  {
    icon: '🔎',
    title: 'Know the kinds of harm',
    ref: 'Section 5',
    points: [
      'Physical abuse: any act causing physical harm, including corporal punishment.',
      'Emotional abuse: persistent humiliation, mistreatment or terrorising.',
      'Sexual abuse: any sexual activity or exploitation involving a child, including grooming online.',
      'Neglect: persistently failing to meet a child’s basic needs.',
      'Exploitation: including child labour or any relationship that takes advantage of a child.',
      'Bullying and peer-on-peer abuse: children harming each other during our activities.',
      'Online harm: inappropriate contact, grooming, or sharing a child’s image or details without consent.',
      'Not sure if something counts? Don’t decide for yourself: raise it with the Designated Safeguarding Lead (DSL).',
    ],
  },
  {
    icon: '🤝',
    title: 'The golden rules with children',
    ref: 'Section 9',
    points: [
      'Never be alone with a single child in an isolated place. Wherever possible, at least two adults are present.',
      'Treat all children equally: no favourites, including through gifts or special attention.',
      'Never discipline a child, and never use physical punishment. Refer behaviour issues to the school’s teachers.',
      'Physical contact must be appropriate, necessary, and never open to misinterpretation.',
      'Never drive a child alone in a private vehicle. If transport can’t be avoided, tell the DSL in advance and have a second adult present (or make the school and a parent/guardian aware).',
    ],
  },
  {
    icon: '📱',
    title: 'Phones, social media and photos',
    ref: 'Section 9',
    points: [
      'Don’t contact children on your personal phone or social media. Go through the school, a parent/guardian, or the Girl Guide leaders.',
      'Photos or videos of children used outside UYIH’s internal records (social media, website, reports) need written consent from a parent/guardian or the school first.',
      'Consent can be withdrawn at any time; the image then comes down as soon as possible.',
      'Never post a child’s full name with details like where they live. Avoid naming individual children in posts.',
      'Photos from menstrual-health or period-poverty activities need extra care and DSL sign-off before any public use.',
      'Use UYIH devices where possible. If you use your own phone, move the photos to UYIH storage and delete them from your phone soon.',
    ],
  },
  {
    icon: '👂',
    title: 'If a child tells you something',
    ref: 'Section 11',
    points: [
      'Stay calm and listen, without showing shock or disbelief.',
      'Don’t promise to keep it secret. Explain, in a way they understand, that you need to tell someone who can help.',
      'Don’t investigate or ask lots of detailed questions. Let them speak in their own words.',
      'Reassure them that they were right to tell you and that it is not their fault.',
      'As soon as you can, write down what was said in the child’s own words, with the date, time and who else was there.',
      'Report it to the DSL straight away. Don’t wait to “be sure” first.',
    ],
  },
  {
    icon: '📣',
    title: 'Who to tell, and when',
    ref: 'Section 12',
    points: [
      'Report every concern the same day to the Designated Safeguarding Lead, using the Concern/Incident Report Form (Annex 2). Your duty is to report, not to judge whether it is “serious enough” or to sort it out yourself.',
      'If the concern is about the DSL, report to the Executive Director. If it is about the Executive Director, report to the Management Committee Chairperson (or the Secretary, if the Chairperson is involved).',
      'If a child is in immediate danger, call the Kenya Police on 999 or 112 (or the nearest Gender & Children Protection Desk) without delay, then tell the DSL when it is safe.',
      'Childline Kenya is 116: free, 24 hours.',
      'The DSL handles the next steps, including Childline, the Children’s Officer, and informing the school’s Head Teacher and the Narok East Sub-County Education Office for school activities.',
    ],
  },
  {
    icon: '⚖️',
    title: 'Fairness, privacy and your duties',
    ref: 'Sections 8, 13–14, 17–18',
    points: [
      'Before any unsupervised contact with children you need: a signed safeguarding declaration, a verified national ID, a valid Certificate of Good Conduct, a signed copy of this policy and code of conduct, and the safeguarding induction.',
      'Concerns are shared only with people who need to know, but protecting a child always comes before confidentiality.',
      'Nobody who raises a concern in good faith will be punished for it, even if it turns out to be unfounded. Deliberately false reports are a disciplinary matter.',
      'If someone is accused, they step aside from child-facing duties while it is assessed. This is a precaution, not a judgement. Suspected crimes always go to the police.',
      'Breaking the policy or code of conduct is a disciplinary matter under Article 18 of the Constitution and can lead to suspension, expulsion or referral to the authorities.',
    ],
  },
];

// Annex 1 of the policy, word for word
export const DECLARATION =
  'I confirm that I have read and understood the UYIH Child Protection and Safeguarding Policy and the Code of Conduct ' +
  'set out in Section 9. I agree to conduct myself in line with this policy at all times when engaging with children on ' +
  'behalf of UYIH, and to report any safeguarding concern immediately to the Designated Safeguarding Lead.';
