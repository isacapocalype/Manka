import type { PageRenderer } from '@/app/router';
import type {
  OrderDetail,
  RefundInput,
  RefundListItem,
  RefundStatus,
  Settlement,
} from '@/types/entities';
import { REFUND_STATUSES } from '@/types/entities';
import { REFUND_STATUS_LABELS, REFUND_STATUS_TONES } from '@/app/labels';
import { formatBusinessDate, todayJakarta } from '@/core/utils/date';
import { formatNumber, formatRupiah } from '@/core/utils/money';
import { ValidationError } from '@/core/utils/validation';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  applyFormErrors,
  badge,
  bindPagination,
  card,
  confirmDialog,
  dataTable,
  emptyState,
  formActions,
  formErrorBanner,
  formField,
  linkButton,
  loadingBlock,
  pageHeader,
  paginationBar,
  readInteger,
  readMoney,
  readOptionalText,
  readText,
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import {
  bindListFilters,
  buildRoute,
  listFilterHtml,
  readListFilters,
  storeSelectOptions,
} from '@/components/ui/filters';
import { navigateQuery, readPositiveInt, renderPageError } from '@/app/pageUtils';
import { cashAccountChoices } from './cashUi';

interface OrderChoice {
  id: string;
  marketplaceOrderId: string;
  orderDate: string;
  status: string;
  storeId: string;
}

function toChoice(order: OrderChoice): OrderChoice {
  return order;
}

async function loadOrderChoices(
  services: Parameters<PageRenderer>[0]['services'],
  storeId: string,
  linkedOrderId: string | null,
): Promise<{ orders: OrderChoice[]; linked: OrderChoice | null }> {
  if (!storeId) return { orders: [], linked: null };
  const result = await services.orderService.list({ storeId, pageSize: 100 });
  const orders: OrderChoice[] = result.items.map((order) => ({
    id: order.id,
    marketplaceOrderId: order.marketplaceOrderId,
    orderDate: order.orderDate,
    status: order.status,
    storeId: order.storeId,
  }));
  let linked: OrderChoice | null = orders.find((order) => order.id === linkedOrderId) ?? null;
  if (linkedOrderId && !linked) {
    try {
      const detail = await services.orderService.getDetail(linkedOrderId);
      linked = toChoice({
        id: detail.id,
        marketplaceOrderId: detail.marketplaceOrderId,
        orderDate: detail.orderDate,
        status: detail.status,
        storeId: detail.storeId,
      });
    } catch {
      linked = null;
    }
  }
  return { orders, linked };
}

function orderSelectOptions(
  orders: OrderChoice[],
  linked: OrderChoice | null,
  selectedId: string,
): string {
  const map = new Map<string, OrderChoice>();
  if (linked) map.set(linked.id, linked);
  for (const order of orders) map.set(order.id, order);
  return `
    <option value="">— Pilih pesanan —</option>
    ${[...map.values()]
      .map(
        (order) =>
          `<option value="${escapeAttr(order.id)}" ${order.id === selectedId ? 'selected' : ''}>${escapeHtml(order.marketplaceOrderId)} · ${formatBusinessDate(order.orderDate)}</option>`,
      )
      .join('')}
  `;
}

function addRefundHref(storeId: string | null, orderId: string | null = null): string {
  const params = new URLSearchParams({ refundDate: todayJakarta() });
  if (storeId) params.set('storeId', storeId);
  if (orderId) params.set('orderId', orderId);
  return `/finance/refunds/new?${params.toString()}`;
}

