import type { Database, SqlExecutor, SqlRow } from '@/core/database/types';
import type {
  Product,
  ProductCostEntry,
  ProductFilters,
  ProductInput,
  ProductPriceEntry,
  ProductStatus,
} from '@/types/entities';
import { createId } from '@/core/utils/id';
import { nowIso, todayJakarta } from '@/core/utils/date';
import { getNullableString, getNumber, getString } from './rowUtils';

function toStatus(value: string): ProductStatus {
  return value === 'inactive' ? 'inactive' : 'active';
}

function mapProduct(row: SqlRow): Product {
  return {
    id: getString(row, 'id'),
    name: getString(row, 'name'),
    sku: getString(row, 'sku'),
    category: getNullableString(row, 'category'),
    variant: getNullableString(row, 'variant'),
    price: getNumber(row, 'price'),
    currentCost: getNumber(row, 'current_cost'),
    status: toStatus(getString(row, 'status')),
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
  };
}

function mapCost(row: SqlRow): ProductCostEntry {
  return {
    id: getString(row, 'id'),
    productId: getString(row, 'product_id'),
    cost: getNumber(row, 'cost'),
    effectiveAt: getString(row, 'effective_at'),
    note: getNullableString(row, 'note'),
    createdAt: getString(row, 'created_at'),
  };
}

function mapPrice(row: SqlRow): ProductPriceEntry {
  return {
    id: getString(row, 'id'),
    productId: getString(row, 'product_id'),
    price: getNumber(row, 'price'),
    effectiveAt: getString(row, 'effective_at'),
    createdAt: getString(row, 'created_at'),
  };
}

const PRODUCT_SELECT = `
  SELECT p.*,
    COALESCE((
      SELECT pc.cost FROM product_costs pc
      WHERE pc.product_id = p.id
      ORDER BY pc.effective_at DESC, pc.created_at DESC
      LIMIT 1
    ), 0) AS current_cost
  FROM products p
`;

export interface ProductWriteData extends ProductInput {
  price: number;
}

export class ProductRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async list(filters: ProductFilters = {}): Promise<Product[]> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.status && filters.status !== 'all') {
      where.push('p.status = ?');
      params.push(filters.status);
    }
    if (filters.category) {
      where.push('p.category = ?');
      params.push(filters.category);
    }
    if (filters.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      where.push('(p.name LIKE ? OR p.sku LIKE ? OR p.category LIKE ?)');
      params.push(term, term, term);
    }
    const rows = await this.db.query(
      `${PRODUCT_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY p.status ASC, p.name COLLATE NOCASE ASC;`,
      params,
    );
    return rows.map(mapProduct);
  }

  async getById(id: string): Promise<Product | null> {
    const rows = await this.db.query(`${PRODUCT_SELECT} WHERE p.id = ?;`, [id]);
    return rows[0] ? mapProduct(rows[0]) : null;
  }

  async getBySku(sku: string): Promise<Product | null> {
    const rows = await this.db.query(`${PRODUCT_SELECT} WHERE p.sku = ? COLLATE NOCASE;`, [sku]);
    return rows[0] ? mapProduct(rows[0]) : null;
  }

  async getByName(name: string): Promise<Product | null> {
    const rows = await this.db.query(
      `${PRODUCT_SELECT} WHERE p.name = ? COLLATE NOCASE ORDER BY p.status ASC LIMIT 1;`,
      [name],
    );
    return rows[0] ? mapProduct(rows[0]) : null;
  }

  async create(data: ProductWriteData, tx?: SqlExecutor): Promise<Product> {
    const executor = tx ?? this.db;
    const id = createId();
    const timestamp = nowIso();
    await executor.execute(
      `INSERT INTO products (id, name, sku, category, variant, price, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.name,
        data.sku,
        data.category ?? null,
        data.variant ?? null,
        data.price,
        data.status,
        data.notes ?? null,
        timestamp,
        timestamp,
      ],
    );
    if (data.cost !== null && data.cost !== undefined) {
      await executor.execute(
        'INSERT INTO product_costs (id, product_id, cost, effective_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?);',
        [createId(), id, data.cost, todayJakarta(), 'HPP awal', timestamp],
      );
    }
    if (data.price > 0) {
      await executor.execute(
        'INSERT INTO product_prices (id, product_id, price, effective_at, created_at) VALUES (?, ?, ?, ?, ?);',
        [createId(), id, data.price, todayJakarta(), timestamp],
      );
    }
    const rows = await executor.query(`${PRODUCT_SELECT} WHERE p.id = ?;`, [id]);
    const product = rows[0] ? mapProduct(rows[0]) : null;
    if (!product) throw new Error('Produk gagal disimpan.');
    return product;
  }

  async update(id: string, data: ProductWriteData, tx?: SqlExecutor): Promise<void> {
    const executor = tx ?? this.db;
    await executor.execute(
      `UPDATE products SET name = ?, sku = ?, category = ?, variant = ?, price = ?, status = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.name,
        data.sku,
        data.category ?? null,
        data.variant ?? null,
        data.price,
        data.status,
        data.notes ?? null,
        nowIso(),
        id,
      ],
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.execute('DELETE FROM products WHERE id = ?;', [id]);
  }

  async addCost(
    productId: string,
    cost: number,
    effectiveAt: string,
    note: string | null,
    tx?: SqlExecutor,
  ): Promise<void> {
    const executor = tx ?? this.db;
    await executor.execute(
      'INSERT INTO product_costs (id, product_id, cost, effective_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?);',
      [createId(), productId, cost, effectiveAt, note, nowIso()],
    );
  }

  async addPrice(productId: string, price: number, effectiveAt: string, tx?: SqlExecutor): Promise<void> {
    const executor = tx ?? this.db;
    await executor.execute(
      'INSERT INTO product_prices (id, product_id, price, effective_at, created_at) VALUES (?, ?, ?, ?, ?);',
      [createId(), productId, price, effectiveAt, nowIso()],
    );
  }

  async listCosts(productId: string): Promise<ProductCostEntry[]> {
    const rows = await this.db.query(
      'SELECT * FROM product_costs WHERE product_id = ? ORDER BY effective_at DESC, created_at DESC;',
      [productId],
    );
    return rows.map(mapCost);
  }

  async listPrices(productId: string): Promise<ProductPriceEntry[]> {
    const rows = await this.db.query(
      'SELECT * FROM product_prices WHERE product_id = ? ORDER BY effective_at DESC, created_at DESC;',
      [productId],
    );
    return rows.map(mapPrice);
  }

  async countOrderItems(productId: string): Promise<number> {
    const rows = await this.db.query(
      'SELECT COUNT(*) AS total FROM order_items WHERE product_id = ?;',
      [productId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  async listCategories(): Promise<string[]> {
    const rows = await this.db.query(
      "SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category <> '' ORDER BY category COLLATE NOCASE;",
    );
    return rows
      .map((row) => getNullableString(row, 'category'))
      .filter((value): value is string => value !== null);
  }
}
