import type { Database, SqlExecutor, SqlRow } from '@/core/database/types';
import type {
  PagedResult,
  Settlement,
  SettlementListItem,
  SettlementStatus,
} from '@/types/entities';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { getNullableString, getNumber, getString } from './rowUtils';

export interface SettlementFilters {
  storeId?: string | null;
  status?: SettlementStatus | 'all';
  from?: string | null;
  to?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SettlementWriteData {
  storeId: string;
  settlementNo: string;
  settlementDate: string;
  grossSales: number;
  totalDeductions: number;
  totalPayout: number;
  status: SettlementStatus;
  notes: string | null;
}

function mapSettlement(row: SqlRow): SettlementListItem {
  return {
    id: getString(row, 'id'),
    storeId: getString(row, 'store_id'),
    settlementNo: getString(row, 'settlement_no'),
    settlementDate: getString(row, 'settlement_date'),
    grossSales: getNumber(row, 'gross_sales'),
    totalDeductions: getNumber(row, 'total_deductions'),
    totalPayout: getNumber(row, 'total_payout'),
    status: getString(row, 'status') as SettlementStatus,
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
    storeName: getString(row, 'store_name'),
  };
}

const SETTLEMENT_SELECT = `
  SELECT st.*, s.name AS store_name
  FROM settlements st
  JOIN stores s ON s.id = st.store_id
`;

export class SettlementRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async list(filters: SettlementFilters = {}): Promise<PagedResult<SettlementListItem>> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.storeId) {
      where.push('st.store_id = ?');
      params.push(filters.storeId);
    }
    if (filters.status && filters.status !== 'all') {
      where.push('st.status = ?');
      params.push(filters.status);
    }
    if (filters.from) {
      where.push('st.settlement_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      where.push('st.settlement_date <= ?');
      params.push(filters.to);
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      where.push('(st.settlement_no LIKE ? OR st.notes LIKE ? OR s.name LIKE ?)');
      params.push(term, term, term);
    }
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(filters.pageSize ?? 30, 100));
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRows = await this.db.query(
      `SELECT COUNT(*) AS total FROM settlements st JOIN stores s ON s.id = st.store_id ${whereSql};`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);
    const rows = await this.db.query(
      `${SETTLEMENT_SELECT} ${whereSql} ORDER BY st.settlement_date DESC, st.created_at DESC LIMIT ? OFFSET ?;`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { items: rows.map(mapSettlement), total, page, pageSize };
  }

  async getById(id: string): Promise<SettlementListItem | null> {
    const rows = await this.db.query(`${SETTLEMENT_SELECT} WHERE st.id = ?;`, [id]);
    return rows[0] ? mapSettlement(rows[0]) : null;
  }

  async findByNumber(storeId: string, settlementNo: string): Promise<Settlement | null> {
    const rows = await this.db.query(
      'SELECT * FROM settlements WHERE store_id = ? AND settlement_no = ?;',
      [storeId, settlementNo],
    );
    if (!rows[0]) return null;
    const row = rows[0];
    return {
      id: getString(row, 'id'),
      storeId: getString(row, 'store_id'),
      settlementNo: getString(row, 'settlement_no'),
      settlementDate: getString(row, 'settlement_date'),
      grossSales: getNumber(row, 'gross_sales'),
      totalDeductions: getNumber(row, 'total_deductions'),
      totalPayout: getNumber(row, 'total_payout'),
      status: getString(row, 'status') as SettlementStatus,
      notes: getNullableString(row, 'notes'),
      createdAt: getString(row, 'created_at'),
      updatedAt: getString(row, 'updated_at'),
    };
  }

  async listForSelect(storeId?: string | null): Promise<Settlement[]> {
    const params: string[] = [];
    let where = '';
    if (storeId) {
      where = 'WHERE store_id = ?';
      params.push(storeId);
    }
    const rows = await this.db.query(
      `SELECT * FROM settlements ${where} ORDER BY settlement_date DESC LIMIT 200;`,
      params,
    );
    return rows.map((row) => {
      const item = mapSettlement({
        ...row,
        store_name: '',
      });
      return {
        id: item.id,
        storeId: item.storeId,
        settlementNo: item.settlementNo,
        settlementDate: item.settlementDate,
        grossSales: item.grossSales,
        totalDeductions: item.totalDeductions,
        totalPayout: item.totalPayout,
        status: item.status,
        notes: item.notes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
  }

  async create(data: SettlementWriteData, tx?: SqlExecutor): Promise<string> {
    const id = createId();
    const timestamp = nowIso();
    await (tx ?? this.db).execute(
      `INSERT INTO settlements (id, store_id, settlement_no, settlement_date, gross_sales, total_deductions, total_payout, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.storeId,
        data.settlementNo,
        data.settlementDate,
        data.grossSales,
        data.totalDeductions,
        data.totalPayout,
        data.status,
        data.notes,
        timestamp,
        timestamp,
      ],
    );
    return id;
  }

  async update(id: string, data: SettlementWriteData): Promise<void> {
    await this.db.execute(
      `UPDATE settlements SET store_id = ?, settlement_no = ?, settlement_date = ?, gross_sales = ?, total_deductions = ?,
        total_payout = ?, status = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.storeId,
        data.settlementNo,
        data.settlementDate,
        data.grossSales,
        data.totalDeductions,
        data.totalPayout,
        data.status,
        data.notes,
        nowIso(),
        id,
      ],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM settlements WHERE id = ?;', [id]);
  }

  async sumReceived(from: string, to: string, storeId?: string | null): Promise<number> {
    const params: (string | number)[] = [from, to];
    let storeSql = '';
    if (storeId) {
      storeSql = ' AND store_id = ?';
      params.push(storeId);
    }
    const rows = await this.db.query(
      `SELECT COALESCE(SUM(total_payout), 0) AS total FROM settlements
       WHERE status = 'received' AND settlement_date >= ? AND settlement_date <= ?${storeSql};`,
      params,
    );
    return Number(rows[0]?.total ?? 0);
  }
}
