import { describe, expect, it } from 'vitest';
import { createTestContext } from './helpers/testContext';
import { todayJakarta } from '@/core/utils/date';

async function createProduct(name = 'Kaos BOM', sku = 'BOM-01') {
  const context = await createTestContext();
  const product = await context.services.productService.create({
    name,
    sku,
    category: 'Atasan',
    price: 200_000,
    cost: 0,
    status: 'active',
  });
  return { ...context, product };
}

describe('BOM dan HPP', () => {
  it('menghitung HPP dari material desimal, tenaga kerja, dan overhead', async () => {
    const { services, product } = await createProduct();
    const fabric = await services.materialService.create({
      name: 'Kain katun',
      unit: 'meter',
      unitCost: 50_000,
      status: 'active',
    });

    const afterMaterial = await services.bomService.addItem(product.id, {
      type: 'material',
      materialId: fabric.id,
      quantity: 1.25,
    });
    expect(afterMaterial).toMatchObject({
      materialCost: 62_500,
      laborCost: 0,
      overheadCost: 0,
      totalCost: 62_500,
      usingBom: true,
      componentCount: 1,
    });
    expect(afterMaterial.items[0]).toMatchObject({
      type: 'material',
      materialName: 'Kain katun',
      materialUnit: 'meter',
      materialUnitCost: 50_000,
      quantity: 1.25,
      lineCost: 62_500,
    });

    await services.bomService.addItem(product.id, {
      type: 'labor',
      label: 'Jahit per kaos',
      amount: 15_000,
    });
    await services.bomService.addItem(product.id, {
      type: 'overhead',
      label: 'Listrik per unit',
      amount: 2_500,
    });

    const summary = await services.bomService.getSummary(product.id);
    expect(summary).toMatchObject({
      materialCost: 62_500,
      laborCost: 15_000,
      overheadCost: 2_500,
      totalCost: 80_000,
      componentCount: 3,
    });

    const refreshed = await services.productService.get(product.id);
    expect(refreshed.currentCost).toBe(80_000);
    const costs = await services.productService.listCosts(product.id);
    expect(costs[0]).toMatchObject({ cost: 80_000, note: 'HPP dari BOM' });
  });

  it('memakai HPP BOM sebagai snapshot pesanan baru', async () => {
    const { services, product } = await createProduct();
    const material = await services.materialService.create({
      name: 'Benang',
      unit: 'roll',
      unitCost: 20_000,
      status: 'active',
    });
    await services.bomService.addItem(product.id, {
      type: 'material',
      materialId: material.id,
      quantity: 0.5,
    });
    await services.bomService.addItem(product.id, {
      type: 'labor',
      label: 'Jahit',
      amount: 10_000,
    });

    const store = await services.storeService.create({
      name: 'Toko BOM',
      platform: 'shopee',
    });
    const order = await services.orderService.create({
      storeId: store.id,
      marketplaceOrderId: 'MP-BOM-1',
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
          quantity: 2,
          unitPrice: product.price,
        },
      ],
    });
    expect(order.items[0]?.hppSnapshot).toBe(20_000);
  });

  it('menghitung ulang HPP saat biaya material berubah', async () => {
    const { services, product } = await createProduct();
    const material = await services.materialService.create({
      name: 'Kain',
      unit: 'meter',
      unitCost: 40_000,
      status: 'active',
    });
    await services.bomService.addItem(product.id, {
      type: 'material',
      materialId: material.id,
      quantity: 2,
    });
    expect((await services.productService.get(product.id)).currentCost).toBe(80_000);

    await services.materialService.update(material.id, {
      name: 'Kain',
      unit: 'meter',
      unitCost: 45_000,
      status: 'active',
    });

    expect((await services.productService.get(product.id)).currentCost).toBe(90_000);
    const costs = await services.productService.listCosts(product.id);
    expect(costs.map((entry) => entry.cost)).toEqual([90_000, 80_000, 0]);
  });

  it('menolak HPP manual selama produk memakai BOM', async () => {
    const { services, product } = await createProduct();
    const material = await services.materialService.create({
      name: 'Kain',
      unit: 'meter',
      unitCost: 10_000,
      status: 'active',
    });
    await services.bomService.addItem(product.id, {
      type: 'material',
      materialId: material.id,
      quantity: 1,
    });

    await expect(
      services.productService.update(product.id, {
        name: product.name,
        sku: product.sku,
        price: product.price,
        cost: 5_000,
        status: 'active',
      }),
    ).rejects.toThrow(/dihitung dari BOM/i);

    const updated = await services.productService.update(product.id, {
      name: product.name,
      sku: product.sku,
      price: 210_000,
      cost: null,
      status: 'active',
    });
    expect(updated.price).toBe(210_000);
    expect(updated.currentCost).toBe(10_000);
  });

  it('menolak material yang dipakai BOM untuk dihapus', async () => {
    const { services, product } = await createProduct();
    const material = await services.materialService.create({
      name: 'Kain',
      unit: 'meter',
      unitCost: 10_000,
      status: 'active',
    });
    await services.bomService.addItem(product.id, {
      type: 'material',
      materialId: material.id,
      quantity: 1,
    });

    await expect(services.materialService.delete(material.id)).rejects.toThrow(/dipakai/i);
    expect(await services.materialService.usageCount(material.id)).toBe(1);
  });

  it('validasi kuantitas desimal dan komponen tenaga kerja', async () => {
    const { services, product } = await createProduct();
    const material = await services.materialService.create({
      name: 'Kain',
      unit: 'meter',
      unitCost: 10_000,
      status: 'active',
    });

    await expect(
      services.bomService.addItem(product.id, {
        type: 'material',
        materialId: material.id,
        quantity: 1.23456,
      }),
    ).rejects.toThrow(/4 angka desimal/i);

    await expect(
      services.bomService.addItem(product.id, {
        type: 'labor',
        label: '',
        amount: 5_000,
      }),
    ).rejects.toThrow(/wajib diisi/i);

    await expect(
      services.bomService.addItem(product.id, {
        type: 'material',
        materialId: '',
        quantity: 1,
      }),
    ).rejects.toThrow(/material/i);
  });

  it('kembali ke HPP manual setelah seluruh komponen BOM dihapus', async () => {
    const { services, product } = await createProduct();
    const material = await services.materialService.create({
      name: 'Kain',
      unit: 'meter',
      unitCost: 30_000,
      status: 'active',
    });
    const summary = await services.bomService.addItem(product.id, {
      type: 'material',
      materialId: material.id,
      quantity: 2,
    });
    const itemId = summary.items[0]!.id;
    expect((await services.productService.get(product.id)).currentCost).toBe(60_000);

    const empty = await services.bomService.removeItem(product.id, itemId);
    expect(empty.usingBom).toBe(false);
    expect(empty.totalCost).toBe(0);
    expect((await services.productService.get(product.id)).currentCost).toBe(60_000);

    const updated = await services.productService.update(product.id, {
      name: product.name,
      sku: product.sku,
      price: product.price,
      cost: 55_000,
      status: 'active',
    });
    expect(updated.currentCost).toBe(55_000);
  });
});
