// File: src/member/TaskCards.jsx
// Task cards shared by the member dashboard and the /me/tasks page.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { sameSkill } from '../lib/skills';

const TZ = 'Africa/Nairobi';
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }) : '');

// Tasks with an online course open the course instead of “Mark as done”
export const COURSE_TASKS = { orientation: '/me/course/orientation', safeguarding: '/me/course/safeguarding' };

export const STATUS = {
  returned:  { label: 'Needs a change',   cls: 'bg-red-50 text-red-700',                  group: 'Needs a change' },
  todo:      { label: 'To do',            cls: 'bg-sand text-forest',                     group: 'To do' },
  submitted: { label: 'Waiting for UYIH', cls: 'bg-terracotta/15 text-terracotta-dark',   group: 'Waiting for UYIH' },
  done:      { label: 'Done',             cls: 'bg-forest text-cream',                    group: 'Done' },
};

// Categories for browsing: membership tasks, each project, content, general
export const CATEGORY_STYLE = {
  'Membership':                       { dot: 'bg-forest',          chip: 'bg-forest/10 text-forest',               icon: '🎯' },
  'Green Futures':                    { dot: 'bg-forest-light',    chip: 'bg-[#2A5C40]/10 text-[#2A5C40]',        icon: '🌱' },
  'School visits & pad distribution': { dot: 'bg-[#9B3A5A]',       chip: 'bg-[#9B3A5A]/10 text-[#9B3A5A]',        icon: '🏫' },
  'MHM curriculum':                   { dot: 'bg-terracotta',      chip: 'bg-terracotta/10 text-terracotta-dark', icon: '📚' },
  'Content':                          { dot: 'bg-[#2C4A7C]',       chip: 'bg-[#2C4A7C]/10 text-[#2C4A7C]',        icon: '📣' },
  'General':                          { dot: 'bg-ink-muted',       chip: 'bg-sand text-ink-muted',                icon: '🤝' },
};
export const categoryOf = (t) => (t.code ? 'Membership' : t.project ? t.project : t.kind === 'content' ? 'Content' : 'General');
const styleOf = (cat) => CATEGORY_STYLE[cat] || CATEGORY_STYLE.General;

export const withMatches = (tasks, mySkills) =>
  tasks.map((t) => ({ ...t, category: categoryOf(t), match: (t.skills || []).filter((s) => mySkills.some((m) => sameSkill(m, s))) }));

export function CategoryChip({ cat }) {
  const st = styleOf(cat);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.chip}`}>
      <span aria-hidden="true">{st.icon}</span>{cat === 'School visits & pad distribution' ? 'School visits' : cat}
    </span>
  );
}

function Description({ text, clamp = true }) {
  const [more, setMore] = useState(false);
  if (!text) return null;
  const long = text.length > 140;
  return (
    <div className="mt-2">
      <p className={`font-sans text-sm text-ink whitespace-pre-wrap ${clamp && long && !more ? 'line-clamp-2' : ''}`}>{text}</p>
      {clamp && long && (
        <button type="button" className="font-sans text-xs text-terracotta underline mt-0.5" onClick={() => setMore(!more)}>
          {more ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

function Skills({ skills, match }) {
  if (!skills?.length) return null;
  const shown = skills.slice(0, 4);
  return (
    <div className="flex flex-wrap gap-1 mt-3">
      {shown.map((s) => {
        const m = match?.some((x) => sameSkill(x, s));
        return <span key={s} className={`rounded-full px-2 py-0.5 text-[11px] ${m ? 'bg-terracotta/15 text-terracotta-dark font-semibold' : 'bg-sand-light text-ink-muted border border-sand-dark/50'}`}>{m ? '★ ' : ''}{s}</span>;
      })}
      {skills.length > shown.length && <span className="px-1 py-0.5 text-[11px] text-ink-faint">+{skills.length - shown.length}</span>}
    </div>
  );
}

export function MyTask({ t, reload }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const st = STATUS[t.status];
  const canSubmit = t.status === 'todo' || t.status === 'returned';
  const courseUrl = COURSE_TASKS[t.code];
  const cat = categoryOf(t);

  const submit = async () => {
    setBusy(true);
    const { error: err } = await supabase.rpc('submit_task', { p_assignment_id: t.assignment_id, p_note: note || null });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setOpen(false); reload();
  };

  return (
    <li className={`rounded-lg border bg-white p-4 md:p-5 ${t.status === 'returned' ? 'border-red-200' : 'border-sand-dark/60'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <CategoryChip cat={cat} />
        <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
      </div>
      <p className="font-sans font-semibold text-forest mt-2.5 leading-snug">{t.title}</p>
      {t.due_on && <p className="font-sans text-xs text-ink-muted mt-0.5">Due {fmtDate(t.due_on)}</p>}
      {t.status !== 'done' && <Description text={t.description} />}
      {t.status === 'done' && t.completed_at && <p className="font-sans text-xs text-ink-muted mt-1">Completed {fmtDate(t.completed_at)}</p>}
      {t.status === 'returned' && t.admin_note && (
        <p className="font-sans text-sm bg-red-50 text-red-800 rounded px-3 py-2 mt-3">UYIH: {t.admin_note}</p>
      )}
      {canSubmit && courseUrl && (
        <Link to={courseUrl} className="btn-primary text-sm mt-4">Open the course →</Link>
      )}
      {canSubmit && !courseUrl && !open && (
        <button className="btn-primary text-sm mt-4" onClick={() => setOpen(true)}>Mark as done</button>
      )}
      {canSubmit && !courseUrl && open && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="input-label">{t.kind === 'content' ? 'Link to your post *' : 'Anything we should know? (optional)'}</span>
            <textarea className="input-field resize-none" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {error && <p className="font-sans text-sm text-red-700" role="alert">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-primary text-sm" disabled={busy || (t.kind === 'content' && !note.trim())} onClick={submit}>
              {busy ? 'Sending…' : 'Send to UYIH'}
            </button>
            <button className="btn-secondary text-sm" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </li>
  );
}

export function OpenTask({ t, reload }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const courseUrl = COURSE_TASKS[t.code];
  const claim = async () => {
    setBusy(true);
    const { error: err } = await supabase.rpc('claim_task', { p_task_id: t.task_id });
    setBusy(false);
    if (err) setError(err.message);
    else if (courseUrl) navigate(courseUrl);
    else reload();
  };
  return (
    <li className="rounded-lg border border-sand-dark/60 bg-white p-4 md:p-5 flex flex-col">
      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryChip cat={t.category} />
        {t.match?.length > 0 && <span className="rounded-full bg-terracotta text-white text-[11px] font-semibold px-2 py-0.5">For you</span>}
        {t.points > 0 && <span className="ml-auto font-sans text-[11px] text-ink-faint">{t.points} pt{t.points > 1 ? 's' : ''}</span>}
      </div>
      <p className="font-sans font-semibold text-forest mt-2.5 leading-snug">{t.title}</p>
      {t.due_on && <p className="font-sans text-xs text-ink-muted mt-0.5">Due {fmtDate(t.due_on)}</p>}
      <Description text={t.description} />
      <Skills skills={t.skills} match={t.match} />
      {error && <p className="font-sans text-sm text-red-700 mt-2" role="alert">{error}</p>}
      <div className="mt-auto pt-4">
        <button className="btn-secondary text-sm w-full sm:w-auto" onClick={claim} disabled={busy}>
          {busy ? 'Adding…' : courseUrl ? 'Start the course' : 'I’ll do this'}
        </button>
      </div>
    </li>
  );
}
