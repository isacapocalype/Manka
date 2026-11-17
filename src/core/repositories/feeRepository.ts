import type { Database, SqlExecutor, SqlRow } from '@/core/database/types';
import type {
  FeeSource,
  FeeType,
  MarketplaceFee,
  MarketplaceFeeListItem,
  PagedResult,
} from '@/types/entities';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { getNullableString, getNumber, getString } from './rowUtils';
import type { FinanceFee } from '@/types/finance';

export interface FeeFilters {
  storeId?: string | null;
  orderId?: string | null;
  feeType?: FeeType | 'all';
  source?: FeeSource | 'all';
  from?: string | null;
  to?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface FeeWriteData {
  storeId: string;
  orderId: string | null;
  feeType: FeeType;
  amount: number;
  feeDate: string;
  source: FeeSource;
  notes: string | null;
}

function mapFee(row: SqlRow): MarketplaceFeeListItem {
  return {
    id: getString(row, 'id'),
    storeId: getString(row, 'store_id'),
    orderId: getNullableString(row, 'order_id'),
    feeType: getString(row, 'fee_type') as FeeType,
    amount: getNumber(row, 'amount'),
    feeDate: getString(row, 'fee_date'),
    source: getString(row, 'source') as FeeSource,
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
    storeName: getString(row, 'store_name'),
    marketplaceOrderId: getNullableString(row, 'marketplace_order_id'),
  };
}

const FEE_SELECT = `
  SELECT f.*, s.name AS store_name, o.marketplace_order_id AS marketplace_order_id
  FROM marketplace_fees f
  JOIN stores s ON s.id = f.store_id
  LEFT JOIN orders o ON o.id = f.order_id
`;

export class FeeRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async list(filters: FeeFilters = {}): Promise<PagedResult<MarketplaceFeeListItem>> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.storeId) {
      where.push('f.store_id = ?');
      params.push(filters.storeId);
    }
    if (filters.orderId) {
      where.push('f.order_id = ?');
      params.push(filters.orderId);
    }
    if (filters.feeType && filters.feeType !== 'all') {
      where.push('f.fee_type = ?');
      params.push(filters.feeType);
    }
    if (filters.source && filters.source !== 'all') {
      where.push('f.source = ?');
      params.push(filters.source);
    }
    if (filters.from) {
      where.push('f.fee_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      where.push('f.fee_date <= ?');
      params.push(filters.to);
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      where.push('(o.marketplace_order_id LIKE ? OR f.notes LIKE ? OR s.name LIKE ?)');
      params.push(term, term, term);
    }
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(filters.pageSize ?? 30, 100));
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRows = await this.db.query(
      `SELECT COUNT(*) AS total FROM marketplace_fees f JOIN stores s ON s.id = f.store_id LEFT JOIN orders o ON o.id = f.order_id ${whereSql};`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);
    const rows = await this.db.query(
      `${FEE_SELECT} ${whereSql} ORDER BY f.fee_date DESC, f.created_at DESC LIMIT ? OFFSET ?;`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { items: rows.map(mapFee), total, page, pageSize };
  }

  async getById(id: string): Promise<MarketplaceFeeListItem | null> {
    const rows = await this.db.query(`${FEE_SELECT} WHERE f.id = ?;`, [id]);
    return rows[0] ? mapFee(rows[0]) : null;
  }

  async listByOrder(orderId: string): Promise<MarketplaceFee[]> {
    const rows = await this.db.query(`${FEE_SELECT} WHERE f.order_id = ? ORDER BY f.fee_date ASC;`, [
      orderId,
    ]);
    return rows.map(mapFee);
  }

  async create(data: FeeWriteData, tx?: SqlExecutor): Promise<string> {
    const id = createId();
    const timestamp = nowIso();
    await (tx ?? this.db).execute(
      `INSERT INTO marketplace_fees (id, store_id, order_id, fee_type, amount, fee_date, source, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.storeId,
        data.orderId,
        data.feeType,
        data.amount,
        data.feeDate,
        data.source,
        data.notes,
        timestamp,
        timestamp,
      ],
    );
    return id;
  }

  async update(id: string, data: FeeWriteData): Promise<void> {
    await this.db.execute(
      `UPDATE marketplace_fees SET store_id = ?, order_id = ?, fee_type = ?, amount = ?, fee_date = ?, source = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.storeId,
        data.orderId,
        data.feeType,
        data.amount,
        data.feeDate,
        data.source,
        data.notes,
        nowIso(),
        id,
      ],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM marketplace_fees WHERE id = ?;', [id]);
  }

  async findForFinance(from: string, to: string): Promise<FinanceFee[]> {
    const rows = await this.db.query(
      `SELECT store_id, fee_date, amount, source FROM marketplace_fees
       WHERE fee_date >= ? AND fee_date <= ?;`,
      [from, to],
    );
    return rows.map((row) => ({
      storeId: getString(row, 'store_id'),
      feeDate: getString(row, 'fee_date'),
      amount: getNumber(row, 'amount'),
      source: getString(row, 'source') as FeeSource,
    }));
  }

  async sumByOrder(orderId: string): Promise<number> {
    const rows = await this.db.query(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM marketplace_fees WHERE order_id = ?;',
      [orderId],
    );
    return Number(rows[0]?.total ?? 0);
  }
}
