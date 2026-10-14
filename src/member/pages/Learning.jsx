// File: src/member/pages/Learning.jsx
// "My learning": the online courses, course-site style.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMember, PageTitle } from '../MemberLayout';
import { COURSES } from '../courses';
import { courseProgress, COURSE_STYLE, ProgressBar } from '../achievements';

export function CourseCard({ c, compact = false }) {
  const cfg = COURSES[c.code];
  const st = COURSE_STYLE[c.code] || { band: 'from-forest to-forest-light', icon: '📘', tag: 'Course' };
  const pct = courseProgress(c);
  const done = pct === 100;
  const started = pct > 0;
  const action = done ? 'Review course' : started ? 'Continue' : 'Start course';
  return (
    <article className="group rounded-xl border border-sand-dark/50 bg-white overflow-hidden hover:shadow-card-lg transition-shadow flex flex-col">
      <div className={`relative bg-gradient-to-br ${st.band} ${compact ? 'h-20' : 'h-28'} px-5 flex items-end pb-3`}>
        <span className={`absolute right-4 top-3 ${compact ? 'text-3xl' : 'text-5xl'} opacity-90`} aria-hidden="true">{st.icon}</span>
        <span className="font-sans text-[11px] uppercase tracking-[0.14em] text-cream/80 font-semibold">{st.tag}</span>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <p className="font-sans text-xs text-ink-muted">UYIH · Online course</p>
        <h3 className="font-display font-bold text-xl text-forest mt-0.5 leading-snug">{c.title}</h3>
        {!compact && (
          <p className="font-sans text-sm text-ink-muted mt-2">
            {cfg?.lessons.length || 0} lessons · {c.questions}-question quiz · pass mark {c.pass_mark}
          </p>
        )}
        <div className="mt-4">
          <div className="flex justify-between font-sans text-xs mb-1.5">
            <span className={done ? 'text-forest font-semibold' : 'text-ink-muted'}>{done ? 'Completed' : started ? 'In progress' : 'Not started'}</span>
            <span className="text-ink-muted tabular-nums">{pct}%</span>
          </div>
          <ProgressBar pct={pct} />
        </div>
        {c.best && !compact && (
          <p className="font-sans text-xs text-ink-muted mt-2">Best score {c.best.score}/{c.best.total}{c.best.passed ? ' ✓' : ''}</p>
        )}
        <div className="mt-auto pt-4 flex flex-wrap gap-2">
          <Link to={`/me/course/${c.code}`} className={done ? 'btn-secondary text-sm' : 'btn-primary text-sm'}>{action}</Link>
          {c.certificate && <Link to={`/certificates/${c.certificate}`} className="btn-secondary text-sm">🎓 Certificate</Link>}
        </div>
      </div>
    </article>
  );
}

export default function Learning() {
  const { learning } = useMember();
  const [tab, setTab] = useState('progress');
  const inProgress = learning.filter((c) => courseProgress(c) < 100);
  const completed = learning.filter((c) => courseProgress(c) === 100);
  const list = tab === 'progress' ? inProgress : completed;
  return (
    <>
      <PageTitle title="My learning">Short online courses every UYIH volunteer completes. Pass the quiz and the course clears itself, with a certificate.</PageTitle>
      <div className="flex gap-6 border-b border-sand-dark/50 mb-6" role="tablist">
        {[['progress', `In progress (${inProgress.length})`], ['done', `Completed (${completed.length})`]].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`pb-3 -mb-px font-sans text-sm font-semibold border-b-2 ${tab === k ? 'border-terracotta text-forest' : 'border-transparent text-ink-muted hover:text-forest'}`}>{l}</button>
        ))}
      </div>
      {list.length === 0
        ? <p className="font-sans text-ink-muted py-8 text-center">{tab === 'progress' ? 'All courses completed. Well done! 🎉' : 'No completed courses yet.'}</p>
        : <div className="grid sm:grid-cols-2 gap-5">{list.map((c) => <CourseCard key={c.code} c={c} />)}</div>}
    </>
  );
}
