import type { Database } from '@/core/database/types';
import type {
  Order,
  OrderDetail,
  OrderFilters,
  OrderInput,
  OrderListItem,
  OrderStatus,
  PagedResult,
} from '@/types/entities';
import { ORDER_STATUSES } from '@/types/entities';
import type {
  OrderRepository,
  OrderCreateData,
  OrderItemCreateData,
} from '@/core/repositories/orderRepository';
import type { ProductRepository } from '@/core/repositories/productRepository';
import type { StoreRepository } from '@/core/repositories/storeRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  isUniqueConstraintError,
  optionalText,
  requiredText,
  validateMoney,
  validateOptionalNonNegative,
  validateQuantity,
} from '@/core/utils/validation';
import { isValidBusinessDate } from '@/core/utils/date';

function validateStatus(value: string): OrderStatus {
  if (!ORDER_STATUSES.includes(value as OrderStatus)) {
    throw new ValidationError('Status pesanan tidak valid.', {
      status: 'Pilih status pesanan yang valid.',
    });
  }
  return value as OrderStatus;
}

export class OrderService {
  private readonly db: Database;
  private readonly orders: OrderRepository;
  private readonly products: ProductRepository;
  private readonly stores: StoreRepository;
  private readonly audit: AuditRepository;

  constructor(
    db: Database,
    orders: OrderRepository,
    products: ProductRepository,
    stores: StoreRepository,
    audit: AuditRepository,
  ) {
    this.db = db;
    this.orders = orders;
    this.products = products;
    this.stores = stores;
    this.audit = audit;
  }

  list(filters: OrderFilters = {}): Promise<PagedResult<OrderListItem>> {
    return this.orders.list(filters);
  }

  listRecent(limit = 6, storeId?: string | null): Promise<OrderListItem[]> {
    return this.orders.listRecent(limit, storeId);
  }

  async get(id: string): Promise<Order> {
    const order = await this.orders.getById(id);
    if (!order) throw new NotFoundError('Pesanan tidak ditemukan.');
    return order;
  }

  async getDetail(id: string): Promise<OrderDetail> {
    const detail = await this.orders.getDetail(id);
    if (!detail) throw new NotFoundError('Pesanan tidak ditemukan.');
    return detail;
  }

  private async buildWriteData(
    input: OrderInput,
    existing: OrderDetail | null,
  ): Promise<{ data: OrderCreateData; items: OrderItemCreateData[] }> {
    const storeId = requiredText(input.storeId, 'Toko', 'storeId');
    const store = await this.stores.getPublic(storeId);
    if (!store) {
      throw new ValidationError('Toko tidak ditemukan.', { storeId: 'Pilih toko yang valid.' });
    }
    const marketplaceOrderId = requiredText(
      input.marketplaceOrderId,
      'Nomor pesanan marketplace',
      'marketplaceOrderId',
    );
    if (marketplaceOrderId.length > 120) {
      throw new ValidationError('Nomor pesanan terlalu panjang.', {
        marketplaceOrderId: 'Nomor pesanan maksimal 120 karakter.',
      });
    }
    if (!isValidBusinessDate(input.orderDate)) {
      throw new ValidationError('Tanggal pesanan tidak valid.', {
        orderDate: 'Pilih tanggal pesanan yang valid.',
      });
    }
    const status = validateStatus(input.status);
    const sellerDiscount = validateMoney(input.sellerDiscount, 'Diskon penjual', 'sellerDiscount');
    const marketplaceDiscount = validateMoney(
      input.marketplaceDiscount,
      'Diskon marketplace',
      'marketplaceDiscount',
    );
    const shippingPaid = validateMoney(input.shippingPaid, 'Ongkir dibayar pembeli', 'shippingPaid');
    const settlementValue = validateOptionalNonNegative(
      input.settlementValue,
      'Nilai pencairan',
      'settlementValue',
    );
    const notes = optionalText(input.notes, 1000);

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new ValidationError('Pesanan harus memiliki minimal satu produk.', {
        items: 'Tambahkan minimal satu produk.',
      });
    }
    if (input.items.length > 100) {
      throw new ValidationError('Terlalu banyak item dalam satu pesanan.', {
        items: 'Maksimal 100 item per pesanan.',
      });
    }

    const existingById = new Map(
      (existing?.items ?? []).map((item) => [item.id, item] as const),
    );
    const items: OrderItemCreateData[] = [];

