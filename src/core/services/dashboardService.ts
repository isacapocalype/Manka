import type { Store } from '@/types/entities';
import type {
  DailyFinancialRow,
  FinancialComparison,
  FinancialSummary,
  StorePerformance,
} from '@/types/finance';
import type { FinancialService } from './financialService';
import type { CashService } from './cashService';
import type { StoreRepository } from '@/core/repositories/storeRepository';
import type { OrderRepository } from '@/core/repositories/orderRepository';
import type { CashSummary } from '@/types/cash';
import type { DateRange, OrderListItem } from '@/types/entities';
import { previousRange } from '@/core/utils/date';
import {
  buildComparison,
  calculateDailySeries,
  calculateFinancialSummary,
  calculateStorePerformance,
} from '@/core/calculations/financialCalculations';

export interface DashboardData {
  range: DateRange;
  previousRange: DateRange;
  summary: FinancialSummary;
  previousSummary: FinancialSummary;
  comparison: FinancialComparison;
  daily: DailyFinancialRow[];
  storePerformance: StorePerformance[];
  stores: Store[];
  recentOrders: OrderListItem[];
  receivedSettlements: number;
  cash: CashSummary;
}

export class DashboardService {
  private readonly finance: FinancialService;
  private readonly stores: StoreRepository;
  private readonly orders: OrderRepository;
  private readonly cash: CashService;

  constructor(
    finance: FinancialService,
    stores: StoreRepository,
    orders: OrderRepository,
    cash: CashService,
  ) {
    this.finance = finance;
    this.stores = stores;
    this.orders = orders;
    this.cash = cash;
  }

  async load(range: DateRange, storeId: string | null): Promise<DashboardData> {
    const previous = previousRange(range);
    const [
      currentDataset,
      previousDataset,
      stores,
      recentOrders,
      receivedSettlements,
      cash,
    ] = await Promise.all([
      this.finance.loadDataset(range),
      this.finance.loadDataset(previous),
      this.stores.listAll(),
      this.orders.listRecent(6, storeId),
      this.finance.getReceivedSettlements(range, storeId),
      this.cash.getSummary(),
    ]);

    const summary = calculateFinancialSummary(currentDataset, { storeId });
    const previousSummary = calculateFinancialSummary(previousDataset, { storeId });
    const storePerformance = calculateStorePerformance(
      currentDataset,
      storeId ? stores.filter((store) => store.id === storeId) : stores,
    );
    const daily = calculateDailySeries(currentDataset, { storeId }, range.from, range.to);

    return {
      range,
      previousRange: previous,
      summary,
      previousSummary,
      comparison: buildComparison(summary, previousSummary),
      daily,
      storePerformance,
      stores,
      recentOrders,
      receivedSettlements,
      cash,
    };
  }
}
