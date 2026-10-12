// Small shared pieces for the admin dashboard
import React from 'react';
import { STAGES, UYIH_WHATSAPP_NUMBER } from '../lib/config';
import { waNumber } from '../lib/phone';

const TZ = 'Africa/Nairobi';

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }) : '—';

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ }) : '—';

// Takes 'YYYY-MM-01' (a Nairobi calendar month from the database)
export const fmtMonth = (d) =>
  new Date(`${String(d).slice(0, 7)}-15T12:00:00Z`).toLocaleDateString('en-KE', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

// yyyy-mm-dd for <input type="date">, in Nairobi time
export const toDateInput = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-CA', { timeZone: TZ });
};
// Midday Nairobi on the chosen date, so follow-ups don't drift a day
export const fromDateInput = (s) => (s ? new Date(`${s}T09:00:00+03:00`).toISOString() : null);
export const addDays = (n) => new Date(Date.now() + n * 86400000).toISOString();

const stageStyle = {
  newcomer:  'bg-sand text-forest',
  volunteer: 'bg-terracotta/15 text-terracotta-dark',
  member:    'bg-forest/10 text-forest',
  lead:      'bg-forest text-cream',
};
export function StagePill({ stage }) {
  const label = STAGES.find((s) => s.value === stage)?.label || stage;
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${stageStyle[stage] || ''}`}>{label}</span>;
}

export function followUpState(d) {
  if (!d) return 'none';
  const t = new Date(d).getTime();
  if (t < Date.now()) return 'overdue';
  if (t < Date.now() + 86400000) return 'today';
  return 'later';
}

export function FollowUpBadge({ date }) {
  const s = followUpState(date);
  if (s === 'none') return <span className="text-ink-faint text-xs">—</span>;
  const cls = s === 'overdue' ? 'text-red-700 bg-red-50' : s === 'today' ? 'text-terracotta-dark bg-terracotta/10' : 'text-ink-muted bg-sand-light';
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>{s === 'overdue' ? 'Overdue · ' : ''}{fmtDate(date)}</span>;
}

export function waLink(phone, text) {
  return `https://wa.me/${waNumber(phone)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function WhatsAppButton({ phone, text, label = 'WhatsApp', small }) {
  return (
    <a href={waLink(phone, text)} target="_blank" rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-md bg-[#1F8F4E] hover:bg-[#187540] text-white font-semibold transition-colors
        ${small ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm'}`}
      onClick={(e) => e.stopPropagation()}>
      <svg viewBox="0 0 24 24" className={small ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill="currentColor" aria-hidden="true"><path d="M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 1 1 7.99 4.42zm8.02-17.45A11.33 11.33 0 0 0 12.05.75C5.8.75.72 5.83.72 12.08c0 2 .52 3.95 1.52 5.67L.62 23.62l6.01-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.32-8.01z"/></svg>
      {label}
    </a>
  );
}

// Message templates per stage. The admin can edit before sending.
export function messageTemplate(person) {
  const first = (person.full_name || '').split(/\s+/)[0];
  switch (person.stage) {
    case 'newcomer':
      return `Hi ${first}, this is Umoja Youth Impact Hub 👋 Thank you for joining! Our next activity is [EVENT] on [DATE] at [PLACE]. Would you like to come as our [ROLE]? Just reply here and we'll share the details.`;
    case 'volunteer':
      return `Hi ${first}, thank you for volunteering with UYIH! How are you finding [PROJECT]? Anything you need from us? Our next meet-up is [DATE].`;
    case 'member':
      return `Hi ${first}, a quick update from UYIH: [UPDATE]. Hope to see you at [EVENT] on [DATE].`;
    default:
      return `Hi ${first}, `;
  }
}

export const UYIH_NUMBER_PRETTY = `0${UYIH_WHATSAPP_NUMBER.slice(3, 6)} ${UYIH_WHATSAPP_NUMBER.slice(6, 9)} ${UYIH_WHATSAPP_NUMBER.slice(9)}`;

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`bg-white rounded-lg border border-sand-dark/50 shadow-card ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-sand-dark/40">
          <h2 className="font-display font-bold text-xl text-forest">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return <p className="text-sm text-red-700 bg-red-50 rounded-md px-3 py-2" role="alert">{String(error)}</p>;
}

export const inputCls =
  'w-full rounded-md border border-sand-dark bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/20';
export const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-ink-muted mb-1';
export const btnCls = 'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50';
export const btnPrimary = `${btnCls} bg-terracotta text-white hover:bg-terracotta-dark`;
export const btnGhost = `${btnCls} border border-sand-dark text-forest hover:bg-sand-light`;
