import type { Material, MaterialFilters, MaterialInput, MaterialStatus } from '@/types/bom';
import { MATERIAL_STATUSES } from '@/types/bom';
import type { MaterialRepository } from '@/core/repositories/materialRepository';
import type { ProductBomRepository } from '@/core/repositories/productBomRepository';
import type { ProductRepository } from '@/core/repositories/productRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  isUniqueConstraintError,
  optionalText,
  requiredText,
  requireMaxLength,
  validateMoney,
} from '@/core/utils/validation';
import { syncProductHppFromBom } from './bomHpp';

function validateStatus(value: string): MaterialStatus {
  if (!MATERIAL_STATUSES.includes(value as MaterialStatus)) {
    throw new ValidationError('Status material tidak valid.', {
      status: 'Pilih status material.',
    });
  }
  return value as MaterialStatus;
}

export class MaterialService {
  private readonly materials: MaterialRepository;
  private readonly bom: ProductBomRepository;
  private readonly products: ProductRepository;
  private readonly audit: AuditRepository;

  constructor(
    materials: MaterialRepository,
    bom: ProductBomRepository,
    products: ProductRepository,
    audit: AuditRepository,
  ) {
    this.materials = materials;
    this.bom = bom;
    this.products = products;
    this.audit = audit;
  }

  list(filters: MaterialFilters = {}) {
    return this.materials.list(filters);
  }

  listActive(): Promise<Material[]> {
    return this.materials.listActive();
  }

  async get(id: string): Promise<Material> {
    const material = await this.materials.getById(id);
    if (!material) throw new NotFoundError('Material tidak ditemukan.');
    return material;
  }

  async usageCount(id: string): Promise<number> {
    await this.get(id);
    return this.materials.countBomUsage(id);
  }

  async create(input: MaterialInput): Promise<Material> {
    const data = this.validateInput(input);
    const duplicate = await this.materials.getByName(data.name);
    if (duplicate) {
      throw new ConflictError(`Material "${data.name}" sudah ada.`);
    }
    try {
      const material = await this.materials.create(data);
      await this.audit.log('create', 'material', material.id, {
        name: material.name,
        unit: material.unit,
        unitCost: material.unitCost,
      });
      return material;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`Material "${data.name}" sudah ada.`);
      }
      throw error;
    }
  }

  async update(id: string, input: MaterialInput): Promise<Material> {
    const existing = await this.get(id);
    const data = this.validateInput(input);
    const duplicate = await this.materials.getByName(data.name);
    if (duplicate && duplicate.id !== id) {
      throw new ConflictError(`Material "${data.name}" sudah ada.`);
    }
    const affectedProductIds =
      data.unitCost !== existing.unitCost
        ? await this.materials.listProductIdsUsingMaterial(id)
        : [];
    try {
      await this.materials.update(id, data);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`Material "${data.name}" sudah ada.`);
      }
      throw error;
    }
    await this.audit.log('update', 'material', id, {
      name: data.name,
      unit: data.unit,
      unitCost: data.unitCost,
      previousUnitCost: existing.unitCost,
    });
    for (const productId of affectedProductIds) {
      const summary = await syncProductHppFromBom(productId, {
        bom: this.bom,
        products: this.products,
      });
      await this.audit.log('update', 'product', productId, {
        reason: 'material_cost_changed',
        materialId: id,
        hppFromBom: summary.totalCost,
      });
    }
    return this.get(id);
  }

  async delete(id: string): Promise<void> {
    const material = await this.get(id);
    const usage = await this.materials.countBomUsage(id);
    if (usage > 0) {
      throw new ConflictError(
        `Material "${material.name}" dipakai pada ${usage} komponen BOM. Hapus komponennya terlebih dahulu.`,
      );
    }
    await this.materials.delete(id);
    await this.audit.log('delete', 'material', id, { name: material.name });
  }

  private validateInput(input: MaterialInput): MaterialInput & { name: string; unit: string } {
    const name = requiredText(input.name, 'Nama material', 'name');
    requireMaxLength(name, 'Nama material', 150, 'name');
    const unit = requiredText(input.unit, 'Satuan', 'unit');
    requireMaxLength(unit, 'Satuan', 30, 'unit');
    const unitCost = validateMoney(input.unitCost, 'Biaya satuan', 'unitCost');
    const status = validateStatus(input.status);
    const notes = optionalText(input.notes, 1000);
    return { name, unit, unitCost, status, notes };
  }
}
