import type { Database, SqlRow } from '@/core/database/types';
import type {
  ProductionPriority,
  ProductionStage,
  ProductionStageCount,
  WorkOrderDetail,
  WorkOrderFilters,
  WorkOrderListItem,
  WorkOrderListResult,
  WorkOrderStageLog,
  WorkOrderStatus,
} from '@/types/production';
import { PRODUCTION_STAGES } from '@/types/production';
import { createId } from '@/core/utils/id';
import { nowIso, todayJakarta } from '@/core/utils/date';
import { getNullableString, getNumber, getString } from './rowUtils';

function toStage(value: string): ProductionStage {
  return PRODUCTION_STAGES.includes(value as ProductionStage)
    ? (value as ProductionStage)
    : 'antrian';
}

function toPriority(value: string): ProductionPriority {
  return ['low', 'normal', 'high', 'urgent'].includes(value)
    ? (value as ProductionPriority)
    : 'normal';
}

function toStatus(value: string): WorkOrderStatus {
  return ['active', 'done', 'cancelled'].includes(value)
    ? (value as WorkOrderStatus)
    : 'active';
}

function mapWorkOrder(row: SqlRow): WorkOrderListItem {
  return {
    id: getString(row, 'id'),
    code: getString(row, 'code'),
    orderId: getNullableString(row, 'order_id'),
    orderItemId: getNullableString(row, 'order_item_id'),
    productName: getString(row, 'product_name'),
    sku: getString(row, 'sku'),
    qty: getNumber(row, 'qty'),
    deadline: getNullableString(row, 'deadline'),
    priority: toPriority(getString(row, 'priority')),
    picName: getNullableString(row, 'pic_name'),
    currentStage: toStage(getString(row, 'current_stage')),
    status: toStatus(getString(row, 'status')),
    qtyPassed: getNumber(row, 'qty_passed'),
    qtyDefect: getNumber(row, 'qty_defect'),
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
    orderMarketplaceId: getNullableString(row, 'marketplace_order_id'),
    storeName: getNullableString(row, 'store_name'),
  };
}

function mapStage(row: SqlRow): WorkOrderStageLog {
  return {
    id: getString(row, 'id'),
    workOrderId: getString(row, 'work_order_id'),
    stage: getString(row, 'stage') as WorkOrderStageLog['stage'],
    qtyIn: getNumber(row, 'qty_in'),
    qtyPassed: getNumber(row, 'qty_passed'),
    qtyDefect: getNumber(row, 'qty_defect'),
    picName: getNullableString(row, 'pic_name'),
    notes: getNullableString(row, 'notes'),
    startedAt: getNullableString(row, 'started_at'),
    completedAt: getString(row, 'completed_at'),
    createdAt: getString(row, 'created_at'),
  };
}

const WORK_ORDER_SELECT = `
  SELECT wo.*, o.marketplace_order_id AS marketplace_order_id, s.name AS store_name
  FROM work_orders wo
  LEFT JOIN orders o ON o.id = wo.order_id
  LEFT JOIN stores s ON s.id = o.store_id
`;

export interface WorkOrderWriteData {
  code: string;
  orderId: string | null;
  orderItemId: string | null;
  productName: string;
  sku: string;
  qty: number;
  deadline: string | null;
  priority: ProductionPriority;
  picName: string | null;
  notes: string | null;
}

export interface WorkOrderUpdateData {
  deadline: string | null;
  priority: ProductionPriority;
  picName: string | null;
  notes: string | null;
}

export interface WorkOrderStageWriteData {
  workOrderId: string;
  stage: WorkOrderStageLog['stage'];
  nextStage: ProductionStage;
  nextStatus: WorkOrderStatus;
  qtyIn: number;
  qtyPassed: number;
  qtyDefect: number;
  totalDefect: number;
  picName: string | null;
  notes: string | null;
  startedAt: string | null;
}

