import type { PageRenderer } from '@/app/router';
import type {
  SettlementInput,
  SettlementListItem,
  SettlementStatus,
} from '@/types/entities';
import { SETTLEMENT_STATUSES } from '@/types/entities';
import {
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_TONES,
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

function addSettlementHref(storeId: string | null): string {
  const params = new URLSearchParams({ settlementDate: todayJakarta() });
  if (storeId) params.set('storeId', storeId);
  return `/finance/settlements/new?${params.toString()}`;
}

export const settlementListPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat settlement…');

  try {
    const filters = readListFilters(context.query);
    const statusParam = context.query.get('status') ?? 'all';
    const status: SettlementStatus | 'all' = SETTLEMENT_STATUSES.includes(
      statusParam as SettlementStatus,
    )
      ? (statusParam as SettlementStatus)
      : 'all';
    const search = context.query.get('search')?.trim() ?? '';
    const page = readPositiveInt(context.query.get('page'));

    const [stores, settlements] = await Promise.all([
      services.storeService.listAll(),
      services.settlementService.list({
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
    context.setTitle('Settlement');

    const pagePayout = settlements.items.reduce((total, item) => total + item.totalPayout, 0);
    const receivedPayout = settlements.items
      .filter((item) => item.status === 'received')
      .reduce((total, item) => total + item.totalPayout, 0);
    const pendingPayout = settlements.items
      .filter((item) => item.status === 'pending')
      .reduce((total, item) => total + item.totalPayout, 0);
    const hasFilters =
      filters.storeId !== null ||
      filters.period.preset !== 'thisMonth' ||
      status !== 'all' ||
      search !== '';

    const rows = settlements.items.map((settlement) => [
      `<span class="table-strong">${escapeHtml(settlement.settlementNo)}</span><span class="table-sub">${escapeHtml(settlement.storeName)}</span>`,
      formatBusinessDate(settlement.settlementDate),
      formatRupiah(settlement.grossSales),
      `<span class="value-negative">${formatRupiah(-settlement.totalDeductions)}</span>`,
      `<span class="table-strong">${formatRupiah(settlement.totalPayout)}</span>`,
      badge(
        SETTLEMENT_STATUS_LABELS[settlement.status],
        SETTLEMENT_STATUS_TONES[settlement.status],
      ),
      settlement.notes
        ? `<span class="table-note">${escapeHtml(settlement.notes)}</span>`
        : '<span class="muted">—</span>',
      `<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/finance/settlements/${settlement.id}/edit">Ubah</a>
        <button type="button" class="btn btn-ghost btn-icon" data-delete-settlement="${escapeAttr(settlement.id)}" aria-label="Hapus settlement" title="Hapus settlement">${icon('trash')}</button>
      </div>`,
    ]);

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Keuangan',
        title: 'Settlement & pencairan',
        subtitle: `${formatNumber(settlements.total)} settlement pada filter aktif. Pencairan adalah arus kas, bukan omzet baru.`,
        actions: linkButton(addSettlementHref(filters.storeId), 'Catat settlement', 'btn btn-primary', 'plus'),
      })}

      ${listFilterHtml(filters, stores)}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="settlement-status">Status</label>
          <select class="input select" id="settlement-status" data-settlement-status>
            <option value="all" ${status === 'all' ? 'selected' : ''}>Semua status</option>
            ${SETTLEMENT_STATUSES.map(
              (item) =>
                `<option value="${item}" ${item === status ? 'selected' : ''}>${SETTLEMENT_STATUS_LABELS[item]}</option>`,
            ).join('')}
          </select>
        </div>
        <form class="filter-search" data-settlement-search role="search">
          <label class="filter-label" for="settlement-search">Cari</label>
          <div class="search-input-wrap">
            ${icon('search', 'search-icon')}
            <input class="input" id="settlement-search" name="search" type="search" value="${escapeAttr(search)}" placeholder="Nomor settlement, toko, atau catatan…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${hasFilters ? `<a class="filter-reset" href="#/finance/settlements">${icon('x')} Reset</a>` : ''}
      </div>

      <div class="kpi-grid kpi-grid-3">
        <div class="import-stat"><strong>${formatRupiah(receivedPayout)}</strong><span>Diterima pada halaman ini</span></div>
        <div class="import-stat import-stat-warning"><strong>${formatRupiah(pendingPayout)}</strong><span>Menunggu pada halaman ini</span></div>
        <div class="import-stat"><strong>${formatRupiah(pagePayout)}</strong><span>Total pencairan halaman ini</span></div>
      </div>

      <p class="inline-note">${icon('info')} Settlement tidak ditambahkan ke omzet atau laba. Nilainya mencatat uang yang benar-benar dicairkan marketplace.</p>

      ${
        settlements.items.length > 0
          ? card({
              padded: false,
              body: dataTable(
                ['Nomor / toko', 'Tanggal', 'Penjualan', 'Potongan', 'Pencairan', 'Status', 'Catatan', ''],
                rows,
              ),
            })
          : card({
              body: emptyState({
                iconName: hasFilters ? 'search' : 'wallet',
                title: hasFilters ? 'Settlement tidak ditemukan' : 'Belum ada settlement',
                description: hasFilters
                  ? 'Tidak ada settlement yang sesuai dengan filter. Ubah periode, toko, status, atau kata kunci.'
                  : 'Catat pencairan dana dari marketplace agar omzet, laba, dan uang masuk dapat dibedakan.',
                action: hasFilters
                  ? `<a class="btn btn-secondary" href="#/finance/settlements">${icon('refresh-cw')}<span>Reset filter</span></a>`
                  : linkButton(addSettlementHref(filters.storeId), 'Catat settlement pertama', 'btn btn-primary', 'plus'),
              }),
            })
      }
      ${paginationBar({
        page: settlements.page,
        pageSize: settlements.pageSize,
        total: settlements.total,
      })}
    `;

    bindListFilters(root, context);
    root.querySelector<HTMLSelectElement>('[data-settlement-status]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      navigateQuery(context, { status: target.value === 'all' ? null : target.value, page: null });
    });
    const searchForm = root.querySelector<HTMLFormElement>('[data-settlement-search]');
    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = searchForm.querySelector<HTMLInputElement>('input[name="search"]');
      navigateQuery(context, { search: input?.value.trim() || null, page: null });
    });
    bindPagination(root, (nextPage) => {
      context.navigate(buildRoute(context.path, context.query, { page: nextPage }));
    });

    root.querySelectorAll<HTMLButtonElement>('[data-delete-settlement]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.deleteSettlement ?? '';
        const settlement = settlements.items.find((item) => item.id === id);
        if (!settlement) return;
        const confirmed = await confirmDialog({
          title: 'Hapus settlement?',
          message: `Settlement ${settlement.settlementNo} sebesar ${formatRupiah(settlement.totalPayout)} akan dihapus permanen. Refund yang tertaut dapat kehilangan relasi settlement.`,
          confirmLabel: 'Hapus settlement',
          tone: 'danger',
          details: [
            `Toko: ${settlement.storeName}`,
            `Tanggal: ${formatBusinessDate(settlement.settlementDate)}`,
            'Penghapusan tidak mengubah omzet pesanan.',
          ],
        });
        if (!confirmed) return;
        try {
          await services.settlementService.delete(id);
          showToast('Settlement dihapus.', 'success');
          context.refresh();
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Settlement gagal dihapus.', 'error');
        }
      });
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

export const settlementFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? null;
  const isEdit = id !== null;
  root.innerHTML = loadingBlock(isEdit ? 'Memuat settlement…' : 'Menyiapkan formulir…');

  try {
    const [stores, settlement] = await Promise.all([
      services.storeService.listAll(),
      id ? services.settlementService.get(id) : Promise.resolve<SettlementListItem | null>(null),
    ]);
    if (context.signal.aborted) return;
    context.setTitle(isEdit ? 'Ubah settlement' : 'Settlement baru');

    const activeStores = stores.filter((store) => store.status === 'active');
    if (activeStores.length === 0) {
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Keuangan',
          title: isEdit ? 'Ubah settlement' : 'Catat settlement',
          actions: `<a class="btn btn-secondary" href="#/finance/settlements">${icon('arrow-left')}<span>Kembali</span></a>`,
        })}
        ${card({
          body: emptyState({
            iconName: 'store',
            title: 'Belum ada toko aktif',
            description: 'Settlement harus terhubung ke toko. Tambahkan toko atau aktifkan kembali toko yang diarsipkan.',
            action: linkButton('/stores/new', 'Tambah toko', 'btn btn-primary', 'plus'),
          }),
        })}
      `;
      refreshIcons(root);
      return;
    }

    const queryStoreId = context.query.get('storeId');
    const selectedStoreId =
      settlement?.storeId ??
      (queryStoreId && activeStores.some((store) => store.id === queryStoreId)
        ? queryStoreId
        : activeStores[0]?.id ?? '');

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Keuangan',
        title: isEdit ? 'Ubah settlement' : 'Catat settlement',
        subtitle: 'Nomor settlement unik per toko. Total pencairan tidak menambah omzet atau laba.',
        actions: `<a class="btn btn-secondary" href="#/finance/settlements">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="settlement-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail settlement</h2>
            <p>Isi nilai sesuai laporan pencairan marketplace. Total potongan dan pencairan adalah informasi arus kas.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'storeId',
              label: 'Toko',
              type: 'select',
              value: selectedStoreId,
              required: true,
              options: storeSelectOptions(activeStores, selectedStoreId),
              idPrefix: 'settlement',
            })}
            ${formField({
              name: 'settlementNo',
              label: 'Nomor settlement',
              value: settlement?.settlementNo ?? '',
              required: true,
              placeholder: 'Contoh: SPL-2026-001',
              idPrefix: 'settlement',
            })}
            ${formField({
              name: 'settlementDate',
              label: 'Tanggal settlement',
              type: 'date',
              value: settlement?.settlementDate ?? context.query.get('settlementDate') ?? todayJakarta(),
              required: true,
              idPrefix: 'settlement',
            })}
            ${formField({
              name: 'status',
              label: 'Status pencairan',
              type: 'select',
              value: settlement?.status ?? 'received',
              required: true,
              options: SETTLEMENT_STATUSES.map((status) => ({
                value: status,
                label: SETTLEMENT_STATUS_LABELS[status],
              })),
              help: 'Hanya status diterima yang dihitung sebagai dana masuk pada ringkasan.',
              idPrefix: 'settlement',
            })}
            ${formField({
              name: 'grossSales',
              label: 'Total penjualan',
              type: 'money',
              value: settlement ? String(settlement.grossSales) : '',
              required: true,
              placeholder: '0',
              idPrefix: 'settlement',
            })}
            ${formField({
              name: 'totalDeductions',
              label: 'Total potongan',
              type: 'money',
              value: settlement ? String(settlement.totalDeductions) : '',
              required: true,
              placeholder: '0',
              idPrefix: 'settlement',
            })}
            ${formField({
              name: 'totalPayout',
              label: 'Total pencairan',
              type: 'money',
              value: settlement ? String(settlement.totalPayout) : '',
              required: true,
              placeholder: '0',
              help: 'Nominal bersih yang benar-benar dicairkan.',
              idPrefix: 'settlement',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: settlement?.notes ?? '',
              rows: 3,
              placeholder: 'Catatan pencairan, nomor referensi bank, atau periode…',
              idPrefix: 'settlement',
              span: true,
            })}
          </div>
          <div class="form-info">
            ${icon('info')}
            <p>Jangan menambahkan settlement sebagai pendapatan baru. Omzet dan laba sudah dihitung dari pesanan. Settlement hanya menunjukkan uang yang dicairkan.</p>
          </div>
        </div>

        ${formActions(isEdit ? 'Simpan perubahan' : 'Simpan settlement', {
          submitIcon: 'save',
          cancelHref: '#/finance/settlements',
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#settlement-form');
    if (!form) throw new Error('Formulir settlement tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const input: SettlementInput = {
          storeId: readText(form, 'storeId'),
          settlementNo: readText(form, 'settlementNo'),
          settlementDate: readText(form, 'settlementDate'),
          grossSales: readMoney(form, 'grossSales', 'Total penjualan', { required: true }),
          totalDeductions: readMoney(form, 'totalDeductions', 'Total potongan', { required: true }),
          totalPayout: readMoney(form, 'totalPayout', 'Total pencairan', { required: true }),
          status: readText(form, 'status') as SettlementStatus,
          notes: readOptionalText(form, 'notes'),
        };
        if (isEdit && id) {
          await services.settlementService.update(id, input);
        } else {
          await services.settlementService.create(input);
        }
        showToast(isEdit ? 'Settlement diperbarui.' : 'Settlement dicatat.', 'success');
        context.navigate('/finance/settlements');
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Settlement gagal disimpan.', 'error');
        }
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
