import type { Database, SqlExecutor, SqlRow } from '@/core/database/types';
import type {
  CashAccount,
  CashAccountBalance,
  CashAccountFilters,
  CashAccountStatus,
  CashAccountType,
  CashAmountCount,
  CashEntry,
  CashEntryDirection,
  CashEntrySourceType,
  CashLedgerFilters,
  CashReconciliation,
  CashTransfer,
} from '@/types/cash';
import type { PagedResult } from '@/types/entities';
import { calculateCashBalance } from '@/core/calculations/cashMath';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { getNullableString, getNumber, getString } from './rowUtils';

export interface CashAccountWriteData {
  name: string;
  type: CashAccountType;
  openingBalance: number;
  status: CashAccountStatus;
  notes: string | null;
}

export interface CashEntryWriteData {
  accountId: string;
  entryDate: string;
  direction: CashEntryDirection;
  amount: number;
  sourceType: CashEntrySourceType;
  sourceId: string | null;
  description: string;
  notes: string | null;
}

export interface CashTransferWriteData {
  fromAccountId: string;
  toAccountId: string;
  transferDate: string;
  amount: number;
  notes: string | null;
}

export interface CashReconciliationWriteData {
  accountId: string;
  reconciliationDate: string;
  statementBalance: number;
  bookBalance: number;
  difference: number;
  notes: string | null;
}

interface CashEntryLite {
  accountId: string;
  direction: CashEntryDirection;
  amount: number;
  entryDate: string;
}

function mapAccount(row: SqlRow): CashAccount {
  return {
    id: getString(row, 'id'),
    name: getString(row, 'name'),
    type: getString(row, 'type') as CashAccountType,
    openingBalance: getNumber(row, 'opening_balance'),
    status: getString(row, 'status') as CashAccountStatus,
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
  };
}

function mapEntry(row: SqlRow): CashEntry {
  return {
    id: getString(row, 'id'),
    accountId: getString(row, 'account_id'),
    accountName: getString(row, 'account_name'),
    entryDate: getString(row, 'entry_date'),
    direction: getString(row, 'direction') as CashEntryDirection,
    amount: getNumber(row, 'amount'),
    sourceType: getString(row, 'source_type') as CashEntrySourceType,
    sourceId: getNullableString(row, 'source_id'),
    description: getString(row, 'description'),
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
  };
}

function mapTransfer(row: SqlRow): CashTransfer {
  return {
    id: getString(row, 'id'),
    fromAccountId: getString(row, 'from_account_id'),
    fromAccountName: getString(row, 'from_account_name'),
    toAccountId: getString(row, 'to_account_id'),
    toAccountName: getString(row, 'to_account_name'),
    transferDate: getString(row, 'transfer_date'),
    amount: getNumber(row, 'amount'),
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
  };
}

function mapReconciliation(row: SqlRow): CashReconciliation {
  return {
    id: getString(row, 'id'),
    accountId: getString(row, 'account_id'),
    accountName: getString(row, 'account_name'),
    reconciliationDate: getString(row, 'reconciliation_date'),
    statementBalance: getNumber(row, 'statement_balance'),
    bookBalance: getNumber(row, 'book_balance'),
    difference: getNumber(row, 'difference'),
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
  };
}

const ENTRY_SELECT = `
  SELECT ce.*, ca.name AS account_name
  FROM cash_entries ce
  JOIN cash_accounts ca ON ca.id = ce.account_id
`;

const TRANSFER_SELECT = `
  SELECT ct.*, source.name AS from_account_name, destination.name AS to_account_name
  FROM cash_transfers ct
  JOIN cash_accounts source ON source.id = ct.from_account_id
  JOIN cash_accounts destination ON destination.id = ct.to_account_id
`;

const RECONCILIATION_SELECT = `
  SELECT cr.*, ca.name AS account_name
  FROM cash_reconciliations cr
  JOIN cash_accounts ca ON ca.id = cr.account_id
`;

export class CashRepository {
  readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  private executor(tx?: SqlExecutor): SqlExecutor {
    return tx ?? this.db;
  }

  // ---------------------------------------------------------------------------
  // Akun kas
  // ---------------------------------------------------------------------------

