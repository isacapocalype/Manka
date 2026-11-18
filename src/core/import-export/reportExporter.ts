import type { ReportData } from '@/core/services/reportService';
import { formatBusinessDate, formatDateTime } from '@/core/utils/date';
import { formatPercent, formatRupiah } from '@/core/utils/money';
import { saveFile } from './fileSaver';
import { toCsv } from './csv';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

const PRODUCT_HEADERS = [
  'Produk',
  'SKU',
  'Kategori',
  'Unit',
  'Pesanan',
  'Omzet (Rp)',
  'Diskon (Rp)',
  'Refund (Rp)',
  'Bersih (Rp)',
  'HPP (Rp)',
  'Laba kotor (Rp)',
  'Fee MP (Rp)',
  'Laba bersih (Rp)',
  'Margin (%)',
  'Tanpa HPP',
];

function productRowValues(
  row: ReportData['products']['rows'][number],
): (string | number)[] {
  return [
    row.productName,
    row.sku,
    row.category ?? '',
    row.unitsSold,
    row.orderCount,
    row.grossSales,
    row.sellerDiscount,
    row.refunds,
    row.netSales,
    row.cogs,
    row.grossProfit,
    row.marketplaceFees,
    row.netProfit,
    row.marginPercent === null ? '' : Number(row.marginPercent.toFixed(2)),
    row.hasMissingHpp ? 'Ya' : 'Tidak',
  ];
}

const DAILY_HEADERS = [
  'Tanggal',
  'Pesanan',
  'Omzet (Rp)',
  'Diskon penjual (Rp)',
  'Refund (Rp)',
  'Penjualan bersih (Rp)',
  'HPP (Rp)',
  'Laba kotor (Rp)',
  'Biaya marketplace (Rp)',
  'Biaya iklan (Rp)',
  'Biaya operasional (Rp)',
  'Laba operasional (Rp)',
  'Margin (%)',
];

function dailyRowValues(row: ReportData['daily'][number]): (string | number)[] {
  return [
    row.date,
    row.orderCount,
    row.grossSales,
    row.sellerDiscount,
    row.refunds,
    row.netSales,
    row.cogs,
    row.grossProfit,
    row.marketplaceFees,
    row.advertisingSpend,
    row.operationalExpenses,
    row.operatingProfit,
    row.marginPercent === null ? '' : Number(row.marginPercent.toFixed(2)),
  ];
}

function summaryRows(report: ReportData): [string, string | number][] {
  const s = report.summary;
  return [
    ['Periode', `${report.range.from} s/d ${report.range.to}`],
    ['Toko', report.storeId ? (report.stores[0]?.name ?? '-') : 'Semua toko'],
    ['Jumlah pesanan', s.orderCount],
    ['Unit terjual', s.unitsSold],
    ['Omzet', s.grossSales],
    ['Diskon penjual', s.sellerDiscount],
    ['Diskon marketplace (informasi)', s.marketplaceDiscount],
    ['Refund', s.refunds],
    ['Penjualan bersih', s.netSales],
    ['HPP', s.cogs],
    ['Laba kotor', s.grossProfit],
    ['Biaya marketplace aktual', s.marketplaceFeesActual],
    ['Biaya marketplace estimasi', s.marketplaceFeesEstimated],
    ['Biaya iklan', s.advertisingSpend],
    ['Biaya operasional', s.operationalExpenses],
    ['Laba operasional', s.operatingProfit],
    ['Margin operasional', s.marginPercent === null ? '-' : formatPercent(s.marginPercent)],
    ['Laba bersih produk', report.products.totals.netProfit],
    ['Produk tanpa HPP', report.products.withoutHpp.length],
  ];
}

function fileBase(report: ReportData): string {
  const storeName = report.storeId ? report.stores[0]?.name : 'semua-toko';
  return `manka-laporan-${storeName ?? 'semua-toko'}-${report.range.from}-${report.range.to}`;
}

