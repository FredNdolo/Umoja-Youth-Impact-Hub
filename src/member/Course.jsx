// File: src/member/Course.jsx
// Safeguarding Basics: lessons → trivia quiz (answers checked on the server,
// instant feedback) → result → sign the policy declaration.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { MemberHero, Login } from './MemberApp';
import { LESSONS, DECLARATION, POLICY_PDF } from './courses/safeguarding';

const CODE = 'safeguarding';
const Shell = ({ children }) => <div className="bg-cream min-h-screen">{children}</div>;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function Course() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    document.title = 'Safeguarding Basics · My UYIH';
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <Shell><MemberHero eyebrow="Course" title="Loading…" /></Shell>;
  if (!session) return <Shell><Login /></Shell>;
  return <Shell><CourseBody /></Shell>;
}

function CourseBody() {
  const [course, setCourse] = useState(null);
  const [dash, setDash] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('intro'); // intro | lesson | quiz | result | declare | sent
  const [lesson, setLesson] = useState(0);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    const [c, d] = await Promise.all([supabase.rpc('get_course', { p_code: CODE }), supabase.rpc('get_my_dashboard')]);
    if (c.error || d.error) { setError((c.error || d.error).message); return null; }
    setCourse(c.data); setDash(d.data); setError('');
    return c.data;
  }, []);
  useEffect(() => { load(); }, [load]);

  const task = useMemo(() => dash?.my_tasks.find((t) => t.code === CODE), [dash]);
  const go = (v) => { setView(v); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  if (error) return <><MemberHero eyebrow="Course" title="Safeguarding Basics" /><p className="container-narrow max-w-2xl py-10 font-sans text-red-700">{error}</p></>;
  if (!course || !dash) return <MemberHero eyebrow="Course" title="Safeguarding Basics" />;

  const passed = course.best?.passed;
  const answeredCount = course.questions.filter((q) => q.answered).length;

  return (
    <>
      <MemberHero eyebrow="Course · Child protection" title="Safeguarding Basics">
        <p className="font-sans text-cream/75 mt-3 max-w-xl">“Every child we work with has the right to be safe.”</p>
      </MemberHero>

      <div className="container-narrow max-w-2xl py-8 md:py-12">
        <Link to="/me" className="font-sans text-sm text-ink-muted underline">← Back to My UYIH</Link>

        <AnimatePresence mode="wait">
          <motion.div key={view + lesson} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-5">
            {view === 'intro' && (
              <Intro course={course} task={task} passed={passed} answeredCount={answeredCount}
                onStart={() => { setLesson(0); go('lesson'); }}
                onQuiz={() => go('quiz')}
                onDeclare={() => go('declare')} />
            )}
            {view === 'lesson' && (
              <Lesson index={lesson}
                onBack={() => (lesson === 0 ? go('intro') : setLesson(lesson - 1))}
                onNext={() => (lesson === LESSONS.length - 1 ? go('quiz') : (setLesson(lesson + 1), window.scrollTo({ top: 0 })))} />
            )}
            {view === 'quiz' && (
              <Quiz course={course} onFinished={async (r) => { setResult(r); await load(); go('result'); }} />
            )}
            {view === 'result' && result && (
              <Result result={result}
                onRetry={() => { setLesson(0); go('lesson'); }}
                onRetryQuiz={() => go('quiz')}
                onDeclare={() => go('declare')} />
            )}
            {view === 'declare' && (
              <Declare person={dash.person} task={task} best={course.best}
                onSent={async () => { await load(); go('sent'); }} />
            )}
            {view === 'sent' && (
              <div className="card p-6 md:p-8 text-center">
                <div className="text-5xl mb-4" aria-hidden="true">🛡️</div>
                <h2 className="font-display font-bold text-display-sm text-forest">Signed and sent</h2>
                <p className="font-sans text-ink-muted mt-2 max-w-md mx-auto">
                  The Designated Safeguarding Lead will countersign your declaration. You’ll see it as done on your page once confirmed.
                </p>
                <Link to="/me" className="btn-primary mt-6">Back to My UYIH</Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}

function Intro({ course, task, passed, answeredCount, onStart, onQuiz, onDeclare }) {
  const status = task?.status;
  return (
    <div className="card p-6 md:p-8 space-y-5">
      {status === 'done' && <p className="font-sans text-sm bg-forest/10 text-forest rounded-md px-4 py-3">✓ Completed and countersigned. You can review the lessons any time.</p>}
      {status === 'submitted' && <p className="font-sans text-sm bg-terracotta/10 text-terracotta-dark rounded-md px-4 py-3">Your declaration is waiting for the Safeguarding Lead’s countersignature.</p>}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-sand-light rounded-md p-3"><p className="font-display font-bold text-3xl text-forest">7</p><p className="font-sans text-xs text-ink-muted">short lessons</p></div>
        <div className="bg-sand-light rounded-md p-3"><p className="font-display font-bold text-3xl text-forest">{course.questions.length}</p><p className="font-sans text-xs text-ink-muted">quiz questions</p></div>
        <div className="bg-sand-light rounded-md p-3"><p className="font-display font-bold text-3xl text-forest">{course.pass_mark}</p><p className="font-sans text-xs text-ink-muted">to pass</p></div>
      </div>
      <p className="font-sans text-ink">
        A quick guide to UYIH’s Child Protection and Safeguarding Policy: how to keep children safe, the golden rules,
        and exactly what to do if you’re worried about a child. About 10–15 minutes.
      </p>
      {course.best && <p className="font-sans text-sm text-ink-muted">Best score so far: <strong className="text-forest">{course.best.score}/{course.best.total}</strong>{course.best.passed ? ' ✓ passed' : ''}</p>}
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" onClick={onStart}>{course.attempts ? 'Review the lessons' : 'Start the course'}</button>
        {(course.attempts > 0 || answeredCount > 0) && !passed && <button className="btn-secondary" onClick={onQuiz}>{answeredCount ? 'Continue the quiz' : 'Go to the quiz'}</button>}
        {passed && task && (status === 'todo' || status === 'returned') && <button className="btn-secondary" onClick={onDeclare}>Sign the declaration</button>}
      </div>
      <a className="block font-sans text-sm text-terracotta underline" href={POLICY_PDF} target="_blank" rel="noopener noreferrer">Read the full policy (PDF)</a>
    </div>
  );
}

function Lesson({ index, onBack, onNext }) {
  const l = LESSONS[index];
  const last = index === LESSONS.length - 1;
  return (
    <div>
      <div className="flex gap-1.5 mb-4" aria-label={`Lesson ${index + 1} of ${LESSONS.length}`}>
        {LESSONS.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= index ? 'bg-terracotta' : 'bg-sand-dark/50'}`} />)}
      </div>
      <div className="card p-6 md:p-8">
        <p className="font-sans text-xs uppercase tracking-wide text-ink-faint">Lesson {index + 1} of {LESSONS.length} · Policy {l.ref}</p>
        <h2 className="font-display font-bold text-display-sm text-forest mt-1 flex items-center gap-3">
          <span aria-hidden="true" className="text-3xl">{l.icon}</span>{l.title}
        </h2>
        <ul className="mt-5 space-y-3">
          {l.points.map((pt, i) => (
            <li key={i} className="flex gap-3 font-sans text-ink leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-terracotta flex-shrink-0" aria-hidden="true" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between mt-8 pt-5 border-t border-sand-dark/50">
          <button className="btn-secondary" onClick={onBack}>Back</button>
          <button className="btn-primary" onClick={onNext}>{last ? 'Start the quiz →' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}

function Quiz({ course, onFinished }) {
  const [qs, setQs] = useState(course.questions);
  const firstOpen = qs.findIndex((q) => !q.answered);
  const [i, setI] = useState(firstOpen === -1 ? qs.length - 1 : firstOpen);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const q = qs[i];
  const correctSoFar = qs.filter((x) => x.answered?.correct).length;
  const answered = qs.filter((x) => x.answered).length;

  const choose = async (choice) => {
    if (q.answered || busy) return;
    setBusy(true); setError('');
    const { data, error: err } = await supabase.rpc('answer_course_question', { p_code: CODE, p_position: q.position, p_choice: choice });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setQs((all) => all.map((x) => (x.position === q.position ? { ...x, answered: data } : x)));
  };

  const finish = async () => {
    setBusy(true);
    const { data, error: err } = await supabase.rpc('finish_course_quiz', { p_code: CODE });
    setBusy(false);
    if (err) { setError(err.message); return; }
    onFinished(data);
  };

  const last = i === qs.length - 1;
  return (
    <div>
      <div className="flex justify-between items-center font-sans text-sm mb-3">
        <span className="text-ink-muted">Question {i + 1} of {qs.length}</span>
        <span className="text-forest font-semibold" aria-live="polite">✓ {correctSoFar} correct</span>
      </div>
      <div className="h-1.5 rounded-full bg-sand-dark/50 overflow-hidden mb-4">
        <div className="h-full bg-terracotta transition-all" style={{ width: `${(answered / qs.length) * 100}%` }} />
      </div>
      <div className="card p-6 md:p-8">
        <h2 className="font-sans font-semibold text-lg text-forest leading-snug">{q.question}</h2>
        <div className="mt-5 space-y-2.5" role="group" aria-label="Answers">
          {q.options.map((opt, k) => {
            const a = q.answered;
            const isChosen = a && a.choice === k;
            const isRight = a && a.correct_choice === k;
            const cls = !a
              ? 'border-sand-dark bg-white hover:border-forest/60 hover:bg-sand-light'
              : isRight ? 'border-forest bg-forest/10'
              : isChosen ? 'border-red-400 bg-red-50'
              : 'border-sand-dark/60 bg-white opacity-60';
            return (
              <button key={k} type="button" disabled={Boolean(a) || busy} onClick={() => choose(k)}
                className={`w-full text-left flex gap-3 items-start rounded-md border-2 px-4 py-3 font-sans text-sm transition-colors ${cls}`}>
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  a && isRight ? 'bg-forest text-cream' : a && isChosen ? 'bg-red-500 text-white' : 'bg-sand text-forest'}`}>
                  {a && isRight ? '✓' : a && isChosen ? '✗' : LETTERS[k]}
                </span>
                <span className="text-ink">{opt}</span>
              </button>
            );
          })}
        </div>

        {q.answered && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status"
            className={`mt-5 rounded-md p-4 font-sans text-sm ${q.answered.correct ? 'bg-forest/10 text-forest' : 'bg-red-50 text-red-900'}`}>
            <p className="font-semibold">{q.answered.correct ? 'Correct! 🎉' : 'Not quite.'}</p>
            <p className="mt-1">{q.answered.explanation}</p>
            {q.policy_ref && <p className="mt-1 text-xs opacity-75">Policy {q.policy_ref}</p>}
          </motion.div>
        )}
        {error && <p className="font-sans text-sm text-red-700 mt-4" role="alert">{error}</p>}

        <div className="flex justify-between mt-6 pt-5 border-t border-sand-dark/50">
          <button className="btn-secondary" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
          {!last
            ? <button className="btn-primary" disabled={!q.answered} onClick={() => { setI(i + 1); window.scrollTo({ top: 0 }); }}>Next question</button>
            : <button className="btn-primary" disabled={answered < qs.length || busy} onClick={finish}>{busy ? 'Scoring…' : 'See my score'}</button>}
        </div>
      </div>
    </div>
  );
}

