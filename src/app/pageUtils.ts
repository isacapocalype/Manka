import type { RouteContext } from './router';
import { errorMessage } from '@/core/utils/validation';
import { errorState } from '@/components/ui/ui';
import { buildRoute } from '@/components/ui/filters';

export function renderPageError(root: HTMLElement, context: RouteContext, error: unknown): void {
  if (context.signal.aborted) return;
  root.innerHTML = errorState(
    errorMessage(error, 'Data gagal dimuat. Silakan coba lagi.'),
    '<button type="button" class="btn btn-primary" data-retry-page>Muat ulang</button>',
  );
  root.querySelector<HTMLButtonElement>('[data-retry-page]')?.addEventListener('click', () => {
    context.refresh();
  });
}

export function navigateQuery(
  context: RouteContext,
  patch: Record<string, string | number | null | undefined>,
): void {
  context.navigate(buildRoute(context.path, context.query, patch));
}

export function readPositiveInt(value: string | null, fallback = 1): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function storeNameById(stores: { id: string; name: string }[], id: string): string {
  return stores.find((store) => store.id === id)?.name ?? 'Toko tidak ditemukan';
}

export function shopeeIcon(): string {
  return 'shopping-bag';
}

export function todayOrFallback(value: string | null, fallback: string): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
}
