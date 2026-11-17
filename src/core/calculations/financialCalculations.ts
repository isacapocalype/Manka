import type {
  DailyFinancialRow,
  FinancialComparison,
  FinancialDataset,
  FinancialFilter,
  FinancialSummary,
  StorePerformance,
} from '@/types/finance';
import type { BusinessDate, Store } from '@/types/entities';
import { isRevenueOrderStatus } from './orderMath';
import { eachDate } from '@/core/utils/date';
import { percentChange } from '@/core/utils/money';

interface SummaryAccumulator {
  grossSales: number;
  sellerDiscount: number;
  marketplaceDiscount: number;
  refunds: number;
  cogs: number;
  marketplaceFeesActual: number;
  marketplaceFeesEstimated: number;
  advertisingSpend: number;
  operationalExpenses: number;
  sharedOperationalExpenses: number;
  sharedAdvertisingSpend: number;
  orderCount: number;
  unitsSold: number;
}

function emptyAccumulator(): SummaryAccumulator {
  return {
    grossSales: 0,
    sellerDiscount: 0,
    marketplaceDiscount: 0,
    refunds: 0,
    cogs: 0,
    marketplaceFeesActual: 0,
    marketplaceFeesEstimated: 0,
    advertisingSpend: 0,
    operationalExpenses: 0,
    sharedOperationalExpenses: 0,
    sharedAdvertisingSpend: 0,
    orderCount: 0,
    unitsSold: 0,
  };
}

export function emptyFinancialSummary(): FinancialSummary {
  return finalize(emptyAccumulator());
}

function finalize(acc: SummaryAccumulator): FinancialSummary {
  const marketplaceFees = acc.marketplaceFeesActual + acc.marketplaceFeesEstimated;
  const netSales = acc.grossSales - acc.sellerDiscount - acc.refunds;
  const grossProfit = netSales - acc.cogs;
  const operatingProfit =
    netSales - acc.cogs - marketplaceFees - acc.advertisingSpend - acc.operationalExpenses;
  return {
    grossSales: acc.grossSales,
    sellerDiscount: acc.sellerDiscount,
    marketplaceDiscount: acc.marketplaceDiscount,
    refunds: acc.refunds,
    netSales,
    cogs: acc.cogs,
    grossProfit,
    marketplaceFeesActual: acc.marketplaceFeesActual,
    marketplaceFeesEstimated: acc.marketplaceFeesEstimated,
    marketplaceFees,
    advertisingSpend: acc.advertisingSpend,
    operationalExpenses: acc.operationalExpenses,
    sharedOperationalExpenses: acc.sharedOperationalExpenses,
    sharedAdvertisingSpend: acc.sharedAdvertisingSpend,
    operatingProfit,
    orderCount: acc.orderCount,
    unitsSold: acc.unitsSold,
    averageOrderValue: acc.orderCount > 0 ? Math.round(netSales / acc.orderCount) : 0,
    marginPercent: netSales > 0 ? (operatingProfit / netSales) * 100 : null,
    hasEstimatedFees: acc.marketplaceFeesEstimated > 0,
  };
}

function storeMatches(itemStoreId: string | null, filter: FinancialFilter): boolean {
  if (filter.storeId === null) return true;
  return itemStoreId === filter.storeId;
}

function applyOrder(acc: SummaryAccumulator, dataset: FinancialDataset, storeFilter: FinancialFilter): void {
  for (const order of dataset.orders) {
    if (!isRevenueOrderStatus(order.status)) continue;
    if (!storeMatches(order.storeId, storeFilter)) continue;
    acc.orderCount += 1;
    acc.sellerDiscount += order.sellerDiscount;
    acc.marketplaceDiscount += order.marketplaceDiscount;
    for (const item of order.items) {
      acc.grossSales += item.quantity * item.unitPrice;
      acc.cogs += item.quantity * item.hppSnapshot;
      acc.unitsSold += item.quantity;
    }
  }
}

function applyFees(acc: SummaryAccumulator, dataset: FinancialDataset, storeFilter: FinancialFilter): void {
  for (const fee of dataset.fees) {
    if (!storeMatches(fee.storeId, storeFilter)) continue;
    if (fee.source === 'estimated') {
      acc.marketplaceFeesEstimated += fee.amount;
    } else {
      acc.marketplaceFeesActual += fee.amount;
    }
  }
}

function applyRefunds(
  acc: SummaryAccumulator,
  dataset: FinancialDataset,
  storeFilter: FinancialFilter,
): void {
  for (const refund of dataset.refunds) {
    if (refund.status !== 'completed') continue;
    if (!isRevenueOrderStatus(refund.orderStatus)) continue;
    if (!storeMatches(refund.storeId, storeFilter)) continue;
    acc.refunds += refund.amount;
  }
}

function applyAdvertising(
  acc: SummaryAccumulator,
  dataset: FinancialDataset,
  storeFilter: FinancialFilter,
): void {
  for (const expense of dataset.advertisingExpenses) {
    if (expense.storeId === null) {
      acc.sharedAdvertisingSpend += expense.amount;
      if (storeFilter.storeId !== null) continue;
    }
    if (!storeMatches(expense.storeId, storeFilter)) continue;
    acc.advertisingSpend += expense.amount;
  }
}