function exportCsv(report: ReportData): { fileName: string; data: string } {
  const rows: string[][] = [];
  rows.push(['Ringkasan', 'Nilai']);
  for (const [label, value] of summaryRows(report)) {
    rows.push([label, String(value)]);
  }
  rows.push([]);
  rows.push(['Harian']);
  rows.push(DAILY_HEADERS);
  for (const day of report.daily) {
    rows.push(dailyRowValues(day).map((value) => String(value)));
  }
  if (!report.storeId) {
    rows.push([]);
    rows.push(['Per Toko']);
    rows.push(['Toko', 'Platform', 'Pesanan', 'Omzet (Rp)', 'Penjualan bersih (Rp)', 'Laba operasional (Rp)']);
    for (const store of report.storePerformance) {
      rows.push([
        store.storeName,
        store.platform,
        String(store.summary.orderCount),
        String(store.summary.grossSales),
        String(store.summary.netSales),
        String(store.summary.operatingProfit),
      ]);
    }
  }
  rows.push([]);
  rows.push(['Per Produk']);
  rows.push(PRODUCT_HEADERS);
  for (const product of report.products.rows) {
    rows.push(productRowValues(product).map((value) => String(value)));
  }
  return { fileName: `${fileBase(report)}.csv`, data: toCsv(rows[0] ?? [], rows.slice(1)) };
}

async function exportXlsx(report: ReportData): Promise<{ fileName: string; data: Uint8Array }> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Manka';
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet('Ringkasan');
  summarySheet.columns = [
    { header: 'Metrik', key: 'label', width: 34 },
    { header: 'Nilai', key: 'value', width: 24 },
  ];
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  for (const [label, value] of summaryRows(report)) {
    const row = summarySheet.addRow({ label, value });
    if (typeof value === 'number' && !label.includes('Margin') && !label.includes('Jumlah') && !label.includes('Unit')) {
      row.getCell('value').numFmt = '#,##0';
    }
    if (label === 'Laba operasional' || label === 'Penjualan bersih' || label === 'Omzet') {
      row.font = { bold: true };
    }
  }
  summarySheet.addRow([]);
  summarySheet.addRow(['Dibuat', formatDateTime(new Date().toISOString())]);

  const dailySheet = workbook.addWorksheet('Harian');
  dailySheet.columns = DAILY_HEADERS.map((header) => ({
    header,
    key: header,
    width: header.includes('Tanggal') ? 14 : 20,
  }));
  dailySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dailySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  for (const day of report.daily) {
    const row = dailySheet.addRow(dailyRowValues(day));
    for (let index = 2; index <= 12; index += 1) {
      row.getCell(index).numFmt = '#,##0';
    }
    row.getCell(13).numFmt = '0.00';
  }
  dailySheet.getColumn(1).numFmt = 'yyyy-mm-dd';
  dailySheet.views = [{ state: 'frozen', ySplit: 1 }];

  if (!report.storeId) {
    const storeSheet = workbook.addWorksheet('Per Toko');
    storeSheet.columns = [
      { header: 'Toko', key: 'name', width: 30 },
      { header: 'Platform', key: 'platform', width: 14 },
      { header: 'Pesanan', key: 'orders', width: 12 },
      { header: 'Omzet', key: 'gross', width: 18 },
      { header: 'Penjualan Bersih', key: 'net', width: 18 },
      { header: 'Laba Operasional', key: 'profit', width: 20 },
    ];
    storeSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    storeSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    for (const store of report.storePerformance) {
      const row = storeSheet.addRow({
        name: store.storeName,
        platform: store.platform,
        orders: store.summary.orderCount,
        gross: store.summary.grossSales,
        net: store.summary.netSales,
        profit: store.summary.operatingProfit,
      });
      row.getCell(4).numFmt = '#,##0';
      row.getCell(5).numFmt = '#,##0';
      row.getCell(6).numFmt = '#,##0';
    }
  }

  const productSheet = workbook.addWorksheet('Per Produk');
  productSheet.columns = PRODUCT_HEADERS.map((header) => ({
    header,
    key: header,
    width: header === 'Produk' ? 28 : header === 'SKU' ? 16 : header === 'Kategori' ? 18 : 14,
  }));
  productSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  productSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  for (const product of report.products.rows) {
    const row = productSheet.addRow(productRowValues(product));
    for (let index = 6; index <= 13; index += 1) {
      row.getCell(index).numFmt = '#,##0';
    }
    row.getCell(14).numFmt = '0.00';
  }
  productSheet.views = [{ state: 'frozen', ySplit: 1 }];
  if (report.products.rows.length > 0) {
    productSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: report.products.rows.length + 1, column: PRODUCT_HEADERS.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return {
    fileName: `${fileBase(report)}.xlsx`,
    data: new Uint8Array(buffer as ArrayBuffer),
  };
}