    for (let index = 0; index < input.items.length; index += 1) {
      const raw = input.items[index];
      if (!raw) continue;
      let productId: string | null = null;
      let productName: string;
      let sku: string;
      let hppSnapshot: number;

      if (raw.productId) {
        const product = await this.products.getById(raw.productId);
        if (!product) {
          throw new ValidationError('Produk pada item pesanan tidak ditemukan.', {
            items: `Produk pada baris ${index + 1} tidak ditemukan.`,
          });
        }
        productId = product.id;
        productName = product.name;
        sku = product.sku;
        const preserved =
          raw.id && existingById.get(raw.id)?.productId === product.id
            ? existingById.get(raw.id)
            : null;
        hppSnapshot = preserved ? preserved.hppSnapshot : product.currentCost;
      } else {
        productName = requiredText(
          raw.productName,
          `Nama produk baris ${index + 1}`,
          'items',
        );
        sku = requiredText(raw.sku, `SKU baris ${index + 1}`, 'items');
        const preserved =
          raw.id && existingById.get(raw.id)?.productId === null
            ? existingById.get(raw.id)
            : null;
        if (preserved) {
          hppSnapshot = preserved.hppSnapshot;
        } else if (raw.hppSnapshot !== undefined && raw.hppSnapshot !== null) {
          hppSnapshot = validateMoney(
            raw.hppSnapshot,
            `HPP baris ${index + 1}`,
            'items',
          );
        } else {
          hppSnapshot = 0;
        }
      }

      items.push({
        productId,
        productName,
        sku,
        quantity: validateQuantity(
          raw.quantity,
          `Kuantitas baris ${index + 1}`,
          'items',
        ),
        unitPrice: validateMoney(raw.unitPrice, `Harga satuan baris ${index + 1}`, 'items'),
        hppSnapshot,
      });
    }

    return {
      data: {
        storeId,
        marketplaceOrderId,
        orderDate: input.orderDate,
        status,
        sellerDiscount,
        marketplaceDiscount,
        shippingPaid,
        settlementValue,
        notes,
      },
      items,
    };
  }

  private async assertUniqueOrder(
    storeId: string,
    marketplaceOrderId: string,
    excludeId?: string,
  ): Promise<void> {
    const duplicate = await this.orders.findByMarketplaceId(storeId, marketplaceOrderId);
    if (duplicate && duplicate.id !== excludeId) {
      throw new ConflictError(
        `Nomor pesanan "${marketplaceOrderId}" sudah ada pada toko ini. Import ulang tidak menggandakan pesanan.`,
      );
    }
  }

  async create(input: OrderInput): Promise<OrderDetail> {
    const { data, items } = await this.buildWriteData(input, null);
    await this.assertUniqueOrder(data.storeId, data.marketplaceOrderId);
    try {
      const id = await this.db.transaction((tx) => this.orders.insertOrder(data, items, tx));
      await this.audit.log('create', 'order', id, {
        storeId: data.storeId,
        marketplaceOrderId: data.marketplaceOrderId,
        status: data.status,
      });
      return this.getDetail(id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          `Nomor pesanan "${data.marketplaceOrderId}" sudah ada pada toko ini.`,
        );
      }
      throw error;
    }
  }

  async update(id: string, input: OrderInput): Promise<OrderDetail> {
    const existing = await this.getDetail(id);
    const { data, items } = await this.buildWriteData(input, existing);
    await this.assertUniqueOrder(data.storeId, data.marketplaceOrderId, id);
    try {
      await this.db.transaction((tx) => this.orders.updateOrder(id, data, items, tx));
      await this.audit.log('update', 'order', id, {
        storeId: data.storeId,
        marketplaceOrderId: data.marketplaceOrderId,
        status: data.status,
      });
      return this.getDetail(id);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(
          `Nomor pesanan "${data.marketplaceOrderId}" sudah ada pada toko ini.`,
        );
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.get(id);
    const validated = validateStatus(status);
    await this.orders.updateStatus(id, validated);
    await this.audit.log('update_status', 'order', id, { status: validated });
  }

  async delete(id: string): Promise<void> {
    await this.get(id);
    const refundCount = await this.orders.countRefunds(id);
    if (refundCount > 0) {
      throw new ConflictError(
        'Pesanan memiliki data refund dan tidak dapat dihapus. Hapus refund terlebih dahulu jika memang diperlukan.',
      );
    }
    await this.db.transaction((tx) => this.orders.delete(id, tx));
    await this.audit.log('delete', 'order', id);
  }
}
