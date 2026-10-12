// Online courses available on the member page, by task code.
// Each course's quiz lives in the database (course_questions); the lessons live here.
import * as safeguarding from './safeguarding';
import * as orientation from './orientation';

export const COURSES = {
  orientation: {
    code: 'orientation',
    title: 'UYIH Orientation',
    eyebrow: 'Course · Getting started',
    quote: 'Youth-led change in Narok East, together.',
    intro: 'Get to know UYIH: who we are, our mission and values, what we do, Green Futures in a minute, and your path to becoming a member. About 10 minutes.',
    refLabel: '',
    lessons: orientation.LESSONS,
    doneIcon: '🧭',
  },
  safeguarding: {
    code: 'safeguarding',
    title: 'Safeguarding Basics',
    eyebrow: 'Course · Child protection',
    quote: '“Every child we work with has the right to be safe.”',
    intro: 'A quick guide to UYIH’s Child Protection and Safeguarding Policy: how to keep children safe, the golden rules, and exactly what to do if you’re worried about a child. About 10–15 minutes.',
    refLabel: 'Policy ',
    lessons: safeguarding.LESSONS,
    declaration: safeguarding.DECLARATION,
    pdf: safeguarding.POLICY_PDF,
    doneIcon: '🛡️',
  },
};

export const courseUrl = (code) => (COURSES[code] ? `/me/course/${code}` : null);