async function exportPdf(report: ReportData): Promise<{ fileName: string; data: Uint8Array }> {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const storeName = report.storeId ? (report.stores[0]?.name ?? '-') : 'Semua toko';

  doc.setFontSize(16);
  doc.setTextColor('#172033');
  doc.text('Laporan Keuangan Manka', 14, 16);
  doc.setFontSize(10);
  doc.setTextColor('#667085');
  doc.text(`Periode: ${formatBusinessDate(report.range.from, 'long')} - ${formatBusinessDate(report.range.to, 'long')}`, 14, 23);
  doc.text(`Toko: ${storeName}`, 14, 28);
  doc.text(`Dibuat: ${formatDateTime(new Date().toISOString())}`, 14, 33);

  const s = report.summary;
  autoTable(doc, {
    startY: 39,
    head: [['Metrik', 'Nilai']],
    body: [
      ['Omzet', formatRupiah(s.grossSales)],
      ['Diskon penjual', formatRupiah(s.sellerDiscount)],
      ['Refund', formatRupiah(s.refunds)],
      ['Penjualan bersih', formatRupiah(s.netSales)],
      ['HPP', formatRupiah(s.cogs)],
      ['Laba kotor', formatRupiah(s.grossProfit)],
      ['Biaya marketplace', formatRupiah(s.marketplaceFees)],
      ['Biaya iklan', formatRupiah(s.advertisingSpend)],
      ['Biaya operasional', formatRupiah(s.operationalExpenses)],
      ['Laba operasional', formatRupiah(s.operatingProfit)],
      ['Margin operasional', s.marginPercent === null ? 'N/A' : formatPercent(s.marginPercent)],
      ['Laba bersih produk', formatRupiah(report.products.totals.netProfit)],
      ['Produk tanpa HPP', String(report.products.withoutHpp.length)],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  const afterSummary = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
  autoTable(doc, {
    startY: afterSummary + 6,
    head: [[
      'Tanggal',
      'Pesanan',
      'Omzet',
      'Refund',
      'Bersih',
      'HPP',
      'Fee MP',
      'Iklan',
      'Operasional',
      'Laba',
    ]],
    body: report.daily.map((day) => [
      formatBusinessDate(day.date),
      String(day.orderCount),
      formatRupiah(day.grossSales),
      formatRupiah(day.refunds),
      formatRupiah(day.netSales),
      formatRupiah(day.cogs),
      formatRupiah(day.marketplaceFees),
      formatRupiah(day.advertisingSpend),
      formatRupiah(day.operationalExpenses),
      formatRupiah(day.operatingProfit),
    ]),
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor('#667085');
      doc.text(
        `Manka - data lokal - halaman ${pageCount}`,
        doc.internal.pageSize.getWidth() - 14,
        doc.internal.pageSize.getHeight() - 7,
        { align: 'right' },
      );
      if (s.hasEstimatedFees) {
        doc.text(
          'Sebagian biaya marketplace adalah estimasi.',
          14,
          doc.internal.pageSize.getHeight() - 7,
        );
      }
    },
  });

  const afterDaily =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
  autoTable(doc, {
    startY: afterDaily + 6,
    head: [[
      'Produk',
      'SKU',
      'Kategori',
      'Unit',
      'Omzet',
      'HPP',
      'Fee MP',
      'Laba bersih',
      'Margin',
    ]],
    body: report.products.rows.map((product) => [
      product.productName,
      product.sku,
      product.category ?? '-',
      String(product.unitsSold),
      formatRupiah(product.grossSales),
      formatRupiah(product.cogs),
      formatRupiah(product.marketplaceFees),
      formatRupiah(product.netProfit),
      product.marginPercent === null ? 'N/A' : formatPercent(product.marginPercent),
    ]),
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  const buffer = doc.output('arraybuffer');
  return {
    fileName: `${fileBase(report)}.pdf`,
    data: new Uint8Array(buffer),
  };
}

export async function exportReport(
  report: ReportData,
  format: ExportFormat,
): Promise<{ fileName: string; method: 'download' | 'share' }> {
  if (format === 'csv') {
    const { fileName, data } = exportCsv(report);
    return saveFile(fileName, 'text/csv;charset=utf-8', data);
  }
  if (format === 'xlsx') {
    const { fileName, data } = await exportXlsx(report);
    return saveFile(
      fileName,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      data,
    );
  }
  const { fileName, data } = await exportPdf(report);
  return saveFile(fileName, 'application/pdf', data);
}
