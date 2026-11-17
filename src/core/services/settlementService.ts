import type {
  PagedResult,
  SettlementInput,
  SettlementListItem,
  SettlementStatus,
} from '@/types/entities';
import { SETTLEMENT_STATUSES } from '@/types/entities';
import type {
  SettlementFilters,
  SettlementRepository,
  SettlementWriteData,
} from '@/core/repositories/settlementRepository';
import type { StoreRepository } from '@/core/repositories/storeRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  isUniqueConstraintError,
  optionalText,
  requiredText,
  validateMoney,
} from '@/core/utils/validation';
import { isValidBusinessDate } from '@/core/utils/date';

function validateStatus(value: string): SettlementStatus {
  if (!SETTLEMENT_STATUSES.includes(value as SettlementStatus)) {
    throw new ValidationError('Status settlement tidak valid.', {
      status: 'Pilih status settlement.',
    });
  }
  return value as SettlementStatus;
}

export class SettlementService {
  private readonly settlements: SettlementRepository;
  private readonly stores: StoreRepository;
  private readonly audit: AuditRepository;

  constructor(
    settlements: SettlementRepository,
    stores: StoreRepository,
    audit: AuditRepository,
  ) {
    this.settlements = settlements;
    this.stores = stores;
    this.audit = audit;
  }

  list(filters: SettlementFilters): Promise<PagedResult<SettlementListItem>> {
    return this.settlements.list(filters);
  }

  async get(id: string): Promise<SettlementListItem> {
    const settlement = await this.settlements.getById(id);
    if (!settlement) throw new NotFoundError('Settlement tidak ditemukan.');
    return settlement;
  }

  listForSelect(storeId?: string | null) {
    return this.settlements.listForSelect(storeId);
  }

  private async normalize(input: SettlementInput): Promise<SettlementWriteData> {
    const storeId = requiredText(input.storeId, 'Toko', 'storeId');
    const store = await this.stores.getPublic(storeId);
    if (!store) {
      throw new ValidationError('Toko tidak ditemukan.', { storeId: 'Pilih toko yang valid.' });
    }
    const settlementNo = requiredText(input.settlementNo, 'Nomor settlement', 'settlementNo');
    if (settlementNo.length > 120) {
      throw new ValidationError('Nomor settlement terlalu panjang.', {
        settlementNo: 'Nomor settlement maksimal 120 karakter.',
      });
    }
    if (!isValidBusinessDate(input.settlementDate)) {
      throw new ValidationError('Tanggal settlement tidak valid.', {
        settlementDate: 'Pilih tanggal settlement yang valid.',
      });
    }
    return {
      storeId,
      settlementNo,
      settlementDate: input.settlementDate,
      grossSales: validateMoney(input.grossSales, 'Total penjualan', 'grossSales'),
      totalDeductions: validateMoney(input.totalDeductions, 'Total potongan', 'totalDeductions'),
      totalPayout: validateMoney(input.totalPayout, 'Total pencairan', 'totalPayout'),
      status: validateStatus(input.status),
      notes: optionalText(input.notes, 1000),
    };
  }

  private async assertUnique(
    storeId: string,
    settlementNo: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.settlements.findByNumber(storeId, settlementNo);
    if (duplicate && duplicate.id !== excludeId) {
      throw new ConflictError(`Nomor settlement "${settlementNo}" sudah ada pada toko ini.`);
    }
  }

  async create(input: SettlementInput): Promise<SettlementListItem> {
    const data = await this.normalize(input);
    await this.assertUnique(data.storeId, data.settlementNo);
    try {
      const id = await this.settlements.create(data);
      await this.audit.log('create', 'settlement', id, {
        storeId: data.storeId,
        settlementNo: data.settlementNo,
        totalPayout: data.totalPayout,
      });
      return this.get(id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`Nomor settlement "${data.settlementNo}" sudah ada pada toko ini.`);
      }
      throw error;
    }
  }

  async update(id: string, input: SettlementInput): Promise<SettlementListItem> {
    await this.get(id);
    const data = await this.normalize(input);
    await this.assertUnique(data.storeId, data.settlementNo, id);
    try {
      await this.settlements.update(id, data);
      await this.audit.log('update', 'settlement', id, {
        storeId: data.storeId,
        settlementNo: data.settlementNo,
        totalPayout: data.totalPayout,
      });
      return this.get(id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`Nomor settlement "${data.settlementNo}" sudah ada pada toko ini.`);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.get(id);
    await this.settlements.delete(id);
    await this.audit.log('delete', 'settlement', id);
  }
}
