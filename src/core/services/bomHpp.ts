import type { BomItem, BomSummary } from '@/types/bom';
import { calculateBomTotals } from '@/core/calculations/bomMath';
import type { ProductBomRepository } from '@/core/repositories/productBomRepository';
import type { ProductRepository } from '@/core/repositories/productRepository';
import { NotFoundError } from '@/core/utils/validation';
import { todayJakarta } from '@/core/utils/date';

const BOM_COST_NOTE = 'HPP dari BOM';

export interface BomSummaryDeps {
  bom: ProductBomRepository;
  products: ProductRepository;
}

export function summarizeBom(
  productId: string,
  items: BomItem[],
  activeCost: number,
): BomSummary {
  const totals = calculateBomTotals(items);
  return {
    productId,
    items,
    ...totals,
    activeCost,
    usingBom: items.length > 0,
    componentCount: items.length,
  };
}

export async function buildBomSummary(
  productId: string,
  deps: BomSummaryDeps,
): Promise<BomSummary> {
  const product = await deps.products.getById(productId);
  if (!product) throw new NotFoundError('Produk tidak ditemukan.');
  const items = await deps.bom.listByProduct(productId);
  return summarizeBom(productId, items, product.currentCost);
}

/**
 * Menghitung ulang HPP produk dari BOM dan mencatat perubahan ke riwayat HPP.
 * Bila produk belum punya komponen BOM, HPP manual tidak diubah.
 */
export async function syncProductHppFromBom(
  productId: string,
  deps: BomSummaryDeps,
): Promise<BomSummary> {
  const summary = await buildBomSummary(productId, deps);
  if (!summary.usingBom) return summary;
  if (summary.totalCost !== summary.activeCost) {
    await deps.products.addCost(
      productId,
      summary.totalCost,
      todayJakarta(),
      BOM_COST_NOTE,
    );
    return { ...summary, activeCost: summary.totalCost };
  }
  return summary;
}
