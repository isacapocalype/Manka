import { describe, expect, it } from 'vitest';
import { createTestContext } from './helpers/testContext';
import { LAST_BACKUP_AT_KEY } from '@/core/services/backupService';
import { addDays, todayJakarta } from '@/core/utils/date';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('data health checks', () => {
  it('detects orders without fees, products without HPP, stale settlements, and missing backups', async () => {
    const { services } = await createTestContext();
    const store = await services.storeService.create({ name: 'Toko', platform: 'shopee' });
    await services.productService.create({
      name: 'Tanpa HPP',
      sku: 'NO-HPP',
      price: 100_000,
      cost: 0,
      status: 'active',
    });
    const product = await services.productService.create({
      name: 'Kaos',
      sku: 'KAOS-01',
      price: 100_000,
      cost: 60_000,
      status: 'active',
    });
    const order = await services.orderService.create({
      storeId: store.id,
      marketplaceOrderId: 'MP-HEALTH-1',
      orderDate: addDays(todayJakarta(), -2),
      status: 'completed',
      sellerDiscount: 0,
      marketplaceDiscount: 0,
      shippingPaid: 0,
      items: [
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice: 100_000,
        },
      ],
    });
    await services.settlementService.create({
      storeId: store.id,
      settlementNo: 'ST-OLD',
      settlementDate: addDays(todayJakarta(), -10),
      grossSales: 500_000,
      totalDeductions: 50_000,
      totalPayout: 450_000,
      status: 'pending',
      notes: null,
    });

    const report = await services.dataHealthService.check();

    expect(report.totalIssues).toBe(4);
    expect(report.criticalChecks).toBe(1);
    expect(report.warningChecks).toBe(3);

    const orderCheck = report.checks.find(
      (item) => item.code === 'completed_orders_without_fees',
    );
    expect(orderCheck?.count).toBe(1);
    expect(orderCheck?.items[0]?.href).toBe(`#/orders/${order.id}`);

    const productCheck = report.checks.find((item) => item.code === 'products_without_hpp');
    expect(productCheck?.count).toBe(1);
    expect(productCheck?.items[0]?.title).toBe('Tanpa HPP');

    const settlementCheck = report.checks.find(
      (item) => item.code === 'stale_pending_settlements',
    );
    expect(settlementCheck?.count).toBe(1);
    expect(settlementCheck?.items[0]?.title).toBe('ST-OLD');

    const backupCheck = report.checks.find((item) => item.code === 'backup_overdue');
    expect(backupCheck?.count).toBe(1);
    expect(backupCheck?.items[0]?.title).toMatch(/Belum pernah/);
  });

  it('flags a backup that is older than seven days', async () => {
    const { services } = await createTestContext();
    const now = new Date();
    await services.settings.set(
      LAST_BACKUP_AT_KEY,
      new Date(now.getTime() - 8 * DAY_MS).toISOString(),
    );

    const report = await services.dataHealthService.check(now);
    const backupCheck = report.checks.find((item) => item.code === 'backup_overdue');
    expect(backupCheck?.count).toBe(1);
    expect(backupCheck?.items[0]?.title).toMatch(/Backup terakhir/);
  });

  it('reports a healthy database when all checks pass', async () => {
    const { services } = await createTestContext();
    const now = new Date();
    const store = await services.storeService.create({ name: 'Toko', platform: 'tiktok' });
    const product = await services.productService.create({
      name: 'Kaos',
      sku: 'KAOS-01',
      price: 100_000,
      cost: 60_000,
      status: 'active',
    });
    const order = await services.orderService.create({
      storeId: store.id,
      marketplaceOrderId: 'MP-HEALTH-2',
      orderDate: addDays(todayJakarta(), -1),
      status: 'completed',
      sellerDiscount: 0,
      marketplaceDiscount: 0,
      shippingPaid: 0,
      items: [
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice: 100_000,
        },
      ],
    });
    await services.feeService.create({
      storeId: store.id,
      orderId: order.id,
      feeType: 'admin',
      amount: 4_000,
      feeDate: addDays(todayJakarta(), -1),
      source: 'actual',
    });
    await services.settings.set(LAST_BACKUP_AT_KEY, now.toISOString());

    const report = await services.dataHealthService.check(now);

    expect(report.totalIssues).toBe(0);
    expect(report.criticalChecks).toBe(0);
    expect(report.warningChecks).toBe(0);
    expect(report.checks.every((item) => item.count === 0)).toBe(true);
  });
});
