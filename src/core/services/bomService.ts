import type { BomItemInput, BomSummary } from '@/types/bom';
import { BOM_ITEM_TYPES } from '@/types/bom';
import type { ProductBomRepository } from '@/core/repositories/productBomRepository';
import type { MaterialRepository } from '@/core/repositories/materialRepository';
import type { ProductRepository } from '@/core/repositories/productRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import {
  NotFoundError,
  ValidationError,
  optionalText,
  requiredText,
  requireMaxLength,
  validateMoney,
} from '@/core/utils/validation';
import { buildBomSummary, syncProductHppFromBom } from './bomHpp';

const MAX_QUANTITY = 1_000_000;
const QUANTITY_SCALE = 10_000;

function validateQuantity(value: number | undefined, field: string): number {
  if (value === undefined || value === null || !Number.isFinite(value) || value <= 0) {
    throw new ValidationError('Kuantitas material tidak valid.', {
      [field]: 'Kuantitas harus lebih dari 0.',
    });
  }
  if (value > MAX_QUANTITY) {
    throw new ValidationError('Kuantitas material terlalu besar.', {
      [field]: `Kuantitas maksimal ${MAX_QUANTITY}.`,
    });
  }
  const scaled = value * QUANTITY_SCALE;
  if (Math.abs(scaled - Math.round(scaled)) > 1e-6) {
    throw new ValidationError('Kuantitas material maksimal 4 angka desimal.', {
      [field]: 'Gunakan maksimal 4 angka desimal.',
    });
  }
  return Math.round(scaled) / QUANTITY_SCALE;
}

interface ValidatedBomItem {
  type: BomItemInput['type'];
  materialId: string | null;
  label: string | null;
  quantity: number;
  amount: number;
  notes: string | null;
}

export class BomService {
  private readonly bom: ProductBomRepository;
  private readonly materials: MaterialRepository;
  private readonly products: ProductRepository;
  private readonly audit: AuditRepository;

  constructor(
    bom: ProductBomRepository,
    materials: MaterialRepository,
    products: ProductRepository,
    audit: AuditRepository,
  ) {
    this.bom = bom;
    this.materials = materials;
    this.products = products;
    this.audit = audit;
  }

  async getSummary(productId: string): Promise<BomSummary> {
    return buildBomSummary(productId, { bom: this.bom, products: this.products });
  }

  async addItem(productId: string, input: BomItemInput): Promise<BomSummary> {
    await this.requireProduct(productId);
    const data = await this.validateItem(input);
    const sortOrder = await this.bom.nextSortOrder(productId);
    const id = await this.bom.create({ ...data, productId, sortOrder });
    await this.audit.log('create', 'product_bom_item', id, {
      productId,
      type: data.type,
      materialId: data.materialId,
      label: data.label,
      quantity: data.quantity,
      amount: data.amount,
    });
    return syncProductHppFromBom(productId, { bom: this.bom, products: this.products });
  }

  async updateItem(productId: string, itemId: string, input: BomItemInput): Promise<BomSummary> {
    await this.requireProduct(productId);
    const existing = await this.requireItem(productId, itemId);
    const data = await this.validateItem(input);
    await this.bom.update(itemId, data);
    await this.audit.log('update', 'product_bom_item', itemId, {
      productId,
      type: data.type,
      materialId: data.materialId,
      label: data.label,
      quantity: data.quantity,
      amount: data.amount,
      previousType: existing.type,
    });
    return syncProductHppFromBom(productId, { bom: this.bom, products: this.products });
  }

  async removeItem(productId: string, itemId: string): Promise<BomSummary> {
    await this.requireProduct(productId);
    const existing = await this.requireItem(productId, itemId);
    await this.bom.delete(itemId);
    await this.audit.log('delete', 'product_bom_item', itemId, {
      productId,
      type: existing.type,
      materialId: existing.materialId,
      label: existing.label,
    });
    return syncProductHppFromBom(productId, { bom: this.bom, products: this.products });
  }

  private async requireProduct(productId: string): Promise<void> {
    const product = await this.products.getById(productId);
    if (!product) throw new NotFoundError('Produk tidak ditemukan.');
  }

  private async requireItem(productId: string, itemId: string) {
    const item = await this.bom.getById(itemId);
    if (!item || item.productId !== productId) {
      throw new NotFoundError('Komponen BOM tidak ditemukan pada produk ini.');
    }
    return item;
  }

  private async validateItem(input: BomItemInput): Promise<ValidatedBomItem> {
    if (!BOM_ITEM_TYPES.includes(input.type)) {
      throw new ValidationError('Jenis komponen BOM tidak valid.', {
        type: 'Pilih jenis komponen.',
      });
    }
    const notes = optionalText(input.notes, 500);
    if (input.type === 'material') {
      const materialId = input.materialId?.trim() ?? '';
      if (!materialId) {
        throw new ValidationError('Material wajib dipilih.', {
          materialId: 'Pilih material untuk komponen ini.',
        });
      }
      const material = await this.materials.getById(materialId);
      if (!material) {
        throw new ValidationError('Material tidak ditemukan.', {
          materialId: 'Pilih material yang valid.',
        });
      }
      return {
        type: 'material',
        materialId: material.id,
        label: null,
        quantity: validateQuantity(input.quantity, 'quantity'),
        amount: 0,
        notes,
      };
    }

    const label = requiredText(input.label, 'Nama komponen', 'label');
    requireMaxLength(label, 'Nama komponen', 120, 'label');
    const amount = validateMoney(input.amount, 'Biaya komponen', 'amount');
    return {
      type: input.type,
      materialId: null,
      label,
      quantity: 1,
      amount,
      notes,
    };
  }
}
