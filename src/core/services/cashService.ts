import type { Database, SqlExecutor } from '@/core/database/types';
import type {
  CashAccount,
  CashAccountBalance,
  CashAccountFilters,
  CashAccountInput,
  CashAccountStatus,
  CashAccountType,
  CashAmountCount,
  CashEntry,
  CashEntryDirection,
  CashEntryInput,
  CashEntrySourceType,
  CashLedgerFilters,
  CashReconciliation,
  CashReconciliationInput,
  CashReconciliationResult,
  CashSummary,
  CashTransfer,
  CashTransferInput,
} from '@/types/cash';
import {
  CASH_ACCOUNT_STATUSES,
  CASH_ACCOUNT_TYPES,
} from '@/types/cash';
import type {
  CashAccountWriteData,
  CashEntryWriteData,
  CashRepository,
  CashReconciliationWriteData,
  CashTransferWriteData,
} from '@/core/repositories/cashRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import { calculateReconciliationDifference } from '@/core/calculations/cashMath';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  isForeignKeyError,
  isUniqueConstraintError,
  optionalText,
  requireMaxLength,
  requiredText,
  validateMoney,
} from '@/core/utils/validation';
import { isValidBusinessDate } from '@/core/utils/date';
import { createId } from '@/core/utils/id';
import type { BusinessDate, Money } from '@/types/entities';

function validateType(value: string): CashAccountType {
  if (!CASH_ACCOUNT_TYPES.includes(value as CashAccountType)) {
    throw new ValidationError('Jenis rekening tidak valid.', {
      type: 'Pilih jenis rekening.',
    });
  }
  return value as CashAccountType;
}

function validateStatus(value: string): CashAccountStatus {
  if (!CASH_ACCOUNT_STATUSES.includes(value as CashAccountStatus)) {
    throw new ValidationError('Status rekening tidak valid.', {
      status: 'Pilih status rekening.',
    });
  }
  return value as CashAccountStatus;
}

function validateDirection(value: string): CashEntryDirection {
  if (value !== 'in' && value !== 'out') {
    throw new ValidationError('Arah kas tidak valid.', {
      direction: 'Pilih kas masuk atau kas keluar.',
    });
  }
  return value;
}

function validateAmount(value: number, label: string, field: string): Money {
  const amount = validateMoney(value, label, field);
  if (amount <= 0) {
    throw new ValidationError(`${label} harus lebih dari 0.`, {
      [field]: `${label} harus lebih dari 0.`,
    });
  }
  return amount;
}

function validateDate(value: string, label: string, field: string): BusinessDate {
  if (!isValidBusinessDate(value)) {
    throw new ValidationError(`${label} tidak valid.`, {
      [field]: `Pilih ${label.toLowerCase()} yang valid.`,
    });
  }
  return value;
}

export interface SourceCashPosting {
  sourceId: string;
  accountId: string | null;
  entryDate: BusinessDate;
  amount: Money;
  description: string;
  notes?: string | null;
}

export class CashService {
  private readonly db: Database;
  private readonly cash: CashRepository;
  private readonly audit: AuditRepository;

  constructor(db: Database, cash: CashRepository, audit: AuditRepository) {
    this.db = db;
    this.cash = cash;
    this.audit = audit;
  }

  listAccounts(filters: CashAccountFilters = {}): Promise<CashAccountBalance[]> {
    return this.cash.listAccounts(filters);
  }

  listForSelect(): Promise<CashAccountBalance[]> {
    return this.cash.listAccounts({ status: 'all' });
  }

  async getAccount(id: string): Promise<CashAccountBalance> {
    const account = await this.cash.getAccountBalance(id);
    if (!account) throw new NotFoundError('Rekening kas tidak ditemukan.');
    return account;
  }

  async requireAccount(accountId: string | null, field = 'accountId'): Promise<CashAccount> {
    const id = requiredText(accountId, 'Rekening kas', field);
    const account = await this.cash.getAccount(id);
    if (!account) {
      throw new ValidationError('Rekening kas tidak ditemukan.', {
        [field]: 'Pilih rekening kas yang valid.',
      });
    }
    return account;
  }

