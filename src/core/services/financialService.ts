import type { DateRange, Store } from '@/types/entities';
import type {
  DailyFinancialRow,
  FinancialComparison,
  FinancialDataset,
  FinancialSummary,
  StorePerformance,
} from '@/types/finance';
import type { OrderRepository } from '@/core/repositories/orderRepository';
import type { FeeRepository } from '@/core/repositories/feeRepository';
import type { RefundRepository } from '@/core/repositories/refundRepository';
import type { AdvertisingRepository } from '@/core/repositories/advertisingRepository';
import type { OperationalExpenseRepository } from '@/core/repositories/operationalExpenseRepository';
import type { SettlementRepository } from '@/core/repositories/settlementRepository';
import {
  buildComparison,
  calculateDailySeries,
  calculateFinancialSummary,
  calculateStorePerformance,
} from '@/core/calculations/financialCalculations';

export class FinancialService {
  private readonly orders: OrderRepository;
  private readonly fees: FeeRepository;
  private readonly refunds: RefundRepository;
  private readonly ads: AdvertisingRepository;
  private readonly expenses: OperationalExpenseRepository;
  private readonly settlements: SettlementRepository;

  constructor(
    orders: OrderRepository,
    fees: FeeRepository,
    refunds: RefundRepository,
    ads: AdvertisingRepository,
    expenses: OperationalExpenseRepository,
    settlements: SettlementRepository,
  ) {
    this.orders = orders;
    this.fees = fees;
    this.refunds = refunds;
    this.ads = ads;
    this.expenses = expenses;
    this.settlements = settlements;
  }

  async loadDataset(range: DateRange): Promise<FinancialDataset> {
    const [orders, fees, refunds, advertisingExpenses, operationalExpenses] = await Promise.all([
      this.orders.findForFinance(range.from, range.to),
      this.fees.findForFinance(range.from, range.to),
      this.refunds.findForFinance(range.from, range.to),
      this.ads.findForFinance(range.from, range.to),
      this.expenses.findForFinance(range.from, range.to),
    ]);
    return { orders, fees, refunds, advertisingExpenses, operationalExpenses };
  }

  async getSummary(range: DateRange, storeId: string | null): Promise<FinancialSummary> {
    const dataset = await this.loadDataset(range);
    return calculateFinancialSummary(dataset, { storeId });
  }

  async getDaily(
    range: DateRange,
    storeId: string | null,
  ): Promise<DailyFinancialRow[]> {
    const dataset = await this.loadDataset(range);
    return calculateDailySeries(dataset, { storeId }, range.from, range.to);
  }

  async getStorePerformance(range: DateRange, stores: Store[]): Promise<StorePerformance[]> {
    const dataset = await this.loadDataset(range);
    return calculateStorePerformance(dataset, stores);
  }

  async getComparison(
    range: DateRange,
    previous: DateRange,
    storeId: string | null,
  ): Promise<FinancialComparison> {
    const [currentDataset, previousDataset] = await Promise.all([
      this.loadDataset(range),
      this.loadDataset(previous),
    ]);
    return buildComparison(
      calculateFinancialSummary(currentDataset, { storeId }),
      calculateFinancialSummary(previousDataset, { storeId }),
    );
  }

  async getReceivedSettlements(
    range: DateRange,
    storeId: string | null,
  ): Promise<number> {
    return this.settlements.sumReceived(range.from, range.to, storeId);
  }
}
