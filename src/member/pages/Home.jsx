// File: src/member/pages/Home.jsx
// Member home: continue learning, next tasks, membership progress, medals.
import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMember, Block } from '../MemberLayout';
import { CourseCard } from './Learning';
import { NextMedalCard } from './Achievements';
import { courseProgress, ProgressBar } from '../achievements';
import { MyTask, OpenTask, withMatches, COURSE_TASKS } from '../TaskCards';
import { WHATSAPP_COMMUNITY_URL } from '../../lib/config';
import WhatsAppIcon from '../../components/WhatsAppIcon';

const TRIAL_DAYS = 90;
const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' });

function readFlag(k) { try { return localStorage.getItem(k) === '1'; } catch { return false; } }
function setFlag(k) { try { localStorage.setItem(k, '1'); } catch { /* ignore */ } }

function WelcomeBanner({ first, onClose }) {
  return (
    <div className="relative rounded-xl border border-[#1F8F4E]/30 bg-[#1F8F4E]/[0.06] p-5 md:p-6 mb-6">
      <button className="absolute top-3 right-3 text-ink-muted hover:text-forest text-lg leading-none" onClick={onClose} aria-label="Close">×</button>
      <p className="font-display font-bold text-2xl text-forest">Karibu, {first}! 🎉</p>
      <p className="font-sans text-ink mt-1 max-w-xl">This is your member page. Start with the two short courses below. Upcoming activities are also shared in our WhatsApp community, if you’d like to join it.</p>
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <a href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-sans text-sm font-semibold text-white bg-[#1F8F4E] hover:bg-[#187540]">
          <WhatsAppIcon className="w-4 h-4" /> Join the WhatsApp community
        </a>
        <span className="font-sans text-xs text-ink-muted">Save <strong>0783 218 081</strong> as “UYIH”.</span>
      </div>
    </div>
  );
}

export default function Home() {
  const { dash, learning, reload, editProfile } = useMember();
  const { person, profile, progress, achievements: ach } = dash;
  const first = person.full_name.split(/\s+/)[0];
  const [params, setParams] = useSearchParams();
  const welcomeKey = `uyih-welcome-${person.id}`;
  const [showWelcome, setShowWelcome] = useState(() => params.get('welcome') === '1' || (person.stage === 'newcomer' && !readFlag(welcomeKey)));
  const closeWelcome = () => { setFlag(welcomeKey); setShowWelcome(false); if (params.get('welcome')) setParams({}, { replace: true }); };

  const doneCount = progress.filter((c) => c.done).length;
  const pct = Math.round((doneCount / progress.length) * 100);
  const trialDay = person.stage === 'volunteer' ? daysSince(person.stage_changed_at) : null;
  const courses = learning.filter((c) => courseProgress(c) < 100);
  const order = { returned: 0, todo: 1, submitted: 2 };
  const active = dash.my_tasks.filter((t) => t.status !== 'done' && !COURSE_TASKS[t.code]).sort((a, b) => order[a.status] - order[b.status]);
  const recommended = useMemo(() => withMatches(dash.open_tasks.filter((t) => !t.code), profile?.skills || [])
    .sort((a, b) => b.match.length - a.match.length).slice(0, 2), [dash, profile]);
  const isMember = person.stage === 'member' || person.stage === 'lead';

  return (
    <>
      {showWelcome && <WelcomeBanner first={first} onClose={closeWelcome} />}
      {person.deletion_requested_at && (
        <p className="font-sans text-sm bg-red-50 text-red-800 rounded-md px-4 py-3 mb-6" role="status">
          You asked us to delete your data on {fmtDate(person.deletion_requested_at)}. We’ll do this within 30 days. Changed your mind? Message us on WhatsApp.
        </p>
      )}
      {!profile?.completed_at && (
        <div className="rounded-xl border-2 border-dashed border-terracotta/50 bg-terracotta/5 p-5 flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <h2 className="font-display font-bold text-xl text-forest">Tell us about yourself</h2>
            <p className="font-sans text-sm text-ink-muted">Your skills and free time help us give you roles you’ll enjoy. About 3 minutes.</p>
          </div>
          <button className="btn-primary" onClick={editProfile}>Complete my profile</button>
        </div>
      )}

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {courses.length > 0 && (
            <section>
              <div className="flex items-end justify-between mb-3">
                <h2 className="font-display font-bold text-2xl text-forest">Continue learning</h2>
                <Link to="/me/learning" className="font-sans text-sm text-terracotta font-semibold">My learning →</Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">{courses.map((c) => <CourseCard key={c.code} c={c} compact />)}</div>
            </section>
          )}

          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="font-display font-bold text-2xl text-forest">Your tasks</h2>
              <Link to="/me/tasks" className="font-sans text-sm text-terracotta font-semibold">All tasks →</Link>
            </div>
            {active.length === 0
              ? <p className="font-sans text-sm text-ink-muted rounded-xl border border-sand-dark/50 p-5">No tasks in progress. Pick one up below, or we’ll assign you one that fits your skills.</p>
              : <ul className="grid gap-4">{active.slice(0, 2).map((t) => <MyTask key={t.assignment_id} t={t} reload={reload} personId={person.id} />)}</ul>}
            {active.length > 2 && <p className="font-sans text-sm text-ink-muted mt-2"><Link to="/me/tasks" className="underline">+ {active.length - 2} more</Link></p>}
          </section>

          {recommended.length > 0 && (
            <section>
              <div className="flex items-end justify-between mb-3">
                <h2 className="font-display font-bold text-2xl text-forest">Recommended for you</h2>
                <Link to="/me/tasks?tab=find" className="font-sans text-sm text-terracotta font-semibold">Find tasks →</Link>
              </div>
              <ul className="grid sm:grid-cols-2 gap-4">{recommended.map((t) => <OpenTask key={t.task_id} t={t} reload={reload} />)}</ul>
            </section>
          )}
        </div>

        <div className="space-y-6">
          {!isMember ? (
            <Block title="Becoming a member">
              <div className="flex items-center justify-between font-sans text-sm mb-2">
                <span className="text-ink-muted">{doneCount} of {progress.length} done</span>
                <span className="font-semibold text-forest">{pct}%</span>
              </div>
              <ProgressBar pct={pct} />
              {trialDay !== null && (
                <p className="font-sans text-xs text-ink-muted mt-2">Volunteer trial: day {Math.min(trialDay, TRIAL_DAYS)} of {TRIAL_DAYS}</p>
              )}
              {person.stage === 'newcomer' && (
                <p className="font-sans text-xs text-ink-muted mt-2">Come to your first UYIH activity to become a Volunteer and start your 90-day trial.</p>
              )}
              <ul className="mt-4 space-y-2.5">
                {progress.map((c) => (
                  <li key={c.key} className="flex gap-2.5 items-start font-sans text-sm">
                    <span aria-hidden="true" className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-[11px] ${c.done ? 'bg-forest text-cream' : 'border-2 border-sand-dark'}`}>{c.done ? '✓' : ''}</span>
                    <span className={`flex-1 ${c.done ? 'text-ink-muted line-through decoration-sand-dark' : 'text-ink'}`}>
                      <span className="sr-only">{c.done ? 'Done: ' : 'To do: '}</span>{c.label}
                      {c.target > 1 && !c.done && <span className="text-ink-faint"> · {c.count}/{c.target}</span>}
                    </span>
                    {!c.done && c.key === 'fee' && <Link to="/me/pay" className="font-semibold text-terracotta text-xs whitespace-nowrap">Pay →</Link>}
                    {!c.done && (c.key === 'orientation' || c.key === 'safeguarding') && <Link to={`/me/course/${c.key}`} className="font-semibold text-terracotta text-xs whitespace-nowrap">Start →</Link>}
                    {!c.done && c.key === 'profile' && <button onClick={editProfile} className="font-semibold text-terracotta text-xs whitespace-nowrap">Finish →</button>}
                  </li>
                ))}
              </ul>
            </Block>
          ) : (
            <Block title="Membership">
              <p className="font-sans text-sm text-ink">You’re a full UYIH {person.stage === 'lead' ? 'lead' : 'member'}. Asante! 💚</p>
              {!person.fee_paid && <Link to="/me/pay" className="btn-primary text-sm mt-3">Pay the annual fee</Link>}
            </Block>
          )}

          <Block title="Achievements" action={<Link to="/me/achievements" className="font-sans text-sm text-terracotta font-semibold">View →</Link>}>
            <NextMedalCard ach={ach} />
            <p className="font-sans text-sm text-ink-muted mt-4"><strong className="text-forest">{ach.points}</strong> points · <strong className="text-forest">{ach.certificates.length}</strong> certificate{ach.certificates.length === 1 ? '' : 's'}</p>
          </Block>
        </div>
      </div>
    </>
  );
}
