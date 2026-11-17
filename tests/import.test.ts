import { describe, expect, it } from 'vitest';
import { createTestContext } from './helpers/testContext';
import {
  autoDetectMapping,
  ORDER_IMPORT_FIELDS,
  validateMapping,
  type OrderImportMapping,
} from '@/core/services/importService';
import type { TabularData } from '@/core/import-export/spreadsheet';

const HEADERS = [
  'Order ID',
  'Tanggal Pesanan',
  'Status',
  'SKU',
  'Kuantitas',
  'Harga Satuan',
  'HPP',
  'Diskon Penjual',
  'Biaya Marketplace',
];

function tabular(rows: string[][]): TabularData {
  return {
    fileName: 'pesanan-shopee.csv',
    headers: HEADERS,
    rows: rows.map((values, index) => ({ rowNumber: index + 2, values })),
  };
}

async function seed() {
  const context = await createTestContext();
  const store = await context.services.storeService.create({
    name: 'Toko Uji',
    platform: 'shopee',
    email: 'toko@contoh.com',
  });
  const kaos = await context.services.productService.create({
    name: 'Kaos Premium',
    sku: 'KAOS-01',
    price: 100_000,
    cost: 60_000,
    status: 'active',
  });
  const hoodie = await context.services.productService.create({
    name: 'Hoodie Basic',
    sku: 'HOOD-01',
    price: 150_000,
    cost: 90_000,
    status: 'active',
  });
  await context.services.orderService.create({
    storeId: store.id,
    marketplaceOrderId: 'MP-2002',
    orderDate: '2026-02-02',
    status: 'completed',
    sellerDiscount: 0,
    marketplaceDiscount: 0,
    shippingPaid: 0,
    items: [
      {
        productId: kaos.id,
        productName: kaos.name,
        sku: kaos.sku,
        quantity: 1,
        unitPrice: kaos.price,
      },
    ],
  });
  return { ...context, store, kaos, hoodie };
}

describe('order import mapping', () => {
  it('auto-detects known marketplace headers without duplicates', () => {
    const mapping = autoDetectMapping(HEADERS);
    expect(mapping.orderId).toBe('Order ID');
    expect(mapping.orderDate).toBe('Tanggal Pesanan');
    expect(mapping.status).toBe('Status');
    expect(mapping.sku).toBe('SKU');
    expect(mapping.quantity).toBe('Kuantitas');
    expect(mapping.unitPrice).toBe('Harga Satuan');
    expect(mapping.sellerDiscount).toBe('Diskon Penjual');
    expect(mapping.marketplaceFee).toBe('Biaya Marketplace');
    expect(validateMapping(mapping, HEADERS)).toEqual([]);
  });

  it('requires order identity, date, status, quantity, price, and a product key', () => {
    const mapping = Object.fromEntries(
      ORDER_IMPORT_FIELDS.map((field) => [field.key, null]),
    ) as OrderImportMapping;
    const errors = validateMapping(mapping, HEADERS);
    expect(errors.join(' ')).toMatch(/Nomor pesanan wajib/);
    expect(errors.join(' ')).toMatch(/Tanggal pesanan wajib/);
    expect(errors.join(' ')).toMatch(/Nama produk atau SKU/);
  });
});

