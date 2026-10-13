// File: src/member/MyDocuments.jsx
// Member page: download UYIH's key documents, and upload your national ID and
// police clearance certificate for safeguarding checks (private storage).
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DOC_BUCKET, DOC_MIME, DOC_STATUS, DOC_TYPES, MAX_DOC_BYTES, docPath } from '../lib/memberDocs';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' }) : '');
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });

export const UYIH_DOCS = [
  { title: 'UYIH Constitution', detail: 'Adopted September 2025 · PDF', href: '/docs/uyih-constitution-2025.pdf', icon: '📜' },
  { title: 'Child Protection and Safeguarding Policy', detail: 'PDF', href: '/docs/uyih-child-protection-safeguarding-policy.pdf', icon: '🛡️' },
];

export default function MyDocuments({ personId }) {
  const [docs, setDocs] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('get_my_documents');
    if (err) { setError(err.message); setDocs([]); return; }
    setDocs(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-sans text-xs uppercase tracking-[0.14em] font-semibold text-ink-muted mb-3">UYIH documents</h3>
        <ul className="grid sm:grid-cols-2 gap-3">
          {UYIH_DOCS.map((d) => (
            <li key={d.href}>
              <a href={d.href} download className="flex items-center gap-3 rounded-lg border border-sand-dark/60 bg-white p-4 hover:border-forest/50 transition-colors">
                <span className="text-2xl" aria-hidden="true">{d.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-sans font-semibold text-forest text-sm">{d.title}</span>
                  <span className="block font-sans text-xs text-ink-muted">{d.detail}</span>
                </span>
                <span className="font-sans text-xs font-semibold text-terracotta whitespace-nowrap">Download ↓</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-sans text-xs uppercase tracking-[0.14em] font-semibold text-ink-muted mb-1">Your verification documents</h3>
        <p className="font-sans text-sm text-ink-muted mb-3">
          Because our work takes us into schools, UYIH checks the identity and good conduct of people who work with
          children. Only UYIH’s administrator can open these files. <Link to="/privacy" className="underline">How we protect them</Link>.
        </p>
        {error && <p className="font-sans text-sm text-red-700 mb-2" role="alert">{error}</p>}
        {docs === null ? <p className="font-sans text-sm text-ink-muted">Loading…</p> : (
          <ul className="grid md:grid-cols-2 gap-4">
            {DOC_TYPES.map((t) => (
              <DocSlot key={t.type} def={t} doc={docs.find((d) => d.doc_type === t.type)} personId={personId} onChange={load} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DocSlot({ def, doc, personId, onChange }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [issued, setIssued] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const st = doc ? DOC_STATUS[doc.status] : null;

  const pick = (e) => {
    const f = e.target.files?.[0];
    setError('');
    if (!f) { setFile(null); return; }
    if (!DOC_MIME.includes(f.type)) { setError('Please choose a PDF or a photo (JPG, PNG or WebP).'); e.target.value = ''; return; }
    if (f.size > MAX_DOC_BYTES) { setError('That file is over 5 MB. Try a smaller photo or a scanned PDF.'); e.target.value = ''; return; }
    setFile(f);
  };

  const upload = async () => {
    if (!file) { setError('Choose a file first.'); return; }
    if (def.issued && !issued) { setError('Enter the date the certificate was issued.'); return; }
    if (!agree) { setError('Please tick the box to agree.'); return; }
    setBusy(true); setError('');
    const path = docPath(personId, def.type, file.type);
    const up = await supabase.storage.from(DOC_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) { setBusy(false); setError('The upload failed. Check your connection and try again.'); return; }
    const { data: oldPath, error: err } = await supabase.rpc('record_my_document', {
      p_doc_type: def.type, p_file_path: path, p_file_name: file.name, p_mime_type: file.type,
      p_size: file.size, p_issued_on: def.issued ? issued : null,
    });
    if (err) {
      await supabase.storage.from(DOC_BUCKET).remove([path]);
      setBusy(false); setError(err.message); return;
    }
    if (oldPath) await supabase.storage.from(DOC_BUCKET).remove([oldPath]);
    setBusy(false); setOpen(false); setFile(null); setIssued(''); setAgree(false);
    onChange();
  };

  const remove = async () => {
    if (!window.confirm(`Delete your ${def.label.toLowerCase()} from UYIH?`)) return;
    const { data: path, error: err } = await supabase.rpc('delete_my_document', { p_doc_type: def.type });
    if (err) { setError(err.message); return; }
    if (path) await supabase.storage.from(DOC_BUCKET).remove([path]);
    onChange();
  };

  return (
    <li className="rounded-lg border border-sand-dark/60 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start gap-2">
        <p className="font-sans font-semibold text-forest">{def.label}</p>
        {st && <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>}
        {!doc && <span className="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-sand text-ink-muted">Not uploaded</span>}
      </div>
      <p className="font-sans text-xs text-ink-muted mt-1">{def.help}</p>
      {doc && (
        <p className="font-sans text-xs text-ink mt-2">
          Uploaded {fmtDate(doc.uploaded_at)}{doc.issued_on ? ` · issued ${fmtDate(doc.issued_on)}` : ''}
        </p>
      )}
      {doc?.status === 'rejected' && doc.admin_note && (
        <p className="font-sans text-sm bg-red-50 text-red-800 rounded px-3 py-2 mt-2">UYIH: {doc.admin_note}</p>
      )}

      {!open ? (
        <div className="flex flex-wrap gap-3 mt-4">
          {doc?.status !== 'verified' && (
            <button className={doc ? 'btn-secondary text-sm' : 'btn-primary text-sm'} onClick={() => setOpen(true)}>{doc ? 'Replace' : 'Upload'}</button>
          )}
          {doc?.status === 'verified' && def.issued && (
            <button className="btn-secondary text-sm" onClick={() => setOpen(true)}>Upload a newer one</button>
          )}
          {doc && doc.status !== 'verified' && <button className="font-sans text-xs text-red-700 underline" onClick={remove}>Delete</button>}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="input-label">File (PDF or photo, up to 5 MB)</span>
            <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={pick}
              className="block w-full font-sans text-sm file:mr-3 file:rounded-md file:border-0 file:bg-forest file:px-3 file:py-2 file:text-cream file:font-semibold" />
          </label>
          {def.issued && (
            <label className="block">
              <span className="input-label">Date issued</span>
              <input type="date" className="input-field" max={today()} value={issued} onChange={(e) => { setIssued(e.target.value); setError(''); }} />
            </label>
          )}
          <label className="flex gap-2.5 items-start font-sans text-xs text-ink cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-[#1A3C2A]" checked={agree} onChange={(e) => { setAgree(e.target.checked); setError(''); }} />
            <span>I agree that UYIH keeps this document privately for safeguarding checks, as explained in the privacy notice. I can ask for it to be deleted at any time.</span>
          </label>
          {error && <p className="font-sans text-sm text-red-700" role="alert">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-primary text-sm" disabled={busy} onClick={upload}>{busy ? 'Uploading…' : 'Upload securely'}</button>
            <button className="btn-secondary text-sm" onClick={() => { setOpen(false); setError(''); setFile(null); }}>Cancel</button>
          </div>
        </div>
      )}
      {!open && error && <p className="font-sans text-sm text-red-700 mt-2" role="alert">{error}</p>}
    </li>
  );
}
