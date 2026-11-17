import type { FinancialSummary } from '@/types/finance';
import { formatPercent, formatRupiah } from '@/core/utils/money';
import { icon } from '@/components/ui/icons';
import { escapeHtml } from '@/components/ui/dom';

function row(label: string, value: string, options: { strong?: boolean; negative?: boolean; hint?: string; tone?: 'positive' | 'negative' } = {}): string {
  return `
    <div class="finance-row ${options.strong ? 'finance-row-strong' : ''}">
      <dt>
        ${escapeHtml(label)}
        ${options.hint ? `<small>${escapeHtml(options.hint)}</small>` : ''}
      </dt>
      <dd class="${options.negative ? 'value-negative' : ''} ${options.tone === 'positive' ? 'value-positive' : ''} ${options.tone === 'negative' ? 'value-negative' : ''}">${escapeHtml(value)}</dd>
    </div>
  `;
}

export function financeBreakdown(summary: FinancialSummary, storeId: string | null): string {
  const sharedNote =
    storeId === null && (summary.sharedAdvertisingSpend > 0 || summary.sharedOperationalExpenses > 0)
      ? 'Termasuk biaya bersama'
      : storeId !== null
        ? 'Biaya bersama tidak dialokasikan ke toko'
        : undefined;
  return `
    <dl class="finance-breakdown">
      ${row('Omzet', formatRupiah(summary.grossSales), { strong: true })}
      ${row('Diskon penjual', formatRupiah(-summary.sellerDiscount), { negative: true })}
      ${row('Refund selesai', formatRupiah(-summary.refunds), { negative: true })}
      ${row('Penjualan bersih', formatRupiah(summary.netSales), { strong: true })}
      ${row('HPP terjual', formatRupiah(-summary.cogs), { negative: true })}
      ${row('Laba kotor', formatRupiah(summary.grossProfit), { strong: true, tone: summary.grossProfit >= 0 ? 'positive' : 'negative' })}
      ${row('Biaya marketplace aktual', formatRupiah(-summary.marketplaceFeesActual), { negative: true })}
      ${summary.marketplaceFeesEstimated > 0 ? row('Biaya marketplace estimasi', formatRupiah(-summary.marketplaceFeesEstimated), { negative: true, hint: 'Estimasi, bukan biaya aktual' }) : ''}
      ${row('Biaya iklan', formatRupiah(-summary.advertisingSpend), { negative: true, hint: sharedNote })}
      ${row('Biaya operasional', formatRupiah(-summary.operationalExpenses), { negative: true, hint: sharedNote })}
      ${row('Laba operasional', formatRupiah(summary.operatingProfit), { strong: true, tone: summary.operatingProfit >= 0 ? 'positive' : 'negative' })}
      ${row('Margin operasional', summary.marginPercent === null ? 'N/A' : formatPercent(summary.marginPercent))}
    </dl>
    ${
      summary.hasEstimatedFees
        ? `<p class="inline-note note-warning">${icon('triangle-alert')} Sebagian biaya marketplace masih berupa estimasi dan diberi label.</p>`
        : ''
    }
  `;
}

export function financeNote(storeId: string | null): string {
  if (storeId) {
    return 'Biaya bersama tanpa toko tidak dimasukkan ke ringkasan per toko. Settlement tidak dihitung sebagai pendapatan baru.';
  }
  return 'Semua toko digabung. Settlement adalah arus kas pencairan dan tidak menambah omzet.';
}
