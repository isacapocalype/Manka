import type { Database, SqlExecutor, SqlRow } from '@/core/database/types';
import type {
  OrderStatus,
  PagedResult,
  Refund,
  RefundListItem,
  RefundStatus,
} from '@/types/entities';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { getNullableString, getNumber, getString } from './rowUtils';
import type { FinanceRefund } from '@/types/finance';

export interface RefundFilters {
  storeId?: string | null;
  status?: RefundStatus | 'all';
  from?: string | null;
  to?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface RefundWriteData {
  orderId: string;
  storeId: string;
  settlementId: string | null;
  refundDate: string;
  amount: number;
  quantity: number;
  reason: string;
  status: RefundStatus;
  notes: string | null;
}

function toOrderStatus(value: string): OrderStatus {
  return value as OrderStatus;
}

function mapRefund(row: SqlRow): RefundListItem {
  return {
    id: getString(row, 'id'),
    storeId: getString(row, 'store_id'),
    orderId: getString(row, 'order_id'),
    settlementId: getNullableString(row, 'settlement_id'),
    refundDate: getString(row, 'refund_date'),
    amount: getNumber(row, 'amount'),
    quantity: getNumber(row, 'quantity'),
    reason: getString(row, 'reason'),
    status: getString(row, 'status') as RefundStatus,
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
    storeName: getString(row, 'store_name'),
    marketplaceOrderId: getString(row, 'marketplace_order_id'),
    orderStatus: toOrderStatus(getString(row, 'order_status')),
  };
}

const REFUND_SELECT = `
  SELECT r.*, s.name AS store_name, o.marketplace_order_id AS marketplace_order_id, o.status AS order_status
  FROM refunds r
  JOIN stores s ON s.id = r.store_id
  JOIN orders o ON o.id = r.order_id
`;

export class RefundRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async list(filters: RefundFilters = {}): Promise<PagedResult<RefundListItem>> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.storeId) {
      where.push('r.store_id = ?');
      params.push(filters.storeId);
    }
    if (filters.status && filters.status !== 'all') {
      where.push('r.status = ?');
      params.push(filters.status);
    }
    if (filters.from) {
      where.push('r.refund_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      where.push('r.refund_date <= ?');
      params.push(filters.to);
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      where.push('(o.marketplace_order_id LIKE ? OR r.reason LIKE ? OR s.name LIKE ?)');
      params.push(term, term, term);
    }
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(filters.pageSize ?? 30, 100));
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRows = await this.db.query(
      `SELECT COUNT(*) AS total FROM refunds r JOIN stores s ON s.id = r.store_id JOIN orders o ON o.id = r.order_id ${whereSql};`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);
    const rows = await this.db.query(
      `${REFUND_SELECT} ${whereSql} ORDER BY r.refund_date DESC, r.created_at DESC LIMIT ? OFFSET ?;`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { items: rows.map(mapRefund), total, page, pageSize };
  }

  async getById(id: string): Promise<RefundListItem | null> {
    const rows = await this.db.query(`${REFUND_SELECT} WHERE r.id = ?;`, [id]);
    return rows[0] ? mapRefund(rows[0]) : null;
  }

  async listByOrder(orderId: string): Promise<Refund[]> {
    const rows = await this.db.query(`${REFUND_SELECT} WHERE r.order_id = ? ORDER BY r.refund_date DESC;`, [
      orderId,
    ]);
    return rows.map(mapRefund);
  }

  async create(data: RefundWriteData, tx?: SqlExecutor): Promise<string> {
    const id = createId();
    const timestamp = nowIso();
    await (tx ?? this.db).execute(
      `INSERT INTO refunds (id, store_id, order_id, settlement_id, refund_date, amount, quantity, reason, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.storeId,
        data.orderId,
        data.settlementId,
        data.refundDate,
        data.amount,
        data.quantity,
        data.reason,
        data.status,
        data.notes,
        timestamp,
        timestamp,
      ],
    );
    return id;
  }

  async update(id: string, data: RefundWriteData): Promise<void> {
    await this.db.execute(
      `UPDATE refunds SET store_id = ?, order_id = ?, settlement_id = ?, refund_date = ?, amount = ?, quantity = ?,
        reason = ?, status = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.storeId,
        data.orderId,
        data.settlementId,
        data.refundDate,
        data.amount,
        data.quantity,
        data.reason,
        data.status,
        data.notes,
        nowIso(),
        id,
      ],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM refunds WHERE id = ?;', [id]);
  }

  async countBySettlement(settlementId: string): Promise<number> {
    const rows = await this.db.query(
      'SELECT COUNT(*) AS total FROM refunds WHERE settlement_id = ?;',
      [settlementId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async findForFinance(from: string, to: string): Promise<FinanceRefund[]> {
    const rows = await this.db.query(
      `SELECT r.store_id, r.order_id, r.refund_date, r.amount, r.status, o.status AS order_status
       FROM refunds r
       JOIN orders o ON o.id = r.order_id
       WHERE r.refund_date >= ? AND r.refund_date <= ?;`,
      [from, to],
    );
    return rows.map((row) => ({
      storeId: getString(row, 'store_id'),
      orderId: getString(row, 'order_id'),
      refundDate: getString(row, 'refund_date'),
      amount: getNumber(row, 'amount'),
      status: getString(row, 'status') as RefundStatus,
      orderStatus: toOrderStatus(getString(row, 'order_status')),
    }));
  }

  /** Refund yang terhubung ke pesanan pada rentang tanggal pesanan. */
  async findByOrderDateRange(from: string, to: string): Promise<FinanceRefund[]> {
    const rows = await this.db.query(
      `SELECT r.store_id, r.order_id, r.refund_date, r.amount, r.status, o.status AS order_status
       FROM refunds r
       JOIN orders o ON o.id = r.order_id
       WHERE o.order_date >= ? AND o.order_date <= ?;`,
      [from, to],
    );
    return rows.map((row) => ({
      storeId: getString(row, 'store_id'),
      orderId: getString(row, 'order_id'),
      refundDate: getString(row, 'refund_date'),
      amount: getNumber(row, 'amount'),
      status: getString(row, 'status') as RefundStatus,
      orderStatus: toOrderStatus(getString(row, 'order_status')),
    }));
  }
}
