import { describe, expect, it } from 'vitest';
import {
  calculateAdMetrics,
  calculateDailySeries,
  calculateFinancialSummary,
  calculateStorePerformance,
  emptyFinancialSummary,
} from '@/core/calculations/financialCalculations';
import type { FinancialDataset } from '@/types/finance';
import type { Store } from '@/types/entities';

const dataset: FinancialDataset = {
  orders: [
    {
      id: 'order-a',
      storeId: 'store-a',
      orderDate: '2026-01-02',
      status: 'completed',
      sellerDiscount: 10_000,
      marketplaceDiscount: 5_000,
      items: [
        {
          productId: 'product-a',
          productName: 'Kaos',
          sku: 'KAOS-01',
          category: 'Atasan',
          quantity: 2,
          unitPrice: 100_000,
          hppSnapshot: 60_000,
        },
        {
          productId: 'product-b',
          productName: 'Topi',
          sku: 'TOPI-01',
          category: 'Aksesori',
          quantity: 1,
          unitPrice: 25_000,
          hppSnapshot: 10_000,
        },
      ],
    },
    {
      id: 'order-b',
      storeId: 'store-b',
      orderDate: '2026-01-03',
      status: 'shipped',
      sellerDiscount: 0,
      marketplaceDiscount: 0,
      items: [
        {
          productId: 'product-c',
          productName: 'Jaket',
          sku: 'JAKET-01',
          category: 'Outerwear',
          quantity: 1,
          unitPrice: 50_000,
          hppSnapshot: 30_000,
        },
      ],
    },
    {
      id: 'order-cancelled',
      storeId: 'store-a',
      orderDate: '2026-01-04',
      status: 'cancelled',
      sellerDiscount: 50_000,
      marketplaceDiscount: 0,
      items: [
        {
          productId: 'product-a',
          productName: 'Kaos',
          sku: 'KAOS-01',
          category: 'Atasan',
          quantity: 10,
          unitPrice: 100_000,
          hppSnapshot: 60_000,
        },
      ],
    },
  ],
  fees: [
    { storeId: 'store-a', feeDate: '2026-01-02', amount: 4_000, source: 'actual' },
    { storeId: 'store-a', feeDate: '2026-01-03', amount: 2_000, source: 'estimated' },
    { storeId: 'store-b', feeDate: '2026-01-03', amount: 1_000, source: 'actual' },
  ],
  refunds: [
    {
      storeId: 'store-a',
      orderId: 'order-a',
      refundDate: '2026-01-04',
      amount: 20_000,
      status: 'completed',
      orderStatus: 'completed',
    },
    {
      storeId: 'store-a',
      orderId: 'order-a',
      refundDate: '2026-01-04',
      amount: 5_000,
      status: 'pending',
      orderStatus: 'completed',
    },
    {
      storeId: 'store-a',
      orderId: 'order-cancelled',
      refundDate: '2026-01-04',
      amount: 99_000,
      status: 'completed',
      orderStatus: 'cancelled',
    },
  ],
  advertisingExpenses: [
    { storeId: 'store-a', expenseDate: '2026-01-02', amount: 3_000 },
    { storeId: null, expenseDate: '2026-01-01', amount: 1_000 },
  ],
  operationalExpenses: [
    { storeId: 'store-a', expenseDate: '2026-01-02', amount: 2_000 },
    { storeId: 'store-b', expenseDate: '2026-01-03', amount: 1_500 },
    { storeId: null, expenseDate: '2026-01-01', amount: 500 },
  ],
};

describe('calculateFinancialSummary', () => {
  it('uses seller discount and refunds once, ignoring marketplace discount', () => {
    const summary = calculateFinancialSummary(dataset, { storeId: 'store-a' });
    expect(summary.grossSales).toBe(225_000);
    expect(summary.sellerDiscount).toBe(10_000);
    expect(summary.marketplaceDiscount).toBe(5_000);
    expect(summary.refunds).toBe(20_000);
    expect(summary.netSales).toBe(195_000);
    expect(summary.cogs).toBe(130_000);
    expect(summary.grossProfit).toBe(65_000);
    expect(summary.orderCount).toBe(1);
    expect(summary.unitsSold).toBe(3);
  });

  it('excludes non-revenue orders and pending refunds', () => {
    const summary = calculateFinancialSummary(dataset, { storeId: 'store-a' });
    expect(summary.refunds).toBe(20_000);
    expect(summary.orderCount).toBe(1);
  });

  it('separates actual and estimated marketplace fees', () => {
    const summary = calculateFinancialSummary(dataset, { storeId: 'store-a' });
    expect(summary.marketplaceFeesActual).toBe(4_000);
    expect(summary.marketplaceFeesEstimated).toBe(2_000);
    expect(summary.marketplaceFees).toBe(6_000);
    expect(summary.hasEstimatedFees).toBe(true);
  });

  it('excludes shared costs from per-store profit but tracks them', () => {
    const summary = calculateFinancialSummary(dataset, { storeId: 'store-a' });
    expect(summary.advertisingSpend).toBe(3_000);
    expect(summary.sharedAdvertisingSpend).toBe(1_000);
    expect(summary.operationalExpenses).toBe(2_000);
    expect(summary.sharedOperationalExpenses).toBe(500);
    expect(summary.operatingProfit).toBe(195_000 - 130_000 - 6_000 - 3_000 - 2_000);
  });

  it('includes shared costs in all-store totals exactly once', () => {
    const summary = calculateFinancialSummary(dataset, { storeId: null });
    expect(summary.orderCount).toBe(2);
    expect(summary.grossSales).toBe(275_000);
    expect(summary.netSales).toBe(245_000);
    expect(summary.cogs).toBe(160_000);
    expect(summary.marketplaceFees).toBe(7_000);
    expect(summary.advertisingSpend).toBe(4_000);
    expect(summary.operationalExpenses).toBe(4_000);
    expect(summary.operatingProfit).toBe(245_000 - 160_000 - 7_000 - 4_000 - 4_000);
  });

  it('returns a null margin when net sales is not positive', () => {
    const summary = emptyFinancialSummary();
    expect(summary.marginPercent).toBeNull();
    expect(summary.operatingProfit).toBe(0);
  });
});

