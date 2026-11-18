import type { CashAccountBalance } from '@/types/cash';
import { CASH_ACCOUNT_TYPE_LABELS } from '@/app/labels';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';

export interface CashAccountChoice {
  value: string;
  label: string;
}

export function cashAccountChoices(
  accounts: readonly CashAccountBalance[],
  selectedId: string | null,
  options: { allLabel?: string | null; includeArchived?: boolean } = {},
): CashAccountChoice[] {
  const result: CashAccountChoice[] = [];
  if (options.allLabel !== null) {
    result.push({ value: '', label: options.allLabel ?? '— Pilih rekening —' });
  }
  for (const account of accounts) {
    if (account.status === 'archived' && account.id !== selectedId) {
      if (!options.includeArchived) continue;
    }
    result.push({
      value: account.id,
      label: `${account.name} · ${CASH_ACCOUNT_TYPE_LABELS[account.type]}${account.status === 'archived' ? ' (arsip)' : ''}`,
    });
  }
  return result;
}

export function cashAccountOptionsHtml(
  accounts: readonly CashAccountBalance[],
  selectedId: string | null,
): string {
  return cashAccountChoices(accounts, selectedId)
    .map(
      (choice) =>
        `<option value="${escapeAttr(choice.value)}" ${choice.value === (selectedId ?? '') ? 'selected' : ''}>${escapeHtml(choice.label)}</option>`,
    )
    .join('');
}
