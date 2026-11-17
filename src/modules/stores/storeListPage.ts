import type { PageRenderer } from '@/app/router';
import type { Store, StorePlatform } from '@/types/entities';
import { STORE_PLATFORMS } from '@/types/entities';
import {
  STORE_PLATFORM_LABELS,
  STORE_STATUS_LABELS,
  STORE_STATUS_TONES,
} from '@/app/labels';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  badge,
  confirmDialog,
  emptyState,
  linkButton,
  loadingBlock,
  pageHeader,
  showToast,
} from '@/components/ui/ui';
import { buildRoute } from '@/components/ui/filters';
import { renderPageError } from '@/app/pageUtils';

function storeCard(store: Store): string {
  const contact =
    store.email || store.phone
      ? [store.email ? icon('mail') + `<span>${escapeHtml(store.email)}</span>` : '', store.phone ? icon('phone') + `<span>${escapeHtml(store.phone)}</span>` : '']
          .filter(Boolean)
          .join('')
      : '<span class="muted">Email dan nomor HP belum diisi</span>';
  return `
    <article class="store-card" data-platform="${store.platform}">
      <div class="store-card-top">
        <span class="store-platform-icon">${icon('store')}</span>
        <div class="store-card-badges">
          ${badge(STORE_PLATFORM_LABELS[store.platform], store.platform === 'shopee' ? 'warning' : store.platform === 'tiktok' ? 'neutral' : 'info')}
          ${badge(STORE_STATUS_LABELS[store.status], STORE_STATUS_TONES[store.status])}
        </div>
      </div>
      <h2 class="store-card-name"><a href="#/stores/${store.id}">${escapeHtml(store.name)}</a></h2>
      <p class="store-contact">${contact}</p>
      <div class="store-card-foot">
        <a class="btn btn-secondary btn-sm" href="#/stores/${store.id}">Buka</a>
        <div class="store-card-actions">
          <a class="btn btn-ghost btn-icon" href="#/stores/${store.id}/edit" aria-label="Ubah ${escapeAttr(store.name)}" title="Ubah toko">${icon('pencil')}</a>
          <button type="button" class="btn btn-ghost btn-icon" data-store-toggle="${store.id}" data-store-status="${store.status}" aria-label="${store.status === 'active' ? 'Arsipkan' : 'Aktifkan'} ${escapeAttr(store.name)}" title="${store.status === 'active' ? 'Arsipkan' : 'Aktifkan'}">
            ${icon(store.status === 'active' ? 'archive' : 'archive-restore')}
          </button>
        </div>
      </div>
    </article>
  `;
}

export const storeListPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat daftar toko…');

  try {
    const search = context.query.get('search')?.trim() ?? '';
    const platformValue = context.query.get('platform') ?? '';
    const platform =
      platformValue && STORE_PLATFORMS.includes(platformValue as StorePlatform)
        ? (platformValue as StorePlatform)
        : null;
    const includeArchived = context.query.get('archived') === '1';
    const stores = await services.storeService.list({ search, platform, includeArchived });
    if (context.signal.aborted) return;

    context.setTitle('Toko');
    const hasFilters = search !== '' || platform !== null;
    const totalStores = (await services.storeService.listAll()).length;

    const cards = stores.map(storeCard).join('');
    const addCard = hasFilters
      ? ''
      : `<a class="store-card store-card-add" href="#/stores/new">
          <span class="store-add-icon">${icon('plus')}</span>
          <strong>Tambah toko</strong>
          <small>Buat profile toko baru</small>
        </a>`;

    const emptyContent =
      totalStores === 0
        ? emptyState({
            iconName: 'store',
            title: 'Belum ada toko',
            description:
              'Tambahkan toko Shopee, TikTok Shop, atau toko lain. Setiap transaksi akan terhubung ke toko yang tepat.',
            action: linkButton('/stores/new', 'Tambah toko pertama', 'btn btn-primary', 'plus'),
          })
        : emptyState({
            iconName: 'search',
            title: 'Toko tidak ditemukan',
            description: 'Tidak ada toko yang sesuai dengan pencarian atau filter yang dipilih.',
            action: `<a class="btn btn-secondary" href="#/stores">${icon('refresh-cw')}<span>Reset filter</span></a>`,
          });

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Multi-toko',
        title: 'Toko',
        subtitle: 'Kelola identitas, profile, dan status setiap toko dalam satu tempat.',
        actions: linkButton('/stores/new', 'Tambah toko', 'btn btn-primary', 'plus'),
      })}

      <div class="filter-bar store-filter-bar">
        <form class="filter-search" data-store-search role="search">
          <label class="filter-label" for="store-search">Cari toko</label>
          <div class="search-input-wrap">
            ${icon('search', 'search-icon')}
            <input class="input" id="store-search" name="search" type="search" value="${escapeAttr(search)}" placeholder="Nama, email, atau nomor HP…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        <div class="filter-control">
          <label class="filter-label" for="store-platform">Platform</label>
          <select class="input select" id="store-platform" data-store-platform>
            <option value="">Semua platform</option>
            ${STORE_PLATFORMS.map(
              (item) =>
                `<option value="${item}" ${item === platform ? 'selected' : ''}>${STORE_PLATFORM_LABELS[item]}</option>`,
            ).join('')}
          </select>
        </div>
        <label class="filter-check">
          <input type="checkbox" data-store-archived ${includeArchived ? 'checked' : ''} />
          <span>Tampilkan arsip</span>
        </label>
      </div>

      ${
        stores.length > 0
          ? `<div class="store-grid">${cards}${addCard}</div>`
          : `<div class="card"><div class="card-body">${emptyContent}</div></div>`
      }
    `;

    const searchForm = root.querySelector<HTMLFormElement>('[data-store-search]');
    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = searchForm.querySelector<HTMLInputElement>('input[name="search"]');
      context.navigate(buildRoute(context.path, context.query, { search: input?.value.trim() || null }));
    });

    root.querySelector<HTMLSelectElement>('[data-store-platform]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      context.navigate(buildRoute(context.path, context.query, { platform: target.value || null }));
    });

    root.querySelector<HTMLInputElement>('[data-store-archived]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLInputElement;
      context.navigate(buildRoute(context.path, context.query, { archived: target.checked ? '1' : null }));
    });

    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-store-toggle]')) {
      button.addEventListener('click', async () => {
        const storeId = button.dataset.storeToggle;
        const status = button.dataset.storeStatus;
        if (!storeId || !status) return;
        if (status === 'active') {
          const confirmed = await confirmDialog({
            title: 'Arsipkan toko?',
            message:
              'Toko akan disembunyikan dari pilihan transaksi baru, tetapi seluruh pesanan, produk, dan data keuangan tetap tersimpan.',
            confirmLabel: 'Arsipkan toko',
            tone: 'primary',
          });
          if (!confirmed) return;
        }
        button.disabled = true;
        try {
          if (status === 'active') {
            await services.storeService.archive(storeId);
            showToast('Toko diarsipkan. Data transaksi tetap tersimpan.', 'success');
          } else {
            await services.storeService.restore(storeId);
            showToast('Toko diaktifkan kembali.', 'success');
          }
          context.refresh();
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Status toko gagal diubah.', 'error');
          button.disabled = false;
        }
      });
    }

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
