import type {
  ProductionPriority,
  ProductionStage,
  WorkOrderAdvanceInput,
  WorkOrderDetail,
  WorkOrderFilters,
  WorkOrderInput,
  WorkOrderListItem,
  WorkOrderListResult,
  WorkOrderUpdateInput,
} from '@/types/production';
import { PRODUCTION_PRIORITIES, PRODUCTION_STAGES } from '@/types/production';
import type { WorkOrderRepository } from '@/core/repositories/workOrderRepository';
import type { OrderRepository } from '@/core/repositories/orderRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  isUniqueConstraintError,
  optionalText,
  requiredText,
  requireMaxLength,
} from '@/core/utils/validation';
import { isValidBusinessDate, todayJakarta } from '@/core/utils/date';

const FINAL_STAGE: ProductionStage = 'selesai';
const ORDER_STATUSES_BLOCKED_FOR_PRODUCTION = new Set(['cancelled', 'returned', 'refunded']);

function validateQty(value: number, field: string, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ValidationError(`${label} harus berupa bilangan bulat lebih dari 0.`, {
      [field]: `${label} harus lebih dari 0.`,
    });
  }
  if (value > 1_000_000) {
    throw new ValidationError(`${label} terlalu besar.`, {
      [field]: `${label} maksimal 1.000.000.`,
    });
  }
  return value;
}

function validateNonNegativeQty(value: number, field: string, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ValidationError(`${label} harus berupa bilangan bulat minimal 0.`, {
      [field]: `${label} tidak valid.`,
    });
  }
  return value;
}

function validatePriority(value: string): ProductionPriority {
  if (!PRODUCTION_PRIORITIES.includes(value as ProductionPriority)) {
    throw new ValidationError('Prioritas tidak valid.', {
      priority: 'Pilih prioritas yang valid.',
    });
  }
  return value as ProductionPriority;
}

function validateDeadline(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === '') return null;
  if (!isValidBusinessDate(value)) {
    throw new ValidationError('Tenggat produksi tidak valid.', {
      deadline: 'Pilih tanggal tenggat yang valid.',
    });
  }
  return value;
}

export interface ProductionRemainingItem {
  orderItemId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  scheduledQty: number;
  remainingQty: number;
}

export class ProductionService {
  private readonly workOrders: WorkOrderRepository;
  private readonly orders: OrderRepository;
  private readonly audit: AuditRepository;

  constructor(
    workOrders: WorkOrderRepository,
    orders: OrderRepository,
    audit: AuditRepository,
  ) {
    this.workOrders = workOrders;
    this.orders = orders;
    this.audit = audit;
  }

  list(filters: WorkOrderFilters = {}): Promise<WorkOrderListResult> {
    return this.workOrders.list(filters);
  }

  async get(id: string): Promise<WorkOrderDetail> {
    const workOrder = await this.workOrders.getById(id);
    if (!workOrder) throw new NotFoundError('Work order tidak ditemukan.');
    return workOrder;
  }

  listByOrder(orderId: string): Promise<WorkOrderListItem[]> {
    return this.workOrders.listByOrder(orderId);
  }

  async remainingItems(orderId: string): Promise<ProductionRemainingItem[]> {
    const order = await this.orders.getDetail(orderId);
    if (!order) throw new NotFoundError('Pesanan tidak ditemukan.');
    const scheduled = await this.workOrders.sumActiveQtyByOrder(orderId);
    return order.items.map((item) => {
      const scheduledQty = scheduled.get(item.id) ?? 0;
      return {
        orderItemId: item.id,
        productName: item.productName,
        sku: item.sku,
        orderedQty: item.quantity,
        scheduledQty,
        remainingQty: Math.max(0, item.quantity - scheduledQty),
      };
    });
  }

