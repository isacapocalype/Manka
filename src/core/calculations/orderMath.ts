import type { Money, OrderStatus } from '@/types/entities';

export const REVENUE_ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'completed',
];

/**
 * Kebijakan pendapatan:
 * - Pesanan batal, retur, dan refund penuh tidak dihitung sebagai penjualan.
 * - Refund pada pesanan yang masih dihitung sebagai penjualan mengurangi pendapatan satu kali.
 * - Settlement tidak pernah ditambahkan sebagai pendapatan baru.
 */
export function isRevenueOrderStatus(status: OrderStatus): boolean {
  return REVENUE_ORDER_STATUSES.includes(status);
}

export interface OrderMathInput {
  status: OrderStatus;
  sellerDiscount: Money;
  items: readonly { quantity: number; unitPrice: Money; hppSnapshot: Money }[];
  completedRefundTotal: Money;
  marketplaceFees: Money;
}

export interface OrderMathResult {
  grossSales: Money;
  sellerDiscount: Money;
  refunds: Money;
  netSales: Money;
  cogs: Money;
  marketplaceFees: Money;
  estimatedProfit: Money;
  unitsSold: number;
}

export function calculateOrderMath(input: OrderMathInput): OrderMathResult {
  const grossSales = input.items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );
  const cogs = input.items.reduce((total, item) => total + item.quantity * item.hppSnapshot, 0);
  const unitsSold = input.items.reduce((total, item) => total + item.quantity, 0);

  if (!isRevenueOrderStatus(input.status)) {
    return {
      grossSales: 0,
      sellerDiscount: 0,
      refunds: 0,
      netSales: 0,
      cogs: 0,
      marketplaceFees: input.marketplaceFees,
      estimatedProfit: -input.marketplaceFees,
      unitsSold: 0,
    };
  }

  const netSales = grossSales - input.sellerDiscount - input.completedRefundTotal;
  return {
    grossSales,
    sellerDiscount: input.sellerDiscount,
    refunds: input.completedRefundTotal,
    netSales,
    cogs,
    marketplaceFees: input.marketplaceFees,
    estimatedProfit: netSales - cogs - input.marketplaceFees,
    unitsSold,
  };
}
