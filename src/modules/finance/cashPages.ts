import type { PageRenderer } from '@/app/router';
import type {
  CashAccountBalance,
  CashAccountInput,
  CashAccountStatus,
  CashAccountType,
  CashEntryDirection,
  CashEntrySourceType,
} from '@/types/cash';
import {
  CASH_ACCOUNT_STATUSES,
  CASH_ACCOUNT_TYPES,
  CASH_ENTRY_DIRECTIONS,
  CASH_ENTRY_SOURCE_TYPES,
} from '@/types/cash';
import {
  CASH_ACCOUNT_STATUS_LABELS,
  CASH_ACCOUNT_STATUS_TONES,
  CASH_ACCOUNT_TYPE_LABELS,
  CASH_SOURCE_TYPE_LABELS,
  CASH_SOURCE_TYPE_TONES,
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
  checkboxField,
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
  readCheckbox,
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
} from '@/components/ui/filters';
import { navigateQuery, readPositiveInt, renderPageError } from '@/app/pageUtils';
import { cashAccountChoices, cashAccountOptionsHtml } from './cashUi';

function accountTypeLabel(account: CashAccountBalance): string {
  return CASH_ACCOUNT_TYPE_LABELS[account.type];
}

function sourceBadge(sourceType: CashEntrySourceType): string {
  return badge(CASH_SOURCE_TYPE_LABELS[sourceType], CASH_SOURCE_TYPE_TONES[sourceType]);
}

function directionAmount(direction: CashEntryDirection, amount: number): string {
  if (direction === 'in') {
    return `<span class="value-positive">+${formatRupiah(amount)}</span>`;
  }
  return `<span class="value-negative">-${formatRupiah(amount)}</span>`;
}

function accountActionHref(account: CashAccountBalance): string {
  return `/finance/cash/${account.id}/edit`;
}

