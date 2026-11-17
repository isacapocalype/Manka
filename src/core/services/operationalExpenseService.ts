import type {
  ExpenseCategory,
  OperationalExpenseInput,
  OperationalExpenseListItem,
  PagedResult,
} from '@/types/entities';
import { EXPENSE_CATEGORIES } from '@/types/entities';
import type {
  OperationalExpenseFilters,
  OperationalExpenseRepository,
  OperationalExpenseWriteData,
} from '@/core/repositories/operationalExpenseRepository';
import type { StoreRepository } from '@/core/repositories/storeRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
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
  private readonly expenses: OperationalExpenseRepository;
  private readonly stores: StoreRepository;
  private readonly audit: AuditRepository;

  constructor(
    expenses: OperationalExpenseRepository,
    stores: StoreRepository,
    audit: AuditRepository,
  ) {
    this.expenses = expenses;
    this.stores = stores;
    this.audit = audit;
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
    return {
      storeId,
      expenseDate: input.expenseDate,
      category: validateCategory(input.category),
      amount,
      description: requiredText(input.description, 'Deskripsi', 'description'),
      receiptNote: optionalText(input.receiptNote, 2000),
    };
  }

  async create(input: OperationalExpenseFormInput): Promise<OperationalExpenseListItem> {
    const data = await this.normalize(input);
    const id = await this.expenses.create(data);
    await this.audit.log('create', 'operational_expense', id, {
      storeId: data.storeId,
      category: data.category,
      amount: data.amount,
      date: data.expenseDate,
    });
    return this.get(id);
  }

  async update(
    id: string,
    input: OperationalExpenseFormInput,
  ): Promise<OperationalExpenseListItem> {
    await this.get(id);
    const data = await this.normalize(input);
    await this.expenses.update(id, data);
    await this.audit.log('update', 'operational_expense', id, {
      storeId: data.storeId,
      category: data.category,
      amount: data.amount,
      date: data.expenseDate,
    });
    return this.get(id);
  }

  async delete(id: string): Promise<void> {
    await this.get(id);
    await this.expenses.delete(id);
    await this.audit.log('delete', 'operational_expense', id);
  }
}
