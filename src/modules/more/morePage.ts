import type { PageRenderer } from '@/app/router';
import { formatNumber } from '@/core/utils/money';
import { icon } from '@/components/ui/icons';
import { card, pageHeader } from '@/components/ui/ui';
import { renderPageError } from '@/app/pageUtils';
import { refreshIcons } from '@/components/ui/icons';

interface MoreLink {
  href: string;
  label: string;
  description: string;
  iconName: string;
}

const MAIN_LINKS: MoreLink[] = [
  {
    href: '/stores',
    label: 'Toko & profil',
    description: 'Kelola toko marketplace, data sensitif terenkripsi, arsip, dan riwayat toko.',
    iconName: 'store',
  },
  {
    href: '/orders',
    label: 'Pesanan',
    description: 'Catat penjualan, status pesanan, HPP snapshot, dan nominal pencairan.',
    iconName: 'shopping-bag',
  },
  {
    href: '/orders/import',
    label: 'Import pesanan',
    description: 'Tarik CSV/XLSX marketplace dengan mapping kolom, validasi, dan deteksi duplikat.',
    iconName: 'upload',
  },
  {
    href: '/production',
    label: 'Produksi',
    description:
      'Work order dari item pesanan atau manual, progres tahap, PIC, tenggat, lolos, dan cacat.',
    iconName: 'factory',
  },
  {
    href: '/products',
    label: 'Produk & HPP',
    description: 'Produk, harga jual, dan riwayat HPP untuk perhitungan laba yang konsisten.',
    iconName: 'package',
  },
  {
    href: '/materials',
    label: 'Material',
    description: 'Bahan baku dan biaya satuan untuk menyusun BOM serta HPP produk.',
    iconName: 'boxes',
  },
  {
    href: '/reports',
    label: 'Laporan',
    description: 'Laporan harian, bulanan, tahunan, per toko, dan ekspor CSV/Excel/PDF.',
    iconName: 'chart-column',
  },
  {
    href: '/health',
    label: 'Kesehatan data',
    description:
      'Periksa pesanan tanpa fee, produk HPP 0, settlement pending, dan backup yang terlambat.',
    iconName: 'shield-check',
  },
  {
    href: '/settings',
    label: 'Pengaturan & backup',
    description: 'Backup terenkripsi, restore, riwayat import, audit log, dan keamanan data.',
    iconName: 'settings',
  },
];

const FINANCE_LINKS: MoreLink[] = [
  {
    href: '/finance/cash',
    label: 'Kas & rekening',
    description: 'Saldo kas, bank, e-wallet, transfer, dan rekonsiliasi.',
    iconName: 'landmark',
  },
  {
    href: '/finance/fees',
    label: 'Biaya marketplace',
    description: 'Potongan aktual dan estimasi.',
    iconName: 'credit-card',
  },
  {
    href: '/finance/ads',
    label: 'Iklan',
    description: 'Kampanye dan biaya iklan.',
    iconName: 'megaphone',
  },
  {
    href: '/finance/expenses',
    label: 'Biaya operasional',
    description: 'Biaya toko dan biaya bersama.',
    iconName: 'receipt',
  },
  {
    href: '/finance/refunds',
    label: 'Refund',
    description: 'Pengembalian dana yang tidak dihitung ganda.',
    iconName: 'refresh-cw',
  },
  {
    href: '/finance/settlements',
    label: 'Settlement',
    description: 'Pencairan dana sebagai arus kas.',
    iconName: 'banknote',
  },
];

export const morePage: PageRenderer = async (context) => {
  const { root, services } = context;
  context.setTitle('Lainnya');

  try {
    const counts = await services.backupRepo.getDataCounts();
    if (context.signal.aborted) return;

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Menu',
        title: 'Lainnya',
        subtitle: 'Semua modul yang tidak muat di navigasi bawah. Data tetap tersimpan lokal di perangkat.',
      })}

      <div class="quick-counts">
        <span>${icon('store')} <strong>${formatNumber(counts.stores)}</strong> toko</span>
        <span>${icon('package')} <strong>${formatNumber(counts.products)}</strong> produk</span>
        <span>${icon('shopping-bag')} <strong>${formatNumber(counts.orders)}</strong> pesanan</span>
      </div>

      <div class="more-grid">
        ${MAIN_LINKS.map(
          (link) => `
            <a class="more-card" href="#${link.href}">
              <span class="more-icon">${icon(link.iconName)}</span>
              <span class="more-copy">
                <strong>${link.label}</strong>
                <span>${link.description}</span>
              </span>
              ${icon('chevron-right', 'more-chevron')}
            </a>
          `,
        ).join('')}
      </div>

      ${card({
        title: 'Keuangan',
        subtitle: 'Akses cepat ke modul keuangan',
        body: `
          <div class="more-grid more-grid-compact">
            ${FINANCE_LINKS.map(
              (link) => `
                <a class="more-card more-card-compact" href="#${link.href}">
                  <span class="more-icon">${icon(link.iconName)}</span>
                  <span class="more-copy">
                    <strong>${link.label}</strong>
                    <span>${link.description}</span>
                  </span>
                  ${icon('chevron-right', 'more-chevron')}
                </a>
              `,
            ).join('')}
          </div>
        `,
      })}

      ${card({
        title: 'Tentang data',
        body: `
          <p class="inline-note">${icon('shield-check')} Manka berjalan offline. Tidak ada akun, server, atau sinkronisasi cloud. Backup terenkripsi tersedia di Pengaturan dan dapat disalin keluar aplikasi.</p>
          <div class="more-foot-links">
            <a class="btn btn-secondary" href="#/settings">${icon('database-backup')}<span>Backup & restore</span></a>
            <a class="btn btn-ghost" href="#/dashboard">${icon('layout-dashboard')}<span>Kembali ke dashboard</span></a>
          </div>
        `,
      })}
    `;

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
