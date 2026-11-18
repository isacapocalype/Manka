import type { Database, SqlExecutor, SqlRow } from '@/core/database/types';
import type {
  Material,
  MaterialFilters,
  MaterialInput,
  MaterialListItem,
  MaterialStatus,
} from '@/types/bom';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { getNullableString, getNumber, getString } from './rowUtils';

function toStatus(value: string): MaterialStatus {
  return value === 'inactive' ? 'inactive' : 'active';
}

function mapMaterial(row: SqlRow): Material {
  return {
    id: getString(row, 'id'),
    name: getString(row, 'name'),
    unit: getString(row, 'unit'),
    unitCost: getNumber(row, 'unit_cost'),
    status: toStatus(getString(row, 'status')),
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
  };
}

function mapListItem(row: SqlRow): MaterialListItem {
  return {
    ...mapMaterial(row),
    usageCount: getNumber(row, 'usage_count'),
  };
}

const MATERIAL_SELECT = `
  SELECT m.*,
    (SELECT COUNT(*) FROM product_bom_items b WHERE b.material_id = m.id) AS usage_count
  FROM materials m
`;

export interface MaterialWriteData extends MaterialInput {
  name: string;
  unit: string;
}

export class MaterialRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async list(filters: MaterialFilters = {}): Promise<MaterialListItem[]> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.status && filters.status !== 'all') {
      where.push('m.status = ?');
      params.push(filters.status);
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      where.push('(m.name LIKE ? OR m.unit LIKE ? OR m.notes LIKE ?)');
      params.push(term, term, term);
    }
    const rows = await this.db.query(
      `${MATERIAL_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY m.status ASC, m.name COLLATE NOCASE ASC;`,
      params,
    );
    return rows.map(mapListItem);
  }

  async listActive(): Promise<Material[]> {
    const rows = await this.db.query(
      `${MATERIAL_SELECT} WHERE m.status = 'active' ORDER BY m.name COLLATE NOCASE ASC;`,
    );
    return rows.map(mapMaterial);
  }

  async getById(id: string): Promise<Material | null> {
    const rows = await this.db.query(`${MATERIAL_SELECT} WHERE m.id = ?;`, [id]);
    return rows[0] ? mapMaterial(rows[0]) : null;
  }

  async getByName(name: string): Promise<Material | null> {
    const rows = await this.db.query(`${MATERIAL_SELECT} WHERE m.name = ? COLLATE NOCASE;`, [
      name,
    ]);
    return rows[0] ? mapMaterial(rows[0]) : null;
  }

  async create(data: MaterialWriteData, tx?: SqlExecutor): Promise<Material> {
    const executor = tx ?? this.db;
    const id = createId();
    const timestamp = nowIso();
    await executor.execute(
      `INSERT INTO materials (id, name, unit, unit_cost, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.name,
        data.unit,
        data.unitCost,
        data.status,
        data.notes ?? null,
        timestamp,
        timestamp,
      ],
    );
    const rows = await executor.query('SELECT * FROM materials WHERE id = ?;', [id]);
    const material = rows[0] ? mapMaterial(rows[0]) : null;
    if (!material) throw new Error('Material gagal disimpan.');
    return material;
  }

  async update(id: string, data: MaterialWriteData, tx?: SqlExecutor): Promise<void> {
    const executor = tx ?? this.db;
    await executor.execute(
      `UPDATE materials SET name = ?, unit = ?, unit_cost = ?, status = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.name,
        data.unit,
        data.unitCost,
        data.status,
        data.notes ?? null,
        nowIso(),
        id,
      ],
    );
  }

  async delete(id: string, tx?: SqlExecutor): Promise<void> {
    const executor = tx ?? this.db;
    await executor.execute('DELETE FROM materials WHERE id = ?;', [id]);
  }

  async countBomUsage(materialId: string): Promise<number> {
    const rows = await this.db.query(
      'SELECT COUNT(*) AS total FROM product_bom_items WHERE material_id = ?;',
      [materialId],
    );
    return getNumber(rows[0] ?? {}, 'total');
  }

  async listProductIdsUsingMaterial(materialId: string): Promise<string[]> {
    const rows = await this.db.query(
      'SELECT DISTINCT product_id FROM product_bom_items WHERE material_id = ?;',
      [materialId],
    );
    return rows.map((row) => getString(row, 'product_id'));
  }
}
