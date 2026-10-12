// Choices for the get-to-know-you profile (values match the database)
export const CURRENT_STATUS = [
  { value: 'student',          label: 'Student' },
  { value: 'employed',         label: 'Employed' },
  { value: 'self_employed',    label: 'Self-employed / business' },
  { value: 'looking_for_work', label: 'Looking for work' },
  { value: 'other',            label: 'Something else' },
];

export const AVAILABILITY = [
  { value: 'weekday_daytime',  label: 'Weekdays (daytime)' },
  { value: 'weekday_evenings', label: 'Weekday evenings' },
  { value: 'weekends',         label: 'Weekends' },
];

export const HOURS = [
  { value: 'under_5', label: 'Under 5 hours a month' },
  { value: '5_10',    label: '5–10 hours a month' },
  { value: '10_20',   label: '10–20 hours a month' },
  { value: 'over_20', label: 'More than 20 hours a month' },
];

export const GOALS = [
  'Experience for my CV', 'Learn new skills', 'Certificates', 'Meet people / network',
  'Make a difference in my community', 'Leadership experience', 'Job or internship leads', 'Have fun',
];

export const RESOURCES = [
  'Smartphone', 'Laptop or computer', 'Camera', 'Own transport (car)', 'Motorbike',
  'Space for meetings or storage', 'Contacts in schools', 'Contacts with local leaders',
];

export const labelFor = (list, value) => list.find((x) => x.value === value)?.label || value;
