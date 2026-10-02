/** Service-worker registration, "update available" prompt and install button. Production builds only. */
interface InstallPromptEvent extends Event { prompt(): Promise<void> }

function showUpdateToast(apply: () => void): void {
  if (document.getElementById('update-toast')) return;
  const el = document.createElement('div');
  el.id = 'update-toast';
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = '<span>A new version of ChemSim is available.</span><button class="combine small" type="button">Reload</button>';
  el.querySelector('button')!.addEventListener('click', apply);
  document.body.appendChild(el);
}

export function registerPwa(): void {
  // Install button (Chromium fires beforeinstallprompt when the app is installable).
  const btn = document.getElementById('install');
  let deferred: InstallPromptEvent | null = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallPromptEvent; btn?.removeAttribute('hidden'); });
  btn?.addEventListener('click', async () => { await deferred?.prompt(); deferred = null; btn.setAttribute('hidden', ''); });
  window.addEventListener('appinstalled', () => btn?.setAttribute('hidden', ''));

  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
      const offer = (w: ServiceWorker) => showUpdateToast(() => w.postMessage('SKIP_WAITING'));
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); });
      });
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading) { reloading = true; location.reload(); } });
    } catch { /* offline support is a progressive enhancement */ }
  });
}
