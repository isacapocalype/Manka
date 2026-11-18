import type {
  DailyFinancialRow,
  FinancialComparison,
  FinancialDataset,
  FinancialFilter,
  FinancialSummary,
  ProductProfitDataset,
  ProductProfitReport,
  ProductProfitRow,
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

interface ProductProfitAccumulator {
  key: string;
  productId: string | null;
  productName: string;
  sku: string;
  category: string | null;
  unitsSold: number;
  orderIds: Set<string>;
  grossSales: number;
  sellerDiscount: number;
  refunds: number;
  cogs: number;
  marketplaceFeesActual: number;
  marketplaceFeesEstimated: number;
  hasMissingHpp: boolean;
}

function allocateProportionally(total: number, weights: readonly number[]): number[] {
  if (weights.length === 0 || total === 0) {
    return weights.map(() => 0);
  }
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const effectiveWeights = weightSum > 0 ? weights : weights.map(() => 1);
  const effectiveSum = weightSum > 0 ? weightSum : weights.length;
  let allocated = 0;
  return effectiveWeights.map((weight, index) => {
    if (index === effectiveWeights.length - 1) {
      return total - allocated;
    }
    const share = Math.round((total * weight) / effectiveSum);
    allocated += share;
    return share;
  });
}

function productKey(item: { productId: string | null; sku: string; productName: string }): string {
  if (item.productId) return `product:${item.productId}`;
  return `sku:${item.sku || item.productName}`;
}

/**
 * Laba per produk memakai item pesanan pada periode tanggal pesanan.
 * Diskon penjual, refund, dan fee marketplace level pesanan dialokasikan
 * proporsional terhadap omzet item. Fee tanpa pesanan tidak dialokasikan.
 */
export function calculateProductProfit(
  dataset: ProductProfitDataset,
  filter: FinancialFilter,
): ProductProfitReport {
  const products = new Map<string, ProductProfitAccumulator>();
  const orderIds = new Set<string>();

  for (const order of dataset.orders) {
    if (!isRevenueOrderStatus(order.status)) continue;
    if (!storeMatches(order.storeId, filter)) continue;
    const items = order.items.filter((item) => item.quantity > 0);
    if (items.length === 0) continue;

    orderIds.add(order.id);
    const weights = items.map((item) => item.quantity * item.unitPrice);
    const discountShares = allocateProportionally(order.sellerDiscount, weights);

    const refundTotal = dataset.refunds
      .filter(
        (refund) =>
          refund.orderId === order.id &&
          refund.status === 'completed' &&
          isRevenueOrderStatus(refund.orderStatus) &&
          storeMatches(refund.storeId, filter),
      )
      .reduce((total, refund) => total + refund.amount, 0);
    const refundShares = allocateProportionally(refundTotal, weights);

    const orderFees = dataset.fees.filter(
      (fee) => fee.orderId === order.id && storeMatches(fee.storeId, filter),
    );
    const feeActual = orderFees
      .filter((fee) => fee.source === 'actual')
      .reduce((total, fee) => total + fee.amount, 0);
    const feeEstimated = orderFees
      .filter((fee) => fee.source === 'estimated')
      .reduce((total, fee) => total + fee.amount, 0);
    const feeActualShares = allocateProportionally(feeActual, weights);
    const feeEstimatedShares = allocateProportionally(feeEstimated, weights);

    items.forEach((item, index) => {
      const key = productKey(item);
      let product = products.get(key);
      if (!product) {
        product = {
          key,
          productId: item.productId,
          productName: item.productName || item.sku || 'Tanpa nama',
          sku: item.sku,
          category: item.category,
          unitsSold: 0,
          orderIds: new Set<string>(),
          grossSales: 0,
          sellerDiscount: 0,
          refunds: 0,
          cogs: 0,
          marketplaceFeesActual: 0,
          marketplaceFeesEstimated: 0,
          hasMissingHpp: false,
        };
        products.set(key, product);
      }
      product.productName = item.productName || product.productName;
      product.sku = item.sku || product.sku;
      product.category = item.category ?? product.category;
      product.unitsSold += item.quantity;
      product.orderIds.add(order.id);
      product.grossSales += item.quantity * item.unitPrice;
      product.sellerDiscount += discountShares[index] ?? 0;
      product.refunds += refundShares[index] ?? 0;
      product.cogs += item.quantity * item.hppSnapshot;
      product.marketplaceFeesActual += feeActualShares[index] ?? 0;
      product.marketplaceFeesEstimated += feeEstimatedShares[index] ?? 0;
      if (item.hppSnapshot === 0) product.hasMissingHpp = true;
    });
  }

  const rows: ProductProfitRow[] = [...products.values()]
    .map((product) => {
      const netSales = product.grossSales - product.sellerDiscount - product.refunds;
      const grossProfit = netSales - product.cogs;
      const marketplaceFees =
        product.marketplaceFeesActual + product.marketplaceFeesEstimated;
      const netProfit = grossProfit - marketplaceFees;
      return {
        key: product.key,
        productId: product.productId,
        productName: product.productName,
        sku: product.sku,
        category: product.category,
        unitsSold: product.unitsSold,
        orderCount: product.orderIds.size,
        grossSales: product.grossSales,
        sellerDiscount: product.sellerDiscount,
        refunds: product.refunds,
        netSales,
        cogs: product.cogs,
        grossProfit,
        marketplaceFeesActual: product.marketplaceFeesActual,
        marketplaceFeesEstimated: product.marketplaceFeesEstimated,
        marketplaceFees,
        netProfit,
        marginPercent: netSales > 0 ? (netProfit / netSales) * 100 : null,
        hasMissingHpp: product.hasMissingHpp,
      };
    })
    .sort(
      (left, right) =>
        right.netProfit - left.netProfit || left.productName.localeCompare(right.productName),
    );

  const totals = rows.reduce(
    (acc, row) => {
      acc.unitsSold += row.unitsSold;
      acc.grossSales += row.grossSales;
      acc.sellerDiscount += row.sellerDiscount;
      acc.refunds += row.refunds;
      acc.netSales += row.netSales;
      acc.cogs += row.cogs;
      acc.grossProfit += row.grossProfit;
      acc.marketplaceFees += row.marketplaceFees;
      acc.netProfit += row.netProfit;
      return acc;
    },
    {
      orderCount: orderIds.size,
      unitsSold: 0,
      grossSales: 0,
      sellerDiscount: 0,
      refunds: 0,
      netSales: 0,
      cogs: 0,
      grossProfit: 0,
      marketplaceFees: 0,
      netProfit: 0,
      marginPercent: null as number | null,
    },
  );
  totals.marginPercent = totals.netSales > 0 ? (totals.netProfit / totals.netSales) * 100 : null;

  return {
    rows,
    topProfit: rows.filter((row) => row.netProfit > 0).slice(0, 5),
    lossMaking: rows
      .filter((row) => row.netProfit < 0)
      .sort((left, right) => left.netProfit - right.netProfit),
    withoutHpp: rows
      .filter((row) => row.hasMissingHpp)
      .sort((left, right) => right.grossSales - left.grossSales),
    totals,
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
