import type { DateRange } from '@/types/entities';
import type { ProductProfitReport } from '@/types/finance';
import type { OrderRepository } from '@/core/repositories/orderRepository';
import type { FeeRepository } from '@/core/repositories/feeRepository';
import type { RefundRepository } from '@/core/repositories/refundRepository';
import { calculateProductProfit } from '@/core/calculations/financialCalculations';

export class ProductProfitService {
  private readonly orders: OrderRepository;
  private readonly fees: FeeRepository;
  private readonly refunds: RefundRepository;

  constructor(
    orders: OrderRepository,
    fees: FeeRepository,
    refunds: RefundRepository,
  ) {
    this.orders = orders;
    this.fees = fees;
    this.refunds = refunds;
  }

  async getReport(range: DateRange, storeId: string | null): Promise<ProductProfitReport> {
    const [orders, fees, refunds] = await Promise.all([
      this.orders.findForFinance(range.from, range.to),
      this.fees.findByOrderDateRange(range.from, range.to),
      this.refunds.findByOrderDateRange(range.from, range.to),
    ]);
    return calculateProductProfit({ orders, fees, refunds }, { storeId });
  }
}
