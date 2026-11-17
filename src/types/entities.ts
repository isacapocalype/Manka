export const STORE_PLATFORMS = ['shopee', 'tiktok', 'other'] as const;
export type StorePlatform = (typeof STORE_PLATFORMS)[number];

export const STORE_STATUSES = ['active', 'archived'] as const;
export type StoreStatus = (typeof STORE_STATUSES)[number];

export const PRODUCT_STATUSES = ['active', 'inactive'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
  'returned',
  'refunded',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const FEE_TYPES = [
  'admin',
  'service',
  'transaction',
  'commission',
  'promotion',
  'other',
] as const;
export type FeeType = (typeof FEE_TYPES)[number];

export const FEE_SOURCES = ['actual', 'estimated'] as const;
export type FeeSource = (typeof FEE_SOURCES)[number];

export const AD_PLATFORMS = ['shopee', 'tiktok', 'meta', 'google', 'other'] as const;
export type AdPlatform = (typeof AD_PLATFORMS)[number];

export const EXPENSE_CATEGORIES = [
  'salary',
  'electricity',
  'internet',
  'rent',
  'machine_maintenance',
  'supplies',
  'transportation',
  'other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const REFUND_STATUSES = ['pending', 'completed', 'rejected'] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const SETTLEMENT_STATUSES = ['pending', 'received'] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

/** Nilai uang selalu integer Rupiah. */
export type Money = number;
/** Tanggal bisnis: YYYY-MM-DD (Asia/Jakarta). */
export type BusinessDate = string;
/** Waktu ISO 8601 untuk metadata. */
export type IsoDateTime = string;

export interface Store {
  id: string;
  name: string;
  platform: StorePlatform;
  email: string | null;
  phone: string | null;
  ktpName: string | null;
  status: StoreStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** Hanya diminta setelah pengguna memberikan tindakan eksplisit. */
export interface StoreSensitiveData {
  password: string | null;
  bankAccount: string | null;
}

export interface StoreRecord extends Store {
  passwordEnc: string | null;
  bankAccountEnc: string | null;
}

export interface StoreInput {
  name: string;
  platform: StorePlatform;
  email?: string | null;
  phone?: string | null;
  ktpName?: string | null;
  password?: string | null;
  bankAccount?: string | null;
  status?: StoreStatus;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  variant: string | null;
  price: Money;
  currentCost: Money;
  status: ProductStatus;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface ProductCostEntry {
  id: string;
  productId: string;
  cost: Money;
  effectiveAt: BusinessDate;
  note: string | null;
  createdAt: IsoDateTime;
}

export interface ProductPriceEntry {
  id: string;
  productId: string;
  price: Money;
  effectiveAt: BusinessDate;
  createdAt: IsoDateTime;
}

export interface ProductInput {
  name: string;
  sku: string;
  category?: string | null;
  variant?: string | null;
  price: Money;
  cost?: Money | null;
  status: ProductStatus;
  notes?: string | null;
}

export interface Order {
  id: string;
  storeId: string;
  marketplaceOrderId: string;
  orderDate: BusinessDate;
  status: OrderStatus;
  sellerDiscount: Money;
  marketplaceDiscount: Money;
  shippingPaid: Money;
  settlementValue: Money | null;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: Money;
  hppSnapshot: Money;
  createdAt: IsoDateTime;
}

export interface OrderItemInput {
  id?: string;
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: Money;
  hppSnapshot?: Money;
}

export interface OrderInput {
  storeId: string;
  marketplaceOrderId: string;
  orderDate: BusinessDate;
  status: OrderStatus;
  sellerDiscount: Money;
  marketplaceDiscount: Money;
  shippingPaid: Money;
  settlementValue?: Money | null;
  notes?: string | null;
  items: OrderItemInput[];
}

export interface OrderListItem extends Order {
  storeName: string;
  grossSales: Money;
  itemCount: number;
  unitCount: number;
  marketplaceFees: Money;
  refundTotal: Money;
  netSales: Money;
}

export interface OrderDetail extends Order {
  storeName: string;
  items: OrderItem[];
  fees: MarketplaceFee[];
  refunds: Refund[];
  grossSales: Money;
  cogs: Money;
  marketplaceFees: Money;
  refundTotal: Money;
  netSales: Money;
  estimatedProfit: Money;
}

export interface MarketplaceFee {
  id: string;
  storeId: string;
  orderId: string | null;
  feeType: FeeType;
  amount: Money;
  feeDate: BusinessDate;
  source: FeeSource;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface MarketplaceFeeListItem extends MarketplaceFee {
  storeName: string;
  marketplaceOrderId: string | null;
}

export interface MarketplaceFeeInput {
  storeId: string;
  orderId?: string | null;
  feeType: FeeType;
  amount: Money;
  feeDate: BusinessDate;
  source: FeeSource;
  notes?: string | null;
}

export interface AdvertisingCampaign {
  id: string;
  storeId: string | null;
  platform: AdPlatform;
  name: string;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface AdvertisingCampaignInput {
  storeId?: string | null;
  platform: AdPlatform;
  name: string;
  notes?: string | null;
}

export interface AdvertisingExpense {
  id: string;
  campaignId: string;
  expenseDate: BusinessDate;
  amount: Money;
  impressions: number | null;
  clicks: number | null;
  attributedOrders: number | null;
  attributedRevenue: Money | null;
  notes: string | null;
  createdAt: IsoDateTime;
}

export interface AdvertisingExpenseInput {
  campaignId: string;
  expenseDate: BusinessDate;
  amount: Money;
  impressions?: number | null;
  clicks?: number | null;
  attributedOrders?: number | null;
  attributedRevenue?: Money | null;
  notes?: string | null;
}

export interface AdvertisingCampaignSummary extends AdvertisingCampaign {
  storeName: string | null;
  totalSpend: Money;
  totalAttributedRevenue: Money | null;
  totalAttributedOrders: number | null;
  attributionRows: number;
  expenseCount: number;
  roas: number | null;
  acos: number | null;
}

export interface OperationalExpense {
  id: string;
  storeId: string | null;
  expenseDate: BusinessDate;
  category: ExpenseCategory;
  amount: Money;
  description: string;
  receiptNote: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface OperationalExpenseListItem extends OperationalExpense {
  storeName: string | null;
}

export interface OperationalExpenseInput {
  storeId?: string | null;
  expenseDate: BusinessDate;
  category: ExpenseCategory;
  amount: Money;
  description: string;
  receiptNote?: string | null;
}

export interface Refund {
  id: string;
  storeId: string;
  orderId: string;
  settlementId: string | null;
  refundDate: BusinessDate;
  amount: Money;
  quantity: number;
  reason: string;
  status: RefundStatus;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface RefundListItem extends Refund {
  storeName: string;
  marketplaceOrderId: string;
  orderStatus: OrderStatus;
}

export interface RefundInput {
  orderId: string;
  settlementId?: string | null;
  refundDate: BusinessDate;
  amount: Money;
  quantity: number;
  reason: string;
  status: RefundStatus;
  notes?: string | null;
}

export interface Settlement {
  id: string;
  storeId: string;
  settlementNo: string;
  settlementDate: BusinessDate;
  grossSales: Money;
  totalDeductions: Money;
  totalPayout: Money;
  status: SettlementStatus;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface SettlementListItem extends Settlement {
  storeName: string;
}

export interface SettlementInput {
  storeId: string;
  settlementNo: string;
  settlementDate: BusinessDate;
  grossSales: Money;
  totalDeductions: Money;
  totalPayout: Money;
  status: SettlementStatus;
  notes?: string | null;
}

export interface ImportBatch {
  id: string;
  importType: string;
  fileName: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  skippedRows: number;
  notes: string | null;
  createdAt: IsoDateTime;
}

export interface ImportError {
  id: string;
  batchId: string;
  rowNumber: number;
  message: string;
  rawData: string | null;
  createdAt: IsoDateTime;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: IsoDateTime;
}

export interface DateRange {
  from: BusinessDate;
  to: BusinessDate;
}

export interface StoreFilters {
  includeArchived?: boolean;
  search?: string;
  platform?: StorePlatform | null;
}

export interface ProductFilters {
  search?: string;
  status?: ProductStatus | 'all';
  category?: string | null;
}

export interface OrderFilters {
  search?: string;
  storeId?: string | null;
  status?: OrderStatus | 'all';
  from?: BusinessDate | null;
  to?: BusinessDate | null;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DataCounts {
  stores: number;
  products: number;
  orders: number;
  fees: number;
  refunds: number;
  settlements: number;
  campaigns: number;
  expenses: number;
  operationalExpenses: number;
}