describe('calculateDailySeries', () => {
  it('places every transaction on its own date and keeps refunds on refund date', () => {
    const rows = calculateDailySeries(dataset, { storeId: 'store-a' }, '2026-01-01', '2026-01-05');
    expect(rows.map((row) => row.date)).toEqual([
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
      '2026-01-05',
    ]);

    const jan2 = rows.find((row) => row.date === '2026-01-02');
    expect(jan2?.grossSales).toBe(225_000);
    expect(jan2?.cogs).toBe(130_000);
    expect(jan2?.marketplaceFees).toBe(4_000);
    expect(jan2?.advertisingSpend).toBe(3_000);
    expect(jan2?.operationalExpenses).toBe(2_000);
    expect(jan2?.operatingProfit).toBe(215_000 - 130_000 - 4_000 - 3_000 - 2_000);

    const jan4 = rows.find((row) => row.date === '2026-01-04');
    expect(jan4?.refunds).toBe(20_000);
    expect(jan4?.netSales).toBe(-20_000);
    expect(jan4?.marginPercent).toBeNull();
  });

  it('does not create days outside the requested range for shared expenses', () => {
    const withOutOfRange: FinancialDataset = {
      ...dataset,
      advertisingExpenses: [
        ...dataset.advertisingExpenses,
        { storeId: null, expenseDate: '2025-12-31', amount: 7_000 },
      ],
      operationalExpenses: [
        ...dataset.operationalExpenses,
        { storeId: null, expenseDate: '2025-12-31', amount: 9_000 },
      ],
    };
    const rows = calculateDailySeries(withOutOfRange, { storeId: null }, '2026-01-01', '2026-01-03');
    expect(rows).toHaveLength(3);
    expect(rows[0]?.date).toBe('2026-01-01');
    expect(rows[2]?.date).toBe('2026-01-03');
    expect(rows.some((row) => row.date === '2025-12-31')).toBe(false);
    expect(rows[0]?.operationalExpenses).toBe(500);
    expect(rows[0]?.advertisingSpend).toBe(1_000);
  });

  it('keeps shared spend informational but out of store profit rows', () => {
    const rows = calculateDailySeries(dataset, { storeId: 'store-a' }, '2026-01-01', '2026-01-05');
    const jan1 = rows[0];
    expect(jan1?.sharedAdvertisingSpend).toBe(1_000);
    expect(jan1?.advertisingSpend).toBe(0);
    expect(jan1?.sharedOperationalExpenses).toBe(500);
    expect(jan1?.operationalExpenses).toBe(0);
    expect(jan1?.operatingProfit).toBe(0);
  });
});

describe('calculateStorePerformance', () => {
  it('computes per-store summaries without shared costs', () => {
    const stores: Store[] = [
      {
        id: 'store-a',
        name: 'Toko A',
        platform: 'shopee',
        email: null,
        phone: null,
        ktpName: null,
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'store-b',
        name: 'Toko B',
        platform: 'tiktok',
        email: null,
        phone: null,
        ktpName: null,
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const performance = calculateStorePerformance(dataset, stores);
    expect(performance.map((row) => row.storeId)).toEqual(['store-a', 'store-b']);
    expect(performance[0]?.summary.advertisingSpend).toBe(3_000);
    expect(performance[1]?.summary.sharedAdvertisingSpend).toBe(1_000);
    expect(performance[1]?.summary.operatingProfit).toBe(50_000 - 30_000 - 1_000 - 1_500);
  });
});

describe('calculateAdMetrics', () => {
  it('returns N/A when there is no attribution data', () => {
    expect(calculateAdMetrics(10_000, null, 0)).toEqual({ roas: null, acos: null });
    expect(calculateAdMetrics(10_000, 0, 0)).toEqual({ roas: null, acos: null });
  });

  it('computes ROAS and ACOS from attributed revenue', () => {
    expect(calculateAdMetrics(10_000, 50_000, 2)).toEqual({ roas: 5, acos: 20 });
  });

  it('never invents ROAS when spend is zero', () => {
    expect(calculateAdMetrics(0, 10_000, 1)).toEqual({ roas: null, acos: 0 });
    expect(calculateAdMetrics(0, 0, 1)).toEqual({ roas: null, acos: null });
  });
});
