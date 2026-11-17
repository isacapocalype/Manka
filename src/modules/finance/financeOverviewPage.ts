import type { PageRenderer } from '@/app/router';
import { formatBusinessDate } from '@/core/utils/date';
import { formatNumber, formatPercent, formatRupiah } from '@/core/utils/money';
import { STORE_PLATFORM_LABELS } from '@/app/labels';
import { escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  card,
  dataTable,
  emptyState,
  kpiCard,
  linkButton,
  loadingBlock,
  pageHeader,
} from '@/components/ui/ui';
import { bindListFilters, listFilterHtml, readListFilters } from '@/components/ui/filters';
import { renderLineChart } from '@/components/ui/charts';
import { financeBreakdown, financeNote } from './financeUi';
import { renderPageError } from '@/app/pageUtils';

interface FinanceShortcut {
  href: string;
  title: string;
  description: string;
  iconName: string;
  count: number;
  countLabel: string;
}

export const financeOverviewPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Menghitung ringkasan keuangan…');

  try {
    const filters = readListFilters(context.query);
    const [stores, counts] = await Promise.all([
      services.storeService.listAll(),
      services.backupRepo.getDataCounts(),
    ]);

    if (stores.length === 0) {
      context.setTitle('Keuangan');
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Keuangan',
          title: 'Ringkasan keuangan',
          subtitle: 'Semua angka dihitung dari transaksi yang tersimpan di perangkat.',
          actions: linkButton('/reports', 'Buka laporan', 'btn btn-secondary', 'chart-column'),
        })}
        ${card({
          body: emptyState({
            iconName: 'wallet',
            title: 'Belum ada data keuangan',
            description:
              'Tambahkan toko dan pesanan terlebih dahulu. Biaya marketplace, iklan, operasional, refund, dan settlement akan muncul di sini setelah dicatat.',
            action: `${linkButton('/stores/new', 'Tambah toko', 'btn btn-primary', 'plus')}
              ${linkButton('/orders/import', 'Import pesanan', 'btn btn-secondary', 'upload')}`,
          }),
        })}
      `;
      refreshIcons(root);
      return;
    }

    const filteredStores = filters.storeId
      ? stores.filter((store) => store.id === filters.storeId)
      : stores;
    const [summary, daily, storePerformance, receivedSettlements] = await Promise.all([
      services.financeService.getSummary(filters.period, filters.storeId),
      services.financeService.getDaily(filters.period, filters.storeId),
      services.financeService.getStorePerformance(filters.period, filteredStores),
      services.financeService.getReceivedSettlements(filters.period, filters.storeId),
    ]);
    if (context.signal.aborted) return;

    context.setTitle('Keuangan');
    const activeStoreName = filters.storeId
      ? stores.find((store) => store.id === filters.storeId)?.name ?? null
      : null;
    const hasActivity =
      summary.orderCount > 0 ||
      summary.marketplaceFees !== 0 ||
      summary.advertisingSpend !== 0 ||
      summary.operationalExpenses !== 0 ||
      summary.refunds !== 0 ||
      receivedSettlements !== 0;

    const shortcuts: FinanceShortcut[] = [
      {
        href: '/finance/fees',
        title: 'Biaya marketplace',
        description: 'Potongan administrasi, layanan, komisi, dan promosi.',
        iconName: 'credit-card',
        count: counts.fees,
        countLabel: 'biaya',
      },
      {
        href: '/finance/ads',
        title: 'Iklan',
        description: 'Kampanye, pengeluaran harian, ROAS, dan ACOS.',
        iconName: 'megaphone',
        count: counts.campaigns,
        countLabel: 'kampanye',
      },
      {
        href: '/finance/expenses',
        title: 'Biaya operasional',
        description: 'Gaji, listrik, sewa, perawatan mesin, dan biaya bersama.',
        iconName: 'receipt',
        count: counts.operationalExpenses,
        countLabel: 'catatan',
      },
      {
        href: '/finance/refunds',
        title: 'Refund',
        description: 'Pengembalian dana yang mengurangi penjualan sekali saja.',
        iconName: 'refresh-cw',
        count: counts.refunds,
        countLabel: 'refund',
      },
      {
        href: '/finance/settlements',
        title: 'Settlement',
        description: 'Pencairan dana marketplace sebagai arus kas, bukan omzet baru.',
        iconName: 'banknote',
        count: counts.settlements,
        countLabel: 'settlement',
      },
    ];

    root.innerHTML = `
      ${pageHeader({
        eyebrow: activeStoreName ? `Toko ${activeStoreName}` : 'Semua toko',
        title: 'Ringkasan keuangan',
        subtitle: filters.period.label,
        actions: `
          ${linkButton('/finance/expenses/new', 'Catat biaya', 'btn btn-secondary', 'plus')}
          ${linkButton('/reports', 'Buka laporan', 'btn btn-primary', 'chart-column')}
        `,
      })}

      ${listFilterHtml(filters, stores)}

      <div class="kpi-grid">
        ${kpiCard({
          label: 'Penjualan bersih',
          value: formatRupiah(summary.netSales),
          iconName: 'banknote',
          hint: `${formatNumber(summary.orderCount)} pesanan · ${formatNumber(summary.unitsSold)} unit`,
        })}
        ${kpiCard({
          label: 'Laba kotor',
          value: formatRupiah(summary.grossProfit),
          iconName: 'trending-up',
          tone: summary.grossProfit >= 0 ? 'positive' : 'negative',
          hint: `Setelah HPP ${formatRupiah(summary.cogs)}`,
        })}
        ${kpiCard({
          label: 'Laba operasional',
          value: formatRupiah(summary.operatingProfit),
          iconName: summary.operatingProfit >= 0 ? 'trending-up' : 'trending-down',
          tone: summary.operatingProfit >= 0 ? 'positive' : 'negative',
          hint: summary.marginPercent === null ? 'Margin N/A' : `Margin ${formatPercent(summary.marginPercent)}`,
        })}
        ${kpiCard({
          label: 'Dana settlement diterima',
          value: formatRupiah(receivedSettlements),
          iconName: 'wallet',
          hint: 'Arus kas, tidak menambah omzet',
        })}
      </div>

      ${
        summary.hasEstimatedFees
          ? `<p class="inline-note note-warning">${icon('triangle-alert')} Sebagian biaya marketplace masih berupa estimasi dan tidak dianggap biaya aktual.</p>`
          : ''
      }

      ${
        !hasActivity
          ? card({
              body: emptyState({
                iconName: 'chart-pie',
                title: 'Belum ada aktivitas keuangan',
                description:
                  'Tidak ada pesanan, biaya, atau settlement pada filter yang dipilih. Ubah periode/toko atau catat transaksi baru.',
                action: `${linkButton('/orders/new', 'Tambah pesanan', 'btn btn-primary', 'plus')}
                  ${linkButton('/finance/expenses/new', 'Catat biaya', 'btn btn-secondary', 'plus')}`,
              }),
            })
          : `
            <div class="finance-grid">
              ${card({
                title: 'Rincian laba rugi',
                subtitle: 'Tidak ada biaya yang dihitung dua kali',
                body: financeBreakdown(summary, filters.storeId),
              })}
              ${card({
                title: 'Arus kas dan catatan',
                subtitle: 'Informasi agar omzet tidak tertukar dengan pencairan',
                body: `
                  <div class="finance-cashflow">
                    <div>
                      <span>${icon('banknote')} Settlement diterima</span>
                      <strong>${formatRupiah(receivedSettlements)}</strong>
                    </div>
                    <p>Settlement adalah uang yang benar-benar dicairkan marketplace. Nilai ini tidak ditambahkan ke penjualan bersih atau laba.</p>
                  </div>
                  <div class="finance-cashflow">
                    <div>
                      <span>${icon('refresh-cw')} Refund selesai</span>
                      <strong>${formatRupiah(summary.refunds)}</strong>
                    </div>
                    <p>Refund pada pesanan yang masih dihitung sebagai penjualan mengurangi pendapatan satu kali.</p>
                  </div>
                  <div class="finance-cashflow">
                    <div>
                      <span>${icon('percent')} Diskon marketplace</span>
                      <strong>${formatRupiah(summary.marketplaceDiscount)}</strong>
                    </div>
                    <p>Diskon yang ditanggung marketplace tidak mengurangi pendapatan penjual.</p>
                  </div>
                  <p class="inline-note">${icon('info')} ${escapeHtml(financeNote(filters.storeId))}</p>
                `,
              })}
            </div>

            ${card({
              title: 'Tren penjualan dan laba',
              subtitle: 'Nilai harian pada periode aktif',
              body: '<div class="chart-box chart-box-lg"><canvas id="finance-chart" aria-label="Grafik penjualan bersih dan laba operasional" role="img"></canvas></div>',
            })}
          `
      }

      <div class="section-heading">
        <h2>Kelola keuangan</h2>
        <p>Setiap catatan terhubung ke toko dan periode laporan.</p>
      </div>
      <div class="shortcut-grid">
        ${shortcuts
          .map(
            (shortcut) => `
              <a class="shortcut-card" href="#${shortcut.href}">
                <span class="shortcut-icon">${icon(shortcut.iconName)}</span>
                <div>
                  <strong>${escapeHtml(shortcut.title)}</strong>
                  <p>${escapeHtml(shortcut.description)}</p>
                  <span class="shortcut-meta">${formatNumber(shortcut.count)} ${escapeHtml(shortcut.countLabel)}</span>
                </div>
                ${icon('arrow-right', 'shortcut-arrow')}
              </a>
            `,
          )
          .join('')}
      </div>

      ${
        storePerformance.length > 1
          ? card({
              title: 'Perbandingan toko',
              subtitle: 'Diurutkan dari penjualan bersih',
              padded: false,
              body: dataTable(
                ['Toko', 'Pesanan', 'Omzet', 'Penjualan bersih', 'Laba operasional'],
                storePerformance.map((store) => [
                  `<a class="table-link" href="#/stores/${store.storeId}">${escapeHtml(store.storeName)}</a><span class="table-sub">${STORE_PLATFORM_LABELS[store.platform]}</span>`,
                  formatNumber(store.summary.orderCount),
                  formatRupiah(store.summary.grossSales),
                  formatRupiah(store.summary.netSales),
                  `<span class="${store.summary.operatingProfit >= 0 ? 'value-positive' : 'value-negative'}">${formatRupiah(store.summary.operatingProfit)}</span>`,
                ]),
              ),
            })
          : ''
      }
    `;

    bindListFilters(root, context);

    if (hasActivity) {
      const canvas = root.querySelector<HTMLCanvasElement>('#finance-chart');
      if (canvas) {
        const chart = await renderLineChart(
          canvas,
          daily.map((day) => formatBusinessDate(day.date)),
          [
            {
              label: 'Penjualan bersih',
              data: daily.map((day) => day.netSales),
              color: '#2563EB',
              fillColor: 'rgba(37, 99, 235, 0.10)',
              fill: true,
            },
            {
              label: 'Laba operasional',
              data: daily.map((day) => day.operatingProfit),
              color: '#16A34A',
            },
          ],
          { currency: true, signal: context.signal },
        );
        if (chart) context.onCleanup(() => chart.destroy());
      }
    }

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
