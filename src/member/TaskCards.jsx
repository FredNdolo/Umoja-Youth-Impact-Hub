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

const SUB_BUCKET = 'task-submissions';
const SUB_MAX = 20 * 1024 * 1024;
const SUB_TYPES = {
  'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'text/plain': 'txt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/msword': 'doc', 'application/vnd.ms-excel': 'xls', 'application/vnd.ms-powerpoint': 'ppt',
};

async function openOwnFile(path) {
  const w = window.open('', '_blank');
  const { data, error } = await supabase.storage.from(SUB_BUCKET).createSignedUrl(path, 120);
  if (error) { if (w) w.close(); return; }
  if (w) w.location = data.signedUrl; else window.location.href = data.signedUrl;
}

// What the member sent in (link, file, note)
function Submitted({ t }) {
  if (!t.submission_url && !t.submission_file && !t.member_note) return null;
  return (
    <div className="mt-3 rounded-md bg-sand-light/70 border border-sand-dark/40 px-3 py-2.5 font-sans text-xs space-y-1">
      <p className="font-semibold text-ink-muted uppercase tracking-wide text-[10px]">Your submission</p>
      {t.submission_url && <p>🔗 <a href={t.submission_url} target="_blank" rel="noopener noreferrer" className="text-terracotta underline break-all">{t.submission_url}</a></p>}
      {t.submission_file && <p>📎 <button className="text-terracotta underline" onClick={() => openOwnFile(t.submission_file)}>{t.submission_file_name || 'Your file'}</button></p>}
      {t.member_note && <p className="text-ink whitespace-pre-wrap">“{t.member_note}”</p>}
    </div>
  );
}

// Submission box: a link, a file, or both, plus an optional note
function SubmissionBox({ t, personId, onCancel, onDone }) {
  const [link, setLink] = useState(t.submission_url || '');
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const needsSomething = t.kind === 'content';

  const pick = (e) => {
    const f = e.target.files?.[0];
    setError('');
    if (!f) { setFile(null); return; }
    if (!SUB_TYPES[f.type]) { setError('Please choose a PDF, photo, Word, Excel, PowerPoint, text or MP4 file.'); e.target.value = ''; return; }
    if (f.size > SUB_MAX) { setError('That file is over 20 MB. For bigger files, share a Google Drive link instead.'); e.target.value = ''; return; }
    setFile(f);
  };

  const send = async () => {
    const l = link.trim();
    if (l && !/^https?:\/\/\S+$/i.test(l)) { setError('The link should start with http:// or https://'); return; }
    if (needsSomething && !l && !file && !t.submission_file) { setError('Add a link to your post or upload the file.'); return; }
    setBusy(true); setError('');
    let path = null;
    if (file) {
      path = `${personId}/${t.assignment_id}-${Date.now()}.${SUB_TYPES[file.type]}`;
      const up = await supabase.storage.from(SUB_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) { setBusy(false); setError('The upload failed. Check your connection and try again.'); return; }
    }
    const { data: oldPath, error: err } = await supabase.rpc('submit_task', {
      p_assignment_id: t.assignment_id, p_note: note || null, p_link: l || null,
      p_file_path: path, p_file_name: file ? file.name : null,
    });
    if (err) {
      if (path) await supabase.storage.from(SUB_BUCKET).remove([path]);
      setBusy(false); setError(err.message); return;
    }
    if (oldPath) await supabase.storage.from(SUB_BUCKET).remove([oldPath]);
    setBusy(false); onDone();
  };

  return (
    <div className="mt-4 rounded-lg border border-sand-dark/60 bg-sand-light/50 p-4 space-y-3">
      <p className="font-sans text-sm font-semibold text-forest">Submit your work</p>
      <label className="block">
        <span className="input-label">Link (Google Drive, Instagram, TikTok, a document…)</span>
        <input className="input-field" type="url" inputMode="url" placeholder="https://" value={link} maxLength={500}
          onChange={(e) => { setLink(e.target.value); setError(''); }} />
      </label>
      <label className="block">
        <span className="input-label">Or upload a file (up to 20 MB)</span>
        <input type="file" onChange={pick} accept={Object.keys(SUB_TYPES).join(',')}
          className="block w-full font-sans text-sm file:mr-3 file:rounded-md file:border-0 file:bg-forest file:px-3 file:py-2 file:text-cream file:font-semibold" />
        {t.submission_file && !file && <span className="block font-sans text-xs text-ink-muted mt-1">Already uploaded: {t.submission_file_name || 'a file'} (choose a new file to replace it)</span>}
      </label>
      <label className="block">
        <span className="input-label">Note for UYIH (optional)</span>
        <textarea className="input-field resize-none" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {error && <p className="font-sans text-sm text-red-700" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary text-sm" disabled={busy} onClick={send}>{busy ? (file ? 'Uploading…' : 'Sending…') : 'Send to UYIH'}</button>
        <button className="btn-secondary text-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export function MyTask({ t, reload, personId }) {
  const [open, setOpen] = useState(false);
  const st = STATUS[t.status];
  const canSubmit = t.status === 'todo' || t.status === 'returned';
  const courseUrl = COURSE_TASKS[t.code];
  const cat = categoryOf(t);

  return (
    <li className={`rounded-lg border bg-white p-4 md:p-5 ${t.status === 'returned' ? 'border-red-200' : 'border-sand-dark/60'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <CategoryChip cat={cat} />
        {t.points > 0 && <span className="font-sans text-[11px] text-ink-faint">{t.points} pt{t.points > 1 ? 's' : ''}</span>}
        <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
      </div>
      <p className="font-sans font-semibold text-forest mt-2.5 leading-snug">{t.title}</p>
      {t.due_on && <p className="font-sans text-xs text-ink-muted mt-0.5">Due {fmtDate(t.due_on)}</p>}
      {t.status !== 'done' && <Description text={t.description} />}
      {t.status === 'done' && t.completed_at && <p className="font-sans text-xs text-ink-muted mt-1">Completed {fmtDate(t.completed_at)}</p>}
      {t.status === 'returned' && t.admin_note && (
        <p className="font-sans text-sm bg-red-50 text-red-800 rounded px-3 py-2 mt-3">UYIH: {t.admin_note}</p>
      )}
      {!courseUrl && !open && <Submitted t={t} />}
      {canSubmit && courseUrl && (
        <Link to={courseUrl} className="btn-primary text-sm mt-4">Open the course →</Link>
      )}
      {canSubmit && !courseUrl && !open && (
        <button className="btn-primary text-sm mt-4" onClick={() => setOpen(true)}>{t.status === 'returned' ? 'Submit again' : 'Submit'}</button>
      )}
      {canSubmit && !courseUrl && open && (
        <SubmissionBox t={t} personId={personId} onCancel={() => setOpen(false)} onDone={() => { setOpen(false); reload(); }} />
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
