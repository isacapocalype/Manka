import type { PageRenderer } from '@/app/router';
import type {
  ExpenseCategory,
  OperationalExpenseListItem,
} from '@/types/entities';
import { EXPENSE_CATEGORIES } from '@/types/entities';
import { EXPENSE_CATEGORY_LABELS } from '@/app/labels';
import { formatBusinessDate, todayJakarta } from '@/core/utils/date';
import { formatNumber, formatRupiah } from '@/core/utils/money';
import { ValidationError } from '@/core/utils/validation';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  applyFormErrors,
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
import type { OperationalExpenseFormInput } from '@/core/services/operationalExpenseService';

function addExpenseHref(storeId: string | null): string {
  const params = new URLSearchParams({ expenseDate: todayJakarta() });
  if (storeId) params.set('storeId', storeId);
  return `/finance/expenses/new?${params.toString()}`;
}

export const expenseListPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat biaya operasional…');

  try {
    const filters = readListFilters(context.query);
    const categoryParam = context.query.get('category') ?? 'all';
    const category: ExpenseCategory | 'all' = EXPENSE_CATEGORIES.includes(
      categoryParam as ExpenseCategory,
    )
      ? (categoryParam as ExpenseCategory)
      : 'all';
    const search = context.query.get('search')?.trim() ?? '';
    const page = readPositiveInt(context.query.get('page'));

    const [stores, expenses] = await Promise.all([
      services.storeService.listAll(),
      services.expenseService.list({
        storeId: filters.storeId,
        category,
        search,
        from: filters.period.from,
        to: filters.period.to,
        page,
        pageSize: 25,
      }),
    ]);
    if (context.signal.aborted) return;
    context.setTitle('Biaya operasional');

    const pageTotal = expenses.items.reduce((total, expense) => total + expense.amount, 0);
    const sharedTotal = expenses.items
      .filter((expense) => expense.storeId === null)
      .reduce((total, expense) => total + expense.amount, 0);
    const hasFilters =
      filters.storeId !== null ||
      filters.period.preset !== 'thisMonth' ||
      category !== 'all' ||
      search !== '';

    const rows = expenses.items.map((expense) => [
      `<span class="table-strong">${formatBusinessDate(expense.expenseDate)}</span>`,
      expense.storeId
        ? `<a class="table-link" href="#/stores/${expense.storeId}">${escapeHtml(expense.storeName ?? 'Toko')}</a>`
        : '<span class="badge badge-primary">Biaya bersama</span>',
      EXPENSE_CATEGORY_LABELS[expense.category],
      `<span class="table-strong">${escapeHtml(expense.description)}</span>${expense.receiptNote ? `<span class="table-sub">${escapeHtml(expense.receiptNote)}</span>` : ''}`,
      formatRupiah(expense.amount),
      `<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/finance/expenses/${expense.id}/edit">Ubah</a>
        <button type="button" class="btn btn-ghost btn-icon" data-delete-expense="${escapeAttr(expense.id)}" aria-label="Hapus biaya" title="Hapus biaya">${icon('trash')}</button>
      </div>`,
    ]);

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Keuangan',
        title: 'Biaya operasional',
        subtitle: `${formatNumber(expenses.total)} catatan pada filter aktif. Biaya tanpa toko dihitung sebagai biaya bersama.`,
        actions: linkButton(addExpenseHref(filters.storeId), 'Catat biaya', 'btn btn-primary', 'plus'),
      })}

      ${listFilterHtml(filters, stores)}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="expense-category">Kategori</label>
          <select class="input select" id="expense-category" data-expense-category>
            <option value="all" ${category === 'all' ? 'selected' : ''}>Semua kategori</option>
            ${EXPENSE_CATEGORIES.map(
              (item) =>
                `<option value="${item}" ${item === category ? 'selected' : ''}>${EXPENSE_CATEGORY_LABELS[item]}</option>`,
            ).join('')}
          </select>
        </div>
        <form class="filter-search" data-expense-search role="search">
          <label class="filter-label" for="expense-search">Cari</label>
          <div class="search-input-wrap">
            ${icon('search', 'search-icon')}
            <input class="input" id="expense-search" name="search" type="search" value="${escapeAttr(search)}" placeholder="Deskripsi atau catatan…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${hasFilters ? `<a class="filter-reset" href="#/finance/expenses">${icon('x')} Reset</a>` : ''}
      </div>

      <div class="kpi-grid kpi-grid-3">
        <div class="import-stat"><strong>${formatRupiah(pageTotal)}</strong><span>Total pada halaman ini</span></div>
        <div class="import-stat import-stat-warning"><strong>${formatRupiah(sharedTotal)}</strong><span>Biaya bersama pada halaman ini</span></div>
        <div class="import-stat"><strong>${formatNumber(expenses.items.length)}</strong><span>Baris ditampilkan</span></div>
      </div>

      ${
        expenses.items.length > 0
          ? card({
              padded: false,
              body: dataTable(
                ['Tanggal', 'Toko', 'Kategori', 'Deskripsi', 'Nominal', ''],
                rows,
              ),
            })
          : card({
              body: emptyState({
                iconName: hasFilters ? 'search' : 'receipt',
                title: hasFilters ? 'Biaya tidak ditemukan' : 'Belum ada biaya operasional',
                description: hasFilters
                  ? 'Tidak ada biaya yang sesuai dengan filter. Ubah periode, toko, kategori, atau kata kunci.'
                  : 'Catat gaji, listrik, internet, sewa, perawatan mesin, bahan pendukung, dan biaya lain. Biaya bersama dicatat tanpa toko.',
                action: hasFilters
                  ? `<a class="btn btn-secondary" href="#/finance/expenses">${icon('refresh-cw')}<span>Reset filter</span></a>`
                  : linkButton(addExpenseHref(filters.storeId), 'Catat biaya pertama', 'btn btn-primary', 'plus'),
              }),
            })
      }
      ${paginationBar({ page: expenses.page, pageSize: expenses.pageSize, total: expenses.total })}
    `;

    bindListFilters(root, context);

    root.querySelector<HTMLSelectElement>('[data-expense-category]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      navigateQuery(context, { category: target.value === 'all' ? null : target.value, page: null });
    });
    const searchForm = root.querySelector<HTMLFormElement>('[data-expense-search]');
    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = searchForm.querySelector<HTMLInputElement>('input[name="search"]');
      navigateQuery(context, { search: input?.value.trim() || null, page: null });
    });
    bindPagination(root, (nextPage) => {
      context.navigate(buildRoute(context.path, context.query, { page: nextPage }));
    });

    root.querySelectorAll<HTMLButtonElement>('[data-delete-expense]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.deleteExpense ?? '';
        const expense = expenses.items.find((item) => item.id === id);
        if (!expense) return;
        const confirmed = await confirmDialog({
          title: 'Hapus biaya operasional?',
          message: `Biaya "${expense.description}" sebesar ${formatRupiah(expense.amount)} akan dihapus permanen.`,
          confirmLabel: 'Hapus biaya',
          tone: 'danger',
        });
        if (!confirmed) return;
        try {
          await services.expenseService.delete(id);
          showToast('Biaya operasional dihapus.', 'success');
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

export const expenseFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? null;
  const isEdit = id !== null;
  root.innerHTML = loadingBlock(isEdit ? 'Memuat biaya…' : 'Menyiapkan formulir…');

  try {
    const [stores, expense] = await Promise.all([
      services.storeService.listAll(),
      id ? services.expenseService.get(id) : Promise.resolve<OperationalExpenseListItem | null>(null),
    ]);
    if (context.signal.aborted) return;
    context.setTitle(isEdit ? 'Ubah biaya operasional' : 'Biaya operasional baru');

    const activeStores = stores.filter((store) => store.status === 'active');
    const queryStoreId = context.query.get('storeId');
    const selectedStoreId =
      expense?.storeId ??
      (queryStoreId && activeStores.some((store) => store.id === queryStoreId)
        ? queryStoreId
        : '');

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Keuangan',
        title: isEdit ? 'Ubah biaya operasional' : 'Catat biaya operasional',
        subtitle: 'Biaya tanpa toko dihitung sebagai biaya bersama dan hanya muncul pada total semua toko.',
        actions: `<a class="btn btn-secondary" href="#/finance/expenses">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="expense-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail biaya</h2>
            <p>Nominal harus lebih dari 0. Deskripsi wajib diisi agar laporan mudah ditelusuri.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'storeId',
              label: 'Toko terkait',
              type: 'select',
              value: selectedStoreId,
              options: storeSelectOptions(activeStores, selectedStoreId, {
                allLabel: 'Biaya bersama (tanpa toko)',
              }),
              help: 'Pilih biaya bersama untuk biaya yang tidak dapat dialokasikan ke satu toko.',
              idPrefix: 'expense',
            })}
            ${formField({
              name: 'expenseDate',
              label: 'Tanggal biaya',
              type: 'date',
              value: expense?.expenseDate ?? context.query.get('expenseDate') ?? todayJakarta(),
              required: true,
              idPrefix: 'expense',
            })}
            ${formField({
              name: 'category',
              label: 'Kategori',
              type: 'select',
              value: expense?.category ?? 'salary',
              required: true,
              options: EXPENSE_CATEGORIES.map((category) => ({
                value: category,
                label: EXPENSE_CATEGORY_LABELS[category],
              })),
              idPrefix: 'expense',
            })}
            ${formField({
              name: 'amount',
              label: 'Nominal',
              type: 'money',
              value: expense ? String(expense.amount) : '',
              required: true,
              placeholder: '0',
              idPrefix: 'expense',
            })}
            ${formField({
              name: 'description',
              label: 'Deskripsi',
              value: expense?.description ?? '',
              required: true,
              placeholder: 'Contoh: Gaji produksi bulan ini',
              idPrefix: 'expense',
              span: true,
            })}
            ${formField({
              name: 'receiptNote',
              label: 'Bukti / catatan',
              type: 'textarea',
              value: expense?.receiptNote ?? '',
              rows: 3,
              placeholder: 'Nomor nota, keterangan bukti, atau catatan tambahan…',
              idPrefix: 'expense',
              span: true,
            })}
          </div>
        </div>

        ${formActions(isEdit ? 'Simpan perubahan' : 'Simpan biaya', {
          submitIcon: 'save',
          cancelHref: '#/finance/expenses',
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#expense-form');
    if (!form) throw new Error('Formulir biaya operasional tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const input: OperationalExpenseFormInput = {
          storeId: readText(form, 'storeId') || null,
          expenseDate: readText(form, 'expenseDate'),
          category: readText(form, 'category') as ExpenseCategory,
          amount: readMoney(form, 'amount', 'Nominal', { required: true }),
          description: readText(form, 'description'),
          receiptNote: readOptionalText(form, 'receiptNote'),
        };
        if (input.amount <= 0) {
          throw new ValidationError('Nominal biaya harus lebih dari 0.', {
            amount: 'Nominal biaya harus lebih dari 0.',
          });
        }
        if (isEdit && id) {
          await services.expenseService.update(id, input);
        } else {
          await services.expenseService.create(input);
        }
        showToast(isEdit ? 'Biaya operasional diperbarui.' : 'Biaya operasional dicatat.', 'success');
        context.navigate('/finance/expenses');
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Biaya operasional gagal disimpan.', 'error');
        }
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
