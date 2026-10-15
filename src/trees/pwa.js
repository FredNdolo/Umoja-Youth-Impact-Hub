// Registers the offline service worker the first time someone opens the
// Tree Monitor, so the app (and map tiles they've viewed) work without signal.
let done = false;
export async function registerTreeAppSW() {
  if (done || typeof window === 'undefined' || !('serviceWorker' in navigator) || import.meta.env.DEV) return;
  done = true;
  try {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
  } catch { /* offline support is a bonus; never block the app */ }
}
