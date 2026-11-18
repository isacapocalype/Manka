import type { Database, SqlRow, SqlValue } from '@/core/database/types';
import type { DataCounts } from '@/types/entities';

export interface BackupTableDefinition {
  name: string;
  /** Versi skema saat tabel ini pertama kali dibuat. Default 1. */
  since?: number;
  columns: readonly string[];
  /** Kolom yang baru ditambahkan setelah versi 1, beserta versi skemanya. */
  columnSince?: Readonly<Record<string, number>>;
}

export function isBackupTableInVersion(
  table: BackupTableDefinition,
  schemaVersion: number,
): boolean {
  return (table.since ?? 1) <= schemaVersion;
}

export function backupTableColumns(
  table: BackupTableDefinition,
  schemaVersion: number,
): string[] {
  return table.columns.filter(
    (column) => (table.columnSince?.[column] ?? 1) <= schemaVersion,
  );
}

/** Urutan induk → anak untuk insert restore. */
export const BACKUP_TABLES: readonly BackupTableDefinition[] = [
  { name: 'app_settings', columns: ['key', 'value', 'updated_at'] },
  {
    name: 'stores',
    columns: [
      'id',
      'name',
      'platform',
      'email',
      'phone',
      'password_enc',
      'ktp_name',
      'bank_account_enc',
      'status',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'products',
    columns: [
      'id',
      'name',
      'sku',
      'category',
      'variant',
      'price',
      'status',
      'notes',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'product_costs',
    columns: ['id', 'product_id', 'cost', 'effective_at', 'note', 'created_at'],
  },
  {
    name: 'product_prices',
    columns: ['id', 'product_id', 'price', 'effective_at', 'created_at'],
  },
  {
    name: 'orders',
    columns: [
      'id',
      'store_id',
      'marketplace_order_id',
      'order_date',
      'status',
      'seller_discount',
      'marketplace_discount',
      'shipping_paid',
      'settlement_value',
      'notes',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'order_items',
    columns: [
      'id',
      'order_id',
      'product_id',
      'product_name',
      'sku',
      'quantity',
      'unit_price',
      'hpp_snapshot',
      'created_at',
    ],
  },
  {
    name: 'work_orders',
    since: 2,
    columns: [
      'id',
      'code',
      'order_id',
      'order_item_id',
      'product_name',
      'sku',
      'qty',
      'deadline',
      'priority',
      'pic_name',
      'current_stage',
      'status',
      'qty_passed',
      'qty_defect',
      'notes',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'work_order_stages',
    since: 2,
    columns: [
      'id',
      'work_order_id',
      'stage',
      'qty_in',
      'qty_passed',
      'qty_defect',
      'pic_name',
      'notes',
      'started_at',
      'completed_at',
      'created_at',
    ],
  },
  {
    name: 'marketplace_fees',
    columns: [
      'id',
      'store_id',
      'order_id',
      'fee_type',
      'amount',
      'fee_date',
      'source',
      'notes',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'advertising_campaigns',
    columns: ['id', 'store_id', 'platform', 'name', 'notes', 'created_at', 'updated_at'],
  },
  {
    name: 'advertising_expenses',
    columns: [
      'id',
      'campaign_id',
      'expense_date',
      'amount',
      'impressions',
      'clicks',
      'attributed_orders',
      'attributed_revenue',
      'notes',
      'created_at',
    ],
  },
  {
    name: 'operational_expenses',
    columns: [
      'id',
      'store_id',
      'expense_date',
      'category',
      'amount',
      'description',
      'receipt_note',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'settlements',
    columns: [
      'id',
      'store_id',
      'settlement_no',
      'settlement_date',
      'gross_sales',
      'total_deductions',
      'total_payout',
      'status',
      'notes',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'refunds',
    columns: [
      'id',
      'store_id',
      'order_id',
      'settlement_id',
      'refund_date',
      'amount',
      'quantity',
      'reason',
      'status',
      'notes',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'import_batches',
    columns: [
      'id',
      'import_type',
      'file_name',
      'total_rows',
      'success_rows',
      'failed_rows',
      'skipped_rows',
      'notes',
      'created_at',
    ],
  },
  {
    name: 'import_errors',
    columns: ['id', 'batch_id', 'row_number', 'message', 'raw_data', 'created_at'],
  },
  {
    name: 'audit_logs',
    columns: ['id', 'action', 'entity_type', 'entity_id', 'details', 'created_at'],
  },
];

export class BackupRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async readAll(): Promise<Record<string, SqlRow[]>> {
    const tables: Record<string, SqlRow[]> = {};
    for (const table of BACKUP_TABLES) {
      const rows = await this.db.query(`SELECT * FROM "${table.name}";`);
      tables[table.name] = rows.map((row) => {
        const clean: SqlRow = {};
        for (const column of table.columns) {
          const value = row[column];
          clean[column] = (value ?? null) as SqlValue;
        }
        return clean;
      });
    }
    return tables;
  }

  async restoreAll(
    tables: Record<string, SqlRow[]>,
    schemaVersion: number,
  ): Promise<void> {
    const clearOrder = [...BACKUP_TABLES].reverse();
    await this.db.transaction(async (tx) => {
      for (const table of clearOrder) {
        await tx.execute(`DELETE FROM "${table.name}";`);
      }
      for (const table of BACKUP_TABLES) {
        const rows = tables[table.name];
        if (!rows || rows.length === 0) continue;
        if (!isBackupTableInVersion(table, schemaVersion)) {
          throw new Error(
            `Tabel ${table.name} tidak dikenal pada skema backup versi ${schemaVersion}.`,
          );
        }
        const columns = backupTableColumns(table, schemaVersion);
        for (const row of rows) {
          const missing = columns.filter(
            (column) => !Object.prototype.hasOwnProperty.call(row, column),
          );
          if (missing.length > 0) {
            throw new Error(
              `Data backup untuk tabel ${table.name} tidak lengkap: ${missing.join(', ')}.`,
            );
          }
          const placeholders = columns.map(() => '?').join(', ');
          const values = columns.map((column) => {
            const value = row[column];
            if (
              value === null ||
              typeof value === 'string' ||
              typeof value === 'number'
            ) {
              return value;
            }
            throw new Error(`Nilai kolom ${table.name}.${column} pada backup tidak valid.`);
          });
          await tx.execute(
            `INSERT INTO "${table.name}" (${columns.map((column) => `"${column}"`).join(', ')}) VALUES (${placeholders});`,
            values,
          );
        }
      }
    });
  }

  async getDataCounts(): Promise<DataCounts> {
    const rows = await this.db.query(
      `SELECT
        (SELECT COUNT(*) FROM stores) AS stores,
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COUNT(*) FROM marketplace_fees) AS fees,
        (SELECT COUNT(*) FROM refunds) AS refunds,
        (SELECT COUNT(*) FROM settlements) AS settlements,
        (SELECT COUNT(*) FROM advertising_campaigns) AS campaigns,
        (SELECT COUNT(*) FROM advertising_expenses) AS ad_expenses,
        (SELECT COUNT(*) FROM operational_expenses) AS operational_expenses;`,
    );
    const row = rows[0];
    return {
      stores: Number(row?.stores ?? 0),
      products: Number(row?.products ?? 0),
      orders: Number(row?.orders ?? 0),
      fees: Number(row?.fees ?? 0),
      refunds: Number(row?.refunds ?? 0),
      settlements: Number(row?.settlements ?? 0),
      campaigns: Number(row?.campaigns ?? 0),
      expenses: Number(row?.ad_expenses ?? 0),
      operationalExpenses: Number(row?.operational_expenses ?? 0),
    };
  }
}