export const cashOverviewPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat kas dan rekening…');

  try {
    const [summary, entries, transfers, reconciliations] = await Promise.all([
      services.cashService.getSummary(),
      services.cashService.listEntries({ pageSize: 8 }),
      services.cashService.listTransfers(8),
      services.cashService.listReconciliations(null, 8),
    ]);
    if (context.signal.aborted) return;
    context.setTitle('Kas & rekening');

    const needsAttention =
      summary.pendingSettlements.count > 0 ||
      summary.unassignedSettlements.count > 0 ||
      summary.unlinkedRefunds.count > 0;

    const accountRows = summary.accounts.map((account) => [
      `<span class="table-strong">${escapeHtml(account.name)}</span>${
        account.notes ? `<span class="table-sub">${escapeHtml(account.notes)}</span>` : ''
      }`,
      accountTypeLabel(account),
      badge(
        CASH_ACCOUNT_STATUS_LABELS[account.status],
        CASH_ACCOUNT_STATUS_TONES[account.status],
      ),
      formatRupiah(account.openingBalance),
      `<span class="table-strong ${account.balance < 0 ? 'value-negative' : ''}">${formatRupiah(account.balance)}</span>`,
      `${formatNumber(account.entryCount)} entri${
        account.lastEntryDate
          ? `<span class="table-sub">Terakhir ${formatBusinessDate(account.lastEntryDate)}</span>`
          : ''
      }`,
      `<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/finance/cash/ledger?accountId=${encodeURIComponent(account.id)}">Buku besar</a>
        <a class="btn btn-ghost btn-sm" href="#${accountActionHref(account)}">Ubah</a>
      </div>`,
    ]);

    const entryRows = entries.items.map((entry) => [
      formatBusinessDate(entry.entryDate),
      `<a class="table-link" href="#/finance/cash/ledger?accountId=${encodeURIComponent(entry.accountId)}">${escapeHtml(entry.accountName)}</a>`,
      `<span class="table-strong">${escapeHtml(entry.description)}</span>${
        entry.notes ? `<span class="table-sub">${escapeHtml(entry.notes)}</span>` : ''
      }`,
      sourceBadge(entry.sourceType),
      directionAmount(entry.direction, entry.amount),
    ]);

    const transferRows = transfers.map((transfer) => [
      formatBusinessDate(transfer.transferDate),
      `${escapeHtml(transfer.fromAccountName)} <span class="table-sub">→ ${escapeHtml(transfer.toAccountName)}</span>`,
      `<span class="table-strong">${formatRupiah(transfer.amount)}</span>`,
      transfer.notes ? escapeHtml(transfer.notes) : '<span class="muted">—</span>',
      `<button type="button" class="btn btn-ghost btn-icon" data-delete-transfer="${escapeAttr(transfer.id)}" aria-label="Hapus transfer" title="Hapus transfer">${icon('trash')}</button>`,
    ]);

    const reconciliationRows = reconciliations.map((reconciliation) => [
      formatBusinessDate(reconciliation.reconciliationDate),
      escapeHtml(reconciliation.accountName),
      formatRupiah(reconciliation.statementBalance),
      formatRupiah(reconciliation.bookBalance),
      reconciliation.difference === 0
        ? badge('Cocok', 'success')
        : `<span class="${reconciliation.difference > 0 ? 'value-positive' : 'value-negative'}">${formatRupiah(reconciliation.difference)}</span>`,
      reconciliation.notes ? escapeHtml(reconciliation.notes) : '<span class="muted">—</span>',
    ]);

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Keuangan',
        title: 'Kas & rekening',
        subtitle: 'Saldo kas, bank, dan e-wallet dihitung dari saldo awal ditambah seluruh mutasi.',
        actions: `
          ${linkButton('/finance/cash/new', 'Tambah rekening', 'btn btn-secondary', 'plus')}
          ${linkButton('/finance/cash/transfers/new', 'Transfer', 'btn btn-secondary', 'arrow-left-right')}
          ${linkButton('/finance/cash/reconciliations/new', 'Rekonsiliasi', 'btn btn-primary', 'scale')}
        `,
      })}

      <div class="kpi-grid">
        <div class="import-stat"><strong>${formatRupiah(summary.totalBalance)}</strong><span>Saldo kas saat ini</span></div>
        <div class="import-stat"><strong>${formatRupiah(summary.totalOpeningBalance)}</strong><span>Total saldo awal</span></div>
        <div class="import-stat import-stat-warning"><strong>${formatRupiah(summary.pendingSettlements.amount)}</strong><span>${formatNumber(summary.pendingSettlements.count)} settlement menunggu</span></div>
        <div class="import-stat import-stat-warning"><strong>${formatRupiah(summary.unassignedSettlements.amount)}</strong><span>${formatNumber(summary.unassignedSettlements.count)} settlement tanpa rekening</span></div>
      </div>

      ${
        needsAttention
          ? `<p class="inline-note note-warning">${icon('triangle-alert')} Masih ada dana yang belum tercatat: ${formatNumber(summary.unassignedSettlements.count)} settlement diterima tanpa rekening dan ${formatNumber(summary.unlinkedRefunds.count)} refund selesai tanpa settlement (${formatRupiah(summary.unlinkedRefunds.amount)}). Lengkapi rekening agar saldo kas akurat.</p>`
          : `<p class="inline-note note-success">${icon('shield-check')} Semua settlement diterima dan refund selesai sudah tertaut rekening atau settlement.</p>`
      }

      ${
        summary.accounts.length > 0
          ? card({
              title: 'Rekening',
              subtitle: `${formatNumber(summary.accountCount)} rekening terdaftar`,
              padded: false,
              body: dataTable(
                ['Rekening', 'Jenis', 'Status', 'Saldo awal', 'Saldo', 'Aktivitas', ''],
                accountRows,
              ),
            })
          : card({
              body: emptyState({
                iconName: 'landmark',
                title: 'Belum ada rekening kas',
                description:
                  'Tambahkan kas tunai, rekening bank, atau e-wallet. Saldo awal dan seluruh transaksi akan membentuk saldo berjalan.',
                action: linkButton('/finance/cash/new', 'Tambah rekening pertama', 'btn btn-primary', 'plus'),
              }),
            })
      }

      <div class="section-heading">
        <h2>Buku besar terbaru</h2>
        <p>Pencatatan otomatis dari settlement, biaya, refund, transfer, dan penyesuaian.</p>
      </div>
      ${
        entries.items.length > 0
          ? card({
              padded: false,
              body: dataTable(
                ['Tanggal', 'Rekening', 'Keterangan', 'Sumber', 'Nominal'],
                entryRows,
              ),
            })
          : card({
              body: emptyState({
                compact: true,
                iconName: 'notebook-pen',
                title: 'Belum ada mutasi kas',
                description:
                  'Mutasi akan muncul setelah settlement diterima, biaya dibayar, refund selesai, atau transfer dicatat.',
                action: linkButton('/finance/cash/ledger', 'Buka buku besar', 'btn btn-secondary', 'arrow-right'),
              }),
            })
      }
      ${
        entries.items.length > 0
          ? linkButton('/finance/cash/ledger', 'Lihat semua mutasi', 'btn btn-secondary', 'arrow-right')
          : ''
      }

      <div class="finance-grid">
        ${card({
          title: 'Transfer terakhir',
          subtitle: 'Perpindahan dana antar rekening',
          actions: linkButton('/finance/cash/transfers/new', 'Transfer', 'btn btn-ghost btn-sm', 'plus'),
          padded: false,
          body:
            transfers.length > 0
              ? dataTable(['Tanggal', 'Rute', 'Nominal', 'Catatan', ''], transferRows)
              : emptyState({
                  compact: true,
                  iconName: 'arrow-left-right',
                  title: 'Belum ada transfer',
                  description: 'Transfer mencatat kas keluar dan kas masuk pada dua rekening sekaligus.',
                }),
        })}
        ${card({
          title: 'Rekonsiliasi terakhir',
          subtitle: 'Saldo rekening vs saldo buku',
          actions: linkButton(
            '/finance/cash/reconciliations/new',
            'Rekonsiliasi',
            'btn btn-ghost btn-sm',
            'plus',
          ),
          padded: false,
          body:
            reconciliations.length > 0
              ? dataTable(['Tanggal', 'Rekening', 'Saldo rekening', 'Saldo buku', 'Selisih', 'Catatan'], reconciliationRows)
              : emptyState({
                  compact: true,
                  iconName: 'scale',
                  title: 'Belum ada rekonsiliasi',
                  description: 'Bandingkan mutasi rekening dengan buku besar dan catat selisih bila ada.',
                }),
        })}
      </div>
    `;

    root.querySelectorAll<HTMLButtonElement>('[data-delete-transfer]').forEach((button) => {
      button.addEventListener('click', async () => {
        const id = button.dataset.deleteTransfer ?? '';
        const transfer = transfers.find((item) => item.id === id);
        if (!transfer) return;
        const confirmed = await confirmDialog({
          title: 'Hapus transfer?',
          message: `Transfer ${formatRupiah(transfer.amount)} dari ${transfer.fromAccountName} ke ${transfer.toAccountName} akan dihapus beserta dua mutasi kasnya.`,
          confirmLabel: 'Hapus transfer',
          tone: 'danger',
        });
        if (!confirmed) return;
        try {
          await services.cashService.deleteTransfer(id);
          showToast('Transfer kas dihapus.', 'success');
          context.refresh();
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Transfer gagal dihapus.', 'error');
        }
      });
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

export const cashAccountFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? null;
  const isEdit = id !== null;
  root.innerHTML = loadingBlock(isEdit ? 'Memuat rekening…' : 'Menyiapkan formulir…');

  try {
    const account = id ? await services.cashService.getAccount(id) : null;
    if (context.signal.aborted) return;
    context.setTitle(isEdit ? 'Ubah rekening kas' : 'Rekening kas baru');

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Kas & rekening',
        title: isEdit ? 'Ubah rekening' : 'Tambah rekening',
        subtitle: 'Rekening menyimpan saldo awal dan seluruh mutasi kas yang tertaut.',
        actions: `
          <a class="btn btn-secondary" href="#/finance/cash">${icon('arrow-left')}<span>Kembali</span></a>
          ${isEdit ? `<button type="button" class="btn btn-danger" data-delete-account>${icon('trash')}<span>Hapus</span></button>` : ''}
        `,
      })}

      <form class="form-card" id="cash-account-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Profil rekening</h2>
            <p>Nama rekening harus unik agar tidak tertukar saat mencatat pembayaran dan pencairan.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'name',
              label: 'Nama rekening',
              value: account?.name ?? '',
              required: true,
              placeholder: 'Contoh: BCA Utama',
              idPrefix: 'cash-account',
              span: true,
            })}
            ${formField({
              name: 'type',
              label: 'Jenis',
              type: 'select',
              value: account?.type ?? 'bank',
              required: true,
              options: CASH_ACCOUNT_TYPES.map((type) => ({
                value: type,
                label: CASH_ACCOUNT_TYPE_LABELS[type],
              })),
              idPrefix: 'cash-account',
            })}
            ${formField({
              name: 'status',
              label: 'Status',
              type: 'select',
              value: account?.status ?? 'active',
              required: true,
              options: CASH_ACCOUNT_STATUSES.map((status) => ({
                value: status,
                label: CASH_ACCOUNT_STATUS_LABELS[status],
              })),
              help: 'Rekening diarsipkan tetap menyimpan riwayat dan saldo.',
              idPrefix: 'cash-account',
            })}
            ${formField({
              name: 'openingBalance',
              label: 'Saldo awal',
              type: 'money',
              value: account ? String(account.openingBalance) : '',
              required: true,
              placeholder: '0',
              help: 'Saldo saat mulai memakai Manka. Mutasi berikutnya ditambahkan otomatis.',
              idPrefix: 'cash-account',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: account?.notes ?? '',
              rows: 3,
              placeholder: 'Nomor rekening, bank, atau keterangan lain…',
              idPrefix: 'cash-account',
              span: true,
            })}
          </div>
          ${
            isEdit && account
              ? `<div class="form-info">${icon('info')}<p>Saldo berjalan saat ini: <strong>${formatRupiah(account.balance)}</strong> dari ${formatNumber(account.entryCount)} mutasi. Saldo awal dapat diubah, tetapi riwayat mutasi tidak ikut berubah.</p></div>`
              : ''
          }
        </div>

        ${formActions(isEdit ? 'Simpan perubahan' : 'Simpan rekening', {
          submitIcon: 'save',
          cancelHref: '#/finance/cash',
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#cash-account-form');
    if (!form) throw new Error('Formulir rekening tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const input: CashAccountInput = {
          name: readText(form, 'name'),
          type: readText(form, 'type') as CashAccountType,
          status: readText(form, 'status') as CashAccountStatus,
          openingBalance: readMoney(form, 'openingBalance', 'Saldo awal', { required: true }),
          notes: readOptionalText(form, 'notes'),
        };
        if (isEdit && id) {
          await services.cashService.updateAccount(id, input);
        } else {
          await services.cashService.createAccount(input);
        }
        showToast(isEdit ? 'Rekening diperbarui.' : 'Rekening ditambahkan.', 'success');
        context.navigate('/finance/cash');
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Rekening gagal disimpan.', 'error');
        }
      }
    });

    root.querySelector<HTMLButtonElement>('[data-delete-account]')?.addEventListener('click', async () => {
      if (!id || !account) return;
      const confirmed = await confirmDialog({
        title: 'Hapus rekening?',
        message: `Rekening "${account.name}" akan dihapus permanen. Rekening yang memiliki mutasi tidak dapat dihapus; arsipkan saja.`,
        confirmLabel: 'Hapus rekening',
        tone: 'danger',
      });
      if (!confirmed) return;
      try {
        await services.cashService.deleteAccount(id);
        showToast('Rekening dihapus.', 'success');
        context.navigate('/finance/cash');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Rekening gagal dihapus.', 'error');
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

export const cashLedgerPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat buku besar kas…');

  try {
    const filters = readListFilters(context.query);
    const accountId = context.query.get('accountId')?.trim() ?? '';
    const directionParam = context.query.get('direction') ?? 'all';
    const direction: CashEntryDirection | 'all' = CASH_ENTRY_DIRECTIONS.includes(
      directionParam as CashEntryDirection,
    )
      ? (directionParam as CashEntryDirection)
      : 'all';
    const sourceParam = context.query.get('sourceType') ?? 'all';
    const sourceType: CashEntrySourceType | 'all' = CASH_ENTRY_SOURCE_TYPES.includes(
      sourceParam as CashEntrySourceType,
    )
      ? (sourceParam as CashEntrySourceType)
      : 'all';
    const search = context.query.get('search')?.trim() ?? '';
    const page = readPositiveInt(context.query.get('page'));

    const [accounts, entries] = await Promise.all([
      services.cashService.listForSelect(),
      services.cashService.listEntries({
        accountId: accountId || null,
        direction,
        sourceType,
        from: filters.period.from,
        to: filters.period.to,
        search,
        page,
        pageSize: 30,
      }),
    ]);
    if (context.signal.aborted) return;
    context.setTitle('Buku besar kas');

    const totalIn = entries.items
      .filter((entry) => entry.direction === 'in')
      .reduce((total, entry) => total + entry.amount, 0);
    const totalOut = entries.items
      .filter((entry) => entry.direction === 'out')
      .reduce((total, entry) => total + entry.amount, 0);
    const hasFilters =
      filters.period.preset !== 'thisMonth' ||
      accountId !== '' ||
      direction !== 'all' ||
      sourceType !== 'all' ||
      search !== '';

    const rows = entries.items.map((entry) => [
      formatBusinessDate(entry.entryDate),
      `<a class="table-link" href="#/finance/cash/ledger?accountId=${encodeURIComponent(entry.accountId)}">${escapeHtml(entry.accountName)}</a>`,
      `<span class="table-strong">${escapeHtml(entry.description)}</span>${
        entry.notes ? `<span class="table-sub">${escapeHtml(entry.notes)}</span>` : ''
      }`,
      sourceBadge(entry.sourceType),
      directionAmount(entry.direction, entry.amount),
    ]);

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Kas & rekening',
        title: 'Buku besar kas',
        subtitle: 'Seluruh mutasi kas dari transaksi keuangan di aplikasi.',
        actions: `
          ${linkButton('/finance/cash/adjustments/new', 'Penyesuaian', 'btn btn-primary', 'plus')}
          <a class="btn btn-secondary" href="#/finance/cash">${icon('arrow-left')}<span>Kas</span></a>
        `,
      })}

      ${listFilterHtml(filters, [], { showStore: false })}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="cash-account-filter">Rekening</label>
          <select class="input select" id="cash-account-filter" data-cash-account>
            <option value="">Semua rekening</option>
            ${cashAccountOptionsHtml(accounts, accountId || null)}
          </select>
        </div>
        <div class="filter-control">
          <label class="filter-label" for="cash-direction-filter">Arah</label>
          <select class="input select" id="cash-direction-filter" data-cash-direction>
            <option value="all" ${direction === 'all' ? 'selected' : ''}>Masuk & keluar</option>
            <option value="in" ${direction === 'in' ? 'selected' : ''}>Kas masuk</option>
            <option value="out" ${direction === 'out' ? 'selected' : ''}>Kas keluar</option>
          </select>
        </div>
        <div class="filter-control">
          <label class="filter-label" for="cash-source-filter">Sumber</label>
          <select class="input select" id="cash-source-filter" data-cash-source>
            <option value="all" ${sourceType === 'all' ? 'selected' : ''}>Semua sumber</option>
            ${CASH_ENTRY_SOURCE_TYPES.map(
              (source) =>
                `<option value="${source}" ${source === sourceType ? 'selected' : ''}>${CASH_SOURCE_TYPE_LABELS[source]}</option>`,
            ).join('')}
          </select>
        </div>
        <form class="filter-search" data-cash-search role="search">
          <label class="filter-label" for="cash-search">Cari</label>
          <div class="search-input-wrap">
            ${icon('search', 'search-icon')}
            <input class="input" id="cash-search" name="search" type="search" value="${escapeAttr(search)}" placeholder="Keterangan, catatan, atau rekening…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${hasFilters ? `<a class="filter-reset" href="#/finance/cash/ledger">${icon('x')} Reset</a>` : ''}
      </div>

      <div class="kpi-grid kpi-grid-3">
        <div class="import-stat"><strong class="value-positive">${formatRupiah(totalIn)}</strong><span>Kas masuk halaman ini</span></div>
        <div class="import-stat"><strong class="value-negative">${formatRupiah(totalOut)}</strong><span>Kas keluar halaman ini</span></div>
        <div class="import-stat"><strong>${formatNumber(entries.total)}</strong><span>Mutasi pada filter</span></div>
      </div>

      ${
        entries.items.length > 0
          ? card({
              padded: false,
              body: dataTable(['Tanggal', 'Rekening', 'Keterangan', 'Sumber', 'Nominal'], rows),
            })
          : card({
              body: emptyState({
                iconName: hasFilters ? 'search' : 'notebook-pen',
                title: hasFilters ? 'Mutasi tidak ditemukan' : 'Belum ada mutasi kas',
                description: hasFilters
                  ? 'Tidak ada mutasi yang sesuai filter. Ubah periode, rekening, arah, sumber, atau kata kunci.'
                  : 'Mutasi muncul saat settlement diterima, biaya dibayar, refund selesai, transfer, atau penyesuaian dicatat.',
                action: linkButton('/finance/cash', 'Kembali ke kas', 'btn btn-secondary', 'arrow-left'),
              }),
            })
      }
      ${paginationBar({ page: entries.page, pageSize: entries.pageSize, total: entries.total })}
    `;

    bindListFilters(root, context);
    root.querySelector<HTMLSelectElement>('[data-cash-account]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      navigateQuery(context, { accountId: target.value || null, page: null });
    });
    root.querySelector<HTMLSelectElement>('[data-cash-direction]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      navigateQuery(context, { direction: target.value === 'all' ? null : target.value, page: null });
    });
    root.querySelector<HTMLSelectElement>('[data-cash-source]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      navigateQuery(context, { sourceType: target.value === 'all' ? null : target.value, page: null });
    });
    const searchForm = root.querySelector<HTMLFormElement>('[data-cash-search]');
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

