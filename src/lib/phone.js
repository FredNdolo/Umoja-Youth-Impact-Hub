// Mirrors the normalisation in the submit_join database function.
// Accepts 0712 345 678, 0110 123 456, 254712345678 or +254712345678.
export function normalisePhone(raw) {
  let p = String(raw || '').replace(/[^0-9+]/g, '');
  if (/^0[17]\d{8}$/.test(p)) p = '+254' + p.slice(1);
  else if (/^254[17]\d{8}$/.test(p)) p = '+' + p;
  return /^\+[1-9]\d{7,14}$/.test(p) ? p : null;
}

// For wa.me links: digits only, no "+"
export function waNumber(e164) {
  return String(e164 || '').replace(/\D/g, '');
}

export function prettyPhone(e164) {
  const m = /^\+254(\d{3})(\d{3})(\d{3})$/.exec(e164 || '');
  return m ? `0${m[1]} ${m[2]} ${m[3]}` : e164;
}