function Result({ result, onRetry, onRetryQuiz, onDeclare }) {
  return (
    <div className="card p-6 md:p-8 text-center" role="status">
      <div className="text-6xl mb-3" aria-hidden="true">{result.passed ? '🏅' : '📚'}</div>
      <p className="font-display font-bold text-6xl text-forest tabular-nums">{result.score}<span className="text-3xl text-ink-muted">/{result.total}</span></p>
      <h2 className="font-display font-bold text-display-sm text-forest mt-2">{result.passed ? 'You passed!' : 'Almost there'}</h2>
      <p className="font-sans text-ink-muted mt-2 max-w-md mx-auto">
        {result.passed
          ? 'Great work. One last step: sign UYIH’s safeguarding declaration.'
          : `You need ${result.pass_mark} to pass. Have another look at the lessons, then try the quiz again. You can retake it as many times as you need.`}
      </p>
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        {result.passed
          ? <button className="btn-primary" onClick={onDeclare}>Sign the declaration</button>
          : <>
              <button className="btn-primary" onClick={onRetry}>Review the lessons</button>
              <button className="btn-secondary" onClick={onRetryQuiz}>Retake the quiz</button>
            </>}
      </div>
    </div>
  );
}

function Declare({ person, task, best, onSent }) {
  const [agree, setAgree] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const status = task?.status;
  if (status === 'submitted' || status === 'done') {
    return <p className="card p-6 font-sans text-ink">Your declaration has already been signed{status === 'done' ? ' and countersigned' : ' and is waiting for countersignature'}.</p>;
  }

  const sign = async () => {
    if (!agree) { setError('Please tick the box to accept the declaration.'); return; }
    if (name.trim().length < 3) { setError('Type your full name to sign.'); return; }
    setBusy(true); setError('');
    let assignmentId = task?.assignment_id;
    if (!assignmentId) {
      // Not yet on their task list: add it, then find it
      const { data: tasks } = await supabase.rpc('get_my_dashboard');
      const open = tasks?.open_tasks.find((t) => t.code === CODE);
      if (open) await supabase.rpc('claim_task', { p_task_id: open.task_id });
      const { data: again } = await supabase.rpc('get_my_dashboard');
      assignmentId = again?.my_tasks.find((t) => t.code === CODE)?.assignment_id;
    }
    const note = `Online course passed ${best?.score}/${best?.total} · Signed as: ${name.trim()}`;
    const { error: err } = await supabase.rpc('submit_task', { p_assignment_id: assignmentId, p_note: note, p_declaration: true });
    setBusy(false);
    if (err) { setError(err.message); return; }
    onSent();
  };

  return (
    <div className="card p-6 md:p-8 space-y-5">
      <div>
        <p className="font-sans text-xs uppercase tracking-wide text-ink-faint">Policy Annex 1</p>
        <h2 className="font-display font-bold text-display-sm text-forest">Code of Conduct Declaration</h2>
      </div>
      <blockquote className="font-sans text-ink leading-relaxed bg-sand-light border-l-4 border-forest rounded-r-md p-4">{DECLARATION}</blockquote>
      <a className="inline-block font-sans text-sm text-terracotta underline" href={POLICY_PDF} target="_blank" rel="noopener noreferrer">Read the full policy (PDF)</a>
      <label className="flex gap-3 items-start cursor-pointer font-sans text-sm text-ink">
        <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[#1A3C2A]" checked={agree} onChange={(e) => { setAgree(e.target.checked); setError(''); }} />
        <span>I have read and understood the policy, and I agree to this declaration.</span>
      </label>
      <label className="block">
        <span className="input-label">Type your full name to sign</span>
        <input className="input-field" value={name} placeholder={person.full_name} maxLength={80} onChange={(e) => { setName(e.target.value); setError(''); }} />
      </label>
      {error && <p className="font-sans text-sm text-red-700" role="alert">{error}</p>}
      <button className="btn-primary w-full py-3.5" onClick={sign} disabled={busy}>{busy ? 'Signing…' : 'Sign and send to the Safeguarding Lead'}</button>
      <p className="font-sans text-xs text-ink-faint">The Designated Safeguarding Lead countersigns your declaration after reviewing it.</p>
    </div>
  );
}
