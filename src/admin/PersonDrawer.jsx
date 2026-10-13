// File: src/admin/PersonDrawer.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { supabase, q } from './supabase';
import {
  StagePill, WhatsAppButton, messageTemplate, fmtDate, fmtDateTime, daysSince,
  toDateInput, fromDateInput, addDays, ErrorNote, inputCls, labelCls, btnPrimary, btnGhost,
} from './ui';
import { Modal } from './People';
import { STAGES, AGE_BANDS, HEARD_FROM } from '../lib/config';
import { prettyPhone } from '../lib/phone';
import { LoginSection, ProfileSection, ChecklistSection, TasksSection, DeletionBanner, DocumentsSection, removePersonFiles } from './PersonMember';

const TRIAL_DAYS = 90;

export default function PersonDrawer({ personId, projects, onClose, onChanged }) {
  const [p, setP]                   = useState(null);
  const [assignments, setAssign]    = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [followUps, setFollowUps]   = useState([]);
  const [stageLog, setStageLog]     = useState([]);
  const [error, setError]           = useState('');
  const [notes, setNotes]           = useState('');
  const [msg, setMsg]               = useState('');

  const load = useCallback(async () => {
    try {
      const [person, a, at, f, s] = await Promise.all([
        q(supabase.from('people').select('*, member_profiles(*)').eq('id', personId).single()),
        q(supabase.from('assignments').select('*, projects(name)').eq('person_id', personId).order('started_on', { ascending: false })),
        q(supabase.from('attendance').select('role, attended, events(id, title, starts_at)').eq('person_id', personId)),
        q(supabase.from('follow_ups').select('*').eq('person_id', personId).order('done_at', { ascending: false })),
        q(supabase.from('stage_changes').select('*').eq('person_id', personId).order('changed_at', { ascending: false })),
      ]);
      setP(person); setNotes(person.notes || ''); setMsg((m) => m || messageTemplate(person));
      setAssign(a);
      setAttendance(at.filter((x) => x.events).sort((x, y) => new Date(y.events.starts_at) - new Date(x.events.starts_at)));
      setFollowUps(f); setStageLog(s); setError('');
    } catch (e) { setError(e.message); }
  }, [personId]);

  useEffect(() => { load(); }, [load]);

  const update = async (patch) => {
    setP((cur) => ({ ...cur, ...patch })); // show the change right away; reload confirms it
    if (patch.stage) setMsg(messageTemplate({ ...p, ...patch }));
    try {
      await q(supabase.from('people').update(patch).eq('id', personId));
      await load(); onChanged();
    } catch (e) { setError(e.message); }
  };

  if (!p) {
    return <Modal title="Loading…" onClose={onClose} wide><ErrorNote error={error} /></Modal>;
  }

  const inTrial = p.stage === 'volunteer';
  const trialDay = inTrial ? daysSince(p.stage_changed_at) : 0;
  const projectName = (slug) => projects.find((x) => x.slug === slug)?.name || slug;

  return (
    <Modal title={p.full_name} onClose={onClose} wide>
      <div className="space-y-6 text-sm">
        <ErrorNote error={error} />
        <DeletionBanner person={p} />

        {/* Summary */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-ink-muted">
          <StagePill stage={p.stage} />
          <span>{prettyPhone(p.phone)}</span>
          {p.email && <a className="underline" href={`mailto:${p.email}`}>{p.email}</a>}
          <span>Age {AGE_BANDS.find((a) => a.value === p.age_band)?.label}</span>
          {p.area && <span>{p.area}</span>}
          <span>Joined {fmtDate(p.created_at)}{p.source === 'admin' ? ' (added by admin)' : ''}</span>
          {p.heard_from && <span>Heard via {HEARD_FROM.find((h) => h.value === p.heard_from)?.label}</span>}
        </div>
        {p.interests.length > 0 && (
          <p><span className="text-ink-muted">Interested in:</span> {p.interests.map(projectName).join(', ')}</p>
        )}

        {/* Stage + trial clock */}
        <div className="grid sm:grid-cols-2 gap-4 bg-sand-light rounded-md p-4">
          <div>
            <label className={labelCls} htmlFor="pd-stage">Stage</label>
            <select id="pd-stage" className={inputCls} value={p.stage}
              onChange={(e) => {
                const to = e.target.value;
                if (to === 'member' && trialDay < TRIAL_DAYS && p.stage === 'volunteer'
                    && !window.confirm(`${p.full_name.split(' ')[0]} is on day ${trialDay} of the ${TRIAL_DAYS}-day trial. Make them a member now?`)) return;
                update({ stage: to });
              }}>
              {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <p className="text-xs text-ink-muted mt-1">Since {fmtDate(p.stage_changed_at)}</p>
          </div>
          <div className="space-y-2">
            {inTrial ? (
              <>
                <p className={labelCls}>Volunteer trial</p>
                <div className="h-2 rounded-full bg-sand-dark/50 overflow-hidden">
                  <div className="h-full bg-terracotta" style={{ width: `${Math.min(100, (trialDay / TRIAL_DAYS) * 100)}%` }} />
                </div>
                <p className="text-xs text-ink-muted">
                  {trialDay >= TRIAL_DAYS
                    ? <strong className="text-forest">Day {trialDay}: ready for a membership review.</strong>
                    : `Day ${trialDay} of ${TRIAL_DAYS}`}
                </p>
              </>
            ) : null}
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-[#1A3C2A]" checked={p.in_whatsapp} onChange={(e) => update({ in_whatsapp: e.target.checked })} />
              In the WhatsApp community
            </label>
            {(p.stage === 'member' || p.stage === 'lead' || p.fee_paid) && (
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-[#1A3C2A]" checked={p.fee_paid} onChange={(e) => update({ fee_paid: e.target.checked })} />
                Membership fee paid{p.fee_paid_on ? ` on ${fmtDate(p.fee_paid_on)}` : ''}
              </label>
            )}
          </div>
        </div>

        {/* Get to know you + membership */}
        <div className="grid gap-5 border border-sand-dark/60 rounded-md p-4">
          <ProfileSection profile={p.member_profiles} />
          <ChecklistSection personId={p.id} refreshKey={p.updated_at + assignments.length + attendance.length} />
          <TasksSection personId={p.id} onChanged={load} />
          <DocumentsSection personId={p.id} onChanged={onChanged} />
          <LoginSection person={p} onChanged={load} />
        </div>

        {/* Message + follow-up */}
        <FollowUpBox person={p} msg={msg} setMsg={setMsg} onDone={async () => { await load(); onChanged(); }} />

        {/* Projects */}
        <Assignments personId={p.id} assignments={assignments} projects={projects} onChange={load} setError={setError} />

        {/* Events */}
        <section>
          <h3 className="font-semibold text-forest mb-2">Events</h3>
          {attendance.length === 0 ? <p className="text-ink-muted">Not on any event list yet. Add them from the Events tab.</p> : (
            <ul className="space-y-1">
              {attendance.map((a) => (
                <li key={a.events.id} className="flex justify-between gap-3">
                  <span>{a.events.title}{a.role ? <span className="text-ink-muted"> · {a.role}</span> : null}</span>
                  <span className={a.attended ? 'text-forest font-medium' : 'text-ink-faint'}>
                    {fmtDate(a.events.starts_at)} · {a.attended ? 'attended' : 'expected'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Notes */}
        <section>
          <label className="font-semibold text-forest mb-2 block" htmlFor="pd-notes">Notes</label>
          <textarea id="pd-notes" rows={3} className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Skills, availability, anything useful. Avoid sensitive details (health, family matters)." />
          {notes !== (p.notes || '') && (
            <button className={`${btnPrimary} mt-2`} onClick={() => update({ notes: notes.trim() || null })}>Save notes</button>
          )}
        </section>

        {/* History */}
        <section>
          <h3 className="font-semibold text-forest mb-2">History</h3>
          <ul className="space-y-1.5 text-ink-muted">
            {[
              ...followUps.map((f) => ({ at: f.done_at, text: `Followed up by ${f.channel.replace('_', ' ')}${f.note ? `: ${f.note}` : ''}` })),
              ...stageLog.map((s) => ({ at: s.changed_at, text: s.from_stage ? `Moved from ${s.from_stage} to ${s.to_stage}` : `Joined as ${s.to_stage}` })),
            ].sort((a, b) => new Date(b.at) - new Date(a.at)).map((h, i) => (
              <li key={i} className="flex gap-3"><span className="w-28 flex-shrink-0 text-xs pt-0.5">{fmtDateTime(h.at)}</span><span className="text-ink">{h.text}</span></li>
            ))}
          </ul>
        </section>

        {/* Delete */}
        <div className="pt-4 border-t border-sand-dark/50 flex justify-between items-center gap-3">
          <p className="text-xs text-ink-muted">Consent: version {p.consent_version}, {fmtDate(p.consented_at)}</p>
          <button className="text-xs text-red-700 underline" onClick={async () => {
            if (!window.confirm(`Permanently delete ${p.full_name} and all their history? Use this when someone asks to be removed.`)) return;
            try { await removePersonFiles(p.id); await q(supabase.from('people').delete().eq('id', p.id)); onChanged(); onClose(); }
            catch (e) { setError(e.message); }
          }}>Delete this person</button>
        </div>
      </div>
    </Modal>
  );
}

function FollowUpBox({ person, msg, setMsg, onDone }) {
  const [channel, setChannel] = useState('whatsapp');
  const [note, setNote]       = useState('');
  const [next, setNext]       = useState(toDateInput(addDays(7)));
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');

  const log = async () => {
    setBusy(true); setError('');
    try {
      await q(supabase.from('follow_ups').insert({ person_id: person.id, channel, note: note.trim() || null }));
      await q(supabase.from('people').update({ next_follow_up_at: fromDateInput(next) }).eq('id', person.id));
      setNote('');
      await onDone();
    } catch (e) { setError(e.message); }
    setBusy(false);
  };

  return (
    <section className="border border-sand-dark/60 rounded-md p-4 space-y-3">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="font-semibold text-forest">Follow up</h3>
        <span className="text-xs text-ink-muted">Next: {person.next_follow_up_at ? fmtDate(person.next_follow_up_at) : 'not set'}</span>
      </div>
      <div>
        <label className={labelCls} htmlFor="fu-msg">Message (edit the [brackets] before sending)</label>
        <textarea id="fu-msg" rows={3} className={inputCls} value={msg} onChange={(e) => setMsg(e.target.value)} />
        <div className="mt-2"><WhatsAppButton phone={person.phone} text={msg} label="Open in WhatsApp" /></div>
      </div>
      <div className="grid sm:grid-cols-[auto_1fr_auto] gap-3 items-end pt-2 border-t border-sand-dark/40">
        <div>
          <label className={labelCls} htmlFor="fu-ch">Contacted by</label>
          <select id="fu-ch" className={inputCls} value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="call">Call</option>
            <option value="in_person">In person</option>
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="fu-note">What happened (optional)</label>
          <input id="fu-note" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Coming to Saturday's tree planting as photographer" maxLength={1000} />
        </div>
        <div>
          <label className={labelCls} htmlFor="fu-next">Next follow-up</label>
          <input id="fu-next" type="date" className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
      </div>
      <ErrorNote error={error} />
      <button className={btnPrimary} onClick={log} disabled={busy}>{busy ? 'Saving…' : 'Mark as followed up'}</button>
    </section>
  );
}

function Assignments({ personId, assignments, projects, onChange, setError }) {
  const [projectId, setProjectId] = useState('');
  const [role, setRole] = useState('');
  const active = assignments.filter((a) => !a.ended_on);
  const past = assignments.filter((a) => a.ended_on);

  const add = async () => {
    if (!projectId) return;
    try {
      await q(supabase.from('assignments').insert({ person_id: personId, project_id: Number(projectId), role: role.trim() || null }));
      setProjectId(''); setRole(''); onChange();
    } catch (e) { setError(e.message); }
  };
  const end = async (id) => {
    try {
      await q(supabase.from('assignments').update({ ended_on: toDateInput(new Date()) }).eq('id', id));
      onChange();
    } catch (e) { setError(e.message); }
  };

  return (
    <section>
      <h3 className="font-semibold text-forest mb-2">Projects</h3>
      {active.length === 0 && <p className="text-ink-muted mb-2">Not placed in a project yet.</p>}
      <ul className="space-y-1.5 mb-3">
        {active.map((a) => (
          <li key={a.id} className="flex justify-between items-center gap-3">
            <span><strong className="text-forest">{a.projects?.name}</strong>{a.role ? ` · ${a.role}` : ''} <span className="text-ink-muted text-xs">since {fmtDate(a.started_on)}</span></span>
            <button className="text-xs text-ink-muted underline" onClick={() => end(a.id)}>End</button>
          </li>
        ))}
        {past.map((a) => (
          <li key={a.id} className="text-ink-faint text-xs">{a.projects?.name}{a.role ? ` · ${a.role}` : ''}: {fmtDate(a.started_on)} to {fmtDate(a.ended_on)}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <select className={`${inputCls} w-auto`} value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="Project">
          <option value="">Place in a project…</option>
          {projects.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        <input className={`${inputCls} w-auto flex-1 min-w-[140px]`} value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role, e.g. Nursery helper" aria-label="Role" maxLength={80} />
        <button className={btnGhost} onClick={add} disabled={!projectId}>Add</button>
      </div>
    </section>
  );
}
