import type { Database, SqlExecutor, SqlRow } from '@/core/database/types';
import type {
  FeeSource,
  FeeType,
  MarketplaceFee,
  Order,
  OrderDetail,
  OrderFilters,
  OrderItem,
  OrderListItem,
  OrderStatus,
  PagedResult,
  Refund,
  RefundStatus,
} from '@/types/entities';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { calculateOrderMath, isRevenueOrderStatus } from '@/core/calculations/orderMath';
import { getNullableNumber, getNullableString, getNumber, getString } from './rowUtils';
import type { FinanceOrder } from '@/types/finance';
import type { CompletedOrderWithoutFee } from '@/types/health';

function toStatus(value: string): OrderStatus {
  const statuses: OrderStatus[] = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
    'returned',
    'refunded',
  ];
  return statuses.includes(value as OrderStatus) ? (value as OrderStatus) : 'pending';
}

function mapOrder(row: SqlRow): Order {
  return {
    id: getString(row, 'id'),
    storeId: getString(row, 'store_id'),
    marketplaceOrderId: getString(row, 'marketplace_order_id'),
    orderDate: getString(row, 'order_date'),
    status: toStatus(getString(row, 'status')),
    sellerDiscount: getNumber(row, 'seller_discount'),
    marketplaceDiscount: getNumber(row, 'marketplace_discount'),
    shippingPaid: getNumber(row, 'shipping_paid'),
    settlementValue: getNullableNumber(row, 'settlement_value'),
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
  };
}

function mapItem(row: SqlRow): OrderItem {
  return {
    id: getString(row, 'id'),
    orderId: getString(row, 'order_id'),
    productId: getNullableString(row, 'product_id'),
    productName: getString(row, 'product_name'),
    sku: getString(row, 'sku'),
    quantity: getNumber(row, 'quantity'),
    unitPrice: getNumber(row, 'unit_price'),
    hppSnapshot: getNumber(row, 'hpp_snapshot'),
    createdAt: getString(row, 'created_at'),
  };
}

function mapFee(row: SqlRow): MarketplaceFee {
  return {
    id: getString(row, 'id'),
    storeId: getString(row, 'store_id'),
    orderId: getNullableString(row, 'order_id'),
    feeType: getString(row, 'fee_type') as FeeType,
    amount: getNumber(row, 'amount'),
    feeDate: getString(row, 'fee_date'),
    source: getString(row, 'source') as FeeSource,
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
  };
}

