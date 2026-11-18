import { describe, expect, it } from 'vitest';
import { createTestContext } from './helpers/testContext';
import {
  createBackupEnvelope,
  type BackupEnvelope,
} from '@/core/crypto/encryption';
import { LATEST_SCHEMA_VERSION } from '@/core/database';
import { APP_VERSION } from '@/core/services/backupService';
import {
  BACKUP_TABLES,
  backupTableColumns,
  isBackupTableInVersion,
} from '@/core/repositories/backupRepository';
import {
  autoDetectMappingFor,
  validateMappingFor,
  type ImportMapping,
} from '@/core/import-export/importFields';

const ORDER_HEADERS = ['Order ID', 'Tanggal Pesanan', 'Status', 'SKU', 'Kuantitas', 'Harga Satuan'];

describe('import mapping templates', () => {
  it('membuat, mencari duplikat, mengubah, memakai, dan menghapus template', async () => {
    const { services } = await createTestContext();
    const mapping = autoDetectMappingFor(ORDER_HEADERS, 'orders');
    const created = await services.importTemplateService.create({
      name: 'Shopee pesanan',
      marketplace: 'shopee',
      importType: 'orders',
      mapping,
    });
    expect(created).toMatchObject({
      name: 'Shopee pesanan',
      marketplace: 'shopee',
      importType: 'orders',
    });
    expect(created.mapping.orderId).toBe('Order ID');
    expect(validateMappingFor(created.mapping, ORDER_HEADERS, 'orders')).toEqual([]);

    await expect(
      services.importTemplateService.create({
        name: 'shopee PESANAN',
        marketplace: 'shopee',
        importType: 'orders',
        mapping,
      }),
    ).rejects.toThrow(/sudah ada/);

    const sameNameOtherMarketplace = await services.importTemplateService.create({
      name: 'Shopee pesanan',
      marketplace: 'tiktok',
      importType: 'orders',
      mapping,
    });
    expect(sameNameOtherMarketplace.id).not.toBe(created.id);

    const listed = await services.importTemplateService.list('orders', 'shopee');
    expect(listed.map((item) => item.id)).toEqual([created.id]);

    const applied = services.importTemplateService.apply(created, [
      'Order ID',
      'Tanggal Pesanan',
      'Status',
      'Kuantitas',
      'Harga Satuan',
    ]);
    expect(applied.orderId).toBe('Order ID');
    expect(applied.sku).toBeNull();
    expect(validateMappingFor(applied, ORDER_HEADERS, 'orders').join(' ')).toMatch(
      /Nama produk atau SKU/,
    );

    const updated = await services.importTemplateService.update(created.id, {
      name: 'Shopee pesanan v2',
      marketplace: 'shopee',
      importType: 'orders',
      mapping: { ...mapping, hpp: 'HPP' },
    });
    expect(updated.name).toBe('Shopee pesanan v2');
    expect(Object.keys(updated.mapping)).not.toContain('grossSales');

    await services.importTemplateService.delete(created.id);
    await expect(services.importTemplateService.get(created.id)).rejects.toThrow(
      /tidak ditemukan/,
    );
  });

  it('menolak template tanpa nama, marketplace, atau jenis import yang valid', async () => {
    const { services } = await createTestContext();
    await expect(
      services.importTemplateService.create({
        name: '  ',
        marketplace: 'shopee',
        importType: 'orders',
        mapping: {},
      }),
    ).rejects.toThrow(/wajib diisi/);
    await expect(
      services.importTemplateService.create({
        name: 'Salah',
        marketplace: 'bukalapak' as 'shopee',
        importType: 'orders',
        mapping: {},
      }),
    ).rejects.toThrow(/Marketplace tidak valid/);
    await expect(
      services.importTemplateService.create({
        name: 'Salah',
        marketplace: 'shopee',
        importType: 'ads' as 'orders',
        mapping: {},
      }),
    ).rejects.toThrow(/Jenis import tidak valid/);
  });
});

describe('backup template import', () => {
  it('mendaftarkan tabel template pada skema versi 5', () => {
    expect(LATEST_SCHEMA_VERSION).toBe(5);
    const definition = BACKUP_TABLES.find((table) => table.name === 'import_templates');
    expect(definition).toBeDefined();
    expect(isBackupTableInVersion(definition!, 4)).toBe(false);
    expect(isBackupTableInVersion(definition!, 5)).toBe(true);
    expect(backupTableColumns(definition!, 5)).toContain('mapping_json');
  });

  it('memutar-balik template dan mapping melalui backup terenkripsi', async () => {
    const source = await createTestContext();
    const mapping: ImportMapping = autoDetectMappingFor(
      ['No Settlement', 'Tanggal Pencairan', 'Total Pencairan'],
      'settlements',
    );
    const template = await source.services.importTemplateService.create({
      name: 'Shopee pencairan',
      marketplace: 'shopee',
      importType: 'settlements',
      mapping,
    });

    const tables = await source.services.backupRepo.readAll();
    expect(tables.import_templates).toHaveLength(1);
    expect(tables.import_templates?.[0]).toMatchObject({
      name: 'Shopee pencairan',
      import_type: 'settlements',
    });

    const password = 'kata-sandi-template';
    const createdAt = '2026-02-10T10:00:00.000Z';
    const envelope = await createBackupEnvelope(
      JSON.stringify({
        schemaVersion: LATEST_SCHEMA_VERSION,
        appVersion: APP_VERSION,
        createdAt,
        encryptionKey: await source.services.encryption.exportKeyBase64(),
        tables,
      }),
      password,
      createdAt,
    );
    const file = new File([JSON.stringify(envelope, null, 2)], 'template.manka', {
      type: 'application/json',
    });

    const target = await createTestContext();
    const inspection = await target.services.backupService.inspectBackup(file, password);
    expect(inspection.tableCounts.import_templates).toBe(1);
    expect((envelope as BackupEnvelope).format).toBe('manka-backup');

    await target.services.backupService.restoreBackup(file, password);
    const restored = await target.services.importTemplateService.get(template.id);
    expect(restored).toMatchObject({
      name: 'Shopee pencairan',
      marketplace: 'shopee',
      importType: 'settlements',
    });
    expect(restored.mapping.settlementNo).toBe('No Settlement');
  });
});
