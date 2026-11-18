import { describe, expect, it } from 'vitest';
import { calculateProductProfit } from '@/core/calculations/financialCalculations';
import type { ProductProfitDataset } from '@/types/finance';
import { createTestContext } from './helpers/testContext';

const dataset: ProductProfitDataset = {
  orders: [
    {
      id: 'order-1',
      storeId: 'store-a',
      orderDate: '2026-03-02',
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
          hppSnapshot: 0,
        },
      ],
    },
    {
      id: 'order-loss',
      storeId: 'store-a',
      orderDate: '2026-03-03',
      status: 'completed',
      sellerDiscount: 0,
      marketplaceDiscount: 0,
      items: [
        {
          productId: 'product-c',
          productName: 'Syal',
          sku: 'SYAL-01',
          category: 'Aksesori',
          quantity: 1,
          unitPrice: 10_000,
          hppSnapshot: 15_000,
        },
      ],
    },
    {
      id: 'order-cancelled',
      storeId: 'store-a',
      orderDate: '2026-03-04',
      status: 'cancelled',
      sellerDiscount: 0,
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
    {
      id: 'order-other-store',
      storeId: 'store-b',
      orderDate: '2026-03-05',
      status: 'completed',
      sellerDiscount: 0,
      marketplaceDiscount: 0,
      items: [
        {
          productId: 'product-d',
          productName: 'Jaket',
          sku: 'JAKET-01',
          category: 'Outerwear',
          quantity: 1,
          unitPrice: 200_000,
          hppSnapshot: 150_000,
        },
      ],
    },
  ],
  fees: [
    {
      storeId: 'store-a',
      orderId: 'order-1',
      feeDate: '2026-03-02',
      amount: 4_000,
      source: 'actual',
    },
    {
      storeId: 'store-a',
      orderId: 'order-1',
      feeDate: '2026-03-02',
      amount: 2_000,
      source: 'estimated',
    },
    {
      storeId: 'store-a',
      orderId: null,
      feeDate: '2026-03-02',
      amount: 9_000,
      source: 'actual',
    },
  ],
  refunds: [
    {
      storeId: 'store-a',
      orderId: 'order-1',
      refundDate: '2026-03-10',
      amount: 20_000,
      status: 'completed',
      orderStatus: 'completed',
    },
    {
      storeId: 'store-a',
      orderId: 'order-1',
      refundDate: '2026-03-11',
      amount: 5_000,
      status: 'pending',
      orderStatus: 'completed',
    },
    {
      storeId: 'store-a',
      orderId: 'order-cancelled',
      refundDate: '2026-03-12',
      amount: 99_000,
      status: 'completed',
      orderStatus: 'cancelled',
    },
  ],
};

describe('calculateProductProfit', () => {
  it('allocates order-level discount, refund, and fees proportionally', () => {
    const report = calculateProductProfit(dataset, { storeId: 'store-a' });
    const kaos = report.rows.find((row) => row.sku === 'KAOS-01');
    const topi = report.rows.find((row) => row.sku === 'TOPI-01');

    expect(kaos?.grossSales).toBe(200_000);
    expect(kaos?.sellerDiscount).toBe(8_889);
    expect(kaos?.refunds).toBe(17_778);
    expect(kaos?.netSales).toBe(173_333);
    expect(kaos?.cogs).toBe(120_000);
    expect(kaos?.marketplaceFees).toBe(5_334);
    expect(kaos?.netProfit).toBe(47_999);

    expect(topi?.sellerDiscount).toBe(1_111);
    expect(topi?.refunds).toBe(2_222);
    expect(topi?.netProfit).toBe(21_001);

    expect(kaos!.sellerDiscount + topi!.sellerDiscount).toBe(10_000);
    expect(kaos!.refunds + topi!.refunds).toBe(20_000);
    expect(kaos!.marketplaceFees + topi!.marketplaceFees).toBe(6_000);
  });

  it('excludes non-revenue orders, pending refunds, and fees without an order', () => {
    const report = calculateProductProfit(dataset, { storeId: 'store-a' });

    expect(report.rows.map((row) => row.sku)).toEqual(['KAOS-01', 'TOPI-01', 'SYAL-01']);
    expect(report.rows.some((row) => row.sku === 'JAKET-01')).toBe(false);
    expect(report.totals.refunds).toBe(20_000);
    expect(report.totals.marketplaceFees).toBe(6_000);
    expect(report.totals.orderCount).toBe(2);
    expect(report.totals.unitsSold).toBe(4);
  });

  it('highlights profitable, loss-making, and missing-HPP products', () => {
    const report = calculateProductProfit(dataset, { storeId: 'store-a' });

    expect(report.topProfit.map((row) => row.sku)).toEqual(['KAOS-01', 'TOPI-01']);
    expect(report.lossMaking.map((row) => row.sku)).toEqual(['SYAL-01']);
    expect(report.withoutHpp.map((row) => row.sku)).toEqual(['TOPI-01']);
    expect(report.rows.find((row) => row.sku === 'SYAL-01')?.netProfit).toBe(-5_000);
  });

  it('keeps totals consistent with the sum of product rows', () => {
    const report = calculateProductProfit(dataset, { storeId: 'store-a' });
    const sum = report.rows.reduce((total, row) => total + row.netProfit, 0);

    expect(report.totals.netProfit).toBe(sum);
    expect(report.totals.netSales).toBe(205_000);
    expect(report.totals.cogs).toBe(135_000);
    expect(report.totals.netProfit).toBe(64_000);
  });
});

describe('product profit report from the database', () => {
  it('reads item snapshots, category, and order-level fees', async () => {
    const { services } = await createTestContext();
    const store = await services.storeService.create({ name: 'Toko', platform: 'shopee' });
    const product = await services.productService.create({
      name: 'Kaos',
      sku: 'KAOS-01',
      category: 'Atasan',
      price: 100_000,
      cost: 60_000,
      status: 'active',
    });
    const order = await services.orderService.create({
      storeId: store.id,
      marketplaceOrderId: 'MP-1',
      orderDate: '2026-03-02',
      status: 'completed',
      sellerDiscount: 5_000,
      marketplaceDiscount: 0,
      shippingPaid: 0,
      items: [
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: 2,
          unitPrice: 100_000,
        },
      ],
    });
    await services.feeService.create({
      storeId: store.id,
      orderId: order.id,
      feeType: 'admin',
      amount: 4_000,
      feeDate: '2026-03-02',
      source: 'actual',
    });

    const report = await services.reportService.getReport(
      { from: '2026-03-01', to: '2026-03-31' },
      store.id,
    );

    expect(report.products.rows).toHaveLength(1);
    expect(report.products.rows[0]).toMatchObject({
      productId: product.id,
      productName: 'Kaos',
      sku: 'KAOS-01',
      category: 'Atasan',
      unitsSold: 2,
      grossSales: 200_000,
      sellerDiscount: 5_000,
      netSales: 195_000,
      cogs: 120_000,
      marketplaceFees: 4_000,
      netProfit: 71_000,
      hasMissingHpp: false,
    });
    expect(report.summary.netSales).toBe(195_000);
    expect(report.products.totals.netProfit).toBe(71_000);
  });
});
