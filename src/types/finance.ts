import type {
  BusinessDate,
  FeeSource,
  Money,
  OrderStatus,
  RefundStatus,
  StorePlatform,
} from './entities';

export interface FinanceOrderItem {
  quantity: number;
  unitPrice: Money;
  hppSnapshot: Money;
}

export interface FinanceOrder {
  id: string;
  storeId: string;
  orderDate: BusinessDate;
  status: OrderStatus;
  sellerDiscount: Money;
  marketplaceDiscount: Money;
  items: FinanceOrderItem[];
}

export interface FinanceFee {
  storeId: string;
  feeDate: BusinessDate;
  amount: Money;
  source: FeeSource;
}

export interface FinanceRefund {
  storeId: string;
  orderId: string;
  refundDate: BusinessDate;
  amount: Money;
  status: RefundStatus;
  orderStatus: OrderStatus;
}

export interface FinanceAdvertisingExpense {
  storeId: string | null;
  expenseDate: BusinessDate;
  amount: Money;
}

export interface FinanceOperationalExpense {
  storeId: string | null;
  expenseDate: BusinessDate;
  amount: Money;
}

export interface FinancialDataset {
  orders: FinanceOrder[];
  fees: FinanceFee[];
  refunds: FinanceRefund[];
  advertisingExpenses: FinanceAdvertisingExpense[];
  operationalExpenses: FinanceOperationalExpense[];
}

export interface FinancialSummary {
  grossSales: Money;
  sellerDiscount: Money;
  marketplaceDiscount: Money;
  refunds: Money;
  netSales: Money;
  cogs: Money;
  grossProfit: Money;
  marketplaceFeesActual: Money;
  marketplaceFeesEstimated: Money;
  marketplaceFees: Money;
  advertisingSpend: Money;
  operationalExpenses: Money;
  sharedOperationalExpenses: Money;
  sharedAdvertisingSpend: Money;
  operatingProfit: Money;
  orderCount: number;
  unitsSold: number;
  averageOrderValue: Money;
  marginPercent: number | null;
  hasEstimatedFees: boolean;
}

export interface DailyFinancialRow extends FinancialSummary {
  date: BusinessDate;
}

export interface StorePerformance {
  storeId: string;
  storeName: string;
  platform: StorePlatform;
  summary: FinancialSummary;
}

export interface FinancialFilter {
  storeId: string | null;
}

export interface FinancialComparison {
  current: FinancialSummary;
  previous: FinancialSummary;
  grossSalesChangePercent: number | null;
  netSalesChangePercent: number | null;
  operatingProfitChangePercent: number | null;
}

export interface StoreComparisonRow {
  storeId: string;
  storeName: string;
  platform: StorePlatform;
  grossSales: Money;
  netSales: Money;
  operatingProfit: Money;
  orderCount: number;
}
