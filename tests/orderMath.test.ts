import { describe, expect, it } from 'vitest';
import { calculateOrderMath, isRevenueOrderStatus } from '@/core/calculations/orderMath';
import type { OrderStatus } from '@/types/entities';

const ITEMS = [
  { quantity: 2, unitPrice: 150_000, hppSnapshot: 90_000 },
  { quantity: 1, unitPrice: 50_000, hppSnapshot: 20_000 },
];

describe('calculateOrderMath', () => {
  it('subtracts seller discount and completed refunds from gross sales', () => {
    const result = calculateOrderMath({
      status: 'completed',
      sellerDiscount: 20_000,
      items: ITEMS,
      completedRefundTotal: 30_000,
      marketplaceFees: 7_000,
    });
    expect(result.grossSales).toBe(350_000);
    expect(result.netSales).toBe(300_000);
    expect(result.cogs).toBe(200_000);
    expect(result.unitsSold).toBe(3);
    expect(result.estimatedProfit).toBe(300_000 - 200_000 - 7_000);
  });

  it('returns zero revenue for cancelled, returned, and refunded orders', () => {
    for (const status of ['cancelled', 'returned', 'refunded'] as OrderStatus[]) {
      const result = calculateOrderMath({
        status,
        sellerDiscount: 10_000,
        items: ITEMS,
        completedRefundTotal: 100_000,
        marketplaceFees: 5_000,
      });
      expect(result.grossSales, status).toBe(0);
      expect(result.netSales, status).toBe(0);
      expect(result.cogs, status).toBe(0);
      expect(result.unitsSold, status).toBe(0);
      expect(result.estimatedProfit, status).toBe(-5_000);
    }
  });

  it('treats all active marketplace statuses as revenue', () => {
    const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'completed'];
    for (const status of statuses) {
      expect(isRevenueOrderStatus(status), status).toBe(true);
    }
    for (const status of ['cancelled', 'returned', 'refunded'] as OrderStatus[]) {
      expect(isRevenueOrderStatus(status), status).toBe(false);
    }
  });

  it('does not mutate or recalculate item snapshots', () => {
    const snapshot = ITEMS.map((item) => ({ ...item }));
    calculateOrderMath({
      status: 'completed',
      sellerDiscount: 0,
      items: snapshot,
      completedRefundTotal: 0,
      marketplaceFees: 0,
    });
    snapshot[0]!.hppSnapshot = 1;
    const result = calculateOrderMath({
      status: 'completed',
      sellerDiscount: 0,
      items: ITEMS,
      completedRefundTotal: 0,
      marketplaceFees: 0,
    });
    expect(result.cogs).toBe(200_000);
  });
});
