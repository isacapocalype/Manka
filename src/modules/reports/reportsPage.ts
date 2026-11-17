import type { PageRenderer } from '@/app/router';
import type { ReportData } from '@/core/services/reportService';
import type { ExportFormat } from '@/core/import-export/reportExporter';
import { exportReport } from '@/core/import-export/reportExporter';
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
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import { bindListFilters, listFilterHtml, readListFilters } from '@/components/ui/filters';
import { renderLineChart } from '@/components/ui/charts';
import { financeBreakdown, financeNote } from '@/modules/finance/financeUi';
import { renderPageError } from '@/app/pageUtils';

const EXPORT_BUTTONS: { format: ExportFormat; label: string; iconName: string }[] = [
  { format: 'csv', label: 'CSV', iconName: 'file-text' },
  { format: 'xlsx', label: 'Excel', iconName: 'file-spreadsheet' },
  { format: 'pdf', label: 'PDF', iconName: 'file' },
];

function hasReportActivity(report: ReportData): boolean {
  const summary = report.summary;
  return (
    summary.orderCount > 0 ||
    summary.marketplaceFees !== 0 ||
    summary.advertisingSpend !== 0 ||
    summary.operationalExpenses !== 0 ||
    summary.refunds !== 0
  );
}

export const reportsPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Menyusun laporan…');

  try {
    const filters = readListFilters(context.query);
    const stores = await services.storeService.listAll();
    if (context.signal.aborted) return;

    if (stores.length === 0) {
      context.setTitle('Laporan');
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Analitik',
          title: 'Laporan keuangan',
          subtitle: 'Laporan dihitung dari transaksi lokal pada periode dan toko yang dipilih.',
        })}
        ${card({
          body: emptyState({
            iconName: 'chart-column',
            title: 'Belum ada data untuk dilaporkan',
            description: 'Tambahkan toko dan pesanan terlebih dahulu. Laporan akan tersedia otomatis.',
            action: `${linkButton('/stores/new', 'Tambah toko', 'btn btn-primary', 'plus')}
              ${linkButton('/orders/new', 'Tambah pesanan', 'btn btn-secondary', 'plus')}`,
          }),
        })}
      `;
      refreshIcons(root);
      return;
    }

    const report = await services.reportService.getReport(filters.period, filters.storeId);
    if (context.signal.aborted) return;
    context.setTitle('Laporan');

    const storeName = filters.storeId
      ? stores.find((store) => store.id === filters.storeId)?.name ?? 'Toko'
      : 'Semua toko';
    const active = hasReportActivity(report);
    const dailyWithActivity = report.daily.filter(
      (day) =>
        day.orderCount > 0 ||
        day.refunds !== 0 ||
        day.marketplaceFees !== 0 ||
        day.advertisingSpend !== 0 ||
        day.operationalExpenses !== 0,
    );
    const rows = (dailyWithActivity.length > 0 ? dailyWithActivity : report.daily).map((day) => [
      `<span class="table-strong">${formatBusinessDate(day.date)}</span>`,
      formatNumber(day.orderCount),
      formatRupiah(day.grossSales),
      formatRupiah(day.refunds),
      formatRupiah(day.netSales),
      formatRupiah(day.cogs),
      formatRupiah(day.marketplaceFees),
      formatRupiah(day.advertisingSpend),
      formatRupiah(day.operationalExpenses),
      `<span class="${day.operatingProfit >= 0 ? 'value-positive' : 'value-negative'}">${formatRupiah(day.operatingProfit)}</span>`,
      day.marginPercent === null ? 'N/A' : formatPercent(day.marginPercent),
    ]);

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Analitik',
        title: 'Laporan keuangan',
        subtitle: `${filters.period.label} · ${storeName}`,
        actions: `
          ${linkButton('/dashboard', 'Dashboard', 'btn btn-secondary', 'layout-dashboard')}
          ${linkButton('/finance', 'Ringkasan keuangan', 'btn btn-secondary', 'wallet')}
        `,
      })}

      ${listFilterHtml(filters, stores)}

      <div class="report-export-bar">
        <div>
          <strong>Ekspor laporan</strong>
          <p>File berisi data aktual pada periode dan toko yang dipilih. Tidak ada data contoh.</p>
        </div>
        <div class="report-export-actions">
          ${EXPORT_BUTTONS.map(
            (item) =>
              `<button type="button" class="btn btn-secondary" data-export="${item.format}">${icon(item.iconName)}<span>${item.label}</span></button>`,
          ).join('')}
        </div>
      </div>

      ${
        active
          ? `
            <div class="kpi-grid">
              ${kpiCard({
                label: 'Penjualan bersih',
                value: formatRupiah(report.summary.netSales),
                iconName: 'banknote',
                hint: `${formatNumber(report.summary.orderCount)} pesanan · ${formatNumber(report.summary.unitsSold)} unit`,
              })}
              ${kpiCard({
                label: 'Laba kotor',
                value: formatRupiah(report.summary.grossProfit),
                iconName: 'trending-up',
                tone: report.summary.grossProfit >= 0 ? 'positive' : 'negative',
                hint: `Setelah HPP ${formatRupiah(report.summary.cogs)}`,
              })}
              ${kpiCard({
                label: 'Laba operasional',
                value: formatRupiah(report.summary.operatingProfit),
                iconName: report.summary.operatingProfit >= 0 ? 'trending-up' : 'trending-down',
                tone: report.summary.operatingProfit >= 0 ? 'positive' : 'negative',
                hint: 'Setelah fee, iklan, dan operasional',
              })}
              ${kpiCard({
                label: 'Margin operasional',
                value: report.summary.marginPercent === null ? 'N/A' : formatPercent(report.summary.marginPercent),
                iconName: 'percent',
                hint:
                  report.summary.marginPercent === null
                    ? 'Butuh penjualan bersih > 0'
                    : 'Laba operasional ÷ penjualan bersih',
              })}
            </div>

            ${
              report.summary.hasEstimatedFees
                ? `<p class="inline-note note-warning">${icon('triangle-alert')} Sebagian biaya marketplace masih estimasi; angka aktual dan estimasi dipisahkan pada rincian.</p>`
                : ''
            }

            <div class="finance-grid">
              ${card({
                title: 'Rincian laba rugi',
                subtitle: 'Perhitungan periode terpilih',
                body: financeBreakdown(report.summary, report.storeId),
              })}
              ${card({
                title: 'Catatan perhitungan',
                subtitle: 'Aturan yang dipakai laporan',
                body: `
                  <ul class="report-notes">
                    <li><strong>Omzet</strong> dihitung dari harga item setelah diskon penjual, bukan diskon marketplace.</li>
                    <li><strong>Refund selesai</strong> mengurangi penjualan satu kali; pesanan batal/retur/refund tidak dihitung sebagai penjualan.</li>
                    <li><strong>HPP</strong> memakai snapshot saat pesanan dibuat, sehingga perubahan HPP produk tidak mengubah masa lalu.</li>
                    <li><strong>Biaya marketplace estimasi</strong> tidak dianggap biaya aktual pada laba.</li>
                    <li><strong>Settlement</strong> adalah arus kas dan tidak menambah omzet atau laba.</li>
                  </ul>
                  <p class="inline-note">${icon('info')} ${escapeHtml(financeNote(report.storeId))}</p>
                `,
              })}
            </div>

            ${card({
              title: 'Tren penjualan bersih dan laba',
              subtitle: `${formatBusinessDate(report.range.from, 'long')} – ${formatBusinessDate(report.range.to, 'long')}`,
              body: '<div class="chart-box chart-box-lg"><canvas id="report-chart" aria-label="Grafik penjualan bersih dan laba operasional" role="img"></canvas></div>',
            })}

            ${card({
              title: 'Rincian harian',
              subtitle: `${formatNumber(report.daily.length)} hari dalam periode · ${formatNumber(dailyWithActivity.length)} hari memiliki aktivitas`,
              padded: false,
              body: dataTable(
                ['Tanggal', 'Pesanan', 'Omzet', 'Refund', 'Bersih', 'HPP', 'Fee MP', 'Iklan', 'Operasional', 'Laba', 'Margin'],
                rows,
              ),
            })}

            ${
              !report.storeId && report.storePerformance.length > 0
                ? card({
                    title: 'Perbandingan toko',
                    subtitle: 'Data pada periode terpilih',
                    padded: false,
                    body: dataTable(
                      ['Toko', 'Pesanan', 'Omzet', 'Penjualan bersih', 'HPP', 'Laba kotor', 'Laba operasional', 'Margin'],
                      report.storePerformance.map((store) => [
                        `<a class="table-link" href="#/stores/${store.storeId}">${escapeHtml(store.storeName)}</a><span class="table-sub">${STORE_PLATFORM_LABELS[store.platform]}</span>`,
                        formatNumber(store.summary.orderCount),
                        formatRupiah(store.summary.grossSales),
                        formatRupiah(store.summary.netSales),
                        formatRupiah(store.summary.cogs),
                        formatRupiah(store.summary.grossProfit),
                        `<span class="${store.summary.operatingProfit >= 0 ? 'value-positive' : 'value-negative'}">${formatRupiah(store.summary.operatingProfit)}</span>`,
                        store.summary.marginPercent === null ? 'N/A' : formatPercent(store.summary.marginPercent),
                      ]),
                    ),
                  })
                : ''
            }
          `
          : card({
              body: emptyState({
                iconName: 'chart-column',
                title: 'Tidak ada aktivitas pada periode ini',
                description:
                  'Tidak ada pesanan, biaya, refund, atau iklan pada filter yang dipilih. Ubah periode/toko atau catat transaksi baru.',
                action: `${linkButton('/orders/new', 'Tambah pesanan', 'btn btn-primary', 'plus')}
                  ${linkButton('/finance/expenses/new', 'Catat biaya', 'btn btn-secondary', 'plus')}`,
              }),
            })
      }
    `;

    bindListFilters(root, context);

    if (active) {
      const canvas = root.querySelector<HTMLCanvasElement>('#report-chart');
      if (canvas) {
        const chart = await renderLineChart(
          canvas,
          report.daily.map((day) => formatBusinessDate(day.date)),
          [
            {
              label: 'Penjualan bersih',
              data: report.daily.map((day) => day.netSales),
              color: '#2563EB',
              fillColor: 'rgba(37, 99, 235, 0.10)',
              fill: true,
            },
            {
              label: 'Laba operasional',
              data: report.daily.map((day) => day.operatingProfit),
              color: '#16A34A',
            },
          ],
          { currency: true, signal: context.signal },
        );
        if (chart) context.onCleanup(() => chart.destroy());
      }
    }

    root.querySelectorAll<HTMLButtonElement>('[data-export]').forEach((button) => {
      button.addEventListener('click', async () => {
        const format = button.dataset.export as ExportFormat | undefined;
        if (!format) return;
        setButtonLoading(button, true, 'Menyiapkan…');
        try {
          const result = await exportReport(report, format);
          showToast(
            result.method === 'share'
              ? `${result.fileName} siap dibagikan melalui dialog berbagi.`
              : `${result.fileName} diunduh.`,
            'success',
          );
        } catch (error) {
          showToast(
            error instanceof Error ? error.message : 'Laporan gagal diekspor.',
            'error',
          );
        } finally {
          setButtonLoading(button, false);
        }
      });
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
