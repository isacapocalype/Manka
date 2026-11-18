import type {
  AdPlatform,
  ExpenseCategory,
  FeeSource,
  FeeType,
  OrderStatus,
  ProductStatus,
  RefundStatus,
  SettlementStatus,
  StorePlatform,
  StoreStatus,
} from '@/types/entities';
import type {
  ProductionPriority,
  ProductionStage,
  WorkOrderStatus,
} from '@/types/production';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export const STORE_PLATFORM_LABELS: Record<StorePlatform, string> = {
  shopee: 'Shopee',
  tiktok: 'TikTok Shop',
  other: 'Lainnya',
};

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  active: 'Aktif',
  archived: 'Diarsipkan',
};

export const STORE_STATUS_TONES: Record<StoreStatus, BadgeTone> = {
  active: 'success',
  archived: 'neutral',
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Aktif',
  inactive: 'Nonaktif',
};

export const PRODUCT_STATUS_TONES: Record<ProductStatus, BadgeTone> = {
  active: 'success',
  inactive: 'neutral',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Menunggu',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Diterima',
  completed: 'Selesai',
  cancelled: 'Batal',
  returned: 'Retur',
  refunded: 'Refund',
};

export const ORDER_STATUS_TONES: Record<OrderStatus, BadgeTone> = {
  pending: 'warning',
  processing: 'info',
  shipped: 'info',
  delivered: 'primary',
  completed: 'success',
  cancelled: 'neutral',
  returned: 'danger',
  refunded: 'danger',
};

export const PRODUCTION_STAGE_LABELS: Record<ProductionStage, string> = {
  antrian: 'Antrian',
  potong: 'Potong',
  jahit: 'Jahit',
  finishing: 'Finishing',
  qc: 'QC',
  packing: 'Packing',
  selesai: 'Selesai',
};

export const PRODUCTION_STAGE_TONES: Record<ProductionStage, BadgeTone> = {
  antrian: 'neutral',
  potong: 'info',
  jahit: 'info',
  finishing: 'primary',
  qc: 'warning',
  packing: 'warning',
  selesai: 'success',
};

export const PRODUCTION_PRIORITY_LABELS: Record<ProductionPriority, string> = {
  low: 'Rendah',
  normal: 'Normal',
  high: 'Tinggi',
  urgent: 'Mendesak',
};

export const PRODUCTION_PRIORITY_TONES: Record<ProductionPriority, BadgeTone> = {
  low: 'neutral',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
};

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  active: 'Berjalan',
  done: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const WORK_ORDER_STATUS_TONES: Record<WorkOrderStatus, BadgeTone> = {
  active: 'info',
  done: 'success',
  cancelled: 'neutral',
};

export const FEE_TYPE_LABELS: Record<FeeType, string> = {
  admin: 'Administrasi',
  service: 'Layanan',
  transaction: 'Transaksi',
  commission: 'Komisi',
  promotion: 'Promosi',
  other: 'Lainnya',
};

export const FEE_SOURCE_LABELS: Record<FeeSource, string> = {
  actual: 'Aktual',
  estimated: 'Estimasi',
};

export const FEE_SOURCE_TONES: Record<FeeSource, BadgeTone> = {
  actual: 'neutral',
  estimated: 'warning',
};

export const AD_PLATFORM_LABELS: Record<AdPlatform, string> = {
  shopee: 'Shopee Ads',
  tiktok: 'TikTok Ads',
  meta: 'Meta Ads',
  google: 'Google Ads',
  other: 'Lainnya',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  salary: 'Gaji',
  electricity: 'Listrik',
  internet: 'Internet',
  rent: 'Sewa',
  machine_maintenance: 'Perawatan mesin',
  supplies: 'Bahan pendukung',
  transportation: 'Transportasi',
  other: 'Lainnya',
};

export const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  pending: 'Menunggu',
  completed: 'Selesai',
  rejected: 'Ditolak',
};

export const REFUND_STATUS_TONES: Record<RefundStatus, BadgeTone> = {
  pending: 'warning',
  completed: 'success',
  rejected: 'neutral',
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  pending: 'Menunggu',
  received: 'Diterima',
};

export const SETTLEMENT_STATUS_TONES: Record<SettlementStatus, BadgeTone> = {
  pending: 'warning',
  received: 'success',
};

export const IMPORT_TYPE_LABELS: Record<string, string> = {
  orders: 'Pesanan',
  order: 'Pesanan',
};

export function labelForImportType(value: string): string {
  return IMPORT_TYPE_LABELS[value] ?? value;
}
