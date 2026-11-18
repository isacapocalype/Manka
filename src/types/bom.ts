import type { IsoDateTime, Money } from './entities';

export const MATERIAL_STATUSES = ['active', 'inactive'] as const;
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

export interface Material {
  id: string;
  name: string;
  unit: string;
  unitCost: Money;
  status: MaterialStatus;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface MaterialListItem extends Material {
  usageCount: number;
}

export interface MaterialInput {
  name: string;
  unit: string;
  unitCost: Money;
  status: MaterialStatus;
  notes?: string | null;
}

export interface MaterialFilters {
  search?: string;
  status?: MaterialStatus | 'all';
}

export const BOM_ITEM_TYPES = ['material', 'labor', 'overhead'] as const;
export type BomItemType = (typeof BOM_ITEM_TYPES)[number];

export interface BomItem {
  id: string;
  productId: string;
  type: BomItemType;
  materialId: string | null;
  materialName: string | null;
  materialUnit: string | null;
  materialUnitCost: Money;
  label: string | null;
  /** Kuantitas material per unit produk. Komponen tenaga kerja/overhead selalu 1. */
  quantity: number;
  /** Biaya komponen tenaga kerja/overhead per unit produk. */
  amount: Money;
  /** Subtotal komponen per unit produk, sudah dibulatkan ke Rupiah. */
  lineCost: Money;
  notes: string | null;
  sortOrder: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface BomItemInput {
  type: BomItemType;
  materialId?: string | null;
  label?: string | null;
  quantity?: number;
  amount?: Money;
  notes?: string | null;
}

export interface BomSummary {
  productId: string;
  items: BomItem[];
  materialCost: Money;
  laborCost: Money;
  overheadCost: Money;
  totalCost: Money;
  /** HPP aktif produk saat ini, termasuk hasil sinkronisasi BOM. */
  activeCost: Money;
  usingBom: boolean;
  componentCount: number;
}
