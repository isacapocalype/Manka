export type DataHealthSeverity = 'critical' | 'warning' | 'info';

export type DataHealthCheckCode =
  | 'completed_orders_without_fees'
  | 'products_without_hpp'
  | 'stale_pending_settlements'
  | 'backup_overdue';

export interface DataHealthItem {
  id: string;
  title: string;
  description: string;
  href: string;
}

export interface DataHealthCheck {
  code: DataHealthCheckCode;
  title: string;
  description: string;
  severity: DataHealthSeverity;
  count: number;
  items: DataHealthItem[];
  actionHref: string;
  actionLabel: string;
}

export interface DataHealthReport {
  checkedAt: string;
  totalIssues: number;
  criticalChecks: number;
  warningChecks: number;
  checks: DataHealthCheck[];
}

export interface CompletedOrderWithoutFee {
  id: string;
  marketplaceOrderId: string;
  orderDate: string;
  storeName: string;
}

export interface PendingSettlementSummary {
  id: string;
  settlementNo: string;
  settlementDate: string;
  totalPayout: number;
  storeName: string;
}