  private async normalizeAccount(input: CashAccountInput): Promise<CashAccountWriteData> {
    const name = requireMaxLength(requiredText(input.name, 'Nama rekening', 'name'), 'Nama rekening', 120, 'name');
    return {
      name,
      type: validateType(input.type),
      openingBalance: validateMoney(input.openingBalance, 'Saldo awal', 'openingBalance'),
      status: validateStatus(input.status),
      notes: optionalText(input.notes, 1000),
    };
  }

  private async assertUniqueAccount(name: string, excludeId?: string): Promise<void> {
    const duplicate = await this.cash.findAccountByName(name, excludeId);
    if (duplicate) {
      throw new ConflictError(`Rekening "${name}" sudah ada.`);
    }
  }

  async createAccount(input: CashAccountInput): Promise<CashAccountBalance> {
    const data = await this.normalizeAccount(input);
    await this.assertUniqueAccount(data.name);
    try {
      const id = await this.cash.createAccount(data);
      await this.audit.log('create', 'cash_account', id, {
        name: data.name,
        type: data.type,
        openingBalance: data.openingBalance,
      });
      return this.getAccount(id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`Rekening "${data.name}" sudah ada.`);
      }
      throw error;
    }
  }

  async updateAccount(id: string, input: CashAccountInput): Promise<CashAccountBalance> {
    await this.getAccount(id);
    const data = await this.normalizeAccount(input);
    await this.assertUniqueAccount(data.name, id);
    try {
      await this.cash.updateAccount(id, data);
      await this.audit.log('update', 'cash_account', id, {
        name: data.name,
        type: data.type,
        openingBalance: data.openingBalance,
        status: data.status,
      });
      return this.getAccount(id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`Rekening "${data.name}" sudah ada.`);
      }
      throw error;
    }
  }

  async deleteAccount(id: string): Promise<void> {
    const account = await this.getAccount(id);
    const entryCount = await this.cash.countAccountEntries(id);
    if (entryCount > 0) {
      throw new ConflictError(
        `Rekening "${account.name}" memiliki ${entryCount} riwayat kas. Arsipkan rekening agar riwayat tetap tersimpan.`,
      );
    }
    try {
      await this.cash.deleteAccount(id);
      await this.audit.log('delete', 'cash_account', id, { name: account.name });
    } catch (error) {
      if (isForeignKeyError(error)) {
        throw new ConflictError(
          `Rekening "${account.name}" masih dipakai transaksi. Arsipkan rekening atau pindahkan transaksinya terlebih dahulu.`,
        );
      }
      throw error;
    }
  }

  listEntries(filters: CashLedgerFilters = {}): Promise<{ items: CashEntry[]; total: number; page: number; pageSize: number }> {
    return this.cash.listEntries(filters);
  }

  async getEntry(id: string): Promise<CashEntry> {
    const entry = await this.cash.getEntry(id);
    if (!entry) throw new NotFoundError('Entri kas tidak ditemukan.');
    return entry;
  }

  async getBalanceAsOf(accountId: string, date: string): Promise<number> {
    await this.requireAccount(accountId);
    return this.cash.getBalanceAsOf(accountId, date);
  }

  async getSummary(): Promise<CashSummary> {
    const [accounts, pendingSettlements, unassignedSettlements, unlinkedRefunds] =
      await Promise.all([
        this.cash.listAccounts({ status: 'all' }),
        this.cash.getPendingSettlementTotals(),
        this.cash.getUnassignedSettlementTotals(),
        this.cash.getUnlinkedRefundTotals(),
      ]);
    return {
      totalBalance: accounts.reduce((total, account) => total + account.balance, 0),
      totalOpeningBalance: accounts.reduce((total, account) => total + account.openingBalance, 0),
      accountCount: accounts.length,
      accounts,
      pendingSettlements,
      unassignedSettlements,
      unlinkedRefunds,
    };
  }

  async createAdjustment(input: CashEntryInput): Promise<CashEntry> {
    const account = await this.requireAccount(input.accountId);
    const entryDate = validateDate(input.entryDate, 'Tanggal penyesuaian', 'entryDate');
    const direction = validateDirection(input.direction);
    const amount = validateAmount(input.amount, 'Nominal penyesuaian', 'amount');
    const description = requireMaxLength(
      requiredText(input.description, 'Keterangan', 'description'),
      'Keterangan',
      200,
      'description',
    );
    const sourceId = createId();
    const entry = await this.cash.createManualEntry({
      accountId: account.id,
      entryDate,
      direction,
      amount,
      sourceType: 'adjustment',
      sourceId,
      description,
      notes: optionalText(input.notes, 1000),
    });
    await this.audit.log('create', 'cash_entry', entry.id, {
      accountId: account.id,
      direction,
      amount,
      sourceType: 'adjustment',
    });
    return entry;
  }

  async listTransfers(limit = 20): Promise<CashTransfer[]> {
    return this.cash.listTransfers(limit);
  }

  async createTransfer(input: CashTransferInput): Promise<CashTransfer> {
    const fromAccount = await this.requireAccount(input.fromAccountId, 'fromAccountId');
    const toAccount = await this.requireAccount(input.toAccountId, 'toAccountId');
    if (fromAccount.id === toAccount.id) {
      throw new ValidationError('Rekening asal dan tujuan harus berbeda.', {
        toAccountId: 'Pilih rekening tujuan yang berbeda.',
      });
    }
    const transferDate = validateDate(input.transferDate, 'Tanggal transfer', 'transferDate');
    const amount = validateAmount(input.amount, 'Nominal transfer', 'amount');
    const data: CashTransferWriteData = {
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      transferDate,
      amount,
      notes: optionalText(input.notes, 1000),
    };
    const id = await this.db.transaction((tx) => this.cash.createTransfer(data, tx));
    await this.audit.log('create', 'cash_transfer', id, {
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      amount,
    });
    const transfer = await this.cash.getTransfer(id);
    if (!transfer) throw new Error('Transfer kas gagal disimpan.');
    return transfer;
  }

  async deleteTransfer(id: string): Promise<void> {
    const transfer = await this.cash.getTransfer(id);
    if (!transfer) throw new NotFoundError('Transfer kas tidak ditemukan.');
    await this.db.transaction((tx) => this.cash.deleteTransfer(id, tx));
    await this.audit.log('delete', 'cash_transfer', id, {
      amount: transfer.amount,
      fromAccountId: transfer.fromAccountId,
      toAccountId: transfer.toAccountId,
    });
  }

  listReconciliations(accountId?: string | null, limit = 20): Promise<CashReconciliation[]> {
    return this.cash.listReconciliations(accountId, limit);
  }

  async createReconciliation(input: CashReconciliationInput): Promise<CashReconciliationResult> {
    const account = await this.requireAccount(input.accountId);
    const reconciliationDate = validateDate(
      input.reconciliationDate,
      'Tanggal rekonsiliasi',
      'reconciliationDate',
    );
    const statementBalance = validateMoney(
      input.statementBalance,
      'Saldo rekening',
      'statementBalance',
    );
    const bookBalance = await this.cash.getBalanceAsOf(account.id, reconciliationDate);
    const difference = calculateReconciliationDifference(statementBalance, bookBalance);
    const data: CashReconciliationWriteData = {
      accountId: account.id,
      reconciliationDate,
      statementBalance,
      bookBalance,
      difference,
      notes: optionalText(input.notes, 1000),
    };
    const result = await this.db.transaction(async (tx) => {
      const reconciliationId = await this.cash.createReconciliation(data, tx);
      let adjustmentEntryId: string | null = null;
      if (input.createAdjustment && difference !== 0) {
        const entry = await this.cash.createManualEntry(
          {
            accountId: account.id,
            entryDate: reconciliationDate,
            direction: difference > 0 ? 'in' : 'out',
            amount: Math.abs(difference),
            sourceType: 'adjustment',
            sourceId: reconciliationId,
            description: `Penyesuaian rekonsiliasi ${account.name}`,
            notes: `Saldo rekening ${statementBalance}, saldo buku ${bookBalance}.`,
          },
          tx,
        );
        adjustmentEntryId = entry.id;
      }
      return { reconciliationId, adjustmentEntryId };
    });
    await this.audit.log('create', 'cash_reconciliation', result.reconciliationId, {
      accountId: account.id,
      statementBalance,
      bookBalance,
      difference,
      adjustmentEntryId: result.adjustmentEntryId,
    });
    const reconciliation = await this.cash.getReconciliation(result.reconciliationId);
    if (!reconciliation) throw new Error('Rekonsiliasi gagal disimpan.');
    return { reconciliation, adjustmentEntryId: result.adjustmentEntryId };
  }

  // ---------------------------------------------------------------------------
  // Posting otomatis dari transaksi keuangan
  // ---------------------------------------------------------------------------

  private async syncSourceEntry(
    sourceType: CashEntrySourceType,
    direction: CashEntryDirection,
    posting: SourceCashPosting,
    shouldPost: boolean,
    tx?: SqlExecutor,
  ): Promise<void> {
    if (!shouldPost || !posting.accountId || posting.amount <= 0) {
      await this.cash.deleteSourceEntries(sourceType, posting.sourceId, tx);
      return;
    }
    const data: CashEntryWriteData = {
      accountId: posting.accountId,
      entryDate: posting.entryDate,
      direction,
      amount: posting.amount,
      sourceType,
      sourceId: posting.sourceId,
      description: posting.description,
      notes: posting.notes ?? null,
    };
    await this.cash.syncSourceEntry(data, tx);
  }

  async syncSettlement(
    settlementId: string,
    data: {
      accountId: string | null;
      settlementNo: string;
      settlementDate: string;
      totalPayout: number;
      status: string;
      notes: string | null;
    },
    tx?: SqlExecutor,
  ): Promise<void> {
    await this.syncSourceEntry(
      'settlement',
      'in',
      {
        sourceId: settlementId,
        accountId: data.accountId,
        entryDate: data.settlementDate,
        amount: data.totalPayout,
        description: `Settlement ${data.settlementNo}`,
        notes: data.notes,
      },
      data.status === 'received',
      tx,
    );
  }

  async syncOperationalExpense(
    expenseId: string,
    data: {
      accountId: string | null;
      expenseDate: string;
      amount: number;
      description: string;
      isPaid: boolean;
      receiptNote: string | null;
    },
    tx?: SqlExecutor,
  ): Promise<void> {
    await this.syncSourceEntry(
      'operational_expense',
      'out',
      {
        sourceId: expenseId,
        accountId: data.accountId,
        entryDate: data.expenseDate,
        amount: data.amount,
        description: data.description,
        notes: data.receiptNote,
      },
      data.isPaid,
      tx,
    );
  }

  async syncAdvertisingExpense(
    expenseId: string,
    data: {
      accountId: string | null;
      expenseDate: string;
      amount: number;
      description: string;
      isPaid: boolean;
      notes: string | null;
    },
    tx?: SqlExecutor,
  ): Promise<void> {
    await this.syncSourceEntry(
      'advertising_expense',
      'out',
      {
        sourceId: expenseId,
        accountId: data.accountId,
        entryDate: data.expenseDate,
        amount: data.amount,
        description: data.description,
        notes: data.notes,
      },
      data.isPaid,
      tx,
    );
  }

  async syncRefund(
    refundId: string,
    data: {
      accountId: string | null;
      settlementId: string | null;
      refundDate: string;
      amount: number;
      description: string;
      status: string;
      notes: string | null;
    },
    tx?: SqlExecutor,
  ): Promise<void> {
    await this.syncSourceEntry(
      'refund',
      'out',
      {
        sourceId: refundId,
        accountId: data.accountId,
        entryDate: data.refundDate,
        amount: data.amount,
        description: data.description,
        notes: data.notes,
      },
      data.status === 'completed' && data.settlementId === null,
      tx,
    );
  }

  async removeSourceEntries(
    sourceType: CashEntrySourceType,
    sourceId: string,
    tx?: SqlExecutor,
  ): Promise<void> {
    await this.cash.deleteSourceEntries(sourceType, sourceId, tx);
  }
}

export type { CashAmountCount };