describe('order import preview and execution', () => {
  it('groups rows by order, links products, snapshots HPP, and flags duplicates and invalid rows', async () => {
    const { services, store, kaos, hoodie } = await seed();
    const mapping = autoDetectMapping(HEADERS);
    const data = tabular([
      ['MP-1001', '2026-02-01', 'selesai', 'KAOS-01', '2', '100000', '', '10000', '5000'],
      ['MP-1001', '2026-02-01', 'selesai', 'HOOD-01', '1', '150000', '', '', ''],
      ['MP-2002', '2026-02-02', 'selesai', 'KAOS-01', '1', '100000', '', '', ''],
      ['MP-1003', '2026-02-03', 'selesai', 'KAOS-01', 'abc', '100000', '', '', ''],
    ]);

    const preview = await services.importService.preview(data, mapping, store.id);
    expect(preview.mappingErrors).toEqual([]);
    expect(preview.validCount).toBe(1);
    expect(preview.duplicateCount).toBe(1);
    expect(preview.invalidCount).toBe(1);
    expect(preview.successRows).toBe(2);
    expect(preview.duplicateRows).toBe(1);
    expect(preview.invalidRows).toBe(1);
    expect(preview.warningCount).toBe(0);

    const candidate = preview.candidates.find((item) => item.orderId === 'MP-1001');
    expect(candidate?.items).toHaveLength(2);
    expect(candidate?.items[0]).toMatchObject({
      productId: kaos.id,
      productName: 'Kaos Premium',
      sku: 'KAOS-01',
      quantity: 2,
      unitPrice: 100_000,
      hppSnapshot: 60_000,
    });
    expect(candidate?.items[1]).toMatchObject({
      productId: hoodie.id,
      hppSnapshot: 90_000,
    });
    expect(candidate?.sellerDiscount).toBe(10_000);

    const result = await services.importService.execute(preview);
    expect(result.orderCount).toBe(1);
    expect(result.successRows).toBe(2);
    expect(result.skippedRows).toBe(1);
    expect(result.failedRows).toBe(1);

    const orders = await services.orders.list({ storeId: store.id, pageSize: 50 });
    expect(orders.items.map((order) => order.marketplaceOrderId).sort()).toEqual([
      'MP-1001',
      'MP-2002',
    ]);

    const imported = orders.items.find((order) => order.marketplaceOrderId === 'MP-1001');
    expect(imported).toBeDefined();
    const detail = await services.orderService.getDetail(imported!.id);
    expect(detail.items.map((item) => item.hppSnapshot).sort((a, b) => a - b)).toEqual([
      60_000,
      90_000,
    ]);
    expect(detail.fees).toHaveLength(1);
    expect(detail.fees[0]?.amount).toBe(5_000);
    expect(detail.grossSales).toBe(350_000);

    const batches = await services.imports.listBatches(10);
    expect(batches[0]).toMatchObject({
      fileName: 'pesanan-shopee.csv',
      totalRows: 4,
      successRows: 2,
      skippedRows: 1,
      failedRows: 1,
    });
    const errors = await services.imports.listErrors(batches[0]!.id);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => /Kuantitas tidak valid/.test(error.message))).toBe(true);
  });

  it('does not duplicate orders when the same file is imported again', async () => {
    const { services, store } = await seed();
    const mapping = autoDetectMapping(HEADERS);
    const data = tabular([
      ['MP-1001', '2026-02-01', 'selesai', 'KAOS-01', '2', '100000', '', '10000', '5000'],
    ]);

    const first = await services.importService.execute(
      await services.importService.preview(data, mapping, store.id),
    );
    expect(first.orderCount).toBe(1);

    const secondPreview = await services.importService.preview(data, mapping, store.id);
    expect(secondPreview.duplicateCount).toBe(1);
    const second = await services.importService.execute(secondPreview);
    expect(second.orderCount).toBe(0);
    expect(second.skippedRows).toBe(1);

    const orders = await services.orders.list({ storeId: store.id, pageSize: 50 });
    expect(orders.items).toHaveLength(2);
  });

  it('keeps unmatched products importable with HPP 0 and a warning', async () => {
    const { services, store } = await seed();
    const mapping = autoDetectMapping(HEADERS);
    const data = tabular([
      ['MP-3001', '2026-02-04', 'diproses', 'TIDAK-ADA', '1', '75000', '', '', ''],
    ]);
    const preview = await services.importService.preview(data, mapping, store.id);
    expect(preview.validCount).toBe(1);
    expect(preview.warningCount).toBe(1);
    expect(preview.candidates[0]?.items[0]?.hppSnapshot).toBe(0);

    const result = await services.importService.execute(preview);
    expect(result.orderCount).toBe(1);
    expect(result.warnings[0]).toMatch(/tidak ditemukan/);
  });

  it('rejects execution when mapping is invalid', async () => {
    const { services, store } = await seed();
    const mapping = autoDetectMapping(HEADERS);
    mapping.quantity = null;
    const preview = await services.importService.preview(
      tabular([['MP-1', '2026-02-01', 'selesai', 'KAOS-01', '1', '1000', '', '', '']]),
      mapping,
      store.id,
    );
    expect(preview.mappingErrors.length).toBeGreaterThan(0);
    await expect(services.importService.execute(preview)).rejects.toThrow(/Mapping kolom/);
  });
});
