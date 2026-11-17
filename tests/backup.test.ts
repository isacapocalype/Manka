import { describe, expect, it } from 'vitest';
import { createTestContext } from './helpers/testContext';
import {
  createBackupEnvelope,
  type BackupEnvelope,
} from '@/core/crypto/encryption';
import { LATEST_SCHEMA_VERSION } from '@/core/database';
import { APP_VERSION } from '@/core/services/backupService';

async function makeBackup(
  context: Awaited<ReturnType<typeof createTestContext>>,
  password: string,
): Promise<File> {
  const tables = await context.services.backupRepo.readAll();
  const encryptionKey = await context.services.encryption.exportKeyBase64();
  const createdAt = '2026-02-10T10:00:00.000Z';
  const envelope = await createBackupEnvelope(
    JSON.stringify({
      schemaVersion: LATEST_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      createdAt,
      encryptionKey,
      tables,
    }),
    password,
    createdAt,
  );
  return new File([JSON.stringify(envelope, null, 2)], 'manka-backup.manka', {
    type: 'application/json',
  });
}

describe('migrations and HPP snapshots', () => {
  it('migrates the full schema and records cost and price history', async () => {
    const { db, services } = await createTestContext();
    const version = await db.query<{ version: number }>(
      'SELECT MAX(version) AS version FROM schema_migrations;',
    );
    expect(version[0]?.version).toBe(LATEST_SCHEMA_VERSION);

    const store = await services.storeService.create({ name: 'Toko', platform: 'shopee' });
    const product = await services.productService.create({
      name: 'Kaos',
      sku: 'KAOS-01',
      price: 100_000,
      cost: 60_000,
      status: 'active',
    });
    await services.productService.update(product.id, {
      name: 'Kaos',
      sku: 'KAOS-01',
      price: 120_000,
      cost: 80_000,
      status: 'active',
    });

    const costs = await services.productService.listCosts(product.id);
    expect(costs.map((entry) => entry.cost)).toEqual([80_000, 60_000]);
    const prices = await services.productService.listPrices(product.id);
    expect(prices.map((entry) => entry.price)).toEqual([120_000, 100_000]);

    const order = await services.orderService.create({
      storeId: store.id,
      marketplaceOrderId: 'MP-1',
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
          unitPrice: 120_000,
        },
      ],
    });
    expect(order.items[0]?.hppSnapshot).toBe(80_000);

    await services.productService.update(product.id, {
      name: 'Kaos',
      sku: 'KAOS-01',
      price: 150_000,
      cost: 99_000,
      status: 'active',
    });

    const after = await services.orderService.getDetail(order.id);
    expect(after.items[0]?.hppSnapshot).toBe(80_000);
    const summary = await services.financeService.getSummary(
      { from: '2026-02-01', to: '2026-02-28' },
      store.id,
    );
    expect(summary.cogs).toBe(160_000);
    expect(summary.netSales).toBe(240_000);
  });

  it('stores marketplace credentials encrypted and reveals them only on request', async () => {
    const { db, services } = await createTestContext();
    const store = await services.storeService.create({
      name: 'Toko Rahasia',
      platform: 'tiktok',
      password: 'sandi-marketplace',
      bankAccount: '1234567890',
    });
    const raw = await db.query<{ password_enc: string | null; bank_account_enc: string | null }>(
      'SELECT password_enc, bank_account_enc FROM stores WHERE id = ?;',
      [store.id],
    );
    expect(raw[0]?.password_enc).not.toContain('sandi-marketplace');
    expect(raw[0]?.bank_account_enc).not.toContain('1234567890');
    expect(raw[0]?.password_enc?.startsWith('v1:')).toBe(true);

    const sensitive = await services.storeService.getSensitiveData(store.id);
    expect(sensitive).toEqual({
      password: 'sandi-marketplace',
      bankAccount: '1234567890',
    });
  });
});

