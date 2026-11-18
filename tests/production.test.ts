import { describe, expect, it } from 'vitest';
import { createTestContext } from './helpers/testContext';
import { addDays, todayJakarta } from '@/core/utils/date';

async function seedOrderItem(quantity = 10) {
  const context = await createTestContext();
  const store = await context.services.storeService.create({
    name: 'Toko Produksi',
    platform: 'shopee',
  });
  const product = await context.services.productService.create({
    name: 'Kaos Sablon',
    sku: 'KAOS-01',
    category: 'Atasan',
    price: 100_000,
    cost: 60_000,
    status: 'active',
  });
  const order = await context.services.orderService.create({
    storeId: store.id,
    marketplaceOrderId: `MP-PROD-${quantity}`,
    orderDate: todayJakarta(),
    status: 'processing',
    sellerDiscount: 0,
    marketplaceDiscount: 0,
    shippingPaid: 0,
    items: [
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unitPrice: product.price,
      },
    ],
  });
  return { ...context, order, item: order.items[0]! };
}

describe('production work orders', () => {
  it('creates a manual work order with a sequential code and default queue stage', async () => {
    const { services } = await createTestContext();

    const first = await services.productionService.create({
      productName: 'Topi Bordir',
      sku: 'TOPI-01',
      qty: 12,
      deadline: addDays(todayJakarta(), 5),
      priority: 'high',
      picName: 'Bu Sari',
      notes: 'Bahan katun',
    });
    const second = await services.productionService.create({
      productName: 'Topi Bordir',
      qty: 3,
    });

    expect(first.code).toMatch(/^WO-\d{8}-001$/);
    expect(second.code).toMatch(/^WO-\d{8}-002$/);
    expect(first).toMatchObject({
      productName: 'Topi Bordir',
      sku: 'TOPI-01',
      qty: 12,
      priority: 'high',
      picName: 'Bu Sari',
      currentStage: 'antrian',
      status: 'active',
      qtyPassed: 0,
      qtyDefect: 0,
    });
    expect(first.stages).toEqual([]);
  });

  it('creates work orders from order items and enforces the remaining quantity', async () => {
    const { services, order, item } = await seedOrderItem(10);

    const first = await services.productionService.create({
      orderId: order.id,
      orderItemId: item.id,
      productName: 'Diabaikan',
      qty: 4,
    });
    const second = await services.productionService.create({
      orderId: order.id,
      orderItemId: item.id,
      productName: 'Diabaikan',
      qty: 6,
    });

    expect(first).toMatchObject({
      orderId: order.id,
      orderItemId: item.id,
      productName: 'Kaos Sablon',
      sku: 'KAOS-01',
      qty: 4,
    });
    expect(second.qty).toBe(6);

    await expect(
      services.productionService.create({
        orderId: order.id,
        orderItemId: item.id,
        productName: 'Kaos Sablon',
        qty: 1,
      }),
    ).rejects.toThrow(/seluruh kuantitas|sisa/i);

    const remaining = await services.productionService.remainingItems(order.id);
    expect(remaining[0]).toMatchObject({
      orderedQty: 10,
      scheduledQty: 10,
      remainingQty: 0,
    });
  });

  it('rejects work orders for cancelled orders', async () => {
    const { services, order, item } = await seedOrderItem(5);
    await services.orderService.updateStatus(order.id, 'cancelled');

    await expect(
      services.productionService.create({
        orderId: order.id,
        orderItemId: item.id,
        productName: 'Kaos',
        qty: 5,
      }),
    ).rejects.toThrow(/batal, retur, atau refund/i);
  });

  it('moves a whole batch through every stage and accumulates defects', async () => {
    const { services } = await createTestContext();
    const workOrder = await services.productionService.create({
      productName: 'Kemeja',
      qty: 10,
    });

    const afterQueue = await services.productionService.advance(workOrder.id, {
      qtyPassed: 9,
      qtyDefect: 1,
      picName: 'Andi',
      notes: 'Bahan kurang 1',
    });
    expect(afterQueue).toMatchObject({
      currentStage: 'potong',
      qtyPassed: 9,
      qtyDefect: 1,
      status: 'active',
    });
    expect(afterQueue.stages[0]).toMatchObject({
      stage: 'antrian',
      qtyIn: 10,
      qtyPassed: 9,
      qtyDefect: 1,
    });

    const afterCut = await services.productionService.advance(workOrder.id, {
      qtyPassed: 8,
      qtyDefect: 1,
    });
    expect(afterCut).toMatchObject({
      currentStage: 'jahit',
      qtyPassed: 8,
      qtyDefect: 2,
    });
    expect(afterCut.stages[1]).toMatchObject({
      stage: 'potong',
      qtyIn: 9,
      qtyPassed: 8,
      qtyDefect: 1,
    });

    await services.productionService.advance(workOrder.id, { qtyPassed: 8, qtyDefect: 0 });
    await services.productionService.advance(workOrder.id, { qtyPassed: 7, qtyDefect: 1 });
    await services.productionService.advance(workOrder.id, { qtyPassed: 7, qtyDefect: 0 });
    const finished = await services.productionService.advance(workOrder.id, {
      qtyPassed: 7,
      qtyDefect: 0,
    });

    expect(finished).toMatchObject({
      currentStage: 'selesai',
      status: 'done',
      qtyPassed: 7,
      qtyDefect: 3,
    });
    expect(finished.stages.map((stage) => stage.stage)).toEqual([
      'antrian',
      'potong',
      'jahit',
      'finishing',
      'qc',
      'packing',
    ]);
    expect(finished.stages.at(-1)).toMatchObject({
      stage: 'packing',
      qtyIn: 7,
      qtyPassed: 7,
      qtyDefect: 0,
    });

    await expect(
      services.productionService.advance(workOrder.id, { qtyPassed: 1, qtyDefect: 0 }),
    ).rejects.toThrow(/selesai/i);
  });

  it('requires passed and defect quantities to match the stage input', async () => {
    const { services } = await createTestContext();
    const workOrder = await services.productionService.create({
      productName: 'Jaket',
      qty: 5,
    });

    await expect(
      services.productionService.advance(workOrder.id, { qtyPassed: 4, qtyDefect: 0 }),
    ).rejects.toThrow(/harus sama dengan kuantitas masuk/i);
  });

  it('finishes a work order when every unit is defective', async () => {
    const { services } = await createTestContext();
    const workOrder = await services.productionService.create({
      productName: 'Syal',
      qty: 4,
    });

    const result = await services.productionService.advance(workOrder.id, {
      qtyPassed: 0,
      qtyDefect: 4,
    });

    expect(result).toMatchObject({
      currentStage: 'selesai',
      status: 'done',
      qtyPassed: 0,
      qtyDefect: 4,
    });
  });

  it('releases the order item quantity when a work order is cancelled', async () => {
    const { services, order, item } = await seedOrderItem(5);
    const workOrder = await services.productionService.create({
      orderId: order.id,
      orderItemId: item.id,
      productName: 'Kaos',
      qty: 5,
    });

    await services.productionService.cancel(workOrder.id);
    const remaining = await services.productionService.remainingItems(order.id);
    expect(remaining[0]).toMatchObject({ scheduledQty: 0, remainingQty: 5 });

    const replacement = await services.productionService.create({
      orderId: order.id,
      orderItemId: item.id,
      productName: 'Kaos',
      qty: 5,
    });
    expect(replacement.status).toBe('active');
    expect(replacement.stages).toEqual([]);
  });

  it('updates production metadata without changing the stage history', async () => {
    const { services } = await createTestContext();
    const workOrder = await services.productionService.create({
      productName: 'Celana',
      qty: 8,
    });
    await services.productionService.advance(workOrder.id, { qtyPassed: 8, qtyDefect: 0 });

    const updated = await services.productionService.update(workOrder.id, {
      deadline: addDays(todayJakarta(), 3),
      priority: 'urgent',
      picName: 'Vendor A',
      notes: 'Prioritas ekspor',
    });

    expect(updated).toMatchObject({
      currentStage: 'potong',
      qtyPassed: 8,
      priority: 'urgent',
      picName: 'Vendor A',
      notes: 'Prioritas ekspor',
    });
    expect(updated.stages).toHaveLength(1);
  });

  it('summarizes active stages and overdue work orders', async () => {
    const { services } = await createTestContext();
    await services.productionService.create({
      productName: 'Kaos',
      qty: 2,
      deadline: addDays(todayJakarta(), -1),
    });
    await services.productionService.create({
      productName: 'Kaos',
      qty: 3,
      deadline: addDays(todayJakarta(), 4),
    });

    const result = await services.productionService.list({ status: 'active' });
    const queue = result.stageCounts.find((item) => item.stage === 'antrian');
    expect(queue).toMatchObject({ count: 2, overdue: 1 });
    expect(result.items).toHaveLength(2);
  });
});