  async create(input: WorkOrderInput): Promise<WorkOrderDetail> {
    let orderId = input.orderId?.trim() || null;
    let orderItemId = input.orderItemId?.trim() || null;
    let productName = input.productName?.trim() ?? '';
    let sku = input.sku?.trim() ?? '';
    let orderedQty: number | null = null;

    if (orderItemId) {
      if (!orderId) {
        throw new ValidationError('Pesanan untuk item produksi tidak diketahui.', {
          orderId: 'Buka work order dari detail pesanan.',
        });
      }
      const order = await this.orders.getDetail(orderId);
      if (!order) {
        throw new ValidationError('Pesanan tidak ditemukan.', {
          orderId: 'Pilih pesanan yang valid.',
        });
      }
      if (ORDER_STATUSES_BLOCKED_FOR_PRODUCTION.has(order.status)) {
        throw new ValidationError(
          'Pesanan dengan status batal, retur, atau refund tidak dapat dibuatkan work order.',
          { orderId: 'Pilih pesanan yang masih berjalan.' },
        );
      }
      const item = order.items.find((candidate) => candidate.id === orderItemId);
      if (!item) {
        throw new ValidationError('Item pesanan tidak ditemukan pada pesanan ini.', {
          orderItemId: 'Item pesanan tidak valid.',
        });
      }
      orderId = order.id;
      productName = item.productName;
      sku = item.sku;
      orderedQty = item.quantity;
    } else if (orderId) {
      const order = await this.orders.getDetail(orderId);
      if (!order) {
        throw new ValidationError('Pesanan tidak ditemukan.', {
          orderId: 'Pilih pesanan yang valid.',
        });
      }
      if (ORDER_STATUSES_BLOCKED_FOR_PRODUCTION.has(order.status)) {
        throw new ValidationError(
          'Pesanan dengan status batal, retur, atau refund tidak dapat dibuatkan work order.',
          { orderId: 'Pilih pesanan yang masih berjalan.' },
        );
      }
    }

    productName = requiredText(productName, 'Nama produk', 'productName');
    requireMaxLength(productName, 'Nama produk', 200, 'productName');
    if (sku.length > 80) {
      throw new ValidationError('SKU terlalu panjang.', {
        sku: 'SKU maksimal 80 karakter.',
      });
    }
    const qty = validateQty(input.qty, 'qty', 'Kuantitas');

    if (orderItemId) {
      const alreadyScheduled = await this.workOrders.sumActiveQtyForOrderItem(orderItemId);
      const remaining = (orderedQty ?? 0) - alreadyScheduled;
      if (remaining <= 0) {
        throw new ConflictError(
          'Seluruh kuantitas item pesanan ini sudah memiliki work order aktif.',
        );
      }
      if (qty > remaining) {
        throw new ValidationError(
          `Kuantitas melebihi sisa item pesanan (${remaining}).`,
          { qty: `Maksimal ${remaining} unit.` },
        );
      }
    }

    const deadline = validateDeadline(input.deadline);
    const priority = validatePriority(input.priority ?? 'normal');
    const picName = optionalText(input.picName, 120);
    const notes = optionalText(input.notes, 2000);
    const date = todayJakarta();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const code = await this.workOrders.nextCode(date);
      try {
        const id = await this.workOrders.create({
          code,
          orderId,
          orderItemId,
          productName,
          sku,
          qty,
          deadline,
          priority,
          picName,
          notes,
        });
        await this.audit.log('create', 'work_order', id, {
          code,
          orderId,
          orderItemId,
          qty,
          deadline,
          priority,
        });
        return this.get(id);
      } catch (error) {
        if (isUniqueConstraintError(error) && attempt < 2) continue;
        throw error;
      }
    }
    throw new ConflictError('Nomor work order gagal dibuat. Coba simpan kembali.');
  }

  async update(id: string, input: WorkOrderUpdateInput): Promise<WorkOrderDetail> {
    const workOrder = await this.get(id);
    if (workOrder.status === 'cancelled') {
      throw new ValidationError('Work order yang dibatalkan tidak dapat diubah.');
    }
    const deadline = validateDeadline(input.deadline);
    const priority = validatePriority(input.priority ?? workOrder.priority);
    const picName = optionalText(input.picName, 120);
    const notes = optionalText(input.notes, 2000);
    await this.workOrders.update(id, { deadline, priority, picName, notes });
    await this.audit.log('update', 'work_order', id, {
      code: workOrder.code,
      deadline,
      priority,
    });
    return this.get(id);
  }

  async advance(id: string, input: WorkOrderAdvanceInput): Promise<WorkOrderDetail> {
    const workOrder = await this.get(id);
    if (workOrder.status === 'cancelled') {
      throw new ValidationError('Work order yang dibatalkan tidak dapat diproses.');
    }
    const currentStage = workOrder.currentStage;
    if (workOrder.status === 'done' || currentStage === FINAL_STAGE) {
      throw new ValidationError('Work order ini sudah selesai.');
    }

    const currentIndex = PRODUCTION_STAGES.indexOf(currentStage);
    const nextStage = PRODUCTION_STAGES[currentIndex + 1];
    if (!nextStage) {
      throw new ValidationError('Tahap produksi tidak dapat dilanjutkan.');
    }

    const qtyIn = workOrder.stages.length === 0 ? workOrder.qty : workOrder.qtyPassed;
    if (qtyIn <= 0) {
      throw new ValidationError(
        'Tidak ada kuantitas yang dapat dilanjutkan. Selesaikan atau batalkan work order ini.',
      );
    }
    const qtyPassed = validateNonNegativeQty(input.qtyPassed, 'qtyPassed', 'Jumlah lolos');
    const qtyDefect = validateNonNegativeQty(input.qtyDefect, 'qtyDefect', 'Jumlah cacat');
    if (qtyPassed + qtyDefect !== qtyIn) {
      throw new ValidationError(
        `Jumlah lolos dan cacat harus sama dengan kuantitas masuk tahap ini (${qtyIn}).`,
        {
          qtyPassed: `Lolos + cacat harus ${qtyIn}.`,
          qtyDefect: `Lolos + cacat harus ${qtyIn}.`,
        },
      );
    }

    const finished = nextStage === FINAL_STAGE || qtyPassed === 0;
    const lastStage = workOrder.stages[workOrder.stages.length - 1];
    await this.workOrders.recordStage({
      workOrderId: id,
      stage: currentStage as WorkOrderStageLogStage,
      nextStage: finished ? FINAL_STAGE : nextStage,
      nextStatus: finished ? 'done' : 'active',
      qtyIn,
      qtyPassed,
      qtyDefect,
      totalDefect: workOrder.qtyDefect + qtyDefect,
      picName: optionalText(input.picName, 120),
      notes: optionalText(input.notes, 2000),
      startedAt: lastStage?.completedAt ?? null,
    });
    await this.audit.log('update', 'work_order', id, {
      code: workOrder.code,
      stage: currentStage,
      qtyIn,
      qtyPassed,
      qtyDefect,
      nextStage: finished ? FINAL_STAGE : nextStage,
    });
    return this.get(id);
  }

  async cancel(id: string): Promise<void> {
    const workOrder = await this.get(id);
    if (workOrder.status === 'cancelled') {
      throw new ValidationError('Work order sudah dibatalkan.');
    }
    if (workOrder.status === 'done' || workOrder.currentStage === FINAL_STAGE) {
      throw new ValidationError('Work order yang sudah selesai tidak dapat dibatalkan.');
    }
    await this.workOrders.cancel(id);
    await this.audit.log('update', 'work_order', id, {
      code: workOrder.code,
      status: 'cancelled',
    });
  }
}

type WorkOrderStageLogStage = Exclude<ProductionStage, 'selesai'>;
