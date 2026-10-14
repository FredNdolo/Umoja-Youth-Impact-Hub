// File: src/member/achievements.jsx
// Points, medals and course progress helpers shared by the member pages.
import React from 'react';
import { COURSES } from './courses';

// Highest medal earned (or null)
export function currentMedal(ach) {
  const earned = (ach?.medals || []).filter((m) => m.earned);
  return earned.length ? earned[earned.length - 1] : null;
}
// The next medal still to earn, and what's missing
export function nextMedal(ach) {
  const m = (ach?.medals || []).find((x) => !x.earned);
  if (!m) return null;
  return {
    ...m,
    pointsLeft: Math.max(0, m.min_points - ach.points),
    needsMember: m.requires_member && !ach.is_member,
    pct: m.min_points ? Math.min(100, Math.round((ach.points / m.min_points) * 100)) : 100,
  };
}

const MEDAL_COLORS = {
  seedling: ['#7FB069', '#2A5C40'],
  sapling:  ['#4E9F5B', '#1A3C2A'],
  tree:     ['#C4622D', '#7A3A16'],
  forest:   ['#D4A64A', '#8B6914'],
};

// A round medal badge; greyed out until earned
export function MedalBadge({ medal, size = 72 }) {
  const [a, b] = MEDAL_COLORS[medal.code] || ['#C4622D', '#1A3C2A'];
  const on = medal.earned;
  return (
    <span className="relative inline-flex items-center justify-center rounded-full flex-shrink-0"
      style={{
        width: size, height: size,
        background: on ? `radial-gradient(circle at 30% 30%, ${a}, ${b})` : '#EDE7DB',
        boxShadow: on ? `0 0 0 4px #fff, 0 0 0 6px ${a}55, 0 6px 16px ${b}40` : '0 0 0 4px #fff, 0 0 0 6px #E2D9C8',
      }}
      aria-label={`${medal.name} medal${on ? '' : ' (not earned yet)'}`}>
      <span style={{ fontSize: size * 0.42, filter: on ? 'none' : 'grayscale(1)', opacity: on ? 1 : 0.45 }} aria-hidden="true">{medal.icon}</span>
      {!on && <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-sand-dark text-xs flex items-center justify-center" aria-hidden="true">🔒</span>}
    </span>
  );
}

// Course progress 0–100 from lessons seen and questions answered
export function courseProgress(c) {
  const cfg = COURSES[c.code];
  if (c.task_status === 'done' || c.certificate) return 100;
  const lessons = cfg?.lessons.length || 1;
  const lessonPart = Math.min(1, c.lessons_seen / lessons) * 50;
  const quizPart = c.best?.passed ? 50 : c.questions ? (c.answered / c.questions) * 45 : 0;
  return Math.round(lessonPart + quizPart);
}

export const COURSE_STYLE = {
  orientation:  { band: 'from-[#1A3C2A] to-[#2A5C40]', icon: '🧭', tag: 'Getting started' },
  safeguarding: { band: 'from-[#7A3A16] to-[#C4622D]', icon: '🛡️', tag: 'Child protection' },
};

export function ProgressBar({ pct, className = '' }) {
  return (
    <div className={`h-2 rounded-full bg-sand-dark/40 overflow-hidden ${className}`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${pct >= 100 ? 'bg-forest' : 'bg-terracotta'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
