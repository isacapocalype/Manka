import type {
  RefundInput,
  RefundListItem,
  PagedResult,
  RefundStatus,
} from '@/types/entities';
import { REFUND_STATUSES } from '@/types/entities';
import type { RefundFilters, RefundRepository, RefundWriteData } from '@/core/repositories/refundRepository';
import type { OrderRepository } from '@/core/repositories/orderRepository';
import type { SettlementRepository } from '@/core/repositories/settlementRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import {
  NotFoundError,
  ValidationError,
  optionalText,
  requiredText,
  validateMoney,
  validateQuantity,
} from '@/core/utils/validation';
import { isValidBusinessDate } from '@/core/utils/date';
import { isRevenueOrderStatus } from '@/core/calculations/orderMath';

function validateStatus(value: string): RefundStatus {
  if (!REFUND_STATUSES.includes(value as RefundStatus)) {
    throw new ValidationError('Status refund tidak valid.', {
      status: 'Pilih status refund.',
    });
  }
  return value as RefundStatus;
}

export interface RefundResultInfo {
  countsInRevenue: boolean;
}

export class RefundService {
  private readonly refunds: RefundRepository;
  private readonly orders: OrderRepository;
  private readonly settlements: SettlementRepository;
  private readonly audit: AuditRepository;

  constructor(
    refunds: RefundRepository,
    orders: OrderRepository,
    settlements: SettlementRepository,
    audit: AuditRepository,
  ) {
    this.refunds = refunds;
    this.orders = orders;
    this.settlements = settlements;
    this.audit = audit;
  }

  list(filters: RefundFilters): Promise<PagedResult<RefundListItem>> {
    return this.refunds.list(filters);
  }

  async get(id: string): Promise<RefundListItem> {
    const refund = await this.refunds.getById(id);
    if (!refund) throw new NotFoundError('Refund tidak ditemukan.');
    return refund;
  }

  async describeRevenueImpact(orderId: string): Promise<RefundResultInfo> {
    const order = await this.orders.getById(orderId);
    if (!order) throw new NotFoundError('Pesanan tidak ditemukan.');
    return { countsInRevenue: isRevenueOrderStatus(order.status) };
  }

  private async normalize(
    input: RefundInput,
    excludeRefundId?: string,
  ): Promise<RefundWriteData> {
    const orderId = requiredText(input.orderId, 'Pesanan', 'orderId');
    const order = await this.orders.getDetail(orderId);
    if (!order) {
      throw new ValidationError('Pesanan tidak ditemukan.', {
        orderId: 'Pilih pesanan yang valid.',
      });
    }
    if (!isValidBusinessDate(input.refundDate)) {
      throw new ValidationError('Tanggal refund tidak valid.', {
        refundDate: 'Pilih tanggal refund yang valid.',
      });
    }
    const quantity = validateQuantity(input.quantity, 'Jumlah barang', 'quantity');
    const amount = validateMoney(input.amount, 'Nilai refund', 'amount');
    if (amount <= 0) {
      throw new ValidationError('Nilai refund harus lebih dari 0.', {
        amount: 'Nilai refund harus lebih dari 0.',
      });
    }
    const totalQuantity = order.items.reduce((total, item) => total + item.quantity, 0);
    const otherQuantity = order.refunds
      .filter(
        (refund) => refund.id !== excludeRefundId && refund.status !== 'rejected',
      )
      .reduce((total, refund) => total + refund.quantity, 0);
    if (quantity + otherQuantity > totalQuantity) {
      throw new ValidationError('Jumlah barang melebihi jumlah pada pesanan.', {
        quantity: `Maksimal ${Math.max(0, totalQuantity - otherQuantity)} barang untuk refund ini.`,
      });
    }
    const originalGross = order.items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    );
    const otherAmount = order.refunds
      .filter(
        (refund) => refund.id !== excludeRefundId && refund.status !== 'rejected',
      )
      .reduce((total, refund) => total + refund.amount, 0);
    if (amount + otherAmount > originalGross) {
      throw new ValidationError('Nilai refund melebihi nilai pesanan.', {
        amount: `Maksimal ${originalGross - otherAmount} untuk refund ini.`,
      });
    }

    const settlementId = optionalText(input.settlementId, 100);
    if (settlementId) {
      const settlement = await this.settlements.getById(settlementId);
      if (!settlement) {
        throw new ValidationError('Settlement tidak ditemukan.', {
          settlementId: 'Pilih settlement yang valid.',
        });
      }
      if (settlement.storeId !== order.storeId) {
        throw new ValidationError('Settlement berasal dari toko yang berbeda.', {
          settlementId: 'Pilih settlement dari toko yang sama.',
        });
      }
    }

    return {
      orderId: order.id,
      storeId: order.storeId,
      settlementId,
      refundDate: input.refundDate,
      amount,
      quantity,
      reason: requiredText(input.reason, 'Alasan refund', 'reason'),
      status: validateStatus(input.status),
      notes: optionalText(input.notes, 1000),
    };
  }

  async create(input: RefundInput): Promise<RefundListItem> {
    const data = await this.normalize(input);
    const id = await this.refunds.create(data);
    await this.audit.log('create', 'refund', id, {
      orderId: data.orderId,
      amount: data.amount,
      status: data.status,
      date: data.refundDate,
    });
    return this.get(id);
  }

  async update(id: string, input: RefundInput): Promise<RefundListItem> {
    await this.get(id);
    const data = await this.normalize(input, id);
    await this.refunds.update(id, data);
    await this.audit.log('update', 'refund', id, {
      orderId: data.orderId,
      amount: data.amount,
      status: data.status,
      date: data.refundDate,
    });
    return this.get(id);
  }

  async delete(id: string): Promise<void> {
    await this.get(id);
    await this.refunds.delete(id);
    await this.audit.log('delete', 'refund', id);
  }
}
