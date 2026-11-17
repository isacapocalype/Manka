import type { Money } from '@/types/entities';

/**
 * Margin kotor produk berdasarkan harga jual aktif dan HPP aktif.
 * Nilai null berarti tidak dapat dihitung karena harga jual 0.
 */
export function calculateProductMarginPercent(price: Money, cost: Money): number | null {
  if (!Number.isFinite(price) || !Number.isFinite(cost) || price <= 0) return null;
  return ((price - cost) / price) * 100;
}

export function calculateProductMarginAmount(price: Money, cost: Money): Money {
  return price - cost;
}
