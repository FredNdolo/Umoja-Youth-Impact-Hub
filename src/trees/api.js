// File: src/trees/api.js
// Tree Monitor data layer: Supabase queries, photo handling and an offline
// queue (IndexedDB) so field teams can register trees and check in without
// signal. Queued items sync automatically when the phone is back online.
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { supabase } from '../lib/supabase';

// Phone storage can be blocked or hang (private browsing, low storage), so
// never wait on it for more than a few seconds.
const within = (p, ms, fallback) => Promise.race([p, new Promise((r) => setTimeout(() => r(fallback), ms))]);
const get = (k) => within(Promise.resolve().then(() => idbGet(k)), 3000, undefined);
const set = (k, v) => within(Promise.resolve().then(() => idbSet(k, v)), 3000, undefined);

export const PHOTO_BUCKET = 'tree-photos';
const QUEUE_KEY = 'tm-queue-v1';
const CACHE_KEY = 'tm-cache-v1';

export const HEALTH = [
  { value: 'healthy',  label: 'Healthy',  icon: '🌿', cls: 'bg-forest text-cream border-forest' },
  { value: 'stressed', label: 'Stressed', icon: '🥀', cls: 'bg-amber-500 text-white border-amber-500' },
  { value: 'diseased', label: 'Diseased', icon: '🦠', cls: 'bg-amber-700 text-white border-amber-700' },
  { value: 'damaged',  label: 'Damaged',  icon: '🪓', cls: 'bg-orange-600 text-white border-orange-600' },
  { value: 'dead',     label: 'Dead',     icon: '🍂', cls: 'bg-red-700 text-white border-red-700' },
  { value: 'missing',  label: 'Missing',  icon: '❓', cls: 'bg-slate-600 text-white border-slate-600' },
];

export const STATUS = {
  planted:  { label: 'Planted',  color: '#7FB069', cls: 'bg-[#7FB069]/15 text-[#3d6b2a]' },
  alive:    { label: 'Alive',    color: '#1F8F4E', cls: 'bg-forest/10 text-forest' },
  stressed: { label: 'Stressed', color: '#D99A1E', cls: 'bg-amber-100 text-amber-800' },
  dead:     { label: 'Dead',     color: '#B42318', cls: 'bg-red-50 text-red-700' },
  missing:  { label: 'Missing',  color: '#64748B', cls: 'bg-slate-100 text-slate-700' },
  replaced: { label: 'Replaced', color: '#94A3B8', cls: 'bg-slate-100 text-slate-500' },
};

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' }) : '—');
export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
export const daysSince = (d) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : null);

// The QR on each label opens the tree's public page; field team see "Check in" there
export const treeUrl = (code) => `${window.location.origin}/t/${code}`;
export function codeFromScan(text) {
  const t = String(text || '').trim();
  const m = t.match(/UYIH-[2-9A-HJ-NP-Z]{6}/i);
  return m ? m[0].toUpperCase() : null;
}

async function q(p) {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

// ── Reference data (cached for offline use) ───────────────────────────
export async function loadReference() {
  try {
    const [sites, plots, species, nurseries, batches, me] = await Promise.all([
      q(supabase.from('tm_sites').select('*').order('name')),
      q(supabase.from('tm_plots').select('*').order('name')),
      q(supabase.from('tm_species').select('*').order('common_name')),
      q(supabase.from('tm_nurseries').select('*').order('name')),
      q(supabase.from('tm_batches').select('*').order('created_at', { ascending: false })),
      q(supabase.rpc('tm_me')),
    ]);
    const ref = { sites, plots, species, nurseries, batches, me, cachedAt: new Date().toISOString() };
    set(CACHE_KEY, ref).catch(() => {}); // storage full or blocked: carry on
    return ref;
  } catch (e) {
    const cached = await get(CACHE_KEY).catch(() => null);
    if (cached) return { ...cached, offline: true };
    throw e;
  }
}

export async function loadTrees() {
  return q(supabase.from('tm_trees')
    .select('id, code, plot_id, species_id, batch_id, planted_on, latitude, longitude, accuracy_m, status, height_cm, dbh_cm, last_checked_at, sponsor_name, notes, registered_at')
    .order('registered_at', { ascending: false }));
}

export async function loadTree(code) {
  const tree = await q(supabase.from('tm_trees').select('*').eq('code', code.toUpperCase()).maybeSingle());
  if (!tree) return null;
  const checkins = await q(supabase.from('tm_checkins').select('*, people:checked_by(full_name)').eq('tree_id', tree.id).order('checked_at', { ascending: false }));
  return { tree, checkins };
}

export async function photoUrl(path, seconds = 600) {
  if (!path) return null;
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, seconds);
  return data?.signedUrl || null;
}

// ── Photos: resize on the phone before upload (saves data) ────────────
export async function compressPhoto(file, maxSide = 1600, quality = 0.8) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = URL.createObjectURL(file);
  });
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(img.src);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), 'image/jpeg', quality));
}