describe('backup and restore', () => {
  it('round-trips all tables and the encryption key into a fresh database', async () => {
    const source = await createTestContext();
    const store = await source.services.storeService.create({
      name: 'Toko Backup',
      platform: 'shopee',
      password: 'sandi-asli',
      bankAccount: '987654321',
    });
    const product = await source.services.productService.create({
      name: 'Kaos Backup',
      sku: 'BK-01',
      price: 100_000,
      cost: 55_000,
      status: 'active',
    });
    await source.services.orderService.create({
      storeId: store.id,
      marketplaceOrderId: 'MP-BACKUP-1',
      orderDate: '2026-02-03',
      status: 'completed',
      sellerDiscount: 5_000,
      marketplaceDiscount: 0,
      shippingPaid: 0,
      items: [
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: 3,
          unitPrice: 100_000,
        },
      ],
    });
    await source.services.expenseService.create({
      storeId: null,
      category: 'internet',
      amount: 250_000,
      expenseDate: '2026-02-04',
      description: 'Internet bersama',
      receiptNote: null,
    });

    const beforeCounts = await source.services.backupRepo.getDataCounts();
    const password = 'kata-sandi-backup';
    const file = await makeBackup(source, password);

    const restored = await createTestContext();
    const inspection = await restored.services.backupService.inspectBackup(file, password);
    expect(inspection.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(inspection.tableCounts.stores).toBe(1);
    expect(inspection.tableCounts.orders).toBe(1);
    expect(inspection.tableCounts.order_items).toBe(1);

    await expect(
      restored.services.backupService.inspectBackup(file, 'kata-sandi-salah'),
    ).rejects.toThrow(/Kata sandi backup salah/);

    const result = await restored.services.backupService.restoreBackup(file, password);
    expect(result.tableCounts).toEqual(inspection.tableCounts);

    const afterCounts = await restored.services.backupRepo.getDataCounts();
    expect(afterCounts).toEqual(beforeCounts);

    const sensitive = await restored.services.storeService.getSensitiveData(store.id);
    expect(sensitive.password).toBe('sandi-asli');
    expect(sensitive.bankAccount).toBe('987654321');

    const detail = await restored.services.orderService.getDetail(
      (await restored.services.orders.list({ pageSize: 10 })).items[0]!.id,
    );
    expect(detail.items[0]?.hppSnapshot).toBe(55_000);
    expect(detail.netSales).toBe(295_000);
  });

  it('rejects backups with incomplete tables', async () => {
    const { services } = await createTestContext();
    const envelope = await createBackupEnvelope(
      JSON.stringify({
        schemaVersion: LATEST_SCHEMA_VERSION,
        appVersion: APP_VERSION,
        createdAt: '2026-02-01T00:00:00.000Z',
        encryptionKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        tables: {},
      }),
      'kata-sandi-backup',
      '2026-02-01T00:00:00.000Z',
    );
    const file = new File([JSON.stringify(envelope)], 'rusak.manka', {
      type: 'application/json',
    });
    await expect(
      services.backupService.inspectBackup(file, 'kata-sandi-backup'),
    ).rejects.toThrow(/tidak ditemukan pada backup/);
  });

  it('rejects a file that is not a Manka backup', async () => {
    const { services } = await createTestContext();
    const file = new File(['{"hello":"world"}'], 'bukan-backup.json', {
      type: 'application/json',
    });
    await expect(services.backupService.inspectBackup(file, 'apa-saja')).rejects.toThrow(
      /bukan backup Manka/,
    );
  });

  it('never writes a backup envelope without the expected format marker', async () => {
    const envelope = await createBackupEnvelope('{}', 'kata-sandi-backup', '2026-02-01T00:00:00.000Z');
    expect(envelope.format).toBe('manka-backup');
    expect(envelope.version).toBe(1);
    expect(envelope.kdf.name).toBe('PBKDF2-SHA256');
    expect(envelope.kdf.iterations).toBeGreaterThanOrEqual(100_000);
    expect((envelope as BackupEnvelope).payload).not.toContain('{}');
  });
});
