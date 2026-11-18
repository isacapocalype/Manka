import type { Database, SqlExecutor, SqlRow } from '@/core/database/types';
import type { BomItem, BomItemType } from '@/types/bom';
import { calculateBomLineCost } from '@/core/calculations/bomMath';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { getNullableString, getNumber, getString } from './rowUtils';

function toType(value: string): BomItemType {
  if (value === 'labor' || value === 'overhead') return value;
  return 'material';
}

function mapBomItem(row: SqlRow): BomItem {
  const type = toType(getString(row, 'item_type'));
  const quantity = getNumber(row, 'quantity');
  const amount = getNumber(row, 'amount');
  const materialUnitCost = getNumber(row, 'material_unit_cost');
  return {
    id: getString(row, 'id'),
    productId: getString(row, 'product_id'),
    type,
    materialId: getNullableString(row, 'material_id'),
    materialName: getNullableString(row, 'material_name'),
    materialUnit: getNullableString(row, 'material_unit'),
    materialUnitCost,
    label: getNullableString(row, 'label'),
    quantity,
    amount,
    lineCost: calculateBomLineCost({ type, quantity, amount, materialUnitCost }),
    notes: getNullableString(row, 'notes'),
    sortOrder: getNumber(row, 'sort_order'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
  };
}

const BOM_SELECT = `
  SELECT b.*,
    m.name AS material_name,
    m.unit AS material_unit,
    COALESCE(m.unit_cost, 0) AS material_unit_cost
  FROM product_bom_items b
  LEFT JOIN materials m ON m.id = b.material_id
`;

export interface BomItemWriteData {
  productId: string;
  type: BomItemType;
  materialId: string | null;
  label: string | null;
  quantity: number;
  amount: number;
  notes: string | null;
  sortOrder: number;
}

export class ProductBomRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async listByProduct(productId: string): Promise<BomItem[]> {
    const rows = await this.db.query(
      `${BOM_SELECT} WHERE b.product_id = ? ORDER BY b.sort_order ASC, b.created_at ASC;`,
      [productId],
    );
    return rows.map(mapBomItem);
  }

  async getById(id: string): Promise<BomItem | null> {
    const rows = await this.db.query(`${BOM_SELECT} WHERE b.id = ?;`, [id]);
    return rows[0] ? mapBomItem(rows[0]) : null;
  }

  async countByProduct(productId: string): Promise<number> {
    const rows = await this.db.query(
      'SELECT COUNT(*) AS total FROM product_bom_items WHERE product_id = ?;',
      [productId],
    );
    return getNumber(rows[0] ?? {}, 'total');
  }

  async nextSortOrder(productId: string): Promise<number> {
    const rows = await this.db.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM product_bom_items WHERE product_id = ?;',
      [productId],
    );
    return getNumber(rows[0] ?? {}, 'next_order');
  }

  async create(data: BomItemWriteData, tx?: SqlExecutor): Promise<string> {
    const executor = tx ?? this.db;
    const id = createId();
    const timestamp = nowIso();
    await executor.execute(
      `INSERT INTO product_bom_items
         (id, product_id, item_type, material_id, label, quantity, amount, notes, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.productId,
        data.type,
        data.materialId,
        data.label,
        data.quantity,
        data.amount,
        data.notes,
        data.sortOrder,
        timestamp,
        timestamp,
      ],
    );
    return id;
  }

  async update(
    id: string,
    data: Omit<BomItemWriteData, 'productId' | 'sortOrder'>,
    tx?: SqlExecutor,
  ): Promise<void> {
    const executor = tx ?? this.db;
    await executor.execute(
      `UPDATE product_bom_items
       SET item_type = ?, material_id = ?, label = ?, quantity = ?, amount = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.type,
        data.materialId,
        data.label,
        data.quantity,
        data.amount,
        data.notes,
        nowIso(),
        id,
      ],
    );
  }

  async delete(id: string, tx?: SqlExecutor): Promise<void> {
    const executor = tx ?? this.db;
    await executor.execute('DELETE FROM product_bom_items WHERE id = ?;', [id]);
  }
}
