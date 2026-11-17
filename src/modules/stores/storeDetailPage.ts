import type { PageRenderer } from '@/app/router';
import type { AdvertisingCampaignSummary } from '@/types/entities';
import {
  STORE_PLATFORM_LABELS,
  STORE_STATUS_LABELS,
  STORE_STATUS_TONES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
} from '@/app/labels';
import { formatBusinessDate, formatDateTime, resolvePeriod, todayJakarta } from '@/core/utils/date';
import { formatDecimal, formatNumber, formatPercent, formatRupiah } from '@/core/utils/money';
import { escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  badge,
  card,
  confirmDialog,
  copyText,
  dataTable,
  emptyState,
  kpiCard,
  linkButton,
  loadingBlock,
  pageHeader,
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import { financeBreakdown, financeNote } from '@/modules/finance/financeUi';
import { renderPageError } from '@/app/pageUtils';

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'profile', label: 'Profile Toko' },
  { id: 'pesanan', label: 'Pesanan' },
  { id: 'keuangan', label: 'Keuangan' },
  { id: 'iklan', label: 'Iklan' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function campaignRows(campaigns: AdvertisingCampaignSummary[]): string[][] {
  return campaigns.map((campaign) => [
    `<span class="table-strong">${escapeHtml(campaign.name)}</span><span class="table-sub">${escapeHtml(campaign.storeName ?? 'Kampanye bersama')}</span>`,
    formatRupiah(campaign.totalSpend),
    campaign.totalAttributedRevenue === null ? 'N/A' : formatRupiah(campaign.totalAttributedRevenue),
    campaign.roas === null ? 'N/A' : `${formatDecimal(campaign.roas)}×`,
    campaign.acos === null ? 'N/A' : formatPercent(campaign.acos),
    formatNumber(campaign.expenseCount),
    `<a class="btn btn-ghost btn-sm" href="#/finance/ads/${encodeURIComponent(campaign.id)}">Buka</a>`,
  ]);
}

export const storeDetailPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const storeId = context.params.id ?? '';
  const tabParam = context.query.get('tab') ?? 'ringkasan';
  const tab: TabId = TABS.some((item) => item.id === tabParam)
    ? (tabParam as TabId)
    : 'ringkasan';

  root.innerHTML = loadingBlock('Memuat toko…');

  try {
    const store = await services.storeService.get(storeId);
    const counts = await services.stores.countTransactions(storeId);
    if (context.signal.aborted) return;
    context.setTitle(store.name);

    const month = resolvePeriod('thisMonth', undefined, todayJakarta());
    let tabContent = '';
    let tabScript: () => void = () => undefined;

    if (tab === 'ringkasan') {
      const [summary, recentOrders] = await Promise.all([
        services.financeService.getSummary(month, storeId),
        services.orderService.list({ storeId, page: 1, pageSize: 6 }),
      ]);
      if (context.signal.aborted) return;
      tabContent = `
        <div class="kpi-grid kpi-grid-3">
          ${kpiCard({
            label: 'Omzet bulan ini',
            value: formatRupiah(summary.grossSales),
            iconName: 'coins',
            hint: `${formatNumber(summary.orderCount)} pesanan`,
          })}
          ${kpiCard({
            label: 'Penjualan bersih',
            value: formatRupiah(summary.netSales),
            iconName: 'banknote',
            hint: `${formatNumber(summary.unitsSold)} unit`,
          })}
          ${kpiCard({
            label: 'Laba operasional',
            value: formatRupiah(summary.operatingProfit),
            iconName: summary.operatingProfit >= 0 ? 'trending-up' : 'trending-down',
            tone: summary.operatingProfit >= 0 ? 'positive' : 'negative',
            hint: summary.marginPercent === null ? 'Margin N/A' : `Margin ${formatPercent(summary.marginPercent)}`,
          })}
        </div>
        <div class="detail-grid">
          ${card({
            title: 'Aksi cepat',
            subtitle: 'Transaksi baru selalu terkait toko ini',
            body: `
              <div class="quick-actions">
                <a class="quick-action" href="#/orders/new?storeId=${store.id}">
                  <span>${icon('plus')}</span><strong>Tambah pesanan</strong><small>Input manual</small>
                </a>
                <a class="quick-action" href="#/orders/import?storeId=${store.id}">
                  <span>${icon('upload')}</span><strong>Import pesanan</strong><small>CSV atau XLSX</small>
                </a>
                <a class="quick-action" href="#/finance/fees?storeId=${store.id}">
                  <span>${icon('credit-card')}</span><strong>Biaya marketplace</strong><small>Catat potongan</small>
                </a>
                <a class="quick-action" href="#/finance/ads?storeId=${store.id}">
                  <span>${icon('megaphone')}</span><strong>Iklan</strong><small>Kampanye toko</small>
                </a>
              </div>
            `,
          })}
          ${card({
            title: 'Ringkasan bulan ini',
            subtitle: month.label,
            actions: linkButton(`/finance?storeId=${store.id}&period=thisMonth`, 'Keuangan toko', 'btn btn-ghost btn-sm', 'arrow-right'),
            body: financeBreakdown(summary, storeId) + `<p class="inline-note">${escapeHtml(financeNote(storeId))}</p>`,
          })}
        </div>
        ${card({
          title: 'Pesanan terbaru',
          subtitle: 'Enam pesanan terakhir dari toko ini',
          actions: linkButton(`/orders?storeId=${store.id}`, 'Lihat semua', 'btn btn-ghost btn-sm', 'arrow-right'),
          body: recentOrders.items.length
            ? dataTable(
                ['Pesanan', 'Tanggal', 'Status', 'Omzet kotor', ''],
                recentOrders.items.map((order) => [
                  `<a class="table-link" href="#/orders/${order.id}">${escapeHtml(order.marketplaceOrderId)}</a>`,
                  formatBusinessDate(order.orderDate),
                  badge(ORDER_STATUS_LABELS[order.status], ORDER_STATUS_TONES[order.status]),
                  formatRupiah(order.grossSales),
                  `<a class="btn btn-ghost btn-sm" href="#/orders/${order.id}">Buka</a>`,
                ]),
              )
            : emptyState({
                compact: true,
                iconName: 'shopping-bag',
                title: 'Belum ada pesanan',
                description: 'Input manual atau import pesanan untuk toko ini.',
                action: linkButton(`/orders/new?storeId=${store.id}`, 'Tambah pesanan', 'btn btn-primary btn-sm', 'plus'),
              }),
        })}
        ${card({
          title: 'Kelola toko',
          subtitle: 'Data transaksi tidak dihapus saat toko diarsipkan',
          body: `
            <div class="danger-zone">
              <div>
                <strong>${store.status === 'active' ? 'Arsipkan toko' : 'Aktifkan toko'}</strong>
                <p>${store.status === 'active' ? 'Toko akan disembunyikan dari pilihan transaksi baru. Semua data tetap tersimpan.' : 'Toko akan muncul kembali pada pilihan transaksi baru.'}</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-store-archive>
                ${icon(store.status === 'active' ? 'archive' : 'archive-restore')}
                <span>${store.status === 'active' ? 'Arsipkan' : 'Aktifkan'}</span>
              </button>
            </div>
            <div class="danger-zone danger-row">
              <div>
                <strong>Hapus toko</strong>
                <p>${counts > 0 ? `Tidak dapat dihapus: masih ada ${counts} transaksi/profil terkait. Gunakan arsip agar data tetap aman.` : 'Toko belum memiliki transaksi. Penghapusan menghilangkan profile toko secara permanen.'}</p>
              </div>
              <button type="button" class="btn btn-danger btn-sm" data-store-delete ${counts > 0 ? 'disabled' : ''}>
                ${icon('trash')}<span>Hapus toko</span>
              </button>
            </div>
          `,
        })}
      `;
      tabScript = () => {
        root.querySelector<HTMLButtonElement>('[data-store-archive]')?.addEventListener('click', async (event) => {
          const button = event.currentTarget as HTMLButtonElement;
          if (store.status === 'active') {
            const confirmed = await confirmDialog({
              title: 'Arsipkan toko?',
              message: 'Toko disembunyikan dari pilihan baru, tetapi pesanan dan laporan tetap dapat diakses melalui arsip.',
              confirmLabel: 'Arsipkan toko',
              tone: 'primary',
            });
            if (!confirmed) return;
          }
          setButtonLoading(button, true, 'Menyimpan…');
          try {
            if (store.status === 'active') {
              await services.storeService.archive(store.id);
              showToast('Toko diarsipkan.', 'success');
            } else {
              await services.storeService.restore(store.id);
              showToast('Toko diaktifkan kembali.', 'success');
            }
            context.refresh();
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Status toko gagal diubah.', 'error');
            setButtonLoading(button, false);
          }
        });
        root.querySelector<HTMLButtonElement>('[data-store-delete]')?.addEventListener('click', async () => {
          const confirmed = await confirmDialog({
            title: 'Hapus toko secara permanen?',
            message: `Profile toko "${store.name}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`,
            confirmLabel: 'Hapus toko',
            tone: 'danger',
            requireText: store.name,
            details: ['Toko hanya dapat dihapus jika belum memiliki transaksi.'],
          });
          if (!confirmed) return;
          try {
            await services.storeService.delete(store.id);
            showToast('Toko dihapus.', 'success');
            context.navigate('/stores');
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Toko gagal dihapus.', 'error');
          }
        });
      };
    }

    if (tab === 'profile') {
      tabContent = `
        <div class="detail-grid">
          ${card({
            title: 'Informasi toko',
            subtitle: 'Identitas dasar dan kontak',
            actions: linkButton(`/stores/${store.id}/edit`, 'Ubah', 'btn btn-secondary btn-sm', 'pencil'),
            body: `
              <dl class="detail-list">
                <div><dt>Nama toko</dt><dd>${escapeHtml(store.name)}</dd></div>
                <div><dt>Platform</dt><dd>${badge(STORE_PLATFORM_LABELS[store.platform], store.platform === 'shopee' ? 'warning' : store.platform === 'tiktok' ? 'neutral' : 'info')}</dd></div>
                <div><dt>Email toko</dt><dd>${store.email ? escapeHtml(store.email) : '<span class="muted">Belum diisi</span>'}</dd></div>
                <div><dt>Nomor HP</dt><dd>${store.phone ? escapeHtml(store.phone) : '<span class="muted">Belum diisi</span>'}</dd></div>
                <div><dt>Nama KTP</dt><dd>${store.ktpName ? escapeHtml(store.ktpName) : '<span class="muted">Belum diisi</span>'}</dd></div>
                <div><dt>Status</dt><dd>${badge(STORE_STATUS_LABELS[store.status], STORE_STATUS_TONES[store.status])}</dd></div>
                <div><dt>Dibuat</dt><dd>${formatDateTime(store.createdAt)}</dd></div>
                <div><dt>Terakhir diubah</dt><dd>${formatDateTime(store.updatedAt)}</dd></div>
              </dl>
            `,
          })}
          ${card({
            title: 'Data sensitif',
            subtitle: 'Kata sandi marketplace dan nomor rekening',
            body: `
              <div class="security-banner">
                ${icon('shield-alert')}
                <p>Data sensitif disamarkan secara default. Membukanya memerlukan konfirmasi dan dicatat pada log aktivitas. Jangan tampilkan di tempat umum.</p>
              </div>
              <div data-sensitive-area>
                <div class="sensitive-lock">
                  <span>${icon('lock-keyhole')}</span>
                  <div>
                    <strong>Data tersimpan terenkripsi</strong>
                    <p>Kata sandi dan nomor rekening tidak dimuat sampai Anda memintanya.</p>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm" data-reveal-sensitive>${icon('eye')}<span>Tampilkan</span></button>
                </div>
              </div>
              <p class="inline-note">${icon('info')} Kata sandi hanya catatan akses marketplace dan tidak digunakan untuk login aplikasi.</p>
            `,
          })}
        </div>
        ${card({
          title: 'Keamanan profile',
          body: `
            <ul class="plain-list">
              <li>${icon('check')} Data sensitif dienkripsi dengan kunci acak yang disimpan terpisah dari database.</li>
              <li>${icon('check')} Kata sandi dan nomor rekening tidak pernah masuk ke URL, log, atau ringkasan dashboard.</li>
              <li>${icon('check')} Backup dibuat dengan proteksi kata sandi melalui menu Pengaturan.</li>
              <li>${icon('triangle-alert')} Siapa pun yang dapat membuka perangkat dan aplikasi berpotensi mengakses data bisnis.</li>
            </ul>
          `,
        })}
      `;
      tabScript = () => {
        const revealButton = root.querySelector<HTMLButtonElement>('[data-reveal-sensitive]');
        const area = root.querySelector<HTMLElement>('[data-sensitive-area]');
        revealButton?.addEventListener('click', async () => {
          if (!area) return;
          const confirmed = await confirmDialog({
            title: 'Tampilkan data sensitif?',
            message:
              'Pastikan layar tidak terlihat oleh orang lain. Tindakan ini akan dicatat pada log aktivitas.',
            confirmLabel: 'Tampilkan data',
            tone: 'primary',
            details: ['Kata sandi marketplace', 'Nomor rekening'],
          });
          if (!confirmed) return;
          setButtonLoading(revealButton, true, 'Membuka…');
          try {
            const sensitive = await services.storeService.getSensitiveData(store.id);
            area.innerHTML = `
              <div class="sensitive-values">
                <div class="sensitive-row">
                  <div>
                    <span class="sensitive-label">Kata sandi marketplace</span>
                    <code class="sensitive-value">${sensitive.password ? escapeHtml(sensitive.password) : '<span class="muted">Belum disimpan</span>'}</code>
                  </div>
                  ${sensitive.password ? `<button type="button" class="btn btn-ghost btn-icon" data-copy-password aria-label="Salin kata sandi" title="Salin">${icon('copy')}</button>` : ''}
                </div>
                <div class="sensitive-row">
                  <div>
                    <span class="sensitive-label">Nomor rekening</span>
                    <code class="sensitive-value">${sensitive.bankAccount ? escapeHtml(sensitive.bankAccount) : '<span class="muted">Belum disimpan</span>'}</code>
                  </div>
                  ${sensitive.bankAccount ? `<button type="button" class="btn btn-ghost btn-icon" data-copy-bank aria-label="Salin nomor rekening" title="Salin">${icon('copy')}</button>` : ''}
                </div>
              </div>
              <div class="sensitive-actions">
                <button type="button" class="btn btn-secondary btn-sm" data-hide-sensitive>${icon('eye-off')}<span>Sembunyikan</span></button>
              </div>
            `;
            const password = sensitive.password;
            const bankAccount = sensitive.bankAccount;
            area.querySelector('[data-copy-password]')?.addEventListener('click', () => {
              if (password) void copyText(password, 'Kata sandi disalin.');
            });
            area.querySelector('[data-copy-bank]')?.addEventListener('click', () => {
              if (bankAccount) void copyText(bankAccount, 'Nomor rekening disalin.');
            });
            area.querySelector('[data-hide-sensitive]')?.addEventListener('click', () => {
              context.refresh();
            });
            refreshIcons(area);
            setButtonLoading(revealButton, false);
          } catch (error) {
            setButtonLoading(revealButton, false);
            showToast(
              error instanceof Error ? error.message : 'Data sensitif tidak dapat dibuka.',
              'error',
            );
          }
        });
      };
    }

    if (tab === 'pesanan') {
      const orders = await services.orderService.list({ storeId, page: 1, pageSize: 15 });
      if (context.signal.aborted) return;
      tabContent = card({
        title: 'Pesanan toko',
        subtitle: 'Pesanan terbaru; gunakan halaman pesanan untuk filter lengkap',
        actions: linkButton(`/orders?storeId=${store.id}`, 'Semua pesanan', 'btn btn-secondary btn-sm', 'arrow-right'),
        body: orders.items.length
          ? dataTable(
              ['Pesanan', 'Tanggal', 'Item', 'Omzet kotor', 'Status', ''],
              orders.items.map((order) => [
                `<span class="table-strong">${escapeHtml(order.marketplaceOrderId)}</span>`,
                formatBusinessDate(order.orderDate),
                `${formatNumber(order.unitCount)} unit`,
                formatRupiah(order.grossSales),
                badge(ORDER_STATUS_LABELS[order.status], ORDER_STATUS_TONES[order.status]),
                `<a class="btn btn-ghost btn-sm" href="#/orders/${order.id}">Buka</a>`,
              ]),
            )
          : emptyState({
              iconName: 'shopping-bag',
              title: 'Belum ada pesanan',
              description: 'Pesanan untuk toko ini belum dicatat.',
              action: linkButton(`/orders/new?storeId=${store.id}`, 'Tambah pesanan', 'btn btn-primary', 'plus'),
            }),
      });
    }

    if (tab === 'keuangan') {
      const [summary, fees] = await Promise.all([
        services.financeService.getSummary(month, storeId),
        services.feeService.list({ storeId, page: 1, pageSize: 10 }),
      ]);
      if (context.signal.aborted) return;
      tabContent = `
        <div class="detail-grid">
          ${card({
            title: 'Ringkasan keuangan',
            subtitle: month.label,
            body: financeBreakdown(summary, storeId) + `<p class="inline-note">${escapeHtml(financeNote(storeId))}</p>`,
          })}
          ${card({
            title: 'Biaya marketplace terbaru',
            subtitle: 'Biaya aktual dan estimasi',
            actions: linkButton(`/finance/fees?storeId=${store.id}`, 'Kelola biaya', 'btn btn-ghost btn-sm', 'arrow-right'),
            body: fees.items.length
              ? `<ul class="simple-list">
                  ${fees.items
                    .map(
                      (fee) => `<li>
                        <div><strong>${formatRupiah(fee.amount)}</strong><small>${formatBusinessDate(fee.feeDate)}${fee.marketplaceOrderId ? ` · ${escapeHtml(fee.marketplaceOrderId)}` : ''}</small></div>
                        <span class="badge badge-${fee.source === 'estimated' ? 'warning' : 'neutral'}">${fee.source === 'estimated' ? 'Estimasi' : 'Aktual'}</span>
                      </li>`,
                    )
                    .join('')}
                </ul>`
              : emptyState({
                  compact: true,
                  iconName: 'credit-card',
                  title: 'Belum ada biaya marketplace',
                  description: 'Catat potongan aktual atau estimasi agar laba lebih akurat.',
                }),
          })}
        </div>
      `;
    }

    if (tab === 'iklan') {
      const campaigns = await services.advertisingService.listCampaigns(storeId);
      if (context.signal.aborted) return;
      tabContent = card({
        title: 'Kampanye iklan toko',
        subtitle: 'ROAS dan ACOS hanya dihitung jika data atribusi tersedia',
        actions: linkButton(`/finance/ads?storeId=${store.id}`, 'Kelola iklan', 'btn btn-secondary btn-sm', 'megaphone'),
        body: campaigns.length
          ? dataTable(
              ['Kampanye', 'Pengeluaran', 'Omzet atribusi', 'ROAS', 'ACOS', 'Baris', ''],
              campaignRows(campaigns),
            )
          : emptyState({
              iconName: 'megaphone',
              title: 'Belum ada kampanye iklan',
              description: 'Kampanye dapat dipisahkan per toko atau dicatat sebagai kampanye bersama.',
              action: linkButton(`/finance/ads/new?storeId=${store.id}`, 'Tambah kampanye', 'btn btn-primary', 'plus'),
            }),
      });
    }

    const tabLinks = TABS.map(
      (item) =>
        `<a class="tab-link ${item.id === tab ? 'is-active' : ''}" href="#/stores/${store.id}?tab=${item.id}" ${item.id === tab ? 'aria-current="page"' : ''}>${escapeHtml(item.label)}</a>`,
    ).join('');

    root.innerHTML = `
      ${pageHeader({
        eyebrow: STORE_PLATFORM_LABELS[store.platform],
        title: store.name,
        subtitle: 'Profile toko dan performa bisnis terpisah dari toko lain.',
        actions: `
          <a class="btn btn-secondary" href="#/stores">${icon('arrow-left')}<span>Kembali</span></a>
          ${linkButton(`/stores/${store.id}/edit`, 'Ubah toko', 'btn btn-primary', 'pencil')}
        `,
      })}
      <div class="detail-meta">
        ${badge(STORE_STATUS_LABELS[store.status], STORE_STATUS_TONES[store.status])}
        ${badge(STORE_PLATFORM_LABELS[store.platform], store.platform === 'shopee' ? 'warning' : store.platform === 'tiktok' ? 'neutral' : 'info')}
        <span class="muted">${counts > 0 ? `${formatNumber(counts)} transaksi terkait` : 'Belum ada transaksi terkait'}</span>
      </div>
      <nav class="tabs" aria-label="Bagian toko">${tabLinks}</nav>
      ${tabContent}
    `;

    tabScript();
    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
