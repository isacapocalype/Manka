import type { PageRenderer } from '@/app/router';
import type { OrderStatus } from '@/types/entities';
import { ORDER_STATUSES } from '@/types/entities';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '@/app/labels';
import { isRevenueOrderStatus } from '@/core/calculations/orderMath';
import { formatBusinessDate } from '@/core/utils/date';
import { formatNumber, formatRupiah } from '@/core/utils/money';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  badge,
  bindPagination,
  card,
  dataTable,
  emptyState,
  linkButton,
  loadingBlock,
  pageHeader,
  paginationBar,
} from '@/components/ui/ui';
import {
  bindListFilters,
  buildRoute,
  listFilterHtml,
  readListFilters,
} from '@/components/ui/filters';
import { navigateQuery, readPositiveInt, renderPageError } from '@/app/pageUtils';

export const orderListPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat pesanan…');

  try {
    const filters = readListFilters(context.query);
    const search = context.query.get('search')?.trim() ?? '';
    const statusParam = context.query.get('status') ?? 'all';
    const status: OrderStatus | 'all' = ORDER_STATUSES.includes(statusParam as OrderStatus)
      ? (statusParam as OrderStatus)
      : 'all';
    const page = readPositiveInt(context.query.get('page'));

    const [stores, orders] = await Promise.all([
      services.storeService.listAll(),
      services.orderService.list({
        storeId: filters.storeId,
        status,
        from: filters.period.from,
        to: filters.period.to,
        search,
        page,
        pageSize: 20,
      }),
    ]);
    if (context.signal.aborted) return;
    context.setTitle('Pesanan');

    const hasFilters =
      search !== '' ||
      status !== 'all' ||
      filters.storeId !== null ||
      filters.period.preset !== 'thisMonth';

    const rows = orders.items.map((order) => [
      `<a class="table-link" href="#/orders/${order.id}">${escapeHtml(order.marketplaceOrderId)}</a><span class="table-sub">${escapeHtml(order.storeName)}</span>`,
      formatBusinessDate(order.orderDate),
      `<span class="table-strong">${formatNumber(order.unitCount)} unit</span><span class="table-sub">${formatNumber(order.itemCount)} item</span>`,
      formatRupiah(order.grossSales),
      isRevenueOrderStatus(order.status)
        ? formatRupiah(order.netSales)
        : '<span class="muted">Tidak dihitung</span>',
      badge(ORDER_STATUS_LABELS[order.status], ORDER_STATUS_TONES[order.status]),
      `<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/orders/${order.id}">Buka</a>
        <a class="btn btn-ghost btn-icon" href="#/orders/${order.id}/edit" aria-label="Ubah pesanan ${escapeAttr(order.marketplaceOrderId)}" title="Ubah">${icon('pencil')}</a>
      </div>`,
    ]);

    const empty =
      orders.total === 0
        ? emptyState({
            iconName: hasFilters ? 'search' : 'shopping-bag',
            title: hasFilters ? 'Pesanan tidak ditemukan' : 'Belum ada pesanan',
            description: hasFilters
              ? 'Tidak ada pesanan yang sesuai dengan filter. Coba ubah periode, toko, status, atau kata kunci.'
              : 'Tambahkan pesanan secara manual atau import file CSV/XLSX dari marketplace. Nomor pesanan unik per toko.',
            action: hasFilters
              ? `<a class="btn btn-secondary" href="#/orders">${icon('refresh-cw')}<span>Reset filter</span></a>`
              : `${linkButton('/orders/new', 'Tambah pesanan', 'btn btn-primary', 'plus')}
                 ${linkButton('/orders/import', 'Import pesanan', 'btn btn-secondary', 'upload')}`,
          })
        : '';

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Transaksi penjualan',
        title: 'Pesanan',
        subtitle: `${formatNumber(orders.total)} pesanan pada filter aktif. Pesanan batal/retur tidak dihitung sebagai penjualan.`,
        actions: `${linkButton('/orders/import', 'Import', 'btn btn-secondary', 'upload')}
          ${linkButton('/orders/new', 'Tambah pesanan', 'btn btn-primary', 'plus')}`,
      })}

      ${listFilterHtml(filters, stores)}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="order-status">Status</label>
          <select class="input select" id="order-status" data-order-status>
            <option value="all" ${status === 'all' ? 'selected' : ''}>Semua status</option>
            ${ORDER_STATUSES.map(
              (item) =>
                `<option value="${item}" ${item === status ? 'selected' : ''}>${ORDER_STATUS_LABELS[item]}</option>`,
            ).join('')}
          </select>
        </div>
        <form class="filter-search" data-order-search role="search">
          <label class="filter-label" for="order-search">Cari pesanan</label>
          <div class="search-input-wrap">
            ${icon('search', 'search-icon')}
            <input class="input" id="order-search" name="search" type="search" value="${escapeAttr(search)}" placeholder="Nomor pesanan, catatan, atau nama toko…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${hasFilters ? `<a class="filter-reset" href="#/orders">${icon('x')} Reset</a>` : ''}
      </div>

      ${orders.items.length > 0 ? card({ padded: false, body: dataTable(['Pesanan', 'Tanggal', 'Jumlah', 'Omzet kotor', 'Penjualan bersih', 'Status', ''], rows) }) : card({ body: empty })}
      ${paginationBar({ page: orders.page, pageSize: orders.pageSize, total: orders.total })}
    `;

    bindListFilters(root, context);

    root.querySelector<HTMLSelectElement>('[data-order-status]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      navigateQuery(context, { status: target.value === 'all' ? null : target.value, page: null });
    });

    const searchForm = root.querySelector<HTMLFormElement>('[data-order-search]');
    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = searchForm.querySelector<HTMLInputElement>('input[name="search"]');
      navigateQuery(context, { search: input?.value.trim() || null, page: null });
    });

    bindPagination(root, (nextPage) => {
      context.navigate(buildRoute(context.path, context.query, { page: nextPage }));
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
