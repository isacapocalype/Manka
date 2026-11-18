import type { CashEntryDirection, CashLedgerTotals } from '@/types/cash';
import type { Money } from '@/types/entities';

export interface CashEntryLike {
  direction: CashEntryDirection;
  amount: Money;
}

/** Nilai bertanda untuk satu entri kas: masuk positif, keluar negatif. */
export function cashSignedAmount(entry: CashEntryLike): Money {
  if (!Number.isFinite(entry.amount) || entry.amount <= 0) return 0;
  return entry.direction === 'in' ? Math.round(entry.amount) : -Math.round(entry.amount);
}

/** Saldo kas = saldo awal + seluruh entri masuk − seluruh entri keluar. */
export function calculateCashBalance(openingBalance: Money, entries: readonly CashEntryLike[]): Money {
  const opening = Number.isFinite(openingBalance) ? Math.round(openingBalance) : 0;
  return entries.reduce((total, entry) => total + cashSignedAmount(entry), opening);
}

export function calculateCashLedgerTotals(
  entries: readonly CashEntryLike[],
): CashLedgerTotals {
  let totalIn = 0;
  let totalOut = 0;
  for (const entry of entries) {
    if (!Number.isFinite(entry.amount) || entry.amount <= 0) continue;
    if (entry.direction === 'in') totalIn += Math.round(entry.amount);
    else totalOut += Math.round(entry.amount);
  }
  return { totalIn, totalOut, net: totalIn - totalOut };
}

/** Selisih rekonsiliasi: saldo rekening/statement − saldo buku. */
export function calculateReconciliationDifference(
  statementBalance: Money,
  bookBalance: Money,
): Money {
  return Math.round(statementBalance) - Math.round(bookBalance);
}