export const refundListPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat refund…');

  try {
    const filters = readListFilters(context.query);
    const statusParam = context.query.get('status') ?? 'all';
    const status: RefundStatus | 'all' = REFUND_STATUSES.includes(statusParam as RefundStatus)
      ? (statusParam as RefundStatus)
      : 'all';
    const search = context.query.get('search')?.trim() ?? '';
    const page = readPositiveInt(context.query.get('page'));

    const [stores, refunds] = await Promise.all([
      services.storeService.listAll(),
      services.refundService.list({
        storeId: filters.storeId,
        status,
        search,
        from: filters.period.from,
        to: filters.period.to,
        page,
        pageSize: 25,
      }),
    ]);
    if (context.signal.aborted) return;
    context.setTitle('Refund');

    const pageTotal = refunds.items
      .filter((refund) => refund.status === 'completed')
      .reduce((total, refund) => total + refund.amount, 0);
    const hasFilters =
      filters.storeId !== null ||
      filters.period.preset !== 'thisMonth' ||
      status !== 'all' ||
      search !== '';

    const rows = refunds.items.map((refund) => [
      `<span class="table-strong">${formatBusinessDate(refund.refundDate)}</span>`,
      `<a class="table-link" href="#/orders/${refund.orderId}">${escapeHtml(refund.marketplaceOrderId)}</a><span class="table-sub">${escapeHtml(refund.storeName)}</span>`,
      `<span class="table-strong">${formatRupiah(refund.amount)}</span>`,
      `${formatNumber(refund.quantity)} barang`,
      `<span class="table-note">${escapeHtml(refund.reason)}</span>`,
      badge(REFUND_STATUS_LABELS[refund.status], REFUND_STATUS_TONES[refund.status]),
      refund.accountName
        ? escapeHtml(refund.accountName)
        : '<span class="muted">—</span>',
      `<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/finance/refunds/${refund.id}/edit">Ubah</a>
        <button type="button" class="btn btn-ghost btn-icon" data-delete-refund="${escapeAttr(refund.id)}" aria-label="Hapus refund" title="Hapus refund">${icon('trash')}</button>
      </div>`,
    ]);

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Keuangan',
        title: 'Refund & retur',
        subtitle: `${formatNumber(refunds.total)} refund pada filter aktif. Hanya refund selesai pada pesanan penjualan yang mengurangi pendapatan, dan hanya sekali.`,
        actions: linkButton(addRefundHref(filters.storeId), 'Catat refund', 'btn btn-primary', 'plus'),
      })}

      ${listFilterHtml(filters, stores)}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="refund-status">Status</label>
          <select class="input select" id="refund-status" data-refund-status>
            <option value="all" ${status === 'all' ? 'selected' : ''}>Semua status</option>
            ${REFUND_STATUSES.map(
              (item) =>
                `<option value="${item}" ${item === status ? 'selected' : ''}>${REFUND_STATUS_LABELS[item]}</option>`,
            ).join('')}
          </select>
        </div>
        <form class="filter-search" data-refund-search role="search">
          <label class="filter-label" for="refund-search">Cari</label>
          <div class="search-input-wrap">
            ${icon('search', 'search-icon')}
            <input class="input" id="refund-search" name="search" type="search" value="${escapeAttr(search)}" placeholder="Nomor pesanan, toko, atau alasan…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${hasFilters ? `<a class="filter-reset" href="#/finance/refunds">${icon('x')} Reset</a>` : ''}
      </div>

      <div class="kpi-grid kpi-grid-3">
        <div class="import-stat import-stat-danger"><strong>${formatRupiah(pageTotal)}</strong><span>Refund selesai pada halaman ini</span></div>
        <div class="import-stat"><strong>${formatNumber(refunds.items.length)}</strong><span>Baris ditampilkan</span></div>
        <div class="import-stat"><strong>${formatNumber(refunds.items.filter((item) => item.status === 'pending').length)}</strong><span>Refund menunggu</span></div>
      </div>

      ${
        refunds.items.length > 0
          ? card({
              padded: false,
              body: dataTable(
                ['Tanggal', 'Pesanan / toko', 'Nilai', 'Jumlah', 'Alasan', 'Status', 'Rekening', ''],
                rows,
              ),
            })
          : card({
              body: emptyState({
                iconName: hasFilters ? 'search' : 'refresh-cw',
                title: hasFilters ? 'Refund tidak ditemukan' : 'Belum ada refund',
                description: hasFilters
                  ? 'Tidak ada refund yang sesuai dengan filter. Ubah periode, toko, status, atau kata kunci.'
                  : 'Catat pengembalian dana dari pesanan. Refund selesai akan mengurangi penjualan bersih sekali saja.',
                action: hasFilters
                  ? `<a class="btn btn-secondary" href="#/finance/refunds">${icon('refresh-cw')}<span>Reset filter</span></a>`
                  : linkButton(addRefundHref(filters.storeId), 'Catat refund pertama', 'btn btn-primary', 'plus'),
              }),
            })
      }
      ${paginationBar({ page: refunds.page, pageSize: refunds.pageSize, total: refunds.total })}
    `;

    bindListFilters(root, context);

    root.querySelector<HTMLSelectElement>('[data-refund-status]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      navigateQuery(context, { status: target.value === 'all' ? null : target.value, page: null });
    });
    const searchForm = root.querySelector<HTMLFormElement>('[data-refund-search]');
    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = searchForm.querySelector<HTMLInputElement>('input[name="search"]');
      navigateQuery(context, { search: input?.value.trim() || null, page: null });
    });
    bindPagination(root, (nextPage) => {
      context.navigate(buildRoute(context.path, context.query, { page: nextPage }));
    });

    root.querySelectorAll<HTMLButtonElement>('[data-delete-refund]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.deleteRefund ?? '';
        const refund = refunds.items.find((item) => item.id === id);
        if (!refund) return;
        const confirmed = await confirmDialog({
          title: 'Hapus refund?',
          message: `Refund ${formatRupiah(refund.amount)} untuk pesanan ${refund.marketplaceOrderId} akan dihapus permanen.`,
          confirmLabel: 'Hapus refund',
          tone: 'danger',
        });
        if (!confirmed) return;
        try {
          await services.refundService.delete(id);
          showToast('Refund dihapus.', 'success');
          context.refresh();
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Refund gagal dihapus.', 'error');
        }
      });
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

export const refundFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? null;
  const isEdit = id !== null;
  root.innerHTML = loadingBlock(isEdit ? 'Memuat refund…' : 'Menyiapkan formulir…');

  try {
    const [stores, refund, cashAccounts] = await Promise.all([
      services.storeService.listAll(),
      id ? services.refundService.get(id) : Promise.resolve<RefundListItem | null>(null),
      services.cashService.listForSelect(),
    ]);
    if (context.signal.aborted) return;
    context.setTitle(isEdit ? 'Ubah refund' : 'Refund baru');

    const activeStores = stores.filter((store) => store.status === 'active');
    if (activeStores.length === 0) {
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Keuangan',
          title: isEdit ? 'Ubah refund' : 'Catat refund',
          actions: `<a class="btn btn-secondary" href="#/finance/refunds">${icon('arrow-left')}<span>Kembali</span></a>`,
        })}
        ${card({
          body: emptyState({
            iconName: 'store',
            title: 'Belum ada toko aktif',
            description: 'Refund harus terhubung ke pesanan pada toko. Tambahkan toko dan pesanan terlebih dahulu.',
            action: linkButton('/stores/new', 'Tambah toko', 'btn btn-primary', 'plus'),
          }),
        })}
      `;
      refreshIcons(root);
      return;
    }

    const queryStoreId = context.query.get('storeId');
    const queryOrderId = context.query.get('orderId');
    const selectedStoreId =
      refund?.storeId ??
      (queryStoreId && activeStores.some((store) => store.id === queryStoreId)
        ? queryStoreId
        : activeStores[0]?.id ?? '');
    const selectedOrderId = refund?.orderId ?? queryOrderId ?? '';
    const { orders, linked } = await loadOrderChoices(
      services,
      selectedStoreId,
      selectedOrderId || null,
    );
    const settlements = await services.settlementService.listForSelect(selectedStoreId);
    const linkedSettlement = refund?.settlementId ?? '';
    if (linkedSettlement && !settlements.some((settlement) => settlement.id === linkedSettlement)) {
      settlements.unshift({
        id: linkedSettlement,
        storeId: selectedStoreId,
        settlementNo: linkedSettlement,
        settlementDate: refund?.refundDate ?? todayJakarta(),
        grossSales: 0,
        totalDeductions: 0,
        totalPayout: 0,
        status: 'pending',
        notes: null,
        accountId: null,
        createdAt: '',
        updatedAt: '',
      });
    }

    const existingOrder = selectedOrderId
      ? await services.orderService.getDetail(selectedOrderId).catch(() => null)
      : null;
    const refundIdForExclusion = id;
    const initialHint = refundLimits(existingOrder, refundIdForExclusion);

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Keuangan',
        title: isEdit ? 'Ubah refund' : 'Catat refund',
        subtitle:
          'Refund hanya mengurangi penjualan sekali. Settlement tidak menambah penjualan dan tidak menghitung refund dua kali.',
        actions: `<a class="btn btn-secondary" href="#/finance/refunds">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="refund-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail refund</h2>
            <p>Pilih pesanan asal. Batas jumlah dan nilai refund dihitung dari item pesanan dan refund lain.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'storeId',
              label: 'Toko',
              type: 'select',
              value: selectedStoreId,
              required: true,
              options: storeSelectOptions(activeStores, selectedStoreId),
              idPrefix: 'refund',
            })}
            <div class="field span-2" data-field="orderId">
              <label class="field-label" for="refund-orderId">Pesanan <span class="required-mark" aria-hidden="true">*</span></label>
              <select class="input select" id="refund-orderId" name="orderId" required>
                ${orderSelectOptions(orders, linked, selectedOrderId)}
              </select>
              <p class="field-help" data-order-hint>${escapeHtml(initialHint)}</p>
              <p class="field-error" data-error-for="orderId"></p>
            </div>
            ${formField({
              name: 'settlementId',
              label: 'Settlement terkait',
              type: 'select',
              value: linkedSettlement,
              options: [
                { value: '', label: 'Tidak terkait settlement' },
                ...settlements.map((settlement) => ({
                  value: settlement.id,
                  label: `${settlement.settlementNo} · ${formatBusinessDate(settlement.settlementDate)}`,
                })),
              ],
              help: 'Opsional. Settlement harus berasal dari toko yang sama.',
              idPrefix: 'refund',
            })}
            ${formField({
              name: 'accountId',
              label: 'Rekening pengeluaran',
              type: 'select',
              value: refund?.accountId ?? '',
              options: cashAccountChoices(cashAccounts, refund?.accountId ?? null),
              help: 'Opsional, untuk refund selesai yang tidak termasuk pencairan settlement. Saldo rekening akan berkurang.',
              idPrefix: 'refund',
            })}
            ${formField({
              name: 'refundDate',
              label: 'Tanggal refund',
              type: 'date',
              value: refund?.refundDate ?? context.query.get('refundDate') ?? todayJakarta(),
              required: true,
              idPrefix: 'refund',
            })}
            ${formField({
              name: 'amount',
              label: 'Nilai refund',
              type: 'money',
              value: refund ? String(refund.amount) : '',
              required: true,
              placeholder: '0',
              idPrefix: 'refund',
            })}
            ${formField({
              name: 'quantity',
              label: 'Jumlah barang',
              type: 'integer',
              value: refund ? String(refund.quantity) : '1',
              required: true,
              min: 1,
              idPrefix: 'refund',
            })}
            ${formField({
              name: 'status',
              label: 'Status refund',
              type: 'select',
              value: refund?.status ?? 'completed',
              required: true,
              options: REFUND_STATUSES.map((item) => ({ value: item, label: REFUND_STATUS_LABELS[item] })),
              help: 'Hanya refund selesai yang mengurangi penjualan bersih.',
              idPrefix: 'refund',
            })}
            ${formField({
              name: 'reason',
              label: 'Alasan refund',
              value: refund?.reason ?? '',
              required: true,
              placeholder: 'Contoh: Barang rusak saat pengiriman',
              idPrefix: 'refund',
              span: true,
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: refund?.notes ?? '',
              rows: 3,
              placeholder: 'Catatan tambahan…',
              idPrefix: 'refund',
              span: true,
            })}
          </div>
          <div class="form-info">
            ${icon('info')}
            <p>Pesanan yang berstatus batal, retur, atau refund tidak lagi dihitung sebagai penjualan. Refund pada pesanan tersebut tetap tersimpan sebagai riwayat, tetapi tidak mengurangi pendapatan dua kali.</p>
          </div>
        </div>

        ${formActions(isEdit ? 'Simpan perubahan' : 'Simpan refund', {
          submitIcon: 'save',
          cancelHref: '#/finance/refunds',
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#refund-form');
    if (!form) throw new Error('Formulir refund tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const storeSelect = form.querySelector<HTMLSelectElement>('select[name="storeId"]');
    const orderSelect = form.querySelector<HTMLSelectElement>('select[name="orderId"]');
    const settlementSelect = form.querySelector<HTMLSelectElement>('select[name="settlementId"]');
    const hint = form.querySelector<HTMLElement>('[data-order-hint]');

    const updateHint = async (): Promise<void> => {
      if (!orderSelect || !hint) return;
      if (!orderSelect.value) {
        hint.textContent = 'Pilih pesanan untuk melihat batas refund.';
        return;
      }
      hint.textContent = 'Menghitung batas refund…';
      try {
        const detail = await services.orderService.getDetail(orderSelect.value);
        hint.textContent = refundLimits(detail, refundIdForExclusion);
      } catch (error) {
        hint.textContent = error instanceof Error ? error.message : 'Pesanan gagal dimuat.';
      }
    };

    const refreshDependencies = async (storeId: string): Promise<void> => {
      if (!orderSelect) return;
      orderSelect.disabled = true;
      try {
        const keepOrder = orderSelect.value;
        const next = await loadOrderChoices(services, storeId, keepOrder || null);
        const keep =
          next.linked?.id ??
          (next.orders.some((order) => order.id === keepOrder) ? keepOrder : '');
        orderSelect.innerHTML = orderSelectOptions(next.orders, next.linked, keep);
        await updateHint();

        if (settlementSelect) {
          const nextSettlements = await services.settlementService.listForSelect(storeId);
          settlementSelect.innerHTML = `
            <option value="">Tidak terkait settlement</option>
            ${nextSettlements
              .map(
                (settlement: Settlement) =>
                  `<option value="${escapeAttr(settlement.id)}">${escapeHtml(settlement.settlementNo)} · ${formatBusinessDate(settlement.settlementDate)}</option>`,
              )
              .join('')}
          `;
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Data pesanan gagal dimuat.', 'error');
      } finally {
        orderSelect.disabled = false;
      }
    };

    storeSelect?.addEventListener('change', () => {
      void refreshDependencies(storeSelect.value);
    });
    orderSelect?.addEventListener('change', () => {
      void updateHint();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const input: RefundInput = {
          orderId: readText(form, 'orderId'),
          settlementId: readText(form, 'settlementId') || null,
          refundDate: readText(form, 'refundDate'),
          amount: readMoney(form, 'amount', 'Nilai refund', { required: true }),
          quantity: readInteger(form, 'quantity', 'Jumlah barang', { required: true, min: 1 }),
          reason: readText(form, 'reason'),
          status: readText(form, 'status') as RefundStatus,
          notes: readOptionalText(form, 'notes'),
          accountId: readText(form, 'accountId') || null,
        };
        if (isEdit && id) {
          await services.refundService.update(id, input);
        } else {
          await services.refundService.create(input);
        }
        showToast(isEdit ? 'Refund diperbarui.' : 'Refund dicatat.', 'success');
        context.navigate('/finance/refunds');
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Refund gagal disimpan.', 'error');
        }
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

function refundLimits(order: OrderDetail | null, excludeRefundId: string | null): string {
  if (!order) return 'Pilih pesanan untuk melihat batas refund.';
  const totalQuantity = order.items.reduce((total, item) => total + item.quantity, 0);
  const gross = order.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const otherQuantity = order.refunds
    .filter((refund) => refund.id !== excludeRefundId && refund.status !== 'rejected')
    .reduce((total, refund) => total + refund.quantity, 0);
  const otherAmount = order.refunds
    .filter((refund) => refund.id !== excludeRefundId && refund.status !== 'rejected')
    .reduce((total, refund) => total + refund.amount, 0);
  return `Pesanan ${order.marketplaceOrderId}: maksimal ${formatNumber(Math.max(0, totalQuantity - otherQuantity))} barang dan ${formatRupiah(Math.max(0, gross - otherAmount))}.`;
}
