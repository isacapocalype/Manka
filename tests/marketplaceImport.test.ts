import { describe, expect, it } from 'vitest';
import { createTestContext } from './helpers/testContext';
import type { TabularData } from '@/core/import-export/spreadsheet';
import {
  autoDetectMappingFor,
  validateMappingFor,
} from '@/core/import-export/importFields';

const FEE_HEADERS = ['Order ID', 'Tanggal Biaya', 'Jenis Biaya', 'Nominal Biaya', 'Catatan'];
const SETTLEMENT_HEADERS = [
  'No Settlement',
  'Tanggal Pencairan',
  'Total Penjualan',
  'Total Potongan',
  'Total Pencairan',
  'Status',
  'Catatan',
];

function tabular(fileName: string, headers: string[], rows: string[][]): TabularData {
  return {
    fileName,
    headers,
    rows: rows.map((values, index) => ({ rowNumber: index + 2, values })),
  };
}

async function seed() {
  const context = await createTestContext();
  const store = await context.services.storeService.create({ name: 'Toko Uji', platform: 'shopee' });
  const product = await context.services.productService.create({
    name: 'Kaos',
    sku: 'KAOS-01',
    price: 100_000,
    cost: 60_000,
    status: 'active',
  });
  const order = await context.services.orderService.create({
    storeId: store.id,
    marketplaceOrderId: 'MP-1001',
    orderDate: '2026-02-01',
    status: 'completed',
    sellerDiscount: 0,
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
  const account = await context.services.cashService.createAccount({
    name: 'Bank marketplace',
    type: 'bank',
    openingBalance: 0,
    status: 'active',
  });
  return { ...context, store, product, order, account };
}

describe('import biaya marketplace', () => {
  it('mendeteksi field, melewati duplikat, dan menolak biaya tanpa pesanan', async () => {
    const { services, store, order } = await seed();
    const mapping = autoDetectMappingFor(FEE_HEADERS, 'fees');
    expect(mapping).toMatchObject({
      orderId: 'Order ID',
      feeDate: 'Tanggal Biaya',
      feeType: 'Jenis Biaya',
      feeAmount: 'Nominal Biaya',
      notes: 'Catatan',
    });
    expect(validateMappingFor(mapping, FEE_HEADERS, 'fees')).toEqual([]);

    const data = tabular('fee-shopee.csv', FEE_HEADERS, [
      ['MP-1001', '2026-02-01', 'komisi', '5000', 'Komisi penjualan'],
      ['MP-1001', '2026-02-01', 'komisi', '5000', 'Komisi penjualan'],
      ['MP-404', '2026-02-01', 'admin', '1000', 'Biaya admin'],
    ]);
    const preview = await services.feeImportService.previewFees(data, mapping, store.id);
    expect(preview.mappingErrors).toEqual([]);
    expect(preview.validCount).toBe(1);
    expect(preview.duplicateCount).toBe(1);
    expect(preview.invalidCount).toBe(1);
    expect(preview.candidates[0]).toMatchObject({
      orderId: order.id,
      feeType: 'commission',
      amount: 5_000,
      feeDate: '2026-02-01',
    });
    expect(preview.candidates[2]?.issues[0]?.message).toMatch(/tidak ditemukan/);

    const result = await services.feeImportService.executeFees(preview);
    expect(result.feeCount).toBe(1);
    expect(result.successRows).toBe(1);
    expect(result.skippedRows).toBe(1);
    expect(result.failedRows).toBe(1);

    const fees = await services.fees.list({ storeId: store.id, pageSize: 50 });
    expect(fees.items).toHaveLength(1);
    expect(fees.items[0]).toMatchObject({
      orderId: order.id,
      feeType: 'commission',
      amount: 5_000,
      source: 'actual',
    });
    expect(fees.items[0]?.notes).toMatch(/import laporan fee/);

    const batches = await services.imports.listBatches(10);
    expect(batches[0]).toMatchObject({ importType: 'fees', successRows: 1 });

    const second = await services.feeImportService.executeFees(
      await services.feeImportService.previewFees(data, mapping, store.id),
    );
    expect(second.feeCount).toBe(0);
    expect(second.skippedRows).toBe(2);
  });

  it('memakai tanggal pesanan bila tanggal biaya kosong dan menolak mapping yang tidak lengkap', async () => {
    const { services, store } = await seed();
    const mapping = autoDetectMappingFor(FEE_HEADERS, 'fees');
    const data = tabular('fee-tanpa-tanggal.csv', FEE_HEADERS, [
      ['MP-1001', '', 'layanan', '2500', ''],
    ]);
    const preview = await services.feeImportService.previewFees(data, mapping, store.id);
    expect(preview.candidates[0]?.feeDate).toBe('2026-02-01');
    expect(preview.candidates[0]?.feeType).toBe('service');
    expect(await services.feeImportService.executeFees(preview)).toMatchObject({ feeCount: 1 });

    mapping.feeAmount = null;
    const invalid = await services.feeImportService.previewFees(data, mapping, store.id);
    expect(invalid.mappingErrors.join(' ')).toMatch(/Nominal biaya wajib/);
    await expect(services.feeImportService.executeFees(invalid)).rejects.toThrow(
      /Mapping kolom/,
    );
  });
});

describe('import settlement marketplace', () => {
  it('mewajibkan rekening tujuan untuk settlement diterima', async () => {
    const { services, store } = await seed();
    const mapping = autoDetectMappingFor(SETTLEMENT_HEADERS, 'settlements');
    expect(validateMappingFor(mapping, SETTLEMENT_HEADERS, 'settlements')).toEqual([]);
    const data = tabular('pencairan.csv', SETTLEMENT_HEADERS, [
      ['ST-1', '2026-02-03', '200000', '20000', '180000', 'diterima', 'Pencairan Feng Shui'],
    ]);

    const withoutAccount = await services.settlementImportService.previewSettlements(
      data,
      mapping,
      store.id,
      null,
    );
    expect(withoutAccount.accountError).toMatch(/rekening tujuan/);
    await expect(
      services.settlementImportService.executeSettlements(withoutAccount),
    ).rejects.toThrow(/rekening tujuan/);
  });

  it('membuat settlement, memposting kas hanya untuk yang diterima, dan melewati duplikat', async () => {
    const { services, store, account } = await seed();
    const mapping = autoDetectMappingFor(SETTLEMENT_HEADERS, 'settlements');
    const data = tabular('pencairan.csv', SETTLEMENT_HEADERS, [
      ['ST-1', '2026-02-03', '200000', '20000', '180000', 'diterima', 'Pencairan I'],
      ['ST-2', '04/02/2026', '100000', '10000', '90000', 'pending', 'Pencairan II'],
      ['ST-3', '2026-02-05', '120000', '20000', '90000', 'diterima', 'Selisih'],
      ['ST-1', '2026-02-03', '200000', '20000', '180000', 'diterima', 'Duplikat'],
    ]);

    const preview = await services.settlementImportService.previewSettlements(
      data,
      mapping,
      store.id,
      account.id,
    );
    expect(preview.mappingErrors).toEqual([]);
    expect(preview.accountError).toBeNull();
    expect(preview.validCount).toBe(3);
    expect(preview.duplicateCount).toBe(1);
    expect(preview.invalidCount).toBe(0);
    expect(preview.warnings.join(' ')).toMatch(/tidak sama/);

    const result = await services.settlementImportService.executeSettlements(preview);
    expect(result.settlementCount).toBe(3);
    expect(result.skippedRows).toBe(1);

    const settlements = await services.settlements.list({ storeId: store.id, pageSize: 50 });
    expect(settlements.items.map((item) => item.settlementNo).sort()).toEqual([
      'ST-1',
      'ST-2',
      'ST-3',
    ]);
    const received = settlements.items.find((item) => item.settlementNo === 'ST-1');
    expect(received).toMatchObject({ status: 'received', totalPayout: 180_000 });
    expect(received?.accountId).toBe(account.id);
    const pending = settlements.items.find((item) => item.settlementNo === 'ST-2');
    expect(pending).toMatchObject({ status: 'pending', settlementDate: '2026-02-04' });
    expect(pending?.accountId).toBeNull();

    const entries = await services.cashService.listEntries({ sourceType: 'settlement' });
    expect(entries.total).toBe(2);
    expect(entries.items.reduce((total, item) => total + item.amount, 0)).toBe(270_000);
    expect((await services.cashService.getAccount(account.id)).balance).toBe(270_000);

    const batches = await services.imports.listBatches(10);
    expect(batches[0]).toMatchObject({ importType: 'settlements', successRows: 3 });

    const second = await services.settlementImportService.executeSettlements(
      await services.settlementImportService.previewSettlements(
        data,
        mapping,
        store.id,
        account.id,
      ),
    );
    expect(second.settlementCount).toBe(0);
    expect((await services.cashService.getAccount(account.id)).balance).toBe(270_000);
  });

  it('menghitung total penjualan bila kolomnya tidak diisi pada file', async () => {
    const { services, store, account } = await seed();
    const headers = ['No Settlement', 'Tanggal Pencairan', 'Total Potongan', 'Total Pencairan'];
    const mapping = autoDetectMappingFor(headers, 'settlements');
    const data = tabular('pencairan-ringkas.csv', headers, [
      ['ST-9', '2026-02-06', '15000', '85000'],
    ]);
    const preview = await services.settlementImportService.previewSettlements(
      data,
      mapping,
      store.id,
      account.id,
    );
    expect(preview.candidates[0]).toMatchObject({ grossSales: 100_000, totalDeductions: 15_000 });
    await services.settlementImportService.executeSettlements(preview);
    const settlements = await services.settlements.list({ storeId: store.id, pageSize: 50 });
    expect(settlements.items[0]).toMatchObject({ grossSales: 100_000, totalPayout: 85_000 });
  });
});