// ── GPS ───────────────────────────────────────────────────────────────
export function getPosition({ timeout = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('This phone or browser can’t share its location.')); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: +p.coords.latitude.toFixed(7), longitude: +p.coords.longitude.toFixed(7), accuracy_m: Math.round(p.coords.accuracy * 10) / 10 }),
      (e) => reject(new Error(e.code === 1 ? 'Location permission was refused. Allow location for this site and try again.' : 'Couldn’t get a GPS fix. Move into the open and try again.')),
      { enableHighAccuracy: true, timeout, maximumAge: 0 },
    );
  });
}

// ── Offline queue ─────────────────────────────────────────────────────
export async function getQueue() { return (await get(QUEUE_KEY).catch(() => null)) || []; }
async function saveQueue(items) { await set(QUEUE_KEY, items); notify(); }
const listeners = new Set();
export function onQueueChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { getQueue().then((qq) => listeners.forEach((fn) => fn(qq))); }

export const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

async function uploadPhoto(treeKey, blob) {
  const path = `${treeKey}/${uuid()}.jpg`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

// Tree codes are made on the phone so the label can be printed straight away,
// even offline. Same alphabet as the database (no 0/O or 1/I).
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function newTreeCode() {
  const a = new Uint32Array(6); crypto.getRandomValues(a);
  return `UYIH-${Array.from(a, (n) => CODE_CHARS[n % 32]).join('')}`;
}

async function sendRegistration(item) {
  const row = { ...item.row };
  const { data, error } = await supabase.from('tm_trees').insert(row).select('id, code').single();
  if (!error) return data;
  if (/client_id/i.test(error.message)) {
    // Already saved on an earlier attempt
    return q(supabase.from('tm_trees').select('id, code').eq('client_id', row.client_id).single());
  }
  if (/tm_trees_code_key/i.test(error.message)) {
    throw new Error(`Code ${row.code} is already used. Ask an admin to re-label this tree.`);
  }
  throw new Error(error.message);
}

async function sendCheckin(item) {
  const row = { ...item.row };
  if (!row.tree_id && item.treeCode) {
    const t = await q(supabase.from('tm_trees').select('id').eq('code', item.treeCode).maybeSingle());
    if (!t) throw new Error(`Tree ${item.treeCode} not found`);
    row.tree_id = t.id;
  }
  if (item.photo && !row.photo_path) row.photo_path = await uploadPhoto(row.tree_id, item.photo);
  const { error } = await supabase.from('tm_checkins').insert(row);
  if (error && !/duplicate key|client_id/i.test(error.message)) throw new Error(error.message);
}

// Save now if online, otherwise keep in the queue. Returns { queued, result }.
export async function registerTree(row) {
  const item = { kind: 'tree', id: uuid(), row: { ...row, code: row.code || newTreeCode(), client_id: row.client_id || uuid() }, created: Date.now() };
  if (navigator.onLine) {
    try { return { queued: false, result: await sendRegistration(item) }; }
    catch (e) { if (navigator.onLine && !/fetch|network/i.test(e.message)) throw e; }
  }
  await saveQueue([...(await getQueue()), item]);
  return { queued: true, result: { code: item.row.code } };
}

export async function checkIn(row, photo, treeCode) {
  const item = {
    kind: 'checkin', id: uuid(), treeCode,
    row: { ...row, client_id: row.client_id || uuid(), checked_at: row.checked_at || new Date().toISOString() },
    photo: photo || null, created: Date.now(),
  };
  if (navigator.onLine) {
    try { await sendCheckin(item); return { queued: false }; }
    catch (e) { if (navigator.onLine && !/fetch|network|Failed/i.test(e.message)) throw e; }
  }
  item.row.offline = true;
  await saveQueue([...(await getQueue()), item]);
  return { queued: true };
}

let syncing = false;
export async function syncQueue() {
  if (syncing || !navigator.onLine) return { sent: 0, failed: 0 };
  syncing = true;
  let sent = 0; let failed = 0;
  try {
    const items = await getQueue();
    const remaining = [];
    // Registrations first, so queued check-ins on new trees can find them
    const ordered = [...items].sort((a, b) => (a.kind === 'tree' ? -1 : 1) - (b.kind === 'tree' ? -1 : 1) || a.created - b.created);
    for (const it of ordered) {
      try {
        if (it.kind === 'tree') await sendRegistration(it);
        else await sendCheckin(it);
        sent += 1;
      } catch (e) {
        failed += 1;
        remaining.push({ ...it, error: e.message, tries: (it.tries || 0) + 1 });
      }
    }
    await saveQueue(remaining);
  } finally {
    syncing = false;
  }
  return { sent, failed };
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { syncQueue(); });
}

// ── Exports ───────────────────────────────────────────────────────────
export function download(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export function toCsv(rows, cols) {
  const esc = (v) => {
    if (v == null) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.map((c) => c.label).join(','), ...rows.map((r) => cols.map((c) => esc(c.get(r))).join(','))].join('\n');
}

// Area of a lng/lat polygon ring in hectares (spherical approximation)
export function ringAreaHa(ring) {
  if (!ring || ring.length < 3) return 0;
  const R = 6378137; const rad = Math.PI / 180;
  let s = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const [lng1, lat1] = ring[i]; const [lng2, lat2] = ring[(i + 1) % ring.length];
    s += (lng2 - lng1) * rad * (2 + Math.sin(lat1 * rad) + Math.sin(lat2 * rad));
  }
  return Math.abs((s * R * R) / 2) / 10000;
}
