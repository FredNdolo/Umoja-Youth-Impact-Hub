// File: src/trees/pages/Scan.jsx
// Scan a tree's QR label with the phone camera (or type the code).
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { Card, Notice } from '../ui';
import { codeFromScan } from '../api';

export default function Scan() {
  const navigate = useNavigate();
  const video = useRef(null);
  const canvas = useRef(null);
  const [err, setErr] = useState('');
  const [manual, setManual] = useState('');
  const [mode, setMode] = useState('check-in');

  useEffect(() => {
    let stream; let raf; let stopped = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('no-camera');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = video.current; v.srcObject = stream; await v.play();
        const tick = () => {
          if (stopped) return;
          if (v.readyState === v.HAVE_ENOUGH_DATA) {
            const c = canvas.current; const w = 480; const h = Math.round((v.videoHeight / v.videoWidth) * w) || 360;
            c.width = w; c.height = h;
            const ctx = c.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(v, 0, 0, w, h);
            const res = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
            const code = res && codeFromScan(res.data);
            if (code) { navigator.vibrate?.(80); go(code); return; }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (e) {
        setErr(e.message === 'no-camera' ? 'This browser can’t open the camera. Type the code below.' : 'Camera permission was refused. Allow the camera for this site, or type the code below.');
      }
    })();
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  function go(code) { navigate(mode === 'view' ? `/me/trees/tree/${code}` : `/me/trees/check-in/${code}`); }

  const submit = (e) => {
    e.preventDefault();
    const code = codeFromScan(manual) || codeFromScan(`UYIH-${manual}`);
    if (!code) { setErr('That doesn’t look like a tree code (UYIH-XXXXXX).'); return; }
    go(code);
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="flex gap-1 rounded-lg bg-sand-light p-1 font-sans text-sm" role="tablist">
        {[['check-in', 'Scan to check in'], ['view', 'Scan to view']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={mode === k} className={`flex-1 rounded-md py-2 font-semibold ${mode === k ? 'bg-white text-forest shadow-sm' : 'text-ink-muted'}`} onClick={() => setMode(k)}>{l}</button>
        ))}
      </div>
      <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4] sm:aspect-video">
        <video ref={video} className="w-full h-full object-cover" playsInline muted />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-56 border-4 border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
        <p className="absolute bottom-3 inset-x-0 text-center font-sans text-sm text-white">Point at the QR label on the tree</p>
      </div>
      <canvas ref={canvas} className="hidden" />
      {err && <Notice kind="warn">{err}</Notice>}
      <Card title="Or type the code">
        <form onSubmit={submit} className="flex gap-2">
          <input className="input-field font-mono uppercase" placeholder="UYIH-7KQ2MD" value={manual} onChange={(e) => setManual(e.target.value.toUpperCase())} aria-label="Tree code" />
          <button className="btn-primary">Go</button>
        </form>
      </Card>
    </div>
  );
}