export class WorkOrderRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async list(filters: WorkOrderFilters = {}): Promise<WorkOrderListResult> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.status && filters.status !== 'all') {
      where.push('wo.status = ?');
      params.push(filters.status);
    }
    if (filters.stage && filters.stage !== 'all') {
      where.push('wo.current_stage = ?');
      params.push(filters.stage);
    }
    if (filters.priority && filters.priority !== 'all') {
      where.push('wo.priority = ?');
      params.push(filters.priority);
    }
    if (filters.overdueOnly) {
      where.push("wo.status = 'active' AND wo.deadline IS NOT NULL AND wo.deadline < ?");
      params.push(todayJakarta());
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      where.push(
        '(wo.code LIKE ? OR wo.product_name LIKE ? OR wo.sku LIKE ? OR wo.pic_name LIKE ? OR o.marketplace_order_id LIKE ?)',
      );
      params.push(term, term, term, term, term);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const rows = await this.db.query(
      `${WORK_ORDER_SELECT} ${whereSql}
       ORDER BY
         CASE wo.status WHEN 'active' THEN 0 WHEN 'done' THEN 1 ELSE 2 END,
         CASE wo.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
         CASE WHEN wo.deadline IS NULL THEN 1 ELSE 0 END,
         wo.deadline ASC,
         wo.created_at ASC;`,
      params,
    );
    const stageCounts = await this.getStageCounts();
    return {
      items: rows.map(mapWorkOrder),
      total: rows.length,
      page: 1,
      pageSize: rows.length,
      stageCounts,
    };
  }

  async getStageCounts(): Promise<ProductionStageCount[]> {
    const today = todayJakarta();
    const rows = await this.db.query(
      `SELECT current_stage, COUNT(*) AS count,
         SUM(CASE WHEN deadline IS NOT NULL AND deadline < ? THEN 1 ELSE 0 END) AS overdue
       FROM work_orders
       WHERE status = 'active'
       GROUP BY current_stage;`,
      [today],
    );
    const counts = new Map<string, { count: number; overdue: number }>();
    for (const row of rows) {
      counts.set(getString(row, 'current_stage'), {
        count: getNumber(row, 'count'),
        overdue: getNumber(row, 'overdue'),
      });
    }
    return PRODUCTION_STAGES.map((stage) => ({
      stage,
      count: counts.get(stage)?.count ?? 0,
      overdue: counts.get(stage)?.overdue ?? 0,
    }));
  }

  async getById(id: string): Promise<WorkOrderDetail | null> {
    const rows = await this.db.query(`${WORK_ORDER_SELECT} WHERE wo.id = ?;`, [id]);
    if (!rows[0]) return null;
    const stages = await this.db.query(
      `SELECT * FROM work_order_stages WHERE work_order_id = ?
       ORDER BY completed_at ASC, created_at ASC;`,
      [id],
    );
    return {
      ...mapWorkOrder(rows[0]),
      stages: stages.map(mapStage),
    };
  }

  async listByOrder(orderId: string): Promise<WorkOrderListItem[]> {
    const rows = await this.db.query(
      `${WORK_ORDER_SELECT} WHERE wo.order_id = ? ORDER BY wo.created_at DESC;`,
      [orderId],
    );
    return rows.map(mapWorkOrder);
  }

  async listByOrderItem(orderItemId: string): Promise<WorkOrderListItem[]> {
    const rows = await this.db.query(
      `${WORK_ORDER_SELECT} WHERE wo.order_item_id = ? ORDER BY wo.created_at ASC;`,
      [orderItemId],
    );
    return rows.map(mapWorkOrder);
  }

  async sumActiveQtyForOrderItem(orderItemId: string): Promise<number> {
    const rows = await this.db.query(
      `SELECT COALESCE(SUM(qty), 0) AS total FROM work_orders
       WHERE order_item_id = ? AND status <> 'cancelled';`,
      [orderItemId],
    );
    return getNumber(rows[0] ?? {}, 'total');
  }

  async sumActiveQtyByOrder(orderId: string): Promise<Map<string, number>> {
    const rows = await this.db.query(
      `SELECT order_item_id, COALESCE(SUM(qty), 0) AS total FROM work_orders
       WHERE order_id = ? AND order_item_id IS NOT NULL AND status <> 'cancelled'
       GROUP BY order_item_id;`,
      [orderId],
    );
    return new Map(
      rows.map((row) => [getString(row, 'order_item_id'), getNumber(row, 'total')]),
    );
  }

  async nextCode(date: string): Promise<string> {
    const prefix = `WO-${date.replace(/-/g, '')}-`;
    const rows = await this.db.query(
      'SELECT code FROM work_orders WHERE code LIKE ?;',
      [`${prefix}%`],
    );
    let highest = 0;
    for (const row of rows) {
      const sequence = Number(getString(row, 'code').slice(prefix.length));
      if (Number.isSafeInteger(sequence) && sequence > highest) highest = sequence;
    }
    return `${prefix}${String(highest + 1).padStart(3, '0')}`;
  }

  async create(data: WorkOrderWriteData): Promise<string> {
    const id = createId();
    const timestamp = nowIso();
    await this.db.execute(
      `INSERT INTO work_orders (
        id, code, order_id, order_item_id, product_name, sku, qty, deadline,
        priority, pic_name, current_stage, status, qty_passed, qty_defect, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'antrian', 'active', 0, 0, ?, ?, ?);`,
      [
        id,
        data.code,
        data.orderId,
        data.orderItemId,
        data.productName,
        data.sku,
        data.qty,
        data.deadline,
        data.priority,
        data.picName,
        data.notes,
        timestamp,
        timestamp,
      ],
    );
    return id;
  }

  async update(id: string, data: WorkOrderUpdateData): Promise<void> {
    await this.db.execute(
      `UPDATE work_orders
       SET deadline = ?, priority = ?, pic_name = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [data.deadline, data.priority, data.picName, data.notes, nowIso(), id],
    );
  }

  async recordStage(data: WorkOrderStageWriteData): Promise<void> {
    const timestamp = nowIso();
    await this.db.transaction(async (tx) => {
      await tx.execute(
        `INSERT INTO work_order_stages (
          id, work_order_id, stage, qty_in, qty_passed, qty_defect,
          pic_name, notes, started_at, completed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          createId(),
          data.workOrderId,
          data.stage,
          data.qtyIn,
          data.qtyPassed,
          data.qtyDefect,
          data.picName,
          data.notes,
          data.startedAt,
          timestamp,
          timestamp,
        ],
      );
      await tx.execute(
        `UPDATE work_orders
         SET current_stage = ?, status = ?, qty_passed = ?, qty_defect = ?, updated_at = ?
         WHERE id = ?;`,
        [
          data.nextStage,
          data.nextStatus,
          data.qtyPassed,
          data.totalDefect,
          timestamp,
          data.workOrderId,
        ],
      );
    });
  }

  async cancel(id: string): Promise<void> {
    await this.db.execute(
      `UPDATE work_orders SET status = 'cancelled', updated_at = ? WHERE id = ?;`,
      [nowIso(), id],
    );
  }
}
