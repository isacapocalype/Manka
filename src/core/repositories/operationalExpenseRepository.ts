import type { Database, SqlExecutor, SqlRow } from '@/core/database/types';
import type {
  ExpenseCategory,
  OperationalExpense,
  OperationalExpenseListItem,
  PagedResult,
} from '@/types/entities';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { getNullableString, getNumber, getString } from './rowUtils';
import type { FinanceOperationalExpense } from '@/types/finance';

export interface OperationalExpenseFilters {
  storeId?: string | null;
  category?: ExpenseCategory | 'all';
  from?: string | null;
  to?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface OperationalExpenseWriteData {
  storeId: string | null;
  expenseDate: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receiptNote: string | null;
}

function mapExpense(row: SqlRow): OperationalExpenseListItem {
  return {
    id: getString(row, 'id'),
    storeId: getNullableString(row, 'store_id'),
    expenseDate: getString(row, 'expense_date'),
    category: getString(row, 'category') as ExpenseCategory,
    amount: getNumber(row, 'amount'),
    description: getString(row, 'description'),
    receiptNote: getNullableString(row, 'receipt_note'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
    storeName: getNullableString(row, 'store_name'),
  };
}

const EXPENSE_SELECT = `
  SELECT oe.*, s.name AS store_name
  FROM operational_expenses oe
  LEFT JOIN stores s ON s.id = oe.store_id
`;

export class OperationalExpenseRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async list(
    filters: OperationalExpenseFilters = {},
  ): Promise<PagedResult<OperationalExpenseListItem>> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.storeId) {
      where.push('oe.store_id = ?');
      params.push(filters.storeId);
    }
    if (filters.category && filters.category !== 'all') {
      where.push('oe.category = ?');
      params.push(filters.category);
    }
    if (filters.from) {
      where.push('oe.expense_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      where.push('oe.expense_date <= ?');
      params.push(filters.to);
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      where.push('(oe.description LIKE ? OR oe.receipt_note LIKE ? OR s.name LIKE ?)');
      params.push(term, term, term);
    }
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(filters.pageSize ?? 30, 100));
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRows = await this.db.query(
      `SELECT COUNT(*) AS total FROM operational_expenses oe LEFT JOIN stores s ON s.id = oe.store_id ${whereSql};`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);
    const rows = await this.db.query(
      `${EXPENSE_SELECT} ${whereSql} ORDER BY oe.expense_date DESC, oe.created_at DESC LIMIT ? OFFSET ?;`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { items: rows.map(mapExpense), total, page, pageSize };
  }

  async getById(id: string): Promise<OperationalExpenseListItem | null> {
    const rows = await this.db.query(`${EXPENSE_SELECT} WHERE oe.id = ?;`, [id]);
    return rows[0] ? mapExpense(rows[0]) : null;
  }

  async create(data: OperationalExpenseWriteData, tx?: SqlExecutor): Promise<string> {
    const id = createId();
    const timestamp = nowIso();
    await (tx ?? this.db).execute(
      `INSERT INTO operational_expenses (id, store_id, expense_date, category, amount, description, receipt_note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.storeId,
        data.expenseDate,
        data.category,
        data.amount,
        data.description,
        data.receiptNote,
        timestamp,
        timestamp,
      ],
    );
    return id;
  }

  async update(id: string, data: OperationalExpenseWriteData): Promise<void> {
    await this.db.execute(
      `UPDATE operational_expenses SET store_id = ?, expense_date = ?, category = ?, amount = ?, description = ?, receipt_note = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.storeId,
        data.expenseDate,
        data.category,
        data.amount,
        data.description,
        data.receiptNote,
        nowIso(),
        id,
      ],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM operational_expenses WHERE id = ?;', [id]);
  }

  async findForFinance(from: string, to: string): Promise<FinanceOperationalExpense[]> {
    const rows = await this.db.query(
      `SELECT store_id, expense_date, amount FROM operational_expenses
       WHERE expense_date >= ? AND expense_date <= ?;`,
      [from, to],
    );
    return rows.map((row) => ({
      storeId: getNullableString(row, 'store_id'),
      expenseDate: getString(row, 'expense_date'),
      amount: getNumber(row, 'amount'),
    }));
  }

  async listByStore(storeId: string, limit = 10): Promise<OperationalExpense[]> {
    const rows = await this.db.query(
      `${EXPENSE_SELECT} WHERE oe.store_id = ? ORDER BY oe.expense_date DESC LIMIT ?;`,
      [storeId, limit],
    );
    return rows.map(mapExpense);
  }
}
