import type { ReportData } from '@/core/services/reportService';
import type { ProductProfitRow } from '@/types/finance';
import { formatNumber, formatPercent, formatRupiah } from '@/core/utils/money';
import { escapeHtml } from '@/components/ui/dom';
import { icon } from '@/components/ui/icons';
import {
  badge,
  card,
  dataTable,
  emptyState,
  kpiCard,
} from '@/components/ui/ui';

function productLink(row: ProductProfitRow): string {
  const name = escapeHtml(row.productName);
  if (!row.productId) return `<span class="table-strong">${name}</span>`;
  return `<a class="table-link" href="#/products/${row.productId}">${name}</a>`;
}

function rankingList(
  rows: ProductProfitRow[],
  emptyText: string,
): string {
  if (rows.length === 0) {
    return `<p class="muted-text">${escapeHtml(emptyText)}</p>`;
  }
  return `
    <ol class="profit-ranking">
      ${rows
        .map(
          (row) => `
            <li>
              <div>
                ${productLink(row)}
                <span class="table-sub">${escapeHtml(row.sku)}${row.category ? ` · ${escapeHtml(row.category)}` : ''}</span>
              </div>
              <div class="profit-ranking-value">
                <span class="${row.netProfit >= 0 ? 'value-positive' : 'value-negative'}">${formatRupiah(row.netProfit)}</span>
                <span class="table-sub">${row.marginPercent === null ? 'Margin N/A' : formatPercent(row.marginPercent)}</span>
              </div>
            </li>
          `,
        )
        .join('')}
    </ol>
  `;
}

export function productProfitSection(report: ReportData): string {
  const products = report.products;
  if (products.rows.length === 0) {
    return card({
      body: emptyState({
        iconName: 'package-search',
        title: 'Belum ada penjualan produk pada periode ini',
        description:
          'Laporan laba per produk memakai item pesanan yang sudah tercatat. Tambahkan pesanan atau ubah periode/toko.',
      }),
    });
  }

  const rows = products.rows.map((row) => [
    `${productLink(row)}<span class="table-sub">${escapeHtml(row.sku)}${row.category ? ` · ${escapeHtml(row.category)}` : ''}</span>`,
    formatNumber(row.unitsSold),
    formatRupiah(row.grossSales),
    formatRupiah(row.sellerDiscount),
    formatRupiah(row.refunds),
    formatRupiah(row.netSales),
    formatRupiah(row.cogs),
    formatRupiah(row.marketplaceFees),
    `<span class="${row.netProfit >= 0 ? 'value-positive' : 'value-negative'}">${formatRupiah(row.netProfit)}</span>`,
    row.marginPercent === null ? 'N/A' : formatPercent(row.marginPercent),
    row.hasMissingHpp ? badge('Tanpa HPP', 'warning') : badge('Lengkap', 'success'),
  ]);

  return `
    <div class="kpi-grid">
      ${kpiCard({
        label: 'Laba bersih produk',
        value: formatRupiah(products.totals.netProfit),
        iconName: 'trending-up',
        tone: products.totals.netProfit >= 0 ? 'positive' : 'negative',
        hint: 'Setelah HPP dan fee marketplace',
      })}
      ${kpiCard({
        label: 'Penjualan bersih',
        value: formatRupiah(products.totals.netSales),
        iconName: 'banknote',
        hint: `${formatNumber(products.totals.orderCount)} pesanan · ${formatNumber(products.totals.unitsSold)} unit`,
      })}
      ${kpiCard({
        label: 'HPP terjual',
        value: formatRupiah(products.totals.cogs),
        iconName: 'package',
        hint: 'Memakai snapshot HPP saat pesanan dibuat',
      })}
      ${kpiCard({
        label: 'Produk tanpa HPP',
        value: formatNumber(products.withoutHpp.length),
        iconName: products.withoutHpp.length > 0 ? 'triangle-alert' : 'circle-check',
        tone: products.withoutHpp.length > 0 ? 'warning' : 'positive',
        hint: products.withoutHpp.length > 0 ? 'Lengkapi HPP produk' : 'Semua produk punya HPP',
      })}
    </div>

    <div class="finance-grid">
      ${card({
        title: 'Produk paling untung',
        subtitle: 'Lima produk dengan laba bersih tertinggi',
        body: rankingList(products.topProfit, 'Belum ada produk yang menghasilkan laba.'),
      })}
      ${card({
        title: 'Produk rugi',
        subtitle: 'Laba bersih di bawah nol',
        body: rankingList(products.lossMaking, 'Tidak ada produk yang rugi pada periode ini.'),
      })}
    </div>

    ${
      products.withoutHpp.length > 0
        ? card({
            title: 'Produk tanpa HPP',
            subtitle: 'Laba belum akurat sampai HPP diisi',
            body: `
              ${rankingList(products.withoutHpp, 'Semua produk sudah memiliki HPP.')}
              <p class="inline-note note-warning">${icon('triangle-alert')} HPP 0 membuat laba produk terlihat lebih besar dari seharusnya. Lengkapi biaya produk terlebih dahulu.</p>
            `,
          })
        : ''
    }

    ${card({
      title: 'Laba per produk',
      subtitle: `${formatNumber(products.rows.length)} produk · ${formatNumber(products.totals.orderCount)} pesanan`,
      padded: false,
      body: dataTable(
        ['Produk', 'Unit terjual', 'Omzet', 'Diskon', 'Refund', 'Bersih', 'HPP', 'Fee MP', 'Laba bersih', 'Margin', 'Status HPP'],
        rows,
      ),
    })}

    <p class="inline-note">${icon('info')} Diskon penjual, refund, dan fee marketplace level pesanan dialokasikan proporsional terhadap omzet item. Refund dan fee mengikuti pesanan asalnya, sehingga laba produk bisa berbeda dari laba harian yang memakai tanggal transaksi. Fee marketplace tanpa pesanan, biaya iklan, dan biaya operasional tidak dialokasikan ke produk.</p>
  `;
}
