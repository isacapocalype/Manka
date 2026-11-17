import type { PageRenderer } from '@/app/router';
import type {
  FeeSource,
  FeeType,
  MarketplaceFeeListItem,
  OrderListItem,
} from '@/types/entities';
import type { AppServices } from '@/core/services/appServices';
import { FEE_SOURCES, FEE_TYPES } from '@/types/entities';
import {
  FEE_SOURCE_LABELS,
  FEE_SOURCE_TONES,
  FEE_TYPE_LABELS,
  ORDER_STATUS_LABELS,
} from '@/app/labels';
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
import type { FeeInput } from '@/core/services/feeService';

function addFeeHref(storeId: string | null): string {
  const params = new URLSearchParams({ feeDate: todayJakarta() });
  if (storeId) params.set('storeId', storeId);
  return `/finance/fees/new?${params.toString()}`;
}

export const feeListPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat biaya marketplace…');

  try {
    const filters = readListFilters(context.query);
    const feeTypeParam = context.query.get('feeType') ?? 'all';
    const sourceParam = context.query.get('source') ?? 'all';
    const feeType: FeeType | 'all' = FEE_TYPES.includes(feeTypeParam as FeeType)
      ? (feeTypeParam as FeeType)
      : 'all';
    const source: FeeSource | 'all' = FEE_SOURCES.includes(sourceParam as FeeSource)
      ? (sourceParam as FeeSource)
      : 'all';
    const search = context.query.get('search')?.trim() ?? '';
    const page = readPositiveInt(context.query.get('page'));

    const [stores, fees] = await Promise.all([
      services.storeService.listAll(),
      services.feeService.list({
        storeId: filters.storeId,
        feeType,
        source,
        search,
        from: filters.period.from,
        to: filters.period.to,
        page,
        pageSize: 25,
      }),
    ]);
    if (context.signal.aborted) return;
    context.setTitle('Biaya marketplace');

    const pageActual = fees.items
      .filter((fee) => fee.source === 'actual')
      .reduce((total, fee) => total + fee.amount, 0);
    const pageEstimated = fees.items
      .filter((fee) => fee.source === 'estimated')
      .reduce((total, fee) => total + fee.amount, 0);
    const hasFilters =
      filters.storeId !== null ||
      filters.period.preset !== 'thisMonth' ||
      feeType !== 'all' ||
      source !== 'all' ||
      search !== '';

    const rows = fees.items.map((fee) => [
      `<span class="table-strong">${formatBusinessDate(fee.feeDate)}</span>`,
      fee.orderId
        ? `<a class="table-link" href="#/orders/${fee.orderId}">${escapeHtml(fee.marketplaceOrderId ?? 'Pesanan')}</a><span class="table-sub">${escapeHtml(fee.storeName)}</span>`
        : `<span class="muted">Biaya umum</span><span class="table-sub">${escapeHtml(fee.storeName)}</span>`,
      FEE_TYPE_LABELS[fee.feeType],
      badge(FEE_SOURCE_LABELS[fee.source], FEE_SOURCE_TONES[fee.source]),
      formatRupiah(fee.amount),
      fee.notes ? `<span class="table-note">${escapeHtml(fee.notes)}</span>` : '<span class="muted">—</span>',
      `<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/finance/fees/${fee.id}/edit">Ubah</a>
        <button type="button" class="btn btn-ghost btn-icon" data-delete-fee="${escapeAttr(fee.id)}" aria-label="Hapus biaya" title="Hapus biaya">${icon('trash')}</button>
      </div>`,
    ]);

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Keuangan',
        title: 'Biaya marketplace',
        subtitle: `${formatNumber(fees.total)} biaya pada filter aktif. Estimasi diberi label terpisah dari biaya aktual.`,
        actions: linkButton(addFeeHref(filters.storeId), 'Catat biaya', 'btn btn-primary', 'plus'),
      })}

      ${listFilterHtml(filters, stores)}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="fee-type">Jenis biaya</label>
          <select class="input select" id="fee-type" data-fee-type>
            <option value="all" ${feeType === 'all' ? 'selected' : ''}>Semua jenis</option>
            ${FEE_TYPES.map(
              (type) => `<option value="${type}" ${type === feeType ? 'selected' : ''}>${FEE_TYPE_LABELS[type]}</option>`,
            ).join('')}
          </select>
        </div>
        <div class="filter-control">
          <label class="filter-label" for="fee-source">Sumber</label>
          <select class="input select" id="fee-source" data-fee-source>
            <option value="all" ${source === 'all' ? 'selected' : ''}>Semua sumber</option>
            <option value="actual" ${source === 'actual' ? 'selected' : ''}>Aktual</option>
            <option value="estimated" ${source === 'estimated' ? 'selected' : ''}>Estimasi</option>
          </select>
        </div>
        <form class="filter-search" data-fee-search role="search">
          <label class="filter-label" for="fee-search">Cari</label>
          <div class="search-input-wrap">
            ${icon('search', 'search-icon')}
            <input class="input" id="fee-search" name="search" type="search" value="${escapeAttr(search)}" placeholder="Nomor pesanan, toko, atau catatan…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${hasFilters ? `<a class="filter-reset" href="#/finance/fees">${icon('x')} Reset</a>` : ''}
      </div>

      <div class="kpi-grid kpi-grid-3">
        <div class="import-stat"><strong>${formatRupiah(pageActual)}</strong><span>Aktual pada halaman ini</span></div>
        <div class="import-stat import-stat-warning"><strong>${formatRupiah(pageEstimated)}</strong><span>Estimasi pada halaman ini</span></div>
        <div class="import-stat"><strong>${formatNumber(fees.items.length)}</strong><span>Baris ditampilkan</span></div>
      </div>

      ${
        fees.items.length > 0
          ? card({
              padded: false,
              body: dataTable(
                ['Tanggal', 'Pesanan / toko', 'Jenis', 'Sumber', 'Nominal', 'Catatan', ''],
                rows,
              ),
            })
          : card({
              body: emptyState({
                iconName: hasFilters ? 'search' : 'credit-card',
                title: hasFilters ? 'Biaya tidak ditemukan' : 'Belum ada biaya marketplace',
                description: hasFilters
                  ? 'Tidak ada biaya yang sesuai dengan filter. Ubah periode, toko, jenis, atau sumber biaya.'
                  : 'Catat potongan marketplace secara manual atau import pesanan yang memuat biaya aktual. Biaya estimasi akan diberi label.',
                action: hasFilters
                  ? `<a class="btn btn-secondary" href="#/finance/fees">${icon('refresh-cw')}<span>Reset filter</span></a>`
                  : linkButton(addFeeHref(filters.storeId), 'Catat biaya pertama', 'btn btn-primary', 'plus'),
              }),
            })
      }
      ${paginationBar({ page: fees.page, pageSize: fees.pageSize, total: fees.total })}
    `;

    bindListFilters(root, context);

    root.querySelector<HTMLSelectElement>('[data-fee-type]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      navigateQuery(context, { feeType: target.value === 'all' ? null : target.value, page: null });
    });
    root.querySelector<HTMLSelectElement>('[data-fee-source]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      navigateQuery(context, { source: target.value === 'all' ? null : target.value, page: null });
    });
    const searchForm = root.querySelector<HTMLFormElement>('[data-fee-search]');
    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = searchForm.querySelector<HTMLInputElement>('input[name="search"]');
      navigateQuery(context, { search: input?.value.trim() || null, page: null });
    });
    bindPagination(root, (nextPage) => {
      context.navigate(buildRoute(context.path, context.query, { page: nextPage }));
    });

    root.querySelectorAll<HTMLButtonElement>('[data-delete-fee]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.deleteFee ?? '';
        const fee = fees.items.find((item) => item.id === id);
        if (!fee) return;
        const confirmed = await confirmDialog({
          title: 'Hapus biaya marketplace?',
          message: `Biaya ${formatRupiah(fee.amount)} pada ${formatBusinessDate(fee.feeDate)} akan dihapus permanen.`,
          confirmLabel: 'Hapus biaya',
          tone: 'danger',
        });
        if (!confirmed) return;
        try {
          await services.feeService.delete(id);
          showToast('Biaya marketplace dihapus.', 'success');
          context.refresh();
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Biaya gagal dihapus.', 'error');
        }
      });
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

function orderOptions(
  orders: OrderListItem[],
  selectedOrderId: string | null,
  extraOrder: OrderListItem | null,
): { value: string; label: string }[] {
  const map = new Map<string, OrderListItem>();
  if (extraOrder) map.set(extraOrder.id, extraOrder);
  for (const order of orders) map.set(order.id, order);
  const result = [{ value: '', label: 'Tanpa pesanan (biaya umum toko)' }];
  for (const order of map.values()) {
    result.push({
      value: order.id,
      label: `${order.marketplaceOrderId} · ${formatBusinessDate(order.orderDate)} · ${ORDER_STATUS_LABELS[order.status]}`,
    });
  }
  if (selectedOrderId && !map.has(selectedOrderId)) {
    result.push({ value: selectedOrderId, label: `Pesanan ${selectedOrderId}` });
  }
  return result;
}

async function loadOrdersForStore(
  services: AppServices,
  storeId: string,
): Promise<OrderListItem[]> {
  if (!storeId) return [];
  const result = await services.orderService.list({ storeId, pageSize: 100 });
  return result.items;
}

export const feeFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? null;
  const isEdit = id !== null;
  root.innerHTML = loadingBlock(isEdit ? 'Memuat biaya…' : 'Menyiapkan formulir…');

  try {
    const [stores, fee] = await Promise.all([
      services.storeService.listAll(),
      id ? services.feeService.get(id) : Promise.resolve<MarketplaceFeeListItem | null>(null),
    ]);
    if (context.signal.aborted) return;
    context.setTitle(isEdit ? 'Ubah biaya marketplace' : 'Biaya marketplace baru');

    const activeStores = stores.filter((store) => store.status === 'active');
    if (activeStores.length === 0) {
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Keuangan',
          title: isEdit ? 'Ubah biaya' : 'Catat biaya marketplace',
          actions: `<a class="btn btn-secondary" href="#/finance/fees">${icon('arrow-left')}<span>Kembali</span></a>`,
        })}
        ${card({
          body: emptyState({
            iconName: 'store',
            title: 'Belum ada toko aktif',
            description: 'Biaya marketplace harus terhubung ke toko. Tambahkan toko atau aktifkan kembali toko yang diarsipkan.',
            action: linkButton('/stores/new', 'Tambah toko', 'btn btn-primary', 'plus'),
          }),
        })}
      `;
      refreshIcons(root);
      return;
    }

    const queryStoreId = context.query.get('storeId');
    const selectedStoreId =
      fee?.storeId ??
      (queryStoreId && activeStores.some((store) => store.id === queryStoreId)
        ? queryStoreId
        : activeStores[0]?.id ?? '');
    const queryOrderId = context.query.get('orderId');
    const selectedOrderId = fee?.orderId ?? queryOrderId ?? '';

    const orders = await loadOrdersForStore(services, selectedStoreId);
    let linkedOrder: OrderListItem | null = null;
    if (selectedOrderId && !orders.some((order) => order.id === selectedOrderId)) {
      try {
        const detail = await services.orderService.getDetail(selectedOrderId);
        linkedOrder = {
          ...detail,
          storeName: detail.storeName,
          grossSales: detail.grossSales,
          itemCount: detail.items.length,
          unitCount: detail.items.reduce((total, item) => total + item.quantity, 0),
          refundTotal: detail.refundTotal,
          netSales: detail.netSales,
        };
      } catch {
        linkedOrder = null;
      }
    }

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Keuangan',
        title: isEdit ? 'Ubah biaya marketplace' : 'Catat biaya marketplace',
        subtitle:
          'Gunakan nominal aktual bila tersedia. Estimasi hanya untuk perkiraan dan selalu diberi label.',
        actions: `<a class="btn btn-secondary" href="#/finance/fees">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="fee-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail biaya</h2>
            <p>Biaya dapat dikaitkan ke pesanan atau dicatat sebagai biaya umum toko.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'storeId',
              label: 'Toko',
              type: 'select',
              value: selectedStoreId,
              required: true,
              options: storeSelectOptions(activeStores, selectedStoreId),
              idPrefix: 'fee',
            })}
            <div class="field" data-field="orderId">
              <label class="field-label" for="fee-orderId">Pesanan terkait <span class="optional-mark">Opsional</span></label>
              <select class="input select" id="fee-orderId" name="orderId">
                ${orderOptions(orders, selectedOrderId || null, linkedOrder)
                  .map(
                    (option) =>
                      `<option value="${escapeAttr(option.value)}" ${option.value === selectedOrderId ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
                  )
                  .join('')}
              </select>
              <p class="field-help" data-order-help>Menampilkan maksimal 100 pesanan terbaru pada toko ini.</p>
              <p class="field-error" data-error-for="orderId"></p>
            </div>
            ${formField({
              name: 'feeType',
              label: 'Jenis biaya',
              type: 'select',
              value: fee?.feeType ?? 'admin',
              required: true,
              options: FEE_TYPES.map((type) => ({ value: type, label: FEE_TYPE_LABELS[type] })),
              idPrefix: 'fee',
            })}
            ${formField({
              name: 'source',
              label: 'Sumber nilai',
              type: 'select',
              value: fee?.source ?? 'actual',
              required: true,
              options: FEE_SOURCES.map((source) => ({ value: source, label: FEE_SOURCE_LABELS[source] })),
              help: 'Estimasi tidak dianggap biaya aktual pada laporan.',
              idPrefix: 'fee',
            })}
            ${formField({
              name: 'amount',
              label: 'Nominal biaya',
              type: 'money',
              value: fee ? String(fee.amount) : '',
              required: true,
              placeholder: '0',
              idPrefix: 'fee',
            })}
            ${formField({
              name: 'feeDate',
              label: 'Tanggal biaya',
              type: 'date',
              value: fee?.feeDate ?? context.query.get('feeDate') ?? todayJakarta(),
              required: true,
              idPrefix: 'fee',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: fee?.notes ?? '',
              rows: 3,
              placeholder: 'Contoh: potongan komisi pesanan periode ini…',
              idPrefix: 'fee',
              span: true,
            })}
          </div>
          <div class="form-info">
            ${icon('info')}
            <p>Biaya yang sudah tercermin di settlement tetap dicatat di sini sebagai biaya aktual. Settlement tidak menambah penjualan dan tidak menghitung biaya dua kali.</p>
          </div>
        </div>

        ${formActions(isEdit ? 'Simpan perubahan' : 'Simpan biaya', {
          submitIcon: 'save',
          cancelHref: '#/finance/fees',
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#fee-form');
    if (!form) throw new Error('Formulir biaya tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const storeSelect = form.querySelector<HTMLSelectElement>('select[name="storeId"]');
    const orderSelect = form.querySelector<HTMLSelectElement>('select[name="orderId"]');
    const orderHelp = form.querySelector<HTMLElement>('[data-order-help]');

    const refreshOrders = async (storeId: string, keepOrderId: string): Promise<void> => {
      if (!orderSelect) return;
      orderSelect.disabled = true;
      if (orderHelp) orderHelp.textContent = 'Memuat pesanan toko…';
      try {
        const nextOrders = await loadOrdersForStore(services, storeId);
        const keep = nextOrders.some((order) => order.id === keepOrderId) ? keepOrderId : '';
        orderSelect.innerHTML = orderOptions(nextOrders, keep, null)
          .map(
            (option) =>
              `<option value="${escapeAttr(option.value)}" ${option.value === keep ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
          )
          .join('');
        if (orderHelp) {
          orderHelp.textContent =
            nextOrders.length === 0
              ? 'Belum ada pesanan pada toko ini. Biaya akan disimpan sebagai biaya umum toko.'
              : 'Menampilkan maksimal 100 pesanan terbaru pada toko ini.';
        }
      } catch (error) {
        if (orderHelp) orderHelp.textContent = 'Pesanan gagal dimuat. Biaya tetap dapat disimpan tanpa pesanan.';
        showToast(error instanceof Error ? error.message : 'Pesanan gagal dimuat.', 'error');
      } finally {
        orderSelect.disabled = false;
      }
    };

    storeSelect?.addEventListener('change', () => {
      void refreshOrders(storeSelect.value, orderSelect?.value ?? '');
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const input: FeeInput = {
          storeId: readText(form, 'storeId'),
          orderId: readText(form, 'orderId') || null,
          feeType: readText(form, 'feeType') as FeeType,
          source: readText(form, 'source') as FeeSource,
          amount: readMoney(form, 'amount', 'Nominal biaya', { required: true }),
          feeDate: readText(form, 'feeDate'),
          notes: readOptionalText(form, 'notes'),
        };
        if (isEdit && id) {
          await services.feeService.update(id, input);
        } else {
          await services.feeService.create(input);
        }
        showToast(isEdit ? 'Biaya marketplace diperbarui.' : 'Biaya marketplace dicatat.', 'success');
        context.navigate('/finance/fees');
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Biaya gagal disimpan.', 'error');
        }
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
