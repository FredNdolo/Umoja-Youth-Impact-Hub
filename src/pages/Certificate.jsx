// File: src/pages/Certificate.jsx
// /certificates/:code: a course certificate anyone can open to check it's
// genuine. Members download it as a PDF with the browser's print dialog.
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { verifyCertificate } from '../lib/publicApi';
import { certificateSignatories } from '../lib/config';
import logo from '../assets/logo.jpg';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Nairobi' });

const PRINT_CSS = `
@page { size: A4 landscape; margin: 0; }
@media print {
  html, body { background: #fff !important; }
  .cert-actions { display: none !important; }
  .cert-page { padding: 0 !important; min-height: 0 !important; }
  .cert-sheet { box-shadow: none !important; width: 297mm !important; height: 210mm !important; max-width: none !important; margin: 0 !important; border-radius: 0 !important; aspect-ratio: auto !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

function useScriptFont() {
  useEffect(() => {
    if (document.getElementById('cert-font')) return;
    const l = document.createElement('link');
    l.id = 'cert-font'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap';
    document.head.appendChild(l);
  }, []);
}

function Signature({ name, title }) {
  return (
    <div className="text-center w-56 sm:w-64">
      <div className="h-12 flex items-end justify-center">
        {name && <span style={{ fontFamily: "'Great Vibes', cursive" }} className="text-3xl sm:text-4xl text-forest leading-none whitespace-nowrap">{name}</span>}
      </div>
      <div className="border-t border-forest/50 mt-1 pt-1.5">
        {name && <p className="font-sans text-xs font-semibold text-forest">{name}</p>}
        <p className="font-sans text-[11px] text-ink-muted">{title}</p>
        <p className="font-sans text-[10px] text-ink-faint">Umoja Youth Impact Hub</p>
      </div>
    </div>
  );
}

export default function Certificate() {
  const { code } = useParams();
  const [cert, setCert] = useState(undefined);
  const [copied, setCopied] = useState(false);
  useScriptFont();

  useEffect(() => {
    document.title = 'Certificate · Umoja Youth Impact Hub';
    verifyCertificate(code).then((c) => setCert(c || null)).catch(() => setCert(null));
  }, [code]);

  const url = `${window.location.origin}/certificates/${code}`;
  // Signatures saved on the certificate when it was issued (older ones fall back to today's list)
  const signers = cert?.signatories?.length ? cert.signatories : certificateSignatories(cert?.course_code);

  if (cert === undefined) return <div className="min-h-screen bg-white pt-32 text-center font-sans text-ink-muted">Checking certificate…</div>;
  if (!cert) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-20 px-4 text-center">
        <div className="text-5xl mb-3" aria-hidden="true">⚠️</div>
        <h1 className="font-display font-bold text-display-sm text-forest">Certificate not found</h1>
        <p className="font-sans text-ink-muted mt-2">There’s no UYIH certificate with the code <strong>{code}</strong>. Check the code and try again.</p>
        <Link to="/" className="btn-primary mt-6">UYIH home</Link>
      </div>
    );
  }

  return (
    <div className="cert-page min-h-screen bg-sand-light/60 pt-24 md:pt-28 pb-16 px-3 sm:px-6">
      <style>{PRINT_CSS}</style>
      <div className="cert-actions max-w-5xl mx-auto mb-5 flex flex-wrap items-center gap-3">
        {cert.revoked
          ? <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-800 font-sans text-sm font-semibold px-3 py-1">✗ This certificate has been revoked</span>
          : <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 text-forest font-sans text-sm font-semibold px-3 py-1">✓ Genuine UYIH certificate</span>}
        <span className="font-sans text-xs text-ink-muted">Code {cert.code}</span>
        <div className="ml-auto flex gap-2">
          <button className="btn-secondary text-sm" onClick={async () => {
            try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
          }}>{copied ? 'Link copied ✓' : 'Copy link'}</button>
          {!cert.revoked && <button className="btn-primary text-sm" onClick={() => window.print()}>Download PDF</button>}
        </div>
      </div>

      <article className="cert-sheet relative max-w-5xl mx-auto bg-[#FFFDF8] rounded-md shadow-card-lg overflow-hidden sm:[aspect-ratio:297/210]">
        {cert.revoked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <span className="font-display font-bold text-5xl sm:text-8xl text-red-700/25 -rotate-12 tracking-widest">REVOKED</span>
          </div>
        )}
        {/* Borders */}
        <div className="absolute inset-3 sm:inset-5 border-2 border-forest" />
        <div className="absolute inset-5 sm:inset-8 border border-terracotta/60" />
        <div className="absolute left-0 top-0 bottom-0 w-3 sm:w-5 bg-forest" />
        <div className="absolute right-0 top-0 bottom-0 w-3 sm:w-5 bg-forest" />

        <div className="relative h-full flex flex-col items-center justify-between gap-6 sm:gap-0 text-center px-8 sm:px-16 py-10 sm:py-12">
          <div className="flex flex-col items-center">
            <img src={logo} alt="UYIH logo" className="w-10 h-10 sm:w-16 sm:h-16 rounded-full object-cover" />
            <p className="font-sans text-[9px] sm:text-xs uppercase tracking-[0.3em] text-terracotta font-semibold mt-2 sm:mt-3">Umoja Youth Impact Hub</p>
          </div>

          <div>
            <h1 className="font-display font-bold text-2xl sm:text-5xl text-forest">Certificate of Completion</h1>
            <p className="font-sans text-[10px] sm:text-sm text-ink-muted mt-2 sm:mt-4">This is to certify that</p>
            <p className="font-display font-bold text-2xl sm:text-5xl text-forest mt-1 sm:mt-3 border-b border-sand-dark inline-block px-4 sm:px-10 pb-1">{cert.full_name}</p>
            <p className="font-sans text-[10px] sm:text-sm text-ink-muted mt-2 sm:mt-4">has successfully completed the UYIH online course</p>
            <p className="font-display font-bold text-lg sm:text-3xl text-terracotta mt-1 sm:mt-2">{cert.title}</p>
          </div>

          <div className="w-full flex flex-col sm:flex-row items-center sm:items-end justify-between gap-5 sm:gap-4">
            {signers.length > 1 && <Signature {...signers[0]} />}
            <div className={`font-sans text-[9px] sm:text-xs text-ink-muted order-first sm:order-none w-full sm:w-auto ${signers.length > 1 ? 'text-center' : 'text-center sm:text-left'}`}>
              <p>Issued {fmtDate(cert.issued_at)}</p>
              <p className="mt-0.5">Certificate {cert.code}</p>
              <p className="mt-0.5 hidden sm:block">Verify at {window.location.host}/certificates/{cert.code}</p>
            </div>
            <Signature {...signers[signers.length - 1]} />
          </div>
        </div>
      </article>
      <p className="cert-actions text-center font-sans text-xs text-ink-muted mt-4">Tip: in the print window choose “Save as PDF” and landscape.</p>
    </div>
  );
}
