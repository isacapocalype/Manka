import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import './styles/main.css';

import { createApp, type MankaApp } from './app/app';
import { getDatabase } from './core/database';
import { createAppServices } from './core/services/appServices';
import { escapeHtml } from './components/ui/dom';

let app: MankaApp | null = null;

function renderBootError(error: unknown): void {
  const mount = document.getElementById('app');
  if (!mount) return;
  const message = error instanceof Error && error.message ? error.message : 'Kesalahan tidak diketahui.';
  mount.innerHTML = `
    <div class="boot-error">
      <div class="boot-error-card">
        <span class="boot-error-mark">M</span>
        <h1>Data lokal gagal dibuka</h1>
        <p>${escapeHtml(message)}</p>
        <p class="boot-error-hint">Pastikan aplikasi tidak sedang dibuka di tab lain. Pada browser, penyimpanan IndexedDB harus diizinkan.</p>
        <button type="button" class="btn btn-primary" id="boot-retry">Coba lagi</button>
      </div>
    </div>
  `;
  document.getElementById('boot-retry')?.addEventListener('click', () => {
    window.location.reload();
  });
}

async function boot(): Promise<void> {
  const mount = document.getElementById('app');
  if (!mount) throw new Error('Elemen #app tidak ditemukan.');
  try {
    const db = await getDatabase();
    const services = createAppServices(db);
    app = createApp(mount, services);
    await services.audit.log('open', 'app', null, {
      backend: db.backend,
      userAgent: navigator.userAgent.slice(0, 120),
    });
  } catch (error) {
    renderBootError(error);
  }
}

window.addEventListener('beforeunload', () => {
  app?.router.stop();
});

void boot();
