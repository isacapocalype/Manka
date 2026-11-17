import type { PageRenderer } from '@/app/router';
import type { DashboardData } from '@/core/services/dashboardService';
import { formatBusinessDate } from '@/core/utils/date';
import { formatNumber, formatPercent, formatRupiah } from '@/core/utils/money';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, STORE_PLATFORM_LABELS } from '@/app/labels';
import {
  badge,
  card,
  dataTable,
  emptyState,
  kpiCard,
  linkButton,
  loadingBlock,
  pageHeader,
} from '@/components/ui/ui';
import {
  bindListFilters,
  listFilterHtml,
  readListFilters,
} from '@/components/ui/filters';
import { renderLineChart } from '@/components/ui/charts';
import { escapeHtml } from '@/components/ui/dom';
import { icon } from '@/components/ui/icons';
import { renderPageError } from '@/app/pageUtils';

export const dashboardPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Menghitung ringkasan bisnis…');

  let data: DashboardData;
  try {
    const filters = readListFilters(context.query);
    data = await services.dashboardService.load(filters.period, filters.storeId);
    if (context.signal.aborted) return;

    context.setTitle('Dashboard');
    const stores = data.stores;
    const summary = data.summary;
    const hasStores = stores.length > 0;
    const hasActivity =
      summary.orderCount > 0 ||
      summary.grossSales !== 0 ||
      summary.marketplaceFees !== 0 ||
      summary.advertisingSpend !== 0 ||
      summary.operationalExpenses !== 0 ||
      summary.refunds !== 0;

    const activeStoreName = filters.storeId
      ? stores.find((store) => store.id === filters.storeId)?.name
      : null;
    const previousLabel = `vs ${formatBusinessDate(data.previousRange.from)} – ${formatBusinessDate(data.previousRange.to)}`;

    const headerActions = hasStores
      ? `${linkButton('/orders/import', 'Import', 'btn btn-secondary', 'upload')}
         ${linkButton('/orders/new', 'Tambah pesanan', 'btn btn-primary', 'plus')}`
      : linkButton('/stores/new', 'Tambah toko', 'btn btn-primary', 'plus');

    const onboarding =
      !hasStores
        ? card({
            className: 'onboarding-card',
            body: emptyState({
              iconName: 'store',
              title: 'Mulai dengan menambahkan toko',
              description:
                'Buat toko pertama, lengkapi profile, lalu tambahkan produk dan pesanan. Semua data tersimpan di perangkat ini tanpa server.',
              action: `
                ${linkButton('/stores/new', 'Tambah toko pertama', 'btn btn-primary', 'plus')}
                <a class="btn btn-secondary" href="#/settings">Buka pengaturan</a>
              `,
            }),
          })
        : '';

    const filterBar = hasStores
      ? listFilterHtml(filters, stores)
      : '';

    const kpiGrid = hasStores
      ? `
        <div class="kpi-grid">
          ${kpiCard({
            label: 'Omzet',
            value: formatRupiah(summary.grossSales),
            iconName: 'coins',
            delta: data.comparison.grossSalesChangePercent,
            deltaLabel: previousLabel,
            hint: activeStoreName ?? 'Semua toko',
          })}
          ${kpiCard({
            label: 'Penjualan bersih',
            value: formatRupiah(summary.netSales),
            iconName: 'banknote',
            delta: data.comparison.netSalesChangePercent,
            deltaLabel: previousLabel,
            hint: `${formatNumber(summary.unitsSold)} unit terjual`,
          })}
          ${kpiCard({
            label: 'Laba operasional',
            value: formatRupiah(summary.operatingProfit),
            iconName: summary.operatingProfit >= 0 ? 'trending-up' : 'trending-down',
            tone: summary.operatingProfit >= 0 ? 'positive' : 'negative',
            delta: data.comparison.operatingProfitChangePercent,
            deltaLabel: previousLabel,
            hint: summary.marginPercent === null ? 'Margin N/A' : `Margin ${formatPercent(summary.marginPercent)}`,
          })}
          ${kpiCard({
            label: 'Pesanan',
            value: formatNumber(summary.orderCount),
            iconName: 'shopping-bag',
            hint: `Rata-rata ${formatRupiah(summary.averageOrderValue)} per pesanan`,
          })}
        </div>
      `
      : '';

    const activityContent = !hasActivity
      ? card({
          body: emptyState({
            iconName: 'chart-line',
            title: 'Belum ada aktivitas pada periode ini',
            description:
              'Tambahkan pesanan secara manual atau import file marketplace. Ringkasan akan dihitung dari transaksi yang benar-benar tersimpan.',
            action: `${linkButton('/orders/new', 'Tambah pesanan', 'btn btn-primary', 'plus')}
              ${linkButton('/orders/import', 'Import CSV / XLSX', 'btn btn-secondary', 'upload')}`,
          }),
        })
      : `
        <div class="chart-grid">
          ${card({
            title: 'Omzet dan penjualan bersih',
            subtitle: 'Nilai harian berdasarkan tanggal transaksi',
            body: '<div class="chart-box"><canvas id="dashboard-sales-chart" aria-label="Grafik omzet dan penjualan bersih" role="img"></canvas></div>',
          })}
          ${card({
            title: 'Laba operasional harian',
            subtitle: 'Setelah HPP, biaya marketplace, iklan, dan operasional',
            body: '<div class="chart-box"><canvas id="dashboard-profit-chart" aria-label="Grafik laba operasional" role="img"></canvas></div>',
          })}
        </div>

        <div class="dashboard-lower-grid">
          ${card({
            title: 'Ringkasan biaya',
            subtitle: 'Biaya yang diperhitungkan pada periode ini',
            actions: linkButton('/finance', 'Rincian', 'btn btn-ghost btn-sm', 'arrow-right'),
            body: `
              <ul class="cost-list">
                <li><span>${icon('refresh-cw')} Refund selesai</span><strong class="value-negative">${formatRupiah(-summary.refunds)}</strong></li>
                <li><span>${icon('package')} HPP terjual</span><strong>${formatRupiah(summary.cogs)}</strong></li>
                <li><span>${icon('credit-card')} Biaya marketplace</span><strong>${formatRupiah(summary.marketplaceFees)}</strong></li>
                ${summary.marketplaceFeesEstimated > 0 ? `<li class="cost-sub"><span>Termasuk estimasi</span><strong>${formatRupiah(summary.marketplaceFeesEstimated)}</strong></li>` : ''}
                <li><span>${icon('megaphone')} Biaya iklan</span><strong>${formatRupiah(summary.advertisingSpend)}</strong></li>
                <li><span>${icon('receipt')} Biaya operasional</span><strong>${formatRupiah(summary.operationalExpenses)}</strong></li>
                <li><span>${icon('banknote')} Dana settlement diterima</span><strong>${formatRupiah(data.receivedSettlements)}</strong></li>
              </ul>
              <p class="inline-note">Settlement adalah pencairan dana, bukan tambahan omzet.</p>
            `,
          })}
          ${card({
            title: 'Performa toko',
            subtitle: activeStoreName ? `Toko ${activeStoreName}` : 'Diurutkan dari penjualan bersih',
            actions: linkButton('/stores', 'Semua toko', 'btn btn-ghost btn-sm', 'arrow-right'),
            body: data.storePerformance.length
              ? dataTable(
                  ['Toko', 'Pesanan', 'Penjualan bersih', 'Laba'],
                  data.storePerformance.map((store) => [
                    `<a class="table-link" href="#/stores/${store.storeId}">${escapeHtml(store.storeName)}</a><span class="table-sub">${STORE_PLATFORM_LABELS[store.platform]}</span>`,
                    formatNumber(store.summary.orderCount),
                    formatRupiah(store.summary.netSales),
                    `<span class="${store.summary.operatingProfit >= 0 ? 'value-positive' : 'value-negative'}">${formatRupiah(store.summary.operatingProfit)}</span>`,
                  ]),
                )
              : emptyState({
                  compact: true,
                  iconName: 'store',
                  title: 'Belum ada performa toko',
                  description: 'Performa muncul setelah ada transaksi pada periode ini.',
                }),
          })}
        </div>

        ${card({
          title: 'Transaksi terbaru',
          subtitle: 'Enam pesanan terakhir yang tersimpan',
          actions: linkButton('/orders', 'Lihat semua pesanan', 'btn btn-ghost btn-sm', 'arrow-right'),
          body: data.recentOrders.length
            ? dataTable(
                ['Pesanan', 'Tanggal', 'Status', 'Omzet kotor', ''],
                data.recentOrders.map((order) => [
                  `<a class="table-link" href="#/orders/${order.id}">${escapeHtml(order.marketplaceOrderId)}</a><span class="table-sub">${escapeHtml(order.storeName)}</span>`,
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
                description: 'Pesanan yang ditambahkan atau diimpor akan muncul di sini.',
              }),
        })}
      `;

    root.innerHTML = `
      ${pageHeader({
        eyebrow: activeStoreName ? `Toko ${activeStoreName}` : 'Semua toko',
        title: 'Dashboard',
        subtitle: `${data.range.from === data.range.to ? formatBusinessDate(data.range.from, 'long') : `${formatBusinessDate(data.range.from, 'long')} – ${formatBusinessDate(data.range.to, 'long')}`}`,
        actions: headerActions,
      })}
      ${filterBar}
      ${onboarding}
      ${kpiGrid}
      ${hasStores && hasActivity && summary.hasEstimatedFees ? `<p class="inline-note note-warning">${icon('triangle-alert')} Sebagian biaya marketplace adalah estimasi. Laba operasional dapat berubah saat biaya aktual dicatat.</p>` : ''}
      ${activeStoreName && (summary.sharedAdvertisingSpend > 0 || summary.sharedOperationalExpenses > 0) ? `<p class="inline-note">${icon('info')} Biaya bersama tidak dialokasikan ke toko yang dipilih.</p>` : ''}
      <div class="dashboard-stack">${activityContent}</div>
    `;

    if (hasStores) {
      bindListFilters(root, context);
    }

    if (hasStores && hasActivity) {
      const labels = data.daily.map((day) => formatBusinessDate(day.date));
      const salesCanvas = root.querySelector<HTMLCanvasElement>('#dashboard-sales-chart');
      if (salesCanvas) {
        const chart = await renderLineChart(
          salesCanvas,
          labels,
          [
            {
              label: 'Omzet',
              data: data.daily.map((day) => day.grossSales),
              color: '#2563EB',
              fillColor: 'rgba(37, 99, 235, 0.10)',
              fill: true,
            },
            {
              label: 'Penjualan bersih',
              data: data.daily.map((day) => day.netSales),
              color: '#0891B2',
            },
          ],
          { currency: true, signal: context.signal },
        );
        if (chart) context.onCleanup(() => chart.destroy());
      }
      const profitCanvas = root.querySelector<HTMLCanvasElement>('#dashboard-profit-chart');
      if (profitCanvas) {
        const chart = await renderLineChart(
          profitCanvas,
          labels,
          [
            {
              label: 'Laba operasional',
              data: data.daily.map((day) => day.operatingProfit),
              color: '#16A34A',
              fillColor: 'rgba(22, 163, 74, 0.10)',
              fill: true,
            },
          ],
          { currency: true, signal: context.signal },
        );
        if (chart) context.onCleanup(() => chart.destroy());
      }
    }
  } catch (error) {
    renderPageError(root, context, error);
  }
};
