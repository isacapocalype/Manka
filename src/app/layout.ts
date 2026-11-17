import type { AppServices } from '@/core/services/appServices';
import { todayJakarta, formatBusinessDate } from '@/core/utils/date';
import { escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import { showToast } from '@/components/ui/toast';
import { FINANCE_NAV, MAIN_NAV, MOBILE_NAV, type NavItem } from './navigation';

export interface LayoutHandle {
  pageHost: HTMLElement;
  setActive(path: string): void;
  setPageLabel(label: string): void;
}

function navLink(
  item: NavItem,
  kind: 'main' | 'finance' | 'mobile',
  className: string,
): string {
  return `<a class="${className}" href="#${escapeHtml(item.href)}" data-nav-kind="${kind}" data-nav-href="${escapeHtml(item.href)}">
    ${icon(item.iconName, 'nav-icon')}
    <span>${escapeHtml(item.label)}</span>
  </a>`;
}

function isLinkActive(href: string, path: string, kind: 'main' | 'finance' | 'mobile'): boolean {
  if (kind === 'finance') {
    if (href === '/finance') return path === '/finance';
    return path === href || path.startsWith(`${href}/`);
  }
  if (kind === 'mobile') {
    if (href === '/dashboard') return path === '/dashboard';
    if (href === '/more') {
      return ['/more', '/stores', '/reports', '/settings'].some(
        (prefix) => path === prefix || path.startsWith(`${prefix}/`),
      );
    }
    if (href === '/finance') return path.startsWith('/finance');
    return path === href || path.startsWith(`${href}/`);
  }
  return path === href || path.startsWith(`${href}/`);
}

export function createLayout(
  mount: HTMLElement,
  services: AppServices,
  onNavigate: (path: string) => void,
): LayoutHandle {
  const sidebarMainTop = MAIN_NAV.filter((item) =>
    ['/dashboard', '/stores', '/orders', '/products'].includes(item.href),
  );
  const sidebarBottom = MAIN_NAV.filter((item) =>
    ['/reports', '/settings'].includes(item.href),
  );
  const todayLabel = formatBusinessDate(todayJakarta(), 'weekday');
  const backendLabel = services.db.backend === 'native' ? 'SQLite lokal' : 'SQLite dev';

  mount.innerHTML = `
    <a class="skip-link" href="#page-content">Lewati ke konten</a>
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#/dashboard" aria-label="Manka — kembali ke dashboard">
          <span class="brand-mark" aria-hidden="true">M</span>
          <span class="brand-copy">
            <strong>Manka</strong>
            <small>Konveksi Manager</small>
          </span>
        </a>
        <nav class="sidebar-nav" aria-label="Navigasi utama">
          <div class="nav-group">
            ${sidebarMainTop.map((item) => navLink(item, 'main', 'nav-link')).join('')}
          </div>
          <div class="nav-group">
            <p class="nav-label">Keuangan</p>
            ${FINANCE_NAV.map((item) => navLink(item, 'finance', 'nav-link nav-link-sub')).join('')}
          </div>
          <div class="nav-group">
            ${sidebarBottom.map((item) => navLink(item, 'main', 'nav-link')).join('')}
          </div>
        </nav>
        <div class="sidebar-foot">
          <div class="local-status">
            <span class="status-dot" aria-hidden="true"></span>
            <div>
              <strong>${escapeHtml(backendLabel)}</strong>
              <small>Data tersimpan di perangkat ini</small>
            </div>
          </div>
        </div>
      </aside>

      <div class="app-main">
        <header class="topbar">
          <div class="topbar-left">
            <a class="topbar-brand" href="#/dashboard" aria-label="Manka">M</a>
            <div class="topbar-context">
              <span data-page-label>Dashboard</span>
              <small>${escapeHtml(todayLabel)}</small>
            </div>
          </div>
          <form class="topbar-search" role="search" data-global-search>
            <label class="sr-only" for="global-search">Cari nomor pesanan</label>
            ${icon('search', 'search-icon')}
            <input id="global-search" type="search" name="search" placeholder="Cari nomor pesanan…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </form>
          <div class="topbar-right">
            <span class="local-badge" title="Aplikasi berjalan tanpa server. Semua data tersimpan lokal.">
              <span class="status-dot" aria-hidden="true"></span>
              Data lokal
            </span>
          </div>
        </header>
        <main id="page-content" class="page-content" tabindex="-1"></main>
      </div>

      <nav class="bottom-nav" aria-label="Navigasi bawah">
        ${MOBILE_NAV.map((item) => navLink(item, 'mobile', 'bottom-link')).join('')}
      </nav>
    </div>
  `;

  const pageHost = mount.querySelector<HTMLElement>('#page-content');
  if (!pageHost) throw new Error('Kontainer halaman tidak ditemukan.');
  const pageLabel = mount.querySelector<HTMLElement>('[data-page-label]');
  const searchForm = mount.querySelector<HTMLFormElement>('[data-global-search]');
  const searchInput = searchForm?.querySelector<HTMLInputElement>('input[name="search"]');

  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const term = searchInput?.value.trim() ?? '';
    if (term === '') {
      searchInput?.focus();
      showToast('Masukkan nomor pesanan yang ingin dicari.', 'info');
      return;
    }
    onNavigate(`/orders?search=${encodeURIComponent(term)}`);
  });

  const links = Array.from(mount.querySelectorAll<HTMLAnchorElement>('[data-nav-kind][data-nav-href]'));

  refreshIcons(mount);

  return {
    pageHost,
    setActive(path: string): void {
      for (const link of links) {
        const href = link.dataset.navHref ?? '';
        const kind = link.dataset.navKind;
        if (kind !== 'main' && kind !== 'finance' && kind !== 'mobile') continue;
        const active = isLinkActive(href, path, kind);
        link.classList.toggle('is-active', active);
        if (active) {
          link.setAttribute('aria-current', 'page');
        } else {
          link.removeAttribute('aria-current');
        }
      }
    },
    setPageLabel(label: string): void {
      if (pageLabel) pageLabel.textContent = label;
    },
  };
}