export const cashTransferFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Menyiapkan formulir transfer…');

  try {
    const accounts = await services.cashService.listForSelect();
    if (context.signal.aborted) return;
    context.setTitle('Transfer kas');
    const activeAccounts = accounts.filter((account) => account.status === 'active');

    if (activeAccounts.length < 2) {
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Kas & rekening',
          title: 'Transfer kas',
          actions: `<a class="btn btn-secondary" href="#/finance/cash">${icon('arrow-left')}<span>Kembali</span></a>`,
        })}
        ${card({
          body: emptyState({
            iconName: 'arrow-left-right',
            title: 'Butuh minimal dua rekening aktif',
            description: 'Tambahkan rekening kas, bank, atau e-wallet terlebih dahulu untuk mencatat transfer antar rekening.',
            action: linkButton('/finance/cash/new', 'Tambah rekening', 'btn btn-primary', 'plus'),
          }),
        })}
      `;
      refreshIcons(root);
      return;
    }

    const first = activeAccounts[0]!;
    const second = activeAccounts[1]!;
    const queryFrom = context.query.get('fromAccountId');
    const queryTo = context.query.get('toAccountId');
    const selectedFrom =
      queryFrom && activeAccounts.some((account) => account.id === queryFrom)
        ? queryFrom
        : first.id;
    const selectedTo =
      queryTo && activeAccounts.some((account) => account.id === queryTo) && queryTo !== selectedFrom
        ? queryTo
        : second.id;

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Kas & rekening',
        title: 'Transfer kas',
        subtitle: 'Satu transfer membuat kas keluar dan kas masuk pada dua rekening sekaligus.',
        actions: `<a class="btn btn-secondary" href="#/finance/cash">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="cash-transfer-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail transfer</h2>
            <p>Rekening asal dan tujuan harus berbeda. Nominal dipotong dari saldo asal dan ditambahkan ke saldo tujuan.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'fromAccountId',
              label: 'Rekening asal',
              type: 'select',
              value: selectedFrom,
              required: true,
              options: cashAccountChoices(activeAccounts, selectedFrom, { allLabel: null }),
              idPrefix: 'cash-transfer',
            })}
            ${formField({
              name: 'toAccountId',
              label: 'Rekening tujuan',
              type: 'select',
              value: selectedTo,
              required: true,
              options: cashAccountChoices(
                activeAccounts.filter((account) => account.id !== selectedFrom),
                selectedTo,
                { allLabel: null },
              ),
              idPrefix: 'cash-transfer',
            })}
            ${formField({
              name: 'transferDate',
              label: 'Tanggal transfer',
              type: 'date',
              value: context.query.get('transferDate') ?? todayJakarta(),
              required: true,
              idPrefix: 'cash-transfer',
            })}
            ${formField({
              name: 'amount',
              label: 'Nominal',
              type: 'money',
              value: '',
              required: true,
              placeholder: '0',
              idPrefix: 'cash-transfer',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: context.query.get('notes') ?? '',
              rows: 3,
              placeholder: 'Biaya admin, referensi transfer, atau catatan lain…',
              idPrefix: 'cash-transfer',
              span: true,
            })}
          </div>
        </div>

        ${formActions('Simpan transfer', {
          submitIcon: 'save',
          cancelHref: '#/finance/cash',
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#cash-transfer-form');
    if (!form) throw new Error('Formulir transfer tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const fromSelect = form.querySelector<HTMLSelectElement>('select[name="fromAccountId"]');
    const toSelect = form.querySelector<HTMLSelectElement>('select[name="toAccountId"]');

    const refreshToOptions = (): void => {
      if (!fromSelect || !toSelect) return;
      const keep = toSelect.value;
      const choices = cashAccountChoices(
        activeAccounts.filter((account) => account.id !== fromSelect.value),
        keep,
        { allLabel: null },
      );
      toSelect.innerHTML = choices
        .map(
          (choice) =>
            `<option value="${escapeAttr(choice.value)}" ${choice.value === keep ? 'selected' : ''}>${escapeHtml(choice.label)}</option>`,
        )
        .join('');
    };
    fromSelect?.addEventListener('change', refreshToOptions);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        await services.cashService.createTransfer({
          fromAccountId: readText(form, 'fromAccountId'),
          toAccountId: readText(form, 'toAccountId'),
          transferDate: readText(form, 'transferDate'),
          amount: readMoney(form, 'amount', 'Nominal transfer', { required: true }),
          notes: readOptionalText(form, 'notes'),
        });
        showToast('Transfer kas dicatat.', 'success');
        context.navigate('/finance/cash');
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Transfer gagal disimpan.', 'error');
        }
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

export const cashReconciliationFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Menyiapkan rekonsiliasi…');

  try {
    const accounts = await services.cashService.listForSelect();
    if (context.signal.aborted) return;
    context.setTitle('Rekonsiliasi kas');
    const activeAccounts = accounts.filter((account) => account.status === 'active');

    if (activeAccounts.length === 0) {
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Kas & rekening',
          title: 'Rekonsiliasi kas',
          actions: `<a class="btn btn-secondary" href="#/finance/cash">${icon('arrow-left')}<span>Kembali</span></a>`,
        })}
        ${card({
          body: emptyState({
            iconName: 'scale',
            title: 'Belum ada rekening aktif',
            description: 'Tambahkan rekening terlebih dahulu untuk membandingkan saldo rekening dengan saldo buku.',
            action: linkButton('/finance/cash/new', 'Tambah rekening', 'btn btn-primary', 'plus'),
          }),
        })}
      `;
      refreshIcons(root);
      return;
    }

    const queryAccount = context.query.get('accountId');
    const selectedAccountId =
      queryAccount && activeAccounts.some((account) => account.id === queryAccount)
        ? queryAccount
        : activeAccounts[0]!.id;

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Kas & rekening',
        title: 'Rekonsiliasi kas',
        subtitle: 'Bandingkan saldo rekening/statement dengan saldo buku pada tanggal tertentu.',
        actions: `<a class="btn btn-secondary" href="#/finance/cash">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="cash-reconciliation-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail rekonsiliasi</h2>
            <p>Selisih dihitung dari saldo rekening dikurangi saldo buku. Buat penyesuaian hanya jika selisih memang perlu dibukukan.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'accountId',
              label: 'Rekening',
              type: 'select',
              value: selectedAccountId,
              required: true,
              options: cashAccountChoices(activeAccounts, selectedAccountId, { allLabel: null }),
              idPrefix: 'cash-reconciliation',
              span: true,
            })}
            ${formField({
              name: 'reconciliationDate',
              label: 'Tanggal rekonsiliasi',
              type: 'date',
              value: context.query.get('reconciliationDate') ?? todayJakarta(),
              required: true,
              idPrefix: 'cash-reconciliation',
            })}
            ${formField({
              name: 'statementBalance',
              label: 'Saldo rekening / statement',
              type: 'money',
              value: '',
              required: true,
              placeholder: '0',
              help: 'Saldo yang tercantum di rekening bank, e-wallet, atau kas fisik.',
              idPrefix: 'cash-reconciliation',
            })}
            <div class="field span-2">
              <p class="field-help" data-book-balance>Pilih rekening untuk melihat saldo buku.</p>
            </div>
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: context.query.get('notes') ?? '',
              rows: 3,
              placeholder: 'Nomor rekening koran, tanggal cetak, atau penjelasan selisih…',
              idPrefix: 'cash-reconciliation',
              span: true,
            })}
          </div>
          <div class="form-section-head">
            <h2>Penyesuaian otomatis</h2>
            <p>Jika dicentang, selisih akan dicatat sebagai mutasi penyesuaian agar saldo buku sama dengan saldo rekening.</p>
          </div>
          ${checkboxField({
            name: 'createAdjustment',
            label: 'Catat selisih sebagai penyesuaian kas',
            description: 'Kosongkan jika selisih hanya ingin dicatat sebagai temuan.',
            checked: true,
            idPrefix: 'cash-reconciliation',
          })}
        </div>

        ${formActions('Simpan rekonsiliasi', {
          submitIcon: 'save',
          cancelHref: '#/finance/cash',
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#cash-reconciliation-form');
    if (!form) throw new Error('Formulir rekonsiliasi tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const accountSelect = form.querySelector<HTMLSelectElement>('select[name="accountId"]');
    const dateInput = form.querySelector<HTMLInputElement>('input[name="reconciliationDate"]');
    const bookHint = form.querySelector<HTMLElement>('[data-book-balance]');

    const refreshBookBalance = async (): Promise<void> => {
      if (!accountSelect || !dateInput || !bookHint) return;
      if (!accountSelect.value || !dateInput.value) {
        bookHint.textContent = 'Pilih rekening untuk melihat saldo buku.';
        return;
      }
      bookHint.textContent = 'Menghitung saldo buku…';
      try {
        const balance = await services.cashService.getBalanceAsOf(
          accountSelect.value,
          dateInput.value,
        );
        bookHint.textContent = `Saldo buku pada ${formatBusinessDate(dateInput.value)}: ${formatRupiah(balance)}.`;
      } catch {
        bookHint.textContent = 'Saldo buku tidak dapat dihitung.';
      }
    };
    accountSelect?.addEventListener('change', () => void refreshBookBalance());
    dateInput?.addEventListener('change', () => void refreshBookBalance());
    void refreshBookBalance();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const result = await services.cashService.createReconciliation({
          accountId: readText(form, 'accountId'),
          reconciliationDate: readText(form, 'reconciliationDate'),
          statementBalance: readMoney(form, 'statementBalance', 'Saldo rekening', {
            required: true,
          }),
          notes: readOptionalText(form, 'notes'),
          createAdjustment: readCheckbox(form, 'createAdjustment'),
        });
        const difference = result.reconciliation.difference;
        showToast(
          difference === 0
            ? 'Rekonsiliasi cocok. Saldo buku sama dengan saldo rekening.'
            : `Rekonsiliasi disimpan. Selisih ${formatRupiah(difference)}${result.adjustmentEntryId ? ' dan penyesuaian kas dibuat.' : ' tanpa penyesuaian.'}`,
          difference === 0 ? 'success' : 'warning',
        );
        context.navigate('/finance/cash');
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Rekonsiliasi gagal disimpan.', 'error');
        }
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

export const cashAdjustmentFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Menyiapkan penyesuaian kas…');

  try {
    const accounts = await services.cashService.listForSelect();
    if (context.signal.aborted) return;
    context.setTitle('Penyesuaian kas');
    const activeAccounts = accounts.filter((account) => account.status === 'active');

    if (activeAccounts.length === 0) {
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Kas & rekening',
          title: 'Penyesuaian kas',
          actions: `<a class="btn btn-secondary" href="#/finance/cash">${icon('arrow-left')}<span>Kembali</span></a>`,
        })}
        ${card({
          body: emptyState({
            iconName: 'notebook-pen',
            title: 'Belum ada rekening aktif',
            description: 'Tambahkan rekening terlebih dahulu untuk mencatat penyesuaian kas.',
            action: linkButton('/finance/cash/new', 'Tambah rekening', 'btn btn-primary', 'plus'),
          }),
        })}
      `;
      refreshIcons(root);
      return;
    }

    const queryAccount = context.query.get('accountId');
    const selectedAccountId =
      queryAccount && activeAccounts.some((account) => account.id === queryAccount)
        ? queryAccount
        : activeAccounts[0]!.id;

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Kas & rekening',
        title: 'Penyesuaian kas',
        subtitle: 'Catat koreksi kas manual yang tidak berasal dari settlement, biaya, refund, atau transfer.',
        actions: `<a class="btn btn-secondary" href="#/finance/cash">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="cash-adjustment-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail penyesuaian</h2>
            <p>Gunakan penyesuaian untuk koreksi saldo, uang hilang, atau selisih kas fisik. Keterangan wajib diisi.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'accountId',
              label: 'Rekening',
              type: 'select',
              value: selectedAccountId,
              required: true,
              options: cashAccountChoices(activeAccounts, selectedAccountId, { allLabel: null }),
              idPrefix: 'cash-adjustment',
              span: true,
            })}
            ${formField({
              name: 'entryDate',
              label: 'Tanggal',
              type: 'date',
              value: context.query.get('entryDate') ?? todayJakarta(),
              required: true,
              idPrefix: 'cash-adjustment',
            })}
            ${formField({
              name: 'direction',
              label: 'Arah',
              type: 'select',
              value: 'out',
              required: true,
              options: [
                { value: 'in', label: 'Kas masuk (menambah saldo)' },
                { value: 'out', label: 'Kas keluar (mengurangi saldo)' },
              ],
              idPrefix: 'cash-adjustment',
            })}
            ${formField({
              name: 'amount',
              label: 'Nominal',
              type: 'money',
              value: '',
              required: true,
              placeholder: '0',
              idPrefix: 'cash-adjustment',
            })}
            ${formField({
              name: 'description',
              label: 'Keterangan',
              value: '',
              required: true,
              placeholder: 'Contoh: Selisih kas fisik',
              idPrefix: 'cash-adjustment',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: context.query.get('notes') ?? '',
              rows: 3,
              placeholder: 'Penjelasan tambahan…',
              idPrefix: 'cash-adjustment',
              span: true,
            })}
          </div>
          <div class="form-info">
            ${icon('info')}
            <p>Penyesuaian langsung mengubah saldo rekening. Tidak memengaruhi omzet, laba, atau laporan penjualan.</p>
          </div>
        </div>

        ${formActions('Simpan penyesuaian', {
          submitIcon: 'save',
          cancelHref: '#/finance/cash',
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#cash-adjustment-form');
    if (!form) throw new Error('Formulir penyesuaian tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        await services.cashService.createAdjustment({
          accountId: readText(form, 'accountId'),
          entryDate: readText(form, 'entryDate'),
          direction: readText(form, 'direction') as CashEntryDirection,
          amount: readMoney(form, 'amount', 'Nominal penyesuaian', { required: true }),
          description: readText(form, 'description'),
          notes: readOptionalText(form, 'notes'),
        });
        showToast('Penyesuaian kas dicatat.', 'success');
        context.navigate('/finance/cash');
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Penyesuaian gagal disimpan.', 'error');
        }
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
