import type {
  ExpenseCategory,
  OperationalExpenseInput,
  OperationalExpenseListItem,
  PagedResult,
} from '@/types/entities';
import type { Database } from '@/core/database/types';
import { EXPENSE_CATEGORIES } from '@/types/entities';
import type {
  OperationalExpenseFilters,
  OperationalExpenseRepository,
  OperationalExpenseWriteData,
} from '@/core/repositories/operationalExpenseRepository';
import type { StoreRepository } from '@/core/repositories/storeRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import type { CashService } from './cashService';
import {
  NotFoundError,
  ValidationError,
  optionalText,
  requiredText,
  validateMoney,
} from '@/core/utils/validation';
import { isValidBusinessDate } from '@/core/utils/date';

export interface OperationalExpenseFormInput extends OperationalExpenseInput {
  category: ExpenseCategory;
}

function validateCategory(value: string): ExpenseCategory {
  if (!EXPENSE_CATEGORIES.includes(value as ExpenseCategory)) {
    throw new ValidationError('Kategori biaya tidak valid.', {
      category: 'Pilih kategori biaya.',
    });
  }
  return value as ExpenseCategory;
}

export class OperationalExpenseService {
  private readonly db: Database;
  private readonly expenses: OperationalExpenseRepository;
  private readonly stores: StoreRepository;
  private readonly audit: AuditRepository;
  private readonly cash: CashService;

  constructor(
    db: Database,
    expenses: OperationalExpenseRepository,
    stores: StoreRepository,
    audit: AuditRepository,
    cash: CashService,
  ) {
    this.db = db;
    this.expenses = expenses;
    this.stores = stores;
    this.audit = audit;
    this.cash = cash;
  }

  list(filters: OperationalExpenseFilters): Promise<PagedResult<OperationalExpenseListItem>> {
    return this.expenses.list(filters);
  }

  async get(id: string): Promise<OperationalExpenseListItem> {
    const expense = await this.expenses.getById(id);
    if (!expense) throw new NotFoundError('Biaya operasional tidak ditemukan.');
    return expense;
  }

  private async normalize(input: OperationalExpenseFormInput): Promise<OperationalExpenseWriteData> {
    const storeId = optionalText(input.storeId, 100);
    if (storeId) {
      const store = await this.stores.getPublic(storeId);
      if (!store) {
        throw new ValidationError('Toko tidak ditemukan.', { storeId: 'Pilih toko yang valid.' });
      }
    }
    if (!isValidBusinessDate(input.expenseDate)) {
      throw new ValidationError('Tanggal biaya tidak valid.', {
        expenseDate: 'Pilih tanggal biaya yang valid.',
      });
    }
    const amount = validateMoney(input.amount, 'Nominal biaya', 'amount');
    if (amount <= 0) {
      throw new ValidationError('Nominal biaya harus lebih dari 0.', {
        amount: 'Nominal biaya harus lebih dari 0.',
      });
    }
    const accountId = optionalText(input.accountId, 100);
    if (accountId) {
      await this.cash.requireAccount(accountId, 'accountId');
    }
    const isPaid = input.isPaid ?? false;
    if (isPaid && !accountId) {
      throw new ValidationError('Rekening kas wajib dipilih untuk biaya yang sudah dibayar.', {
        accountId: 'Pilih rekening sumber dana.',
      });
    }
    return {
      storeId,
      expenseDate: input.expenseDate,
      category: validateCategory(input.category),
      amount,
      description: requiredText(input.description, 'Deskripsi', 'description'),
      receiptNote: optionalText(input.receiptNote, 2000),
      accountId,
      isPaid,
    };
  }

  async create(input: OperationalExpenseFormInput): Promise<OperationalExpenseListItem> {
    const data = await this.normalize(input);
    const id = await this.db.transaction(async (tx) => {
      const expenseId = await this.expenses.create(data, tx);
      await this.cash.syncOperationalExpense(expenseId, data, tx);
      return expenseId;
    });
    await this.audit.log('create', 'operational_expense', id, {
      storeId: data.storeId,
      category: data.category,
      amount: data.amount,
      date: data.expenseDate,
      isPaid: data.isPaid,
      accountId: data.accountId,
    });
    return this.get(id);
  }

  async update(
    id: string,
    input: OperationalExpenseFormInput,
  ): Promise<OperationalExpenseListItem> {
    await this.get(id);
    const data = await this.normalize(input);
    await this.db.transaction(async (tx) => {
      await this.expenses.update(id, data, tx);
      await this.cash.syncOperationalExpense(id, data, tx);
    });
    await this.audit.log('update', 'operational_expense', id, {
      storeId: data.storeId,
      category: data.category,
      amount: data.amount,
      date: data.expenseDate,
      isPaid: data.isPaid,
      accountId: data.accountId,
    });
    return this.get(id);
  }

  async delete(id: string): Promise<void> {
    await this.get(id);
    await this.db.transaction(async (tx) => {
      await this.cash.removeSourceEntries('operational_expense', id, tx);
      await this.expenses.delete(id, tx);
    });
    await this.audit.log('delete', 'operational_expense', id);
  }
}