function applyOperational(
  acc: SummaryAccumulator,
  dataset: FinancialDataset,
  storeFilter: FinancialFilter,
): void {
  for (const expense of dataset.operationalExpenses) {
    if (expense.storeId === null) {
      acc.sharedOperationalExpenses += expense.amount;
      if (storeFilter.storeId !== null) continue;
    }
    if (!storeMatches(expense.storeId, storeFilter)) continue;
    acc.operationalExpenses += expense.amount;
  }
}

export function calculateFinancialSummary(
  dataset: FinancialDataset,
  filter: FinancialFilter,
): FinancialSummary {
  const acc = emptyAccumulator();
  applyOrder(acc, dataset, filter);
  applyFees(acc, dataset, filter);
  applyRefunds(acc, dataset, filter);
  applyAdvertising(acc, dataset, filter);
  applyOperational(acc, dataset, filter);
  return finalize(acc);
}

/**
 * Seri harian memakai tanggal transaksi masing-masing:
 * - penjualan/HPP pada tanggal pesanan,
 * - refund pada tanggal refund,
 * - biaya pada tanggal biaya.
 */
export function calculateDailySeries(
  dataset: FinancialDataset,
  filter: FinancialFilter,
  from: BusinessDate,
  to: BusinessDate,
): DailyFinancialRow[] {
  const accumulators = new Map<BusinessDate, SummaryAccumulator>();
  for (const date of eachDate(from, to)) {
    accumulators.set(date, emptyAccumulator());
  }

  for (const order of dataset.orders) {
    if (!isRevenueOrderStatus(order.status)) continue;
    if (!storeMatches(order.storeId, filter)) continue;
    const acc = accumulators.get(order.orderDate);
    if (!acc) continue;
    acc.orderCount += 1;
    acc.sellerDiscount += order.sellerDiscount;
    acc.marketplaceDiscount += order.marketplaceDiscount;
    for (const item of order.items) {
      acc.grossSales += item.quantity * item.unitPrice;
      acc.cogs += item.quantity * item.hppSnapshot;
      acc.unitsSold += item.quantity;
    }
  }

  for (const fee of dataset.fees) {
    if (!storeMatches(fee.storeId, filter)) continue;
    const acc = accumulators.get(fee.feeDate);
    if (!acc) continue;
    if (fee.source === 'estimated') acc.marketplaceFeesEstimated += fee.amount;
    else acc.marketplaceFeesActual += fee.amount;
  }

  for (const refund of dataset.refunds) {
    if (refund.status !== 'completed' || !isRevenueOrderStatus(refund.orderStatus)) continue;
    if (!storeMatches(refund.storeId, filter)) continue;
    const acc = accumulators.get(refund.refundDate);
    if (!acc) continue;
    acc.refunds += refund.amount;
  }

  for (const expense of dataset.advertisingExpenses) {
    const acc = accumulators.get(expense.expenseDate);
    if (!acc) continue;
    if (expense.storeId === null) {
      acc.sharedAdvertisingSpend += expense.amount;
      if (filter.storeId !== null) continue;
    }
    if (!storeMatches(expense.storeId, filter)) continue;
    acc.advertisingSpend += expense.amount;
  }

  for (const expense of dataset.operationalExpenses) {
    const acc = accumulators.get(expense.expenseDate);
    if (!acc) continue;
    if (expense.storeId === null) {
      acc.sharedOperationalExpenses += expense.amount;
      if (filter.storeId !== null) continue;
    }
    if (!storeMatches(expense.storeId, filter)) continue;
    acc.operationalExpenses += expense.amount;
  }

  return [...accumulators.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, acc]) => ({ date, ...finalize(acc) }));
}

export function calculateStorePerformance(
  dataset: FinancialDataset,
  stores: Store[],
): StorePerformance[] {
  return stores
    .map((store) => ({
      storeId: store.id,
      storeName: store.name,
      platform: store.platform,
      summary: calculateFinancialSummary(dataset, { storeId: store.id }),
    }))
    .sort((left, right) => right.summary.netSales - left.summary.netSales);
}

export function buildComparison(
  current: FinancialSummary,
  previous: FinancialSummary,
): FinancialComparison {
  return {
    current,
    previous,
    grossSalesChangePercent: percentChange(current.grossSales, previous.grossSales),
    netSalesChangePercent: percentChange(current.netSales, previous.netSales),
    operatingProfitChangePercent: percentChange(
      current.operatingProfit,
      previous.operatingProfit,
    ),
  };
}

export interface AdMetrics {
  roas: number | null;
  acos: number | null;
}

export function calculateAdMetrics(
  spend: number,
  attributedRevenue: number | null,
  attributionRows: number,
): AdMetrics {
  if (attributionRows <= 0 || attributedRevenue === null) {
    return { roas: null, acos: null };
  }
  if (spend <= 0) {
    return { roas: null, acos: attributedRevenue > 0 ? 0 : null };
  }
  return {
    roas: attributedRevenue / spend,
    acos: attributedRevenue > 0 ? (spend / attributedRevenue) * 100 : null,
  };
}
