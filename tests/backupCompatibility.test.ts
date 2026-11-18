import { describe, expect, it } from 'vitest';
import {
  backupTableColumns,
  isBackupTableInVersion,
  type BackupTableDefinition,
} from '@/core/repositories/backupRepository';
import { parseBackupPayload } from '@/core/services/backupService';

const ENCRYPTION_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

const definitions: readonly BackupTableDefinition[] = [
  {
    name: 'stores',
    columns: ['id', 'name', 'created_at'],
  },
  {
    name: 'orders',
    columns: ['id', 'status', 'settlement_value'],
    columnSince: { settlement_value: 2 },
  },
  {
    name: 'work_orders',
    since: 2,
    columns: ['id', 'code'],
  },
];

function payloadAt(version: number, tables: Record<string, unknown[]>) {
  return {
    schemaVersion: version,
    appVersion: '1.0.1',
    createdAt: '2026-02-10T10:00:00.000Z',
    encryptionKey: ENCRYPTION_KEY,
    tables,
  };
}

const v1Tables = {
  stores: [{ id: 'store-1', name: 'Toko', created_at: '2026-02-01T00:00:00.000Z' }],
  orders: [{ id: 'order-1', status: 'completed' }],
};

describe('backup table versioning', () => {
  it('only exposes columns and tables that exist in the requested schema version', () => {
    const orders = definitions[1]!;
    const workOrders = definitions[2]!;

    expect(backupTableColumns(orders, 1)).toEqual(['id', 'status']);
    expect(backupTableColumns(orders, 2)).toEqual(['id', 'status', 'settlement_value']);
    expect(isBackupTableInVersion(workOrders, 1)).toBe(false);
    expect(isBackupTableInVersion(workOrders, 2)).toBe(true);
  });

  it('accepts an older backup without tables and columns added later', () => {
    const parsed = parseBackupPayload(payloadAt(1, v1Tables), {
      tables: definitions,
      latestSchemaVersion: 2,
    });

    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.tables.orders).toEqual([{ id: 'order-1', status: 'completed' }]);
    expect(parsed.tables.work_orders).toBeUndefined();
  });

  it('requires the newer table and column when the backup claims the newer schema', () => {
    expect(() =>
      parseBackupPayload(payloadAt(2, v1Tables), {
        tables: definitions,
        latestSchemaVersion: 2,
      }),
    ).toThrow(/settlement_value/);
  });

  it('rejects data for a table that did not exist in the backup schema version', () => {
    expect(() =>
      parseBackupPayload(
        payloadAt(1, {
          ...v1Tables,
          work_orders: [{ id: 'wo-1', code: 'WO-1' }],
        }),
        { tables: definitions, latestSchemaVersion: 2 },
      ),
    ).toThrow(/work_orders/);
  });

  it('rejects a backup created by a newer schema version', () => {
    expect(() =>
      parseBackupPayload(payloadAt(3, v1Tables), {
        tables: definitions,
        latestSchemaVersion: 2,
      }),
    ).toThrow(/lebih baru/);
  });

  it('rejects unknown columns instead of inserting them', () => {
    expect(() =>
      parseBackupPayload(
        payloadAt(1, {
          ...v1Tables,
          orders: [{ id: 'order-1', status: 'completed', injected: 'x' }],
        }),
        { tables: definitions, latestSchemaVersion: 2 },
      ),
    ).toThrow(/tidak dikenal/);
  });
});
