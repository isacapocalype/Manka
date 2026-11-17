import type {
  FeeSource,
  FeeType,
  MarketplaceFeeListItem,
  PagedResult,
} from '@/types/entities';
import { FEE_SOURCES, FEE_TYPES } from '@/types/entities';
import type { FeeFilters, FeeRepository } from '@/core/repositories/feeRepository';
import type { StoreRepository } from '@/core/repositories/storeRepository';
import type { OrderRepository } from '@/core/repositories/orderRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import {
  NotFoundError,
  ValidationError,
  optionalText,
  requiredText,
  validateMoney,
} from '@/core/utils/validation';
import { isValidBusinessDate } from '@/core/utils/date';

export interface FeeInput {
  storeId: string;
  orderId?: string | null;
  feeType: FeeType;
  amount: number;
  feeDate: string;
  source: FeeSource;
  notes?: string | null;
}

function validateFeeType(value: string): FeeType {
  if (!FEE_TYPES.includes(value as FeeType)) {
    throw new ValidationError('Jenis biaya tidak valid.', { feeType: 'Pilih jenis biaya.' });
  }
  return value as FeeType;
}

function validateSource(value: string): FeeSource {
  if (!FEE_SOURCES.includes(value as FeeSource)) {
    throw new ValidationError('Sumber biaya tidak valid.', {
      source: 'Pilih sumber biaya aktual atau estimasi.',
    });
  }
  return value as FeeSource;
}

export class FeeService {
  private readonly fees: FeeRepository;
  private readonly stores: StoreRepository;
  private readonly orders: OrderRepository;
  private readonly audit: AuditRepository;

  constructor(
    fees: FeeRepository,
    stores: StoreRepository,
    orders: OrderRepository,
    audit: AuditRepository,
  ) {
    this.fees = fees;
    this.stores = stores;
    this.orders = orders;
    this.audit = audit;
  }

  list(filters: FeeFilters): Promise<PagedResult<MarketplaceFeeListItem>> {
    return this.fees.list(filters);
  }

  async get(id: string): Promise<MarketplaceFeeListItem> {
    const fee = await this.fees.getById(id);
    if (!fee) throw new NotFoundError('Biaya marketplace tidak ditemukan.');
    return fee;
  }

  private async normalize(input: FeeInput): Promise<{
    storeId: string;
    orderId: string | null;
    feeType: FeeType;
    amount: number;
    feeDate: string;
    source: FeeSource;
    notes: string | null;
  }> {
    const orderId = optionalText(input.orderId, 100);
    let storeId = requiredText(input.storeId, 'Toko', 'storeId');
    if (orderId) {
      const order = await this.orders.getById(orderId);
      if (!order) {
        throw new ValidationError('Pesanan tidak ditemukan.', {
          orderId: 'Pesanan yang dipilih tidak ditemukan.',
        });
      }
      if (order.storeId !== storeId) {
        throw new ValidationError('Pesanan berasal dari toko yang berbeda.', {
          orderId: 'Pilih pesanan dari toko yang sama.',
        });
      }
    } else {
      const store = await this.stores.getPublic(storeId);
      if (!store) {
        throw new ValidationError('Toko tidak ditemukan.', { storeId: 'Pilih toko yang valid.' });
      }
    }
    if (!isValidBusinessDate(input.feeDate)) {
      throw new ValidationError('Tanggal biaya tidak valid.', {
        feeDate: 'Pilih tanggal biaya yang valid.',
      });
    }
    return {
      storeId,
      orderId,
      feeType: validateFeeType(input.feeType),
      amount: validateMoney(input.amount, 'Nominal biaya', 'amount'),
      feeDate: input.feeDate,
      source: validateSource(input.source),
      notes: optionalText(input.notes, 1000),
    };
  }

  async create(input: FeeInput): Promise<MarketplaceFeeListItem> {
    const data = await this.normalize(input);
    const id = await this.fees.create(data);
    await this.audit.log('create', 'marketplace_fee', id, {
      storeId: data.storeId,
      feeType: data.feeType,
      amount: data.amount,
      source: data.source,
    });
    return this.get(id);
  }

  async update(id: string, input: FeeInput): Promise<MarketplaceFeeListItem> {
    await this.get(id);
    const data = await this.normalize(input);
    await this.fees.update(id, data);
    await this.audit.log('update', 'marketplace_fee', id, {
      storeId: data.storeId,
      feeType: data.feeType,
      amount: data.amount,
      source: data.source,
    });
    return this.get(id);
  }

  async delete(id: string): Promise<void> {
    await this.get(id);
    await this.fees.delete(id);
    await this.audit.log('delete', 'marketplace_fee', id);
  }
}
