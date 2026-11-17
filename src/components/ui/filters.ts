import type { Store } from '@/types/entities';
import type { Period, PeriodPreset } from '@/core/utils/date';
import {
  PERIOD_OPTIONS,
  isValidBusinessDate,
  resolvePeriod,
  todayJakarta,
} from '@/core/utils/date';
import { escapeAttr, escapeHtml } from './dom';
import { icon } from './icons';
import { showToast } from './toast';

export interface ListFilterState {
  period: Period;
  storeId: string | null;
}

function readPreset(query: URLSearchParams): PeriodPreset {
  const value = query.get('period');
  if (value && PERIOD_OPTIONS.some((option) => option.value === value)) {
    return value as PeriodPreset;
  }
  return 'thisMonth';
}

export function readListFilters(query: URLSearchParams): ListFilterState {
  const preset = readPreset(query);
  const rawFrom = query.get('from') ?? '';
  const rawTo = query.get('to') ?? '';
  const custom =
    isValidBusinessDate(rawFrom) && isValidBusinessDate(rawTo)
      ? { from: rawFrom, to: rawTo }
      : undefined;
  let period: Period;
  try {
    period = resolvePeriod(preset, custom, todayJakarta());
  } catch {
    period = resolvePeriod('thisMonth', undefined, todayJakarta());
  }
  const storeId = query.get('storeId');
  return {
    period,
    storeId: storeId && storeId.trim() !== '' ? storeId : null,
  };
}

export function storeSelectOptions(
  stores: Store[],
  selectedId: string | null,
  options: { allLabel?: string; includeArchived?: boolean; activeOnly?: boolean } = {},
): { value: string; label: string }[] {
  const result: { value: string; label: string }[] = [];
  if (options.allLabel !== undefined) {
    result.push({ value: '', label: options.allLabel });
  }
  for (const store of stores) {
    if (options.activeOnly && store.status === 'archived' && store.id !== selectedId) continue;
    if (!options.includeArchived && store.status === 'archived' && store.id !== selectedId) continue;
    result.push({
      value: store.id,
      label: `${store.name}${store.status === 'archived' ? ' (arsip)' : ''}`,
    });
  }
  return result;
}

export function storeFilterOptions(stores: Store[], selectedId: string | null): string {
  return storeSelectOptions(stores, selectedId, { allLabel: 'Semua toko', includeArchived: true })
    .map(
      (option) =>
        `<option value="${escapeAttr(option.value)}" ${option.value === (selectedId ?? '') ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
    )
    .join('');
}

export function listFilterHtml(
  filters: ListFilterState,
  stores: Store[],
  options: { showStore?: boolean; showPeriod?: boolean } = {},
): string {
  const showStore = options.showStore ?? true;
  const showPeriod = options.showPeriod ?? true;
  const isCustom = filters.period.preset === 'custom';
  return `
    <div class="filter-bar" data-filter-bar>
      ${
        showPeriod
          ? `<div class="filter-control">
              <label class="filter-label" for="filter-period">Periode</label>
              <select class="input select" id="filter-period" data-filter-period>
                ${PERIOD_OPTIONS.map(
                  (option) =>
                    `<option value="${option.value}" ${option.value === filters.period.preset ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
                ).join('')}
              </select>
            </div>
            <div class="filter-control filter-dates" data-filter-dates ${isCustom ? '' : 'hidden'}>
              <div class="date-field">
                <label class="filter-label" for="filter-from">Dari</label>
                <input class="input" id="filter-from" type="date" data-filter-from value="${escapeAttr(filters.period.from)}" />
              </div>
              <span class="date-separator" aria-hidden="true">—</span>
              <div class="date-field">
                <label class="filter-label" for="filter-to">Sampai</label>
                <input class="input" id="filter-to" type="date" data-filter-to value="${escapeAttr(filters.period.to)}" />
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-filter-apply>Terapkan</button>
            </div>`
          : ''
      }
      ${
        showStore
          ? `<div class="filter-control">
              <label class="filter-label" for="filter-store">Toko</label>
              <select class="input select" id="filter-store" data-filter-store>
                ${storeFilterOptions(stores, filters.storeId)}
              </select>
            </div>`
          : ''
      }
      <span class="filter-range">${icon('calendar-days', 'filter-icon')} ${escapeHtml(filters.period.label)}</span>
    </div>
  `;
}

export function storeFilterHtml(stores: Store[], storeId: string | null): string {
  return `
    <div class="filter-bar filter-bar-compact" data-store-filter>
      <div class="filter-control">
        <label class="filter-label" for="filter-store-only">Toko</label>
        <select class="input select" id="filter-store-only" data-store-filter-select>
          ${storeFilterOptions(stores, storeId)}
        </select>
      </div>
    </div>
  `;
}

export function buildRoute(
  path: string,
  currentQuery: URLSearchParams,
  patch: Record<string, string | number | null | undefined>,
): string {
  const next = new URLSearchParams(currentQuery.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === '') {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  }
  const query = next.toString();
  return query === '' ? path : `${path}?${query}`;
}

export interface FilterContext {
  path: string;
  query: URLSearchParams;
  navigate(path: string): void;
}

export function bindListFilters(root: ParentNode, context: FilterContext): void {
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-filter-apply]');
  const periodSelect = root.querySelector<HTMLSelectElement>('[data-filter-period]');
  const storeSelect = root.querySelector<HTMLSelectElement>('[data-filter-store]');
  const dateWrap = root.querySelector<HTMLElement>('[data-filter-dates]');
  const fromInput = root.querySelector<HTMLInputElement>('[data-filter-from]');
  const toInput = root.querySelector<HTMLInputElement>('[data-filter-to]');

  const navigate = (patch: Record<string, string | number | null | undefined>): void => {
    context.navigate(buildRoute(context.path, context.query, { ...patch, page: null }));
  };

  periodSelect?.addEventListener('change', () => {
    const preset = periodSelect.value;
    if (preset === 'custom') {
      if (dateWrap) dateWrap.hidden = false;
      fromInput?.focus();
      return;
    }
    if (dateWrap) dateWrap.hidden = true;
    navigate({ period: preset, from: null, to: null });
  });

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const from = fromInput?.value ?? '';
      const to = toInput?.value ?? '';
      if (!isValidBusinessDate(from) || !isValidBusinessDate(to)) {
        showToast('Pilih tanggal awal dan akhir yang valid.', 'error');
        return;
      }
      if (from > to) {
        showToast('Tanggal awal tidak boleh setelah tanggal akhir.', 'error');
        return;
      }
      navigate({ period: 'custom', from, to });
    });
  }

  storeSelect?.addEventListener('change', () => {
    navigate({ storeId: storeSelect.value || null });
  });
}

export function bindStoreFilter(root: ParentNode, context: FilterContext): void {
  const select = root.querySelector<HTMLSelectElement>('[data-store-filter-select]');
  select?.addEventListener('change', () => {
    context.navigate(buildRoute(context.path, context.query, { storeId: select.value || null }));
  });
}
