// File: src/components/PaybillCard.jsx
// M-Pesa paybill instructions with copy buttons. Used on /donate and /me/pay.
import React, { useState } from 'react';
import { PAYBILL, UYIH_WHATSAPP_NUMBER } from '../lib/config';

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { /* clipboard blocked: the value is still visible */ }
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-cream border border-sand-dark/60 px-4 py-3">
      <div className="min-w-0">
        <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-ink-muted">{label}</p>
        <p className="font-display font-bold text-2xl text-forest tabular-nums break-all">{value}</p>
      </div>
      <button type="button" onClick={copy}
        className="flex-shrink-0 rounded-md border border-forest/30 px-3 py-1.5 font-sans text-xs font-semibold text-forest hover:bg-forest hover:text-cream transition-colors"
        aria-label={`Copy ${label}`}>
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
    </div>
  );
}

export default function PaybillCard({ amount, title = 'Pay with M-Pesa' }) {
  if (!PAYBILL.number) {
    return (
      <div className="card p-6">
        <h2 className="font-display font-bold text-display-sm text-forest">{title}</h2>
        <p className="font-sans text-ink-muted mt-2">
          Our paybill details will appear here shortly. Meanwhile, message us on WhatsApp and we’ll share them.
        </p>
        <a className="btn-primary mt-4" href={`https://wa.me/${UYIH_WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi UYIH, please share your M-Pesa paybill details.')}`}>Message UYIH</a>
      </div>
    );
  }
  const steps = [
    'Open M-Pesa and choose Lipa na M-Pesa → Pay Bill.',
    `Business number: ${PAYBILL.number}`,
    `Account number: ${PAYBILL.account || 'your name'}`,
    amount ? `Amount: Ksh ${amount.toLocaleString('en-KE')}` : 'Amount: any amount you choose',
    PAYBILL.registeredName
      ? `Enter your PIN and check the name shows ${PAYBILL.registeredName} before you send.`
      : 'Check the business and account numbers, then enter your PIN and send.',
  ];
  return (
    <div className="card p-6 md:p-7">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#1F8F4E] text-white font-bold text-sm" aria-hidden="true">M</span>
        <h2 className="font-display font-bold text-display-sm text-forest">{title}</h2>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        <CopyRow label="Business number" value={PAYBILL.number} />
        {PAYBILL.account && <CopyRow label="Account number" value={PAYBILL.account} />}
      </div>
      {amount && (
        <p className="font-sans text-sm text-ink mt-3">Amount: <strong className="text-forest">Ksh {amount.toLocaleString('en-KE')}</strong></p>
      )}
      <ol className="mt-5 space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 font-sans text-sm text-ink">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sand text-forest text-xs font-bold flex items-center justify-center">{i + 1}</span>
            <span className="pt-0.5">{s}</span>
          </li>
        ))}
      </ol>
      <p className="font-sans text-xs text-ink-faint mt-4">
        You’ll get an M-Pesa SMS with a 10-character confirmation code (like SJK4XYZ12A). Keep it for the next step.
      </p>
    </div>
  );
}
