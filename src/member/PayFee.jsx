// File: src/member/PayFee.jsx
// /me/pay: pay the membership fee by M-Pesa paybill, then send the
// confirmation code. UYIH confirms it against the statement in /admin → Payments.
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MEMBERSHIP_FEE, PAYBILL } from '../lib/config';
import PaybillCard from '../components/PaybillCard';
import { MemberHero, Login } from './MemberApp';

const Shell = ({ children }) => <div className="bg-white min-h-screen">{children}</div>;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' });

export default function PayFee() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    document.title = 'Membership fee · My UYIH';
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <Shell><MemberHero eyebrow="Membership" title="Loading…" /></Shell>;
  if (!session) return <Shell><Login /></Shell>;
  return <Shell><PayBody /></Shell>;
}

function PayBody() {
  const [state, setState] = useState(null); // { paid, paidOn, payments }
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState(String(MEMBERSHIP_FEE));
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [d, p] = await Promise.all([supabase.rpc('get_my_dashboard'), supabase.rpc('get_my_fee_payments')]);
    if (d.error || p.error) { setError((d.error || p.error).message); return; }
    const fee = d.data?.progress?.find((c) => c.key === 'fee');
    setState({ paid: Boolean(fee?.done), payments: p.data || [] });
  }, []);
  useEffect(() => { load(); }, [load]);

  const send = async (e) => {
    e.preventDefault();
    const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(clean)) { setError('The M-Pesa code has 10 letters and numbers, like SJK4XYZ12A.'); return; }
    if (!(Number(amount) >= 1)) { setError('Enter the amount you sent.'); return; }
    setBusy(true); setError('');
    const { error: err } = await supabase.rpc('submit_fee_payment', { p_mpesa_code: clean, p_amount: Number(amount) });
    setBusy(false);
    if (err) { setError(err.message); return; }
    setCode(''); load();
  };

  const pending = state?.payments.find((p) => p.status === 'pending');
  const rejected = state?.payments.find((p) => p.status === 'rejected');

  return (
    <>
      <MemberHero eyebrow="Becoming a member" title="Membership fee">
        <p className="font-sans text-ink-muted mt-2 max-w-xl">Ksh {MEMBERSHIP_FEE.toLocaleString('en-KE')} a year by M-Pesa, first paid at the end of your 90-day volunteer trial (Constitution, Article 4).</p>
      </MemberHero>
      <div className="container-narrow max-w-2xl py-8 md:py-12 space-y-6">
        <Link to="/me" className="font-sans text-sm text-ink-muted underline">← Back to My UYIH</Link>
        {!state && !error && <p className="font-sans text-ink-muted">Loading…</p>}
        {error && !state && <p className="font-sans text-red-700">{error}</p>}

        {state?.paid && (
          <div className="card p-6 md:p-8 text-center" role="status">
            <div className="text-5xl mb-3" aria-hidden="true">✅</div>
            <h2 className="font-display font-bold text-display-sm text-forest">Your fee is paid</h2>
            <p className="font-sans text-ink-muted mt-2">Thank you! It’s ticked off on your membership checklist.</p>
            <Link to="/me" className="btn-primary mt-6">Back to My UYIH</Link>
          </div>
        )}

        {state && !state.paid && pending && (
          <div className="card p-6 md:p-8 text-center" role="status">
            <div className="text-5xl mb-3" aria-hidden="true">⏳</div>
            <h2 className="font-display font-bold text-display-sm text-forest">Waiting for confirmation</h2>
            <p className="font-sans text-ink-muted mt-2 max-w-md mx-auto">
              We got your M-Pesa code <strong className="text-forest tracking-wider">{pending.mpesa_code}</strong> for
              Ksh {pending.amount.toLocaleString('en-KE')} on {fmtDate(pending.created_at)}. UYIH will check it against the paybill statement and tick your fee off.
            </p>
          </div>
        )}

        {state && !state.paid && !pending && (
          <>
            {rejected && (
              <p className="font-sans text-sm bg-red-50 text-red-800 rounded-md px-4 py-3" role="alert">
                We couldn’t match code {rejected.mpesa_code}{rejected.admin_note ? `: ${rejected.admin_note}` : ''}. Please check it and send it again, or message UYIH.
              </p>
            )}
            <div>
              <p className="font-sans text-xs uppercase tracking-[0.14em] text-terracotta font-semibold mb-2">Step 1</p>
              <PaybillCard amount={MEMBERSHIP_FEE} title="Pay by M-Pesa" />
            </div>
            <form onSubmit={send} className="card p-6 md:p-7 space-y-4" noValidate>
              <div>
                <p className="font-sans text-xs uppercase tracking-[0.14em] text-terracotta font-semibold mb-1">Step 2</p>
                <h2 className="font-display font-bold text-display-sm text-forest">Send us your M-Pesa code</h2>
                <p className="font-sans text-sm text-ink-muted mt-1">It’s at the start of the M-Pesa SMS you received.</p>
              </div>
              <div className="grid sm:grid-cols-[1.4fr_1fr] gap-4">
                <label className="block">
                  <span className="input-label">M-Pesa code</span>
                  <input className="input-field uppercase tracking-wider" value={code} maxLength={14} placeholder="SJK4XYZ12A"
                    autoCapitalize="characters" onChange={(e) => { setCode(e.target.value); setError(''); }} />
                </label>
                <label className="block">
                  <span className="input-label">Amount (Ksh)</span>
                  <input className="input-field" type="number" inputMode="numeric" min="1" value={amount} onChange={(e) => { setAmount(e.target.value); setError(''); }} />
                </label>
              </div>
              {error && <p className="font-sans text-sm text-red-700" role="alert">{error}</p>}
              <button className="btn-primary w-full py-3.5" disabled={busy || !PAYBILL.number}>{busy ? 'Sending…' : 'Send for confirmation'}</button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
