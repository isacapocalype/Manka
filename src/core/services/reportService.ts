import type { DateRange, Store } from '@/types/entities';
import type {
  DailyFinancialRow,
  FinancialSummary,
  ProductProfitReport,
  StorePerformance,
} from '@/types/finance';
import type { FinancialService } from './financialService';
import type { ProductProfitService } from './productProfitService';
import type { StoreRepository } from '@/core/repositories/storeRepository';
import {
  calculateDailySeries,
  calculateFinancialSummary,
  calculateStorePerformance,
} from '@/core/calculations/financialCalculations';

export interface ReportData {
  range: DateRange;
  storeId: string | null;
  stores: Store[];
  summary: FinancialSummary;
  daily: DailyFinancialRow[];
  storePerformance: StorePerformance[];
  products: ProductProfitReport;
}

export class ReportService {
  private readonly finance: FinancialService;
  private readonly stores: StoreRepository;
  private readonly productProfit: ProductProfitService;

  constructor(
    finance: FinancialService,
    stores: StoreRepository,
    productProfit: ProductProfitService,
  ) {
    this.finance = finance;
    this.stores = stores;
    this.productProfit = productProfit;
  }

  async getReport(range: DateRange, storeId: string | null): Promise<ReportData> {
    const [dataset, stores, products] = await Promise.all([
      this.finance.loadDataset(range),
      this.stores.listAll(),
      this.productProfit.getReport(range, storeId),
    ]);
    const filteredStores = storeId ? stores.filter((store) => store.id === storeId) : stores;
    return {
      range,
      storeId,
      stores: filteredStores,
      summary: calculateFinancialSummary(dataset, { storeId }),
      daily: calculateDailySeries(dataset, { storeId }, range.from, range.to),
      storePerformance: calculateStorePerformance(dataset, filteredStores),
      products,
    };
  }
}
