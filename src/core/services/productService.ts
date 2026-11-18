import type { Database } from '@/core/database/types';
import type { Product, ProductCostEntry, ProductFilters, ProductInput, ProductPriceEntry, ProductStatus } from '@/types/entities';
import type { ProductRepository } from '@/core/repositories/productRepository';
import type { ProductBomRepository } from '@/core/repositories/productBomRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  isUniqueConstraintError,
  optionalText,
  requiredText,
  validateMoney,
} from '@/core/utils/validation';
import { todayJakarta } from '@/core/utils/date';

const PRODUCT_STATUSES: ProductStatus[] = ['active', 'inactive'];

function validateStatus(value: string): ProductStatus {
  if (!PRODUCT_STATUSES.includes(value as ProductStatus)) {
    throw new ValidationError('Status produk tidak valid.', { status: 'Pilih status produk.' });
  }
  return value as ProductStatus;
}

export class ProductService {
  private readonly db: Database;
  private readonly products: ProductRepository;
  private readonly bom: ProductBomRepository;
  private readonly audit: AuditRepository;

  constructor(
    db: Database,
    products: ProductRepository,
    bom: ProductBomRepository,
    audit: AuditRepository,
  ) {
    this.db = db;
    this.products = products;
    this.bom = bom;
    this.audit = audit;
  }

  list(filters: ProductFilters = {}): Promise<Product[]> {
    return this.products.list(filters);
  }

  listCategories(): Promise<string[]> {
    return this.products.listCategories();
  }

  async get(id: string): Promise<Product> {
    const product = await this.products.getById(id);
    if (!product) throw new NotFoundError('Produk tidak ditemukan.');
    return product;
  }

  async listCosts(id: string): Promise<ProductCostEntry[]> {
    await this.get(id);
    return this.products.listCosts(id);
  }

  async listPrices(id: string): Promise<ProductPriceEntry[]> {
    await this.get(id);
    return this.products.listPrices(id);
  }

  async create(input: ProductInput): Promise<Product> {
    const name = requiredText(input.name, 'Nama produk', 'name');
    if (name.length > 150) {
      throw new ValidationError('Nama produk terlalu panjang.', {
        name: 'Nama produk maksimal 150 karakter.',
      });
    }
    const sku = requiredText(input.sku, 'SKU', 'sku');
    if (sku.length > 80) {
      throw new ValidationError('SKU terlalu panjang.', { sku: 'SKU maksimal 80 karakter.' });
    }
    const price = validateMoney(input.price, 'Harga jual', 'price');
    const cost =
      input.cost === null || input.cost === undefined
        ? null
        : validateMoney(input.cost, 'HPP', 'cost');
    const status = validateStatus(input.status);
    const category = optionalText(input.category, 100);
    const variant = optionalText(input.variant, 100);
    const notes = optionalText(input.notes, 1000);

    const duplicate = await this.products.getBySku(sku);
    if (duplicate) {
      throw new ConflictError(`SKU "${sku}" sudah digunakan oleh produk lain.`);
    }

    try {
      const product = await this.db.transaction((tx) =>
        this.products.create(
          { name, sku, category, variant, price, cost, status, notes },
          tx,
        ),
      );
      await this.audit.log('create', 'product', product.id, { name, sku });
      return product;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`SKU "${sku}" sudah digunakan oleh produk lain.`);
      }
      throw error;
    }
  }

  async update(id: string, input: ProductInput): Promise<Product> {
    const existing = await this.get(id);
    const name = requiredText(input.name, 'Nama produk', 'name');
    if (name.length > 150) {
      throw new ValidationError('Nama produk terlalu panjang.', {
        name: 'Nama produk maksimal 150 karakter.',
      });
    }
    const sku = requiredText(input.sku, 'SKU', 'sku');
    if (sku.length > 80) {
      throw new ValidationError('SKU terlalu panjang.', { sku: 'SKU maksimal 80 karakter.' });
    }
    const price = validateMoney(input.price, 'Harga jual', 'price');
    const cost =
      input.cost === null || input.cost === undefined
        ? null
        : validateMoney(input.cost, 'HPP', 'cost');
    const status = validateStatus(input.status);
    const category = optionalText(input.category, 100);
    const variant = optionalText(input.variant, 100);
    const notes = optionalText(input.notes, 1000);

    const duplicate = await this.products.getBySku(sku);
    if (duplicate && duplicate.id !== id) {
      throw new ConflictError(`SKU "${sku}" sudah digunakan oleh produk lain.`);
    }

    const bomCount = await this.bom.countByProduct(id);
    if (bomCount > 0 && cost !== null && cost !== existing.currentCost) {
      throw new ValidationError(
        'HPP produk ini dihitung dari BOM. Ubah komponen BOM atau biaya material untuk memperbarui HPP.',
        { cost: 'HPP mengikuti perhitungan BOM dan tidak dapat diisi manual.' },
      );
    }

    try {
      await this.db.transaction(async (tx) => {
        await this.products.update(
          id,
          { name, sku, category, variant, price, cost, status, notes },
          tx,
        );
        if (cost !== null && cost !== existing.currentCost) {
          await this.products.addCost(id, cost, todayJakarta(), 'Perubahan HPP', tx);
        }
        if (price !== existing.price) {
          await this.products.addPrice(id, price, todayJakarta(), tx);
        }
      });
      await this.audit.log('update', 'product', id, { name, sku, price, cost, status });
      return this.get(id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`SKU "${sku}" sudah digunakan oleh produk lain.`);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await this.get(id);
    const used = await this.products.countOrderItems(id);
    if (used > 0) {
      throw new ConflictError(
        'Produk sudah digunakan pada pesanan sehingga tidak dapat dihapus. Nonaktifkan produk agar tetap tersedia untuk riwayat.',
      );
    }
    await this.products.delete(id);
    await this.audit.log('delete', 'product', id);
  }
}