function mapRefund(row: SqlRow): Refund {
  return {
    id: getString(row, 'id'),
    storeId: getString(row, 'store_id'),
    orderId: getString(row, 'order_id'),
    settlementId: getNullableString(row, 'settlement_id'),
    refundDate: getString(row, 'refund_date'),
    amount: getNumber(row, 'amount'),
    quantity: getNumber(row, 'quantity'),
    reason: getString(row, 'reason'),
    status: getString(row, 'status') as RefundStatus,
    notes: getNullableString(row, 'notes'),
    accountId: getNullableString(row, 'account_id'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
  };
}

const LIST_SELECT = `
  SELECT o.*, s.name AS store_name,
    COALESCE((SELECT SUM(oi.quantity * oi.unit_price) FROM order_items oi WHERE oi.order_id = o.id), 0) AS gross_sales,
    COALESCE((SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id), 0) AS item_count,
    COALESCE((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id), 0) AS unit_count,
    COALESCE((SELECT SUM(f.amount) FROM marketplace_fees f WHERE f.order_id = o.id), 0) AS marketplace_fees,
    COALESCE((SELECT SUM(r.amount) FROM refunds r WHERE r.order_id = o.id AND r.status = 'completed'), 0) AS refund_total
  FROM orders o
  JOIN stores s ON s.id = o.store_id
`;

function mapListItem(row: SqlRow): OrderListItem {
  const order = mapOrder(row);
  const grossSales = getNumber(row, 'gross_sales');
  const refundTotal = getNumber(row, 'refund_total');
  return {
    ...order,
    storeName: getString(row, 'store_name'),
    grossSales,
    itemCount: getNumber(row, 'item_count'),
    unitCount: getNumber(row, 'unit_count'),
    marketplaceFees: getNumber(row, 'marketplace_fees'),
    refundTotal,
    netSales: isRevenueOrderStatus(order.status)
      ? grossSales - order.sellerDiscount - refundTotal
      : 0,
  };
}

export interface OrderCreateData {
  storeId: string;
  marketplaceOrderId: string;
  orderDate: string;
  status: OrderStatus;
  sellerDiscount: number;
  marketplaceDiscount: number;
  shippingPaid: number;
  settlementValue: number | null;
  notes: string | null;
}

export interface OrderItemCreateData {
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  hppSnapshot: number;
}

export class OrderRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async list(filters: OrderFilters = {}): Promise<PagedResult<OrderListItem>> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.storeId) {
      where.push('o.store_id = ?');
      params.push(filters.storeId);
    }
    if (filters.status && filters.status !== 'all') {
      where.push('o.status = ?');
      params.push(filters.status);
    }
    if (filters.from) {
      where.push('o.order_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      where.push('o.order_date <= ?');
      params.push(filters.to);
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      where.push('(o.marketplace_order_id LIKE ? OR o.notes LIKE ? OR s.name LIKE ?)');
      params.push(term, term, term);
    }
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(filters.pageSize ?? 25, 100));
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRows = await this.db.query(
      `SELECT COUNT(*) AS total FROM orders o JOIN stores s ON s.id = o.store_id ${whereSql};`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const rows = await this.db.query(
      `${LIST_SELECT} ${whereSql} ORDER BY o.order_date DESC, o.created_at DESC LIMIT ? OFFSET ?;`,
      [...params, pageSize, (page - 1) * pageSize],
    );

    return { items: rows.map(mapListItem), total, page, pageSize };
  }

  async listRecent(limit = 6, storeId?: string | null): Promise<OrderListItem[]> {
    const params: (string | number)[] = [];
    let where = '';
    if (storeId) {
      where = 'WHERE o.store_id = ?';
      params.push(storeId);
    }
    const rows = await this.db.query(
      `${LIST_SELECT} ${where} ORDER BY o.order_date DESC, o.created_at DESC LIMIT ?;`,
      [...params, limit],
    );
    return rows.map(mapListItem);
  }

  async getById(id: string): Promise<Order | null> {
    const rows = await this.db.query('SELECT * FROM orders WHERE id = ?;', [id]);
    return rows[0] ? mapOrder(rows[0]) : null;
  }

  async getDetail(id: string): Promise<OrderDetail | null> {
    const rows = await this.db.query(
      `SELECT o.*, s.name AS store_name FROM orders o JOIN stores s ON s.id = o.store_id WHERE o.id = ?;`,
      [id],
    );
    if (!rows[0]) return null;
    const order = mapOrder(rows[0]);
    const storeName = getString(rows[0], 'store_name');
    const itemRows = await this.db.query(
      'SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC;',
      [id],
    );
    const feeRows = await this.db.query(
      'SELECT * FROM marketplace_fees WHERE order_id = ? ORDER BY fee_date ASC, created_at ASC;',
      [id],
    );
    const refundRows = await this.db.query(
      'SELECT * FROM refunds WHERE order_id = ? ORDER BY refund_date DESC;',
      [id],
    );
    const items = itemRows.map(mapItem);
    const fees = feeRows.map(mapFee);
    const refunds = refundRows.map(mapRefund);
    const completedRefunds = refunds
      .filter((refund) => refund.status === 'completed')
      .reduce((total, refund) => total + refund.amount, 0);
    const feeTotal = fees.reduce((total, fee) => total + fee.amount, 0);
    const math = calculateOrderMath({
      status: order.status,
      sellerDiscount: order.sellerDiscount,
      items,
      completedRefundTotal: completedRefunds,
      marketplaceFees: feeTotal,
    });
    return {
      ...order,
      storeName,
      items,
      fees,
      refunds,
      grossSales: math.grossSales,
      cogs: math.cogs,
      marketplaceFees: math.marketplaceFees,
      refundTotal: math.refunds,
      netSales: math.netSales,
      estimatedProfit: math.estimatedProfit,
    };
  }

  async findByMarketplaceId(storeId: string, marketplaceOrderId: string): Promise<Order | null> {
    const rows = await this.db.query(
      'SELECT * FROM orders WHERE store_id = ? AND marketplace_order_id = ?;',
      [storeId, marketplaceOrderId],
    );
    return rows[0] ? mapOrder(rows[0]) : null;
  }

  async findExistingMarketplaceIds(storeId: string, ids: string[]): Promise<Set<string>> {
    const existing = new Set<string>();
    const unique = [...new Set(ids)];
    const chunkSize = 400;
    for (let offset = 0; offset < unique.length; offset += chunkSize) {
      const chunk = unique.slice(offset, offset + chunkSize);
      if (chunk.length === 0) continue;
      const placeholders = chunk.map(() => '?').join(', ');
      const rows = await this.db.query(
        `SELECT marketplace_order_id FROM orders WHERE store_id = ? AND marketplace_order_id IN (${placeholders});`,
        [storeId, ...chunk],
      );
      for (const row of rows) {
        existing.add(getString(row, 'marketplace_order_id'));
      }
    }
    return existing;
  }

  /** Info pesanan marketplace → internal untuk menghubungkan biaya import. */
  async findImportOrderInfo(
    storeId: string,
    ids: string[],
  ): Promise<Map<string, { id: string; orderDate: string }>> {
    const result = new Map<string, { id: string; orderDate: string }>();
    const unique = [...new Set(ids)];
    const chunkSize = 400;
    for (let offset = 0; offset < unique.length; offset += chunkSize) {
      const chunk = unique.slice(offset, offset + chunkSize);
      if (chunk.length === 0) continue;
      const placeholders = chunk.map(() => '?').join(', ');
      const rows = await this.db.query(
        `SELECT id, marketplace_order_id, order_date FROM orders
         WHERE store_id = ? AND marketplace_order_id IN (${placeholders});`,
        [storeId, ...chunk],
      );
      for (const row of rows) {
        result.set(getString(row, 'marketplace_order_id'), {
          id: getString(row, 'id'),
          orderDate: getString(row, 'order_date'),
        });
      }
    }
    return result;
  }

  async insertOrder(data: OrderCreateData, items: OrderItemCreateData[], tx: SqlExecutor): Promise<string> {
    const id = createId();
    const timestamp = nowIso();
    await tx.execute(
      `INSERT INTO orders (id, store_id, marketplace_order_id, order_date, status, seller_discount,
        marketplace_discount, shipping_paid, settlement_value, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.storeId,
        data.marketplaceOrderId,
        data.orderDate,
        data.status,
        data.sellerDiscount,
        data.marketplaceDiscount,
        data.shippingPaid,
        data.settlementValue,
        data.notes,
        timestamp,
        timestamp,
      ],
    );
    await this.insertItems(id, items, tx);
    return id;
  }

  async insertItems(orderId: string, items: OrderItemCreateData[], tx: SqlExecutor): Promise<void> {
    const timestamp = nowIso();
    for (const item of items) {
      await tx.execute(
        `INSERT INTO order_items (id, order_id, product_id, product_name, sku, quantity, unit_price, hpp_snapshot, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          createId(),
          orderId,
          item.productId,
          item.productName,
          item.sku,
          item.quantity,
          item.unitPrice,
          item.hppSnapshot,
          timestamp,
        ],
      );
    }
  }

  async updateOrder(
    id: string,
    data: OrderCreateData,
    items: OrderItemCreateData[],
    tx: SqlExecutor,
  ): Promise<void> {
    await tx.execute(
      `UPDATE orders SET store_id = ?, marketplace_order_id = ?, order_date = ?, status = ?,
        seller_discount = ?, marketplace_discount = ?, shipping_paid = ?, settlement_value = ?,
        notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.storeId,
        data.marketplaceOrderId,
        data.orderDate,
        data.status,
        data.sellerDiscount,
        data.marketplaceDiscount,
        data.shippingPaid,
        data.settlementValue,
        data.notes,
        nowIso(),
        id,
      ],
    );
    await tx.execute('DELETE FROM order_items WHERE order_id = ?;', [id]);
    await this.insertItems(id, items, tx);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.db.execute('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?;', [
      status,
      nowIso(),
      id,
    ]);
  }

  async delete(id: string, tx?: SqlExecutor): Promise<void> {
    await (tx ?? this.db).execute('DELETE FROM orders WHERE id = ?;', [id]);
  }

  async countRefunds(orderId: string): Promise<number> {
    const rows = await this.db.query(
      'SELECT COUNT(*) AS total FROM refunds WHERE order_id = ?;',
      [orderId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async countForStore(storeId: string): Promise<number> {
    const rows = await this.db.query('SELECT COUNT(*) AS total FROM orders WHERE store_id = ?;', [
      storeId,
    ]);
    return Number(rows[0]?.total ?? 0);
  }

  async findCompletedWithoutFees(): Promise<CompletedOrderWithoutFee[]> {
    const rows = await this.db.query(
      `SELECT o.id, o.marketplace_order_id, o.order_date, s.name AS store_name
       FROM orders o
       JOIN stores s ON s.id = o.store_id
       WHERE o.status = 'completed'
         AND NOT EXISTS (
           SELECT 1 FROM marketplace_fees f WHERE f.order_id = o.id
         )
       ORDER BY o.order_date ASC, o.created_at ASC;`,
    );
    return rows.map((row) => ({
      id: getString(row, 'id'),
      marketplaceOrderId: getString(row, 'marketplace_order_id'),
      orderDate: getString(row, 'order_date'),
      storeName: getString(row, 'store_name'),
    }));
  }

  async findForFinance(from: string, to: string): Promise<FinanceOrder[]> {
    const rows = await this.db.query(
      `SELECT o.id, o.store_id, o.order_date, o.status, o.seller_discount, o.marketplace_discount,
        oi.product_id, oi.product_name, oi.sku, p.category,
        oi.quantity, oi.unit_price, oi.hpp_snapshot
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.order_date >= ? AND o.order_date <= ?
       ORDER BY o.order_date ASC, o.id ASC;`,
      [from, to],
    );
    const map = new Map<string, FinanceOrder>();
    for (const row of rows) {
      const id = getString(row, 'id');
      let order = map.get(id);
      if (!order) {
        order = {
          id,
          storeId: getString(row, 'store_id'),
          orderDate: getString(row, 'order_date'),
          status: toStatus(getString(row, 'status')),
          sellerDiscount: getNumber(row, 'seller_discount'),
          marketplaceDiscount: getNumber(row, 'marketplace_discount'),
          items: [],
        };
        map.set(id, order);
      }
      const quantity = getNullableNumber(row, 'quantity');
      if (quantity !== null) {
        order.items.push({
          productId: getNullableString(row, 'product_id'),
          productName: getNullableString(row, 'product_name') ?? '',
          sku: getNullableString(row, 'sku') ?? '',
          category: getNullableString(row, 'category'),
          quantity,
          unitPrice: getNullableNumber(row, 'unit_price') ?? 0,
          hppSnapshot: getNullableNumber(row, 'hpp_snapshot') ?? 0,
        });
      }
    }
    return [...map.values()];
  }
}
