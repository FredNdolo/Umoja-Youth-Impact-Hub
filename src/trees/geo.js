// File: src/trees/geo.js
// Geofencing helpers for the Tree Monitor. Each site has a centre point and
// a radius (its geofence); each plot can have a walked or drawn boundary.
// From a phone's GPS fix we can then tell which site and plot someone is
// standing in, how far they are from a tree, and flag records that look
// out of place — without anyone having to pick from long lists.

const R = 6371008.8; // mean Earth radius, metres
const rad = (d) => (d * Math.PI) / 180;

// Distance in metres between two lat/lng points (haversine)
export function distanceM(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null || Number.isNaN(Number(v)))) return null;
  const dLat = rad(lat2 - lat1); const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Is [lng, lat] inside a GeoJSON polygon ring? (ray casting)
export function inRing(lng, lat, ring) {
  if (!ring || ring.length < 3) return false;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i]; const [xj, yj] = ring[j];
    if (((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

export const DEFAULT_GEOFENCE_M = 250;
export const fenceOf = (site) => Number(site?.geofence_m) || DEFAULT_GEOFENCE_M;

// Distance from a point to a site's centre (null if the site has no GPS point)
export const siteDistance = (site, lat, lng) => (site?.latitude == null ? null : distanceM(lat, lng, site.latitude, site.longitude));

// Is the point inside the site's geofence? null when the site has no GPS point yet.
// The phone's accuracy is allowed for, so a weak fix at the edge isn't flagged.
export function inSite(site, lat, lng, accuracy = 0) {
  const d = siteDistance(site, lat, lng);
  return d == null ? null : d <= fenceOf(site) + Math.min(accuracy || 0, 50);
}

// Where am I? Returns { plot, site, inside, distance } for a GPS fix:
//  1. a plot whose boundary contains the point (most precise)
//  2. otherwise the nearest site whose geofence contains it
//  3. otherwise the nearest site with a GPS point (inside: false)
export function locate({ lat, lng, accuracy = 0 }, sites = [], plots = []) {
  const active = sites.filter((s) => s.active !== false);
  const plot = plots.find((p) => {
    const site = active.find((s) => s.id === p.site_id);
    return site && inRing(lng, lat, p.boundary?.coordinates?.[0]);
  });
  if (plot) {
    const site = active.find((s) => s.id === plot.site_id);
    return { plot, site, inside: true, distance: siteDistance(site, lat, lng) };
  }
  const ranked = active
    .map((s) => ({ s, d: siteDistance(s, lat, lng) }))
    .filter((x) => x.d != null)
    .sort((a, b) => a.d - b.d);
  if (!ranked.length) return { plot: null, site: null, inside: null, distance: null };
  const { s, d } = ranked[0];
  return { plot: null, site: s, inside: d <= fenceOf(s) + Math.min(accuracy || 0, 50), distance: d };
}

// Trees near a point, nearest first
export function nearby(trees, lat, lng, withinM = 100) {
  return trees
    .map((t) => ({ ...t, distance: distanceM(lat, lng, t.latitude, t.longitude) }))
    .filter((t) => t.distance != null && t.distance <= withinM)
    .sort((a, b) => a.distance - b.distance);
}

// How far a check-in can be from the tree's registered point before it's
// flagged. Phone GPS is often ±10–20 m, so we allow for both readings.
export const CHECKIN_FLAG_M = 50;
export const checkinTooFar = (d, accTree = 0, accHere = 0) => d != null && d > CHECKIN_FLAG_M + Math.min((accTree || 0) + (accHere || 0), 50);

export const fmtDistance = (m) => (m == null ? '—' : m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`);
