import type { Money } from '@/types/entities';
import type { BomItemType } from '@/types/bom';

export interface BomCostItemLike {
  type: BomItemType;
  quantity: number;
  amount: Money;
  materialUnitCost: Money;
}

export interface BomCostTotals {
  materialCost: Money;
  laborCost: Money;
  overheadCost: Money;
  totalCost: Money;
}

/**
 * Biaya satu komponen BOM per unit produk.
 * Material: kuantitas desimal x biaya satuan material.
 * Tenaga kerja/overhead: nominal langsung.
 * Setiap baris dibulatkan ke Rupiah agar subtotal yang ditampilkan
 * selalu konsisten dengan total HPP.
 */
export function calculateBomLineCost(item: BomCostItemLike): Money {
  if (item.type === 'material') {
    const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0;
    const unitCost =
      Number.isFinite(item.materialUnitCost) && item.materialUnitCost > 0
        ? item.materialUnitCost
        : 0;
    return Math.max(0, Math.round(quantity * unitCost));
  }
  const amount = Number.isFinite(item.amount) ? item.amount : 0;
  return Math.max(0, Math.round(amount));
}

export function calculateBomTotals(items: readonly BomCostItemLike[]): BomCostTotals {
  let materialCost = 0;
  let laborCost = 0;
  let overheadCost = 0;
  for (const item of items) {
    const lineCost = calculateBomLineCost(item);
    if (item.type === 'material') materialCost += lineCost;
    else if (item.type === 'labor') laborCost += lineCost;
    else overheadCost += lineCost;
  }
  return {
    materialCost,
    laborCost,
    overheadCost,
    totalCost: materialCost + laborCost + overheadCost,
  };
}
