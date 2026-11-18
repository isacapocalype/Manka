import type { BusinessDate, IsoDateTime, Money } from './entities';

export const CASH_ACCOUNT_TYPES = ['cash', 'bank', 'ewallet'] as const;
export type CashAccountType = (typeof CASH_ACCOUNT_TYPES)[number];

export const CASH_ACCOUNT_STATUSES = ['active', 'archived'] as const;
export type CashAccountStatus = (typeof CASH_ACCOUNT_STATUSES)[number];

export const CASH_ENTRY_DIRECTIONS = ['in', 'out'] as const;
export type CashEntryDirection = (typeof CASH_ENTRY_DIRECTIONS)[number];

export const CASH_ENTRY_SOURCE_TYPES = [
  'settlement',
  'operational_expense',
  'advertising_expense',
  'refund',
  'transfer',
  'adjustment',
] as const;
export type CashEntrySourceType = (typeof CASH_ENTRY_SOURCE_TYPES)[number];

export interface CashAccount {
  id: string;
  name: string;
  type: CashAccountType;
  openingBalance: Money;
  status: CashAccountStatus;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CashAccountBalance extends CashAccount {
  /** Saldo berjalan: saldo awal + seluruh entri kas. */
  balance: Money;
  entryCount: number;
  lastEntryDate: BusinessDate | null;
}

export interface CashAccountInput {
  name: string;
  type: CashAccountType;
  openingBalance: Money;
  status: CashAccountStatus;
  notes?: string | null;
}

export interface CashAccountFilters {
  status?: CashAccountStatus | 'all';
  search?: string;
}

export interface CashEntry {
  id: string;
  accountId: string;
  accountName: string;
  entryDate: BusinessDate;
  direction: CashEntryDirection;
  amount: Money;
  sourceType: CashEntrySourceType;
  sourceId: string | null;
  description: string;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CashEntryInput {
  accountId: string;
  entryDate: BusinessDate;
  direction: CashEntryDirection;
  amount: Money;
  description: string;
  notes?: string | null;
}

export interface CashLedgerFilters {
  accountId?: string | null;
  direction?: CashEntryDirection | 'all';
  sourceType?: CashEntrySourceType | 'all';
  from?: BusinessDate | null;
  to?: BusinessDate | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CashLedgerTotals {
  totalIn: Money;
  totalOut: Money;
  net: Money;
}

export interface CashTransfer {
  id: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  transferDate: BusinessDate;
  amount: Money;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CashTransferInput {
  fromAccountId: string;
  toAccountId: string;
  transferDate: BusinessDate;
  amount: Money;
  notes?: string | null;
}

export interface CashReconciliation {
  id: string;
  accountId: string;
  accountName: string;
  reconciliationDate: BusinessDate;
  statementBalance: Money;
  bookBalance: Money;
  difference: Money;
  notes: string | null;
  createdAt: IsoDateTime;
}

export interface CashReconciliationInput {
  accountId: string;
  reconciliationDate: BusinessDate;
  statementBalance: Money;
  notes?: string | null;
  /** Catat selisih sebagai penyesuaian kas agar buku sama dengan rekening. */
  createAdjustment?: boolean;
}

export interface CashReconciliationResult {
  reconciliation: CashReconciliation;
  adjustmentEntryId: string | null;
}

export interface CashAmountCount {
  amount: Money;
  count: number;
}

export interface CashSummary {
  totalBalance: Money;
  totalOpeningBalance: Money;
  accountCount: number;
  accounts: CashAccountBalance[];
  pendingSettlements: CashAmountCount;
  unassignedSettlements: CashAmountCount;
  unlinkedRefunds: CashAmountCount;
}
