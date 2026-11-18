import type { BusinessDate, IsoDateTime, PagedResult } from './entities';

export const PRODUCTION_STAGES = [
  'antrian',
  'potong',
  'jahit',
  'finishing',
  'qc',
  'packing',
  'selesai',
] as const;
export type ProductionStage = (typeof PRODUCTION_STAGES)[number];

export const PRODUCTION_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type ProductionPriority = (typeof PRODUCTION_PRIORITIES)[number];

export const WORK_ORDER_STATUSES = ['active', 'done', 'cancelled'] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export interface WorkOrder {
  id: string;
  code: string;
  orderId: string | null;
  orderItemId: string | null;
  productName: string;
  sku: string;
  qty: number;
  deadline: BusinessDate | null;
  priority: ProductionPriority;
  picName: string | null;
  currentStage: ProductionStage;
  status: WorkOrderStatus;
  qtyPassed: number;
  qtyDefect: number;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface WorkOrderListItem extends WorkOrder {
  orderMarketplaceId: string | null;
  storeName: string | null;
}

export interface WorkOrderStageLog {
  id: string;
  workOrderId: string;
  stage: Exclude<ProductionStage, 'selesai'>;
  qtyIn: number;
  qtyPassed: number;
  qtyDefect: number;
  picName: string | null;
  notes: string | null;
  startedAt: IsoDateTime | null;
  completedAt: IsoDateTime;
  createdAt: IsoDateTime;
}

export interface WorkOrderDetail extends WorkOrderListItem {
  stages: WorkOrderStageLog[];
}

export interface WorkOrderInput {
  orderId?: string | null;
  orderItemId?: string | null;
  productName: string;
  sku?: string;
  qty: number;
  deadline?: BusinessDate | null;
  priority?: ProductionPriority;
  picName?: string | null;
  notes?: string | null;
}

export interface WorkOrderUpdateInput {
  deadline?: BusinessDate | null;
  priority?: ProductionPriority;
  picName?: string | null;
  notes?: string | null;
}

export interface WorkOrderAdvanceInput {
  qtyPassed: number;
  qtyDefect: number;
  picName?: string | null;
  notes?: string | null;
}

export interface WorkOrderFilters {
  status?: WorkOrderStatus | 'all';
  stage?: ProductionStage | 'all';
  priority?: ProductionPriority | 'all';
  search?: string;
  overdueOnly?: boolean;
}

export interface ProductionStageCount {
  stage: ProductionStage;
  count: number;
  overdue: number;
}

export interface WorkOrderListResult extends PagedResult<WorkOrderListItem> {
  stageCounts: ProductionStageCount[];
}