  async listAccounts(filters: CashAccountFilters = {}): Promise<CashAccountBalance[]> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.status && filters.status !== 'all') {
      where.push('status = ?');
      params.push(filters.status);
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      where.push('(name LIKE ? OR notes LIKE ?)');
      params.push(term, term);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [accountRows, entryRows] = await Promise.all([
      this.db.query(
        `SELECT * FROM cash_accounts ${whereSql} ORDER BY status = 'archived', name COLLATE NOCASE ASC;`,
        params,
      ),
      this.db.query<SqlRow>(
        'SELECT account_id, entry_date, direction, amount FROM cash_entries ORDER BY entry_date ASC;',
      ),
    ]);
    const entriesByAccount = new Map<string, CashEntryLite[]>();
    for (const row of entryRows) {
      const accountId = getString(row, 'account_id');
      const list = entriesByAccount.get(accountId) ?? [];
      list.push({
        accountId,
        entryDate: getString(row, 'entry_date'),
        direction: getString(row, 'direction') as CashEntryDirection,
        amount: getNumber(row, 'amount'),
      });
      entriesByAccount.set(accountId, list);
    }
    return accountRows.map((row) => {
      const account = mapAccount(row);
      const entries = entriesByAccount.get(account.id) ?? [];
      return {
        ...account,
        balance: calculateCashBalance(account.openingBalance, entries),
        entryCount: entries.length,
        lastEntryDate: entries.reduce<string | null>(
          (latest, entry) => (latest === null || entry.entryDate > latest ? entry.entryDate : latest),
          null,
        ),
      };
    });
  }

  async getAccount(id: string, tx?: SqlExecutor): Promise<CashAccount | null> {
    const rows = await this.executor(tx).query('SELECT * FROM cash_accounts WHERE id = ?;', [id]);
    return rows[0] ? mapAccount(rows[0]) : null;
  }

  async getAccountBalance(id: string): Promise<CashAccountBalance | null> {
    const account = await this.getAccount(id);
    if (!account) return null;
    const entries = await this.listEntryLite(id);
    return {
      ...account,
      balance: calculateCashBalance(account.openingBalance, entries),
      entryCount: entries.length,
      lastEntryDate: entries.reduce<string | null>(
        (latest, entry) => (latest === null || entry.entryDate > latest ? entry.entryDate : latest),
        null,
      ),
    };
  }

  async findAccountByName(name: string, excludeId?: string): Promise<CashAccount | null> {
    const rows = await this.db.query(
      'SELECT * FROM cash_accounts WHERE name = ? COLLATE NOCASE;',
      [name],
    );
    if (!rows[0]) return null;
    const account = mapAccount(rows[0]);
    return excludeId && account.id === excludeId ? null : account;
  }

  async createAccount(data: CashAccountWriteData, tx?: SqlExecutor): Promise<string> {
    const id = createId();
    const timestamp = nowIso();
    await this.executor(tx).execute(
      `INSERT INTO cash_accounts (id, name, type, opening_balance, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.name,
        data.type,
        data.openingBalance,
        data.status,
        data.notes,
        timestamp,
        timestamp,
      ],
    );
    return id;
  }

  async updateAccount(id: string, data: CashAccountWriteData, tx?: SqlExecutor): Promise<void> {
    await this.executor(tx).execute(
      `UPDATE cash_accounts SET name = ?, type = ?, opening_balance = ?, status = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [data.name, data.type, data.openingBalance, data.status, data.notes, nowIso(), id],
    );
  }

  async deleteAccount(id: string, tx?: SqlExecutor): Promise<void> {
    await this.executor(tx).execute('DELETE FROM cash_accounts WHERE id = ?;', [id]);
  }

  async countAccountEntries(accountId: string): Promise<number> {
    const rows = await this.db.query(
      'SELECT COUNT(*) AS total FROM cash_entries WHERE account_id = ?;',
      [accountId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  // ---------------------------------------------------------------------------
  // Buku besar
  // ---------------------------------------------------------------------------

  private async listEntryLite(accountId: string, throughDate?: string): Promise<CashEntryLite[]> {
    const params: string[] = [accountId];
    let dateSql = '';
    if (throughDate) {
      dateSql = ' AND entry_date <= ?';
      params.push(throughDate);
    }
    const rows = await this.db.query(
      `SELECT account_id, entry_date, direction, amount FROM cash_entries
       WHERE account_id = ?${dateSql} ORDER BY entry_date ASC, created_at ASC;`,
      params,
    );
    return rows.map((row) => ({
      accountId: getString(row, 'account_id'),
      entryDate: getString(row, 'entry_date'),
      direction: getString(row, 'direction') as CashEntryDirection,
      amount: getNumber(row, 'amount'),
    }));
  }

  async getBalanceAsOf(accountId: string, date: string): Promise<number> {
    const account = await this.getAccount(accountId);
    if (!account) return 0;
    const entries = await this.listEntryLite(accountId, date);
    return calculateCashBalance(account.openingBalance, entries);
  }

  async listEntries(filters: CashLedgerFilters = {}): Promise<PagedResult<CashEntry>> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.accountId) {
      where.push('ce.account_id = ?');
      params.push(filters.accountId);
    }
    if (filters.direction && filters.direction !== 'all') {
      where.push('ce.direction = ?');
      params.push(filters.direction);
    }
    if (filters.sourceType && filters.sourceType !== 'all') {
      where.push('ce.source_type = ?');
      params.push(filters.sourceType);
    }
    if (filters.from) {
      where.push('ce.entry_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      where.push('ce.entry_date <= ?');
      params.push(filters.to);
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      where.push('(ce.description LIKE ? OR ce.notes LIKE ? OR ca.name LIKE ?)');
      params.push(term, term, term);
    }
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(filters.pageSize ?? 30, 100));
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRows = await this.db.query(
      `SELECT COUNT(*) AS total FROM cash_entries ce JOIN cash_accounts ca ON ca.id = ce.account_id ${whereSql};`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);
    const rows = await this.db.query(
      `${ENTRY_SELECT} ${whereSql} ORDER BY ce.entry_date DESC, ce.created_at DESC LIMIT ? OFFSET ?;`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { items: rows.map(mapEntry), total, page, pageSize };
  }

  async getEntry(id: string, tx?: SqlExecutor): Promise<CashEntry | null> {
    const rows = await this.executor(tx).query(`${ENTRY_SELECT} WHERE ce.id = ?;`, [id]);
    return rows[0] ? mapEntry(rows[0]) : null;
  }

  async findSourceEntries(
    sourceType: CashEntrySourceType,
    sourceId: string,
    tx?: SqlExecutor,
  ): Promise<CashEntry[]> {
    const rows = await this.executor(tx).query(
      `${ENTRY_SELECT} WHERE ce.source_type = ? AND ce.source_id = ? ORDER BY ce.created_at ASC;`,
      [sourceType, sourceId],
    );
    return rows.map(mapEntry);
  }

  async deleteSourceEntries(
    sourceType: CashEntrySourceType,
    sourceId: string,
    tx?: SqlExecutor,
  ): Promise<void> {
    await this.executor(tx).execute(
      'DELETE FROM cash_entries WHERE source_type = ? AND source_id = ?;',
      [sourceType, sourceId],
    );
  }

  async createEntry(data: CashEntryWriteData, tx?: SqlExecutor): Promise<string> {
    const id = createId();
    const timestamp = nowIso();
    await this.executor(tx).execute(
      `INSERT INTO cash_entries
        (id, account_id, entry_date, direction, amount, source_type, source_id, description, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.accountId,
        data.entryDate,
        data.direction,
        data.amount,
        data.sourceType,
        data.sourceId,
        data.description,
        data.notes,
        timestamp,
        timestamp,
      ],
    );
    return id;
  }

  async updateEntry(id: string, data: CashEntryWriteData, tx?: SqlExecutor): Promise<void> {
    await this.executor(tx).execute(
      `UPDATE cash_entries SET account_id = ?, entry_date = ?, direction = ?, amount = ?, source_type = ?,
        source_id = ?, description = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.accountId,
        data.entryDate,
        data.direction,
        data.amount,
        data.sourceType,
        data.sourceId,
        data.description,
        data.notes,
        nowIso(),
        id,
      ],
    );
  }

  async deleteEntry(id: string, tx?: SqlExecutor): Promise<void> {
    await this.executor(tx).execute('DELETE FROM cash_entries WHERE id = ?;', [id]);
  }

  /** Membuat atau memperbarui satu entri untuk sumber tertentu (idempoten). */
  async syncSourceEntry(data: CashEntryWriteData, tx?: SqlExecutor): Promise<void> {
    if (!data.sourceId) {
      throw new Error('Entri kas terhubung sumber wajib memiliki sourceId.');
    }
    const existing = await this.findSourceEntries(data.sourceType, data.sourceId, tx);
    if (existing.length === 0) {
      await this.createEntry(data, tx);
      return;
    }
    await this.updateEntry(existing[0]!.id, data, tx);
    for (const extra of existing.slice(1)) {
      await this.deleteEntry(extra.id, tx);
    }
  }

  async createManualEntry(data: CashEntryWriteData, tx?: SqlExecutor): Promise<CashEntry> {
    const id = await this.createEntry(data, tx);
    const entry = await this.getEntry(id, tx);
    if (!entry) throw new Error('Entri kas gagal disimpan.');
    return entry;
  }

  // ---------------------------------------------------------------------------
  // Transfer
  // ---------------------------------------------------------------------------

  async listTransfers(limit = 20): Promise<CashTransfer[]> {
    const rows = await this.db.query(
      `${TRANSFER_SELECT} ORDER BY ct.transfer_date DESC, ct.created_at DESC LIMIT ?;`,
      [Math.max(1, Math.min(limit, 100))],
    );
    return rows.map(mapTransfer);
  }

  async getTransfer(id: string): Promise<CashTransfer | null> {
    const rows = await this.db.query(`${TRANSFER_SELECT} WHERE ct.id = ?;`, [id]);
    return rows[0] ? mapTransfer(rows[0]) : null;
  }

  async createTransfer(data: CashTransferWriteData, tx?: SqlExecutor): Promise<string> {
    const id = createId();
    const timestamp = nowIso();
    const from = await this.getAccount(data.fromAccountId, tx);
    const to = await this.getAccount(data.toAccountId, tx);
    if (!from || !to) throw new Error('Rekening transfer tidak ditemukan.');
    await this.executor(tx).execute(
      `INSERT INTO cash_transfers
        (id, from_account_id, to_account_id, transfer_date, amount, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.fromAccountId,
        data.toAccountId,
        data.transferDate,
        data.amount,
        data.notes,
        timestamp,
        timestamp,
      ],
    );
    await this.executor(tx).execute(
      `INSERT INTO cash_entries
        (id, account_id, entry_date, direction, amount, source_type, source_id, description, notes, created_at, updated_at)
       VALUES (?, ?, ?, 'out', ?, 'transfer', ?, ?, ?, ?, ?);`,
      [
        createId(),
        data.fromAccountId,
        data.transferDate,
        data.amount,
        id,
        `Transfer ke ${to.name}`,
        data.notes,
        timestamp,
        timestamp,
      ],
    );
    await this.executor(tx).execute(
      `INSERT INTO cash_entries
        (id, account_id, entry_date, direction, amount, source_type, source_id, description, notes, created_at, updated_at)
       VALUES (?, ?, ?, 'in', ?, 'transfer', ?, ?, ?, ?, ?);`,
      [
        createId(),
        data.toAccountId,
        data.transferDate,
        data.amount,
        id,
        `Transfer dari ${from.name}`,
        data.notes,
        timestamp,
        timestamp,
      ],
    );
    return id;
  }

  async deleteTransfer(id: string, tx?: SqlExecutor): Promise<void> {
    await this.deleteSourceEntries('transfer', id, tx);
    await this.executor(tx).execute('DELETE FROM cash_transfers WHERE id = ?;', [id]);
  }

  // ---------------------------------------------------------------------------
  // Rekonsiliasi
  // ---------------------------------------------------------------------------

  async listReconciliations(accountId?: string | null, limit = 20): Promise<CashReconciliation[]> {
    const params: (string | number)[] = [];
    let where = '';
    if (accountId) {
      where = 'WHERE cr.account_id = ?';
      params.push(accountId);
    }
    params.push(Math.max(1, Math.min(limit, 100)));
    const rows = await this.db.query(
      `${RECONCILIATION_SELECT} ${where} ORDER BY cr.reconciliation_date DESC, cr.created_at DESC LIMIT ?;`,
      params,
    );
    return rows.map(mapReconciliation);
  }

  async getReconciliation(id: string): Promise<CashReconciliation | null> {
    const rows = await this.db.query(`${RECONCILIATION_SELECT} WHERE cr.id = ?;`, [id]);
    return rows[0] ? mapReconciliation(rows[0]) : null;
  }

  async createReconciliation(
    data: CashReconciliationWriteData,
    tx?: SqlExecutor,
  ): Promise<string> {
    const id = createId();
    await this.executor(tx).execute(
      `INSERT INTO cash_reconciliations
        (id, account_id, reconciliation_date, statement_balance, book_balance, difference, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.accountId,
        data.reconciliationDate,
        data.statementBalance,
        data.bookBalance,
        data.difference,
        data.notes,
        nowIso(),
      ],
    );
    return id;
  }

  // ---------------------------------------------------------------------------
  // Ringkasan
  // ---------------------------------------------------------------------------

  async getPendingSettlementTotals(): Promise<CashAmountCount> {
    return this.getSettlementTotals("status = 'pending'");
  }

  async getUnassignedSettlementTotals(): Promise<CashAmountCount> {
    return this.getSettlementTotals("status = 'received' AND account_id IS NULL");
  }

  private async getSettlementTotals(where: string): Promise<CashAmountCount> {
    const rows = await this.db.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(total_payout), 0) AS amount FROM settlements WHERE ${where};`,
    );
    return {
      count: Number(rows[0]?.total ?? 0),
      amount: Number(rows[0]?.amount ?? 0),
    };
  }

  async getUnlinkedRefundTotals(): Promise<CashAmountCount> {
    const rows = await this.db.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS amount FROM refunds
       WHERE status = 'completed' AND settlement_id IS NULL;`,
    );
    return {
      count: Number(rows[0]?.total ?? 0),
      amount: Number(rows[0]?.amount ?? 0),
    };
  }
}
