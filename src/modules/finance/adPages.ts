import type { PageRenderer } from '@/app/router';
import type {
  AdPlatform,
  AdvertisingCampaignInput,
  AdvertisingExpenseInput,
} from '@/types/entities';
import type { AdvertisingExpenseListItem } from '@/core/repositories/advertisingRepository';
import { AD_PLATFORMS } from '@/types/entities';
import { AD_PLATFORM_LABELS } from '@/app/labels';
import { formatBusinessDate, todayJakarta } from '@/core/utils/date';
import { formatDecimal, formatNumber, formatPercent, formatRupiah } from '@/core/utils/money';
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
  kpiCard,
  linkButton,
  loadingBlock,
  pageHeader,
  paginationBar,
  readMoney,
  readOptionalInteger,
  readOptionalMoney,
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

function addCampaignHref(): string {
  return '/finance/ads/new';
}

function addExpenseHref(campaignId?: string | null): string {
  const params = new URLSearchParams({ expenseDate: todayJakarta() });
  if (campaignId) params.set('campaignId', campaignId);
  return `/finance/ads/expenses/new?${params.toString()}`;
}

function roasLabel(value: number | null): string {
  return value === null ? 'N/A' : `${formatDecimal(value)}×`;
}

function acosLabel(value: number | null): string {
  return value === null ? 'N/A' : formatPercent(value);
}

function platformBadge(platform: AdPlatform): string {
  return badge(AD_PLATFORM_LABELS[platform], 'info');
}

function campaignStoreLabel(storeName: string | null): string {
  return storeName
    ? escapeHtml(storeName)
    : '<span class="badge badge-primary">Semua toko</span>';
}

export const adCampaignListPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat kampanye iklan…');

  try {
    const filters = readListFilters(context.query);
    const platformParam = context.query.get('platform') ?? 'all';
    const platform: AdPlatform | 'all' = AD_PLATFORMS.includes(platformParam as AdPlatform)
      ? (platformParam as AdPlatform)
      : 'all';
    const search = context.query.get('search')?.trim().toLowerCase() ?? '';
    const stores = await services.storeService.listAll();
    const campaigns = await services.advertisingService.listCampaigns(filters.storeId);
    if (context.signal.aborted) return;
    context.setTitle('Iklan');

    const filtered = campaigns.filter((campaign) => {
      if (platform !== 'all' && campaign.platform !== platform) return false;
      if (search && !campaign.name.toLowerCase().includes(search)) return false;
      return true;
    });
    const totalSpend = filtered.reduce((total, campaign) => total + campaign.totalSpend, 0);
    const attributedRevenue = filtered.reduce(
      (total, campaign) => total + (campaign.totalAttributedRevenue ?? 0),
      0,
    );
    const attributionRows = filtered.reduce((total, campaign) => total + campaign.attributionRows, 0);
    const overallRoas = totalSpend > 0 && attributionRows > 0 ? attributedRevenue / totalSpend : null;
    const hasFilters =
      filters.storeId !== null || platform !== 'all' || search !== '';

    const rows = filtered.map((campaign) => [
      `<a class="table-link" href="#/finance/ads/${campaign.id}">${escapeHtml(campaign.name)}</a>${
        campaign.notes ? `<span class="table-sub">${escapeHtml(campaign.notes)}</span>` : ''
      }`,
      platformBadge(campaign.platform),
      campaignStoreLabel(campaign.storeName),
      `<span class="table-strong">${formatRupiah(campaign.totalSpend)}</span><span class="table-sub">${formatNumber(campaign.expenseCount)} catatan</span>`,
      campaign.totalAttributedRevenue === null
        ? '<span class="muted">N/A</span>'
        : formatRupiah(campaign.totalAttributedRevenue),
      roasLabel(campaign.roas),
      acosLabel(campaign.acos),
      `<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/finance/ads/expenses?campaignId=${encodeURIComponent(campaign.id)}">Biaya</a>
        <a class="btn btn-ghost btn-sm" href="#/finance/ads/${campaign.id}/edit">Ubah</a>
      </div>`,
    ]);

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Keuangan',
        title: 'Iklan',
        subtitle:
          'Catat pengeluaran iklan per kampanye. ROAS dan ACOS hanya dihitung bila data atribusi tersedia.',
        actions: `
          ${linkButton('/finance/ads/expenses', 'Semua biaya iklan', 'btn btn-secondary', 'receipt')}
          ${linkButton(addCampaignHref(), 'Kampanye baru', 'btn btn-primary', 'plus')}
        `,
      })}

      <div class="kpi-grid">
        ${kpiCard({
          label: 'Total pengeluaran iklan',
          value: formatRupiah(totalSpend),
          iconName: 'megaphone',
          hint: `${formatNumber(filtered.length)} kampanye`,
        })}
        ${kpiCard({
          label: 'Omzet teratribusi',
          value: attributionRows > 0 ? formatRupiah(attributedRevenue) : 'N/A',
          iconName: 'target',
          hint:
            attributionRows > 0
              ? `${formatNumber(attributionRows)} catatan memiliki atribusi`
              : 'Belum ada data atribusi',
        })}
        ${kpiCard({
          label: 'ROAS keseluruhan',
          value: overallRoas === null ? 'N/A' : `${overallRoas.toFixed(2)}×`,
          iconName: 'trending-up',
          hint: 'Omzet teratribusi ÷ biaya iklan',
        })}
        ${kpiCard({
          label: 'Kampanye aktif tercatat',
          value: formatNumber(filtered.length),
          iconName: 'list-checks',
          hint: hasFilters ? 'Setelah filter' : 'Seluruh kampanye',
        })}
      </div>

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="ad-store">Toko</label>
          <select class="input select" id="ad-store" data-ad-store>
            <option value="">Semua toko</option>
            ${stores
              .map(
                (store) =>
                  `<option value="${escapeAttr(store.id)}" ${store.id === filters.storeId ? 'selected' : ''}>${escapeHtml(store.name)}</option>`,
              )
              .join('')}
          </select>
        </div>
        <div class="filter-control">
          <label class="filter-label" for="ad-platform">Platform</label>
          <select class="input select" id="ad-platform" data-ad-platform>
            <option value="all" ${platform === 'all' ? 'selected' : ''}>Semua platform</option>
            ${AD_PLATFORMS.map(
              (item) =>
                `<option value="${item}" ${item === platform ? 'selected' : ''}>${AD_PLATFORM_LABELS[item]}</option>`,
            ).join('')}
          </select>
        </div>
        <form class="filter-search" data-ad-search role="search">
          <label class="filter-label" for="ad-search">Cari kampanye</label>
          <div class="search-input-wrap">
            ${icon('search', 'search-icon')}
            <input class="input" id="ad-search" name="search" type="search" value="${escapeAttr(search)}" placeholder="Nama kampanye…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${hasFilters ? `<a class="filter-reset" href="#/finance/ads">${icon('x')} Reset</a>` : ''}
      </div>

      ${
        filtered.length > 0
          ? card({
              padded: false,
              body: dataTable(
                ['Kampanye', 'Platform', 'Toko', 'Biaya iklan', 'Omzet teratribusi', 'ROAS', 'ACOS', ''],
                rows,
              ),
            })
          : card({
              body: emptyState({
                iconName: hasFilters ? 'search' : 'megaphone',
                title: hasFilters ? 'Kampanye tidak ditemukan' : 'Belum ada kampanye iklan',
                description: hasFilters
                  ? 'Tidak ada kampanye yang sesuai dengan filter. Ubah toko, platform, atau kata kunci.'
                  : 'Buat kampanye untuk mengelompokkan pengeluaran iklan. Data atribusi opsional; ROAS/ACOS tampil N/A jika tidak tersedia.',
                action: hasFilters
                  ? `<a class="btn btn-secondary" href="#/finance/ads">${icon('refresh-cw')}<span>Reset filter</span></a>`
                  : linkButton(addCampaignHref(), 'Buat kampanye pertama', 'btn btn-primary', 'plus'),
              }),
            })
      }
    `;

    root.querySelector<HTMLSelectElement>('[data-ad-store]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      navigateQuery(context, { storeId: target.value || null, page: null });
    });
    root.querySelector<HTMLSelectElement>('[data-ad-platform]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      navigateQuery(context, { platform: target.value === 'all' ? null : target.value, page: null });
    });
    const searchForm = root.querySelector<HTMLFormElement>('[data-ad-search]');
    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = searchForm.querySelector<HTMLInputElement>('input[name="search"]');
      navigateQuery(context, { search: input?.value.trim() || null, page: null });
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

export const adCampaignDetailPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? '';
  root.innerHTML = loadingBlock('Memuat kampanye iklan…');

  try {
    const [campaign, expensePage] = await Promise.all([
      services.advertisingService.getCampaign(id),
      services.advertisingService.listExpenses({ campaignId: id, pageSize: 100 }),
    ]);
    if (context.signal.aborted) return;
    context.setTitle(campaign.name);

    const expenses = expensePage.items;
    const totalImpressions = expenses.reduce((total, expense) => total + (expense.impressions ?? 0), 0);
    const totalClicks = expenses.reduce((total, expense) => total + (expense.clicks ?? 0), 0);
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null;
    const cpc = totalClicks > 0 ? campaign.totalSpend / totalClicks : null;

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Kampanye iklan',
        title: campaign.name,
        subtitle: `${AD_PLATFORM_LABELS[campaign.platform]} · ${campaign.storeName ?? 'Semua toko'}`,
        actions: `
          <a class="btn btn-secondary" href="#/finance/ads">${icon('arrow-left')}<span>Kembali</span></a>
          ${linkButton(`/finance/ads/${campaign.id}/edit`, 'Ubah kampanye', 'btn btn-secondary', 'pencil')}
          ${linkButton(addExpenseHref(campaign.id), 'Catat biaya', 'btn btn-primary', 'plus')}
        `,
      })}

      <div class="kpi-grid">
        ${kpiCard({
          label: 'Total biaya iklan',
          value: formatRupiah(campaign.totalSpend),
          iconName: 'megaphone',
          hint: `${formatNumber(campaign.expenseCount)} catatan biaya`,
        })}
        ${kpiCard({
          label: 'Omzet teratribusi',
          value: campaign.totalAttributedRevenue === null ? 'N/A' : formatRupiah(campaign.totalAttributedRevenue),
          iconName: 'target',
          hint:
            campaign.attributionRows > 0
              ? `${formatNumber(campaign.totalAttributedOrders ?? 0)} pesanan teratribusi`
              : 'Isi omzet teratribusi pada biaya iklan',
        })}
        ${kpiCard({
          label: 'ROAS',
          value: roasLabel(campaign.roas),
          iconName: 'trending-up',
          hint: 'Omzet teratribusi ÷ biaya iklan',
        })}
        ${kpiCard({
          label: 'ACOS',
          value: acosLabel(campaign.acos),
          iconName: 'percent',
          hint: 'Biaya iklan ÷ omzet teratribusi',
        })}
      </div>

      ${card({
        title: 'Ringkasan kampanye',
        body: `
          <dl class="detail-list detail-list-3">
            <div><dt>Platform</dt><dd>${platformBadge(campaign.platform)}</dd></div>
            <div><dt>Toko</dt><dd>${campaign.storeName ? `<a class="table-link" href="#/stores/${campaign.storeId}">${escapeHtml(campaign.storeName)}</a>` : 'Semua toko (biaya bersama)'}</dd></div>
            <div><dt>Dibuat</dt><dd>${formatBusinessDate(campaign.createdAt.slice(0, 10), 'long')}</dd></div>
            <div><dt>Impression</dt><dd>${totalImpressions > 0 ? formatNumber(totalImpressions) : 'N/A'}</dd></div>
            <div><dt>Click</dt><dd>${totalClicks > 0 ? formatNumber(totalClicks) : 'N/A'}</dd></div>
            <div><dt>CTR</dt><dd>${ctr === null ? 'N/A' : formatPercent(ctr)}</dd></div>
            <div><dt>CPC</dt><dd>${cpc === null ? 'N/A' : formatRupiah(cpc)}</dd></div>
            <div><dt>Pesanan teratribusi</dt><dd>${campaign.totalAttributedOrders === null ? 'N/A' : formatNumber(campaign.totalAttributedOrders)}</dd></div>
            <div><dt>Catatan</dt><dd>${campaign.notes ? escapeHtml(campaign.notes) : '<span class="muted">—</span>'}</dd></div>
          </dl>
          <p class="inline-note">${icon('info')} ROAS/ACOS bernilai N/A selama belum ada catatan biaya dengan omzet teratribusi. Angka tidak pernah dikarang.</p>
        `,
      })}

      ${card({
        title: 'Riwayat biaya iklan',
        subtitle: `${formatNumber(expenses.length)} catatan terakhir`,
        padded: false,
        body:
          expenses.length > 0
            ? dataTable(
                ['Tanggal', 'Biaya', 'Impression', 'Click', 'Pesanan', 'Omzet atribusi', 'ROAS', 'ACOS', 'Catatan', ''],
                expenses.map((expense) => {
                  const rowRoas =
                    expense.attributedRevenue !== null && expense.amount > 0
                      ? expense.attributedRevenue / expense.amount
                      : null;
                  const rowAcos =
                    expense.attributedRevenue !== null && expense.attributedRevenue > 0
                      ? (expense.amount / expense.attributedRevenue) * 100
                      : null;
                  return [
                    formatBusinessDate(expense.expenseDate),
                    `<span class="table-strong">${formatRupiah(expense.amount)}</span>`,
                    expense.impressions === null ? '—' : formatNumber(expense.impressions),
                    expense.clicks === null ? '—' : formatNumber(expense.clicks),
                    expense.attributedOrders === null ? '—' : formatNumber(expense.attributedOrders),
                    expense.attributedRevenue === null ? '<span class="muted">N/A</span>' : formatRupiah(expense.attributedRevenue),
                    rowRoas === null ? 'N/A' : `${rowRoas.toFixed(2)}×`,
                    acosLabel(rowAcos),
                    expense.notes ? `<span class="table-note">${escapeHtml(expense.notes)}</span>` : '<span class="muted">—</span>',
                    `<div class="table-actions">
                      <a class="btn btn-ghost btn-sm" href="#/finance/ads/expenses/${expense.id}/edit">Ubah</a>
                      <button type="button" class="btn btn-ghost btn-icon" data-delete-expense="${escapeAttr(expense.id)}" aria-label="Hapus biaya iklan" title="Hapus biaya iklan">${icon('trash')}</button>
                    </div>`,
                  ];
                }),
              )
            : emptyState({
                compact: true,
                iconName: 'receipt',
                title: 'Belum ada biaya iklan',
                description: 'Catat pengeluaran harian kampanye beserta impression, click, dan atribusi bila tersedia.',
                action: linkButton(addExpenseHref(campaign.id), 'Catat biaya iklan', 'btn btn-secondary btn-sm', 'plus'),
              }),
      })}

      <div class="detail-grid">
        ${card({
          title: 'Metrik kampanye',
          body: `
            <dl class="finance-breakdown">
              <div class="finance-row"><dt>Biaya iklan</dt><dd class="value-negative">${formatRupiah(-campaign.totalSpend)}</dd></div>
              <div class="finance-row"><dt>Omzet teratribusi</dt><dd>${campaign.totalAttributedRevenue === null ? 'N/A' : formatRupiah(campaign.totalAttributedRevenue)}</dd></div>
              <div class="finance-row finance-row-strong"><dt>ROAS</dt><dd>${roasLabel(campaign.roas)}</dd></div>
              <div class="finance-row finance-row-strong"><dt>ACOS</dt><dd>${acosLabel(campaign.acos)}</dd></div>
            </dl>
            <p class="inline-note">${icon('info')} Omzet teratribusi adalah omzet yang dilaporkan platform iklan. Nilai ini tidak ditambahkan ke omzet pesanan agar tidak dihitung dua kali.</p>
          `,
        })}

        ${card({
          title: 'Hapus kampanye',
          body: `
            <div class="danger-zone danger-row">
              <div>
                <strong>Hapus kampanye dan seluruh biayanya</strong>
                <p>${formatNumber(campaign.expenseCount)} catatan biaya iklan akan dihapus permanen dan laba periode berubah.</p>
              </div>
              <button type="button" class="btn btn-danger btn-sm" data-delete-campaign>${icon('trash')}<span>Hapus kampanye</span></button>
            </div>
          `,
        })}
      </div>
    `;

    root.querySelectorAll<HTMLButtonElement>('[data-delete-expense]').forEach((button) => {
      button.addEventListener('click', async () => {
        const expenseId = button.dataset.deleteExpense ?? '';
        const expense = expenses.find((item) => item.id === expenseId);
        if (!expense) return;
        const confirmed = await confirmDialog({
          title: 'Hapus biaya iklan?',
          message: `Biaya ${formatRupiah(expense.amount)} pada ${formatBusinessDate(expense.expenseDate)} akan dihapus permanen.`,
          confirmLabel: 'Hapus biaya',
          tone: 'danger',
        });
        if (!confirmed) return;
        try {
          await services.advertisingService.deleteExpense(expenseId);
          showToast('Biaya iklan dihapus.', 'success');
          context.refresh();
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Biaya iklan gagal dihapus.', 'error');
        }
      });
    });

    root.querySelector<HTMLButtonElement>('[data-delete-campaign]')?.addEventListener('click', async (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const confirmed = await confirmDialog({
        title: 'Hapus kampanye iklan?',
        message: `Kampanye "${campaign.name}" beserta ${formatNumber(campaign.expenseCount)} catatan biaya iklan akan dihapus permanen.`,
        confirmLabel: 'Hapus kampanye',
        tone: 'danger',
        requireText: campaign.name,
        details: [
          `Platform: ${AD_PLATFORM_LABELS[campaign.platform]}`,
          `Toko: ${campaign.storeName ?? 'Semua toko'}`,
          `Total biaya: ${formatRupiah(campaign.totalSpend)}`,
        ],
      });
      if (!confirmed) return;
      setButtonLoading(button, true, 'Menghapus…');
      try {
        await services.advertisingService.deleteCampaign(campaign.id);
        showToast('Kampanye iklan dihapus.', 'success');
        context.navigate('/finance/ads');
      } catch (error) {
        setButtonLoading(button, false);
        showToast(error instanceof Error ? error.message : 'Kampanye gagal dihapus.', 'error');
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

export const adCampaignFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? null;
  const isEdit = id !== null;
  root.innerHTML = loadingBlock(isEdit ? 'Memuat kampanye…' : 'Menyiapkan formulir…');

  try {
    const [stores, campaign] = await Promise.all([
      services.storeService.listAll(),
      id ? services.advertisingService.getCampaign(id) : Promise.resolve(null),
    ]);
    if (context.signal.aborted) return;
    context.setTitle(isEdit ? 'Ubah kampanye iklan' : 'Kampanye iklan baru');

    const activeStores = stores.filter((store) => store.status === 'active');
    const queryStoreId = context.query.get('storeId');
    const selectedStoreId =
      campaign?.storeId ??
      (queryStoreId && activeStores.some((store) => store.id === queryStoreId) ? queryStoreId : '');

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Iklan',
        title: isEdit ? 'Ubah kampanye iklan' : 'Kampanye iklan baru',
        subtitle: 'Kampanye mengelompokkan biaya iklan dan menyimpan platform serta toko terkait.',
        actions: `<a class="btn btn-secondary" href="#${isEdit && id ? `/finance/ads/${id}` : '/finance/ads'}">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="ad-campaign-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail kampanye</h2>
            <p>Pilih toko bila biaya iklan dapat dialokasikan. Kampanye tanpa toko dihitung sebagai biaya bersama.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'name',
              label: 'Nama kampanye',
              value: campaign?.name ?? '',
              required: true,
              placeholder: 'Contoh: Shopee Ads Seragam Sekolah',
              idPrefix: 'ad-campaign',
              span: true,
            })}
            ${formField({
              name: 'platform',
              label: 'Platform',
              type: 'select',
              value: campaign?.platform ?? 'shopee',
              required: true,
              options: AD_PLATFORMS.map((platform) => ({
                value: platform,
                label: AD_PLATFORM_LABELS[platform],
              })),
              idPrefix: 'ad-campaign',
            })}
            ${formField({
              name: 'storeId',
              label: 'Toko terkait',
              type: 'select',
              value: selectedStoreId,
              options: storeSelectOptions(activeStores, selectedStoreId, {
                allLabel: 'Semua toko (biaya bersama)',
              }),
              help: 'Kosongkan untuk kampanye lintas toko.',
              idPrefix: 'ad-campaign',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: campaign?.notes ?? '',
              rows: 3,
              placeholder: 'Tujuan kampanye, target audiens, atau catatan lain…',
              idPrefix: 'ad-campaign',
              span: true,
            })}
          </div>
        </div>

        ${formActions(isEdit ? 'Simpan perubahan' : 'Simpan kampanye', {
          submitIcon: 'save',
          cancelHref: `#${isEdit && id ? `/finance/ads/${id}` : '/finance/ads'}`,
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#ad-campaign-form');
    if (!form) throw new Error('Formulir kampanye tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const input: AdvertisingCampaignInput = {
          name: readText(form, 'name'),
          platform: readText(form, 'platform') as AdPlatform,
          storeId: readText(form, 'storeId') || null,
          notes: readOptionalText(form, 'notes'),
        };
        if (isEdit && id) {
          await services.advertisingService.updateCampaign(id, input);
        } else {
          await services.advertisingService.createCampaign(input);
        }
        showToast(isEdit ? 'Kampanye diperbarui.' : 'Kampanye iklan dibuat.', 'success');
        context.navigate('/finance/ads');
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Kampanye gagal disimpan.', 'error');
        }
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

export const adExpenseListPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat biaya iklan…');

  try {
    const filters = readListFilters(context.query);
    const campaignId = context.query.get('campaignId');
    const page = readPositiveInt(context.query.get('page'));
    const [stores, campaignList, expensePage] = await Promise.all([
      services.storeService.listAll(),
      services.advertisingService.listCampaigns(filters.storeId),
      services.advertisingService.listExpenses({
        storeId: filters.storeId,
        campaignId,
        from: filters.period.from,
        to: filters.period.to,
        page,
        pageSize: 30,
      }),
    ]);
    if (context.signal.aborted) return;
    context.setTitle('Biaya iklan');

    const pageSpend = expensePage.items.reduce((total, expense) => total + expense.amount, 0);
    const hasFilters =
      filters.storeId !== null ||
      filters.period.preset !== 'thisMonth' ||
      campaignId !== null;

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Iklan',
        title: 'Biaya iklan',
        subtitle: `${formatNumber(expensePage.total)} catatan pada filter aktif. Metrik ROAS/ACOS per baris dihitung dari atribusi yang diisi.`,
        actions: `
          ${linkButton('/finance/ads', 'Kampanye', 'btn btn-secondary', 'megaphone')}
          ${linkButton(addExpenseHref(campaignId), 'Catat biaya', 'btn btn-primary', 'plus')}
        `,
      })}

      ${listFilterHtml(filters, stores)}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="ad-campaign-filter">Kampanye</label>
          <select class="input select" id="ad-campaign-filter" data-campaign-filter>
            <option value="">Semua kampanye</option>
            ${campaignList
              .map(
                (campaign) =>
                  `<option value="${escapeAttr(campaign.id)}" ${campaign.id === campaignId ? 'selected' : ''}>${escapeHtml(campaign.name)}</option>`,
              )
              .join('')}
          </select>
        </div>
        <div class="filter-control">
          <span class="filter-label">Total halaman</span>
          <div class="filter-static">${formatRupiah(pageSpend)}</div>
        </div>
        ${hasFilters ? `<a class="filter-reset" href="#/finance/ads/expenses">${icon('x')} Reset</a>` : ''}
      </div>

      ${
        expensePage.items.length > 0
          ? card({
              padded: false,
              body: dataTable(
                ['Tanggal', 'Kampanye', 'Toko', 'Biaya', 'Impression', 'Click', 'Pesanan', 'Omzet atribusi', 'ROAS', 'ACOS', ''],
                expensePage.items.map((expense) => {
                  const roas =
                    expense.attributedRevenue !== null && expense.amount > 0
                      ? expense.attributedRevenue / expense.amount
                      : null;
                  const acos =
                    expense.attributedRevenue !== null && expense.attributedRevenue > 0
                      ? (expense.amount / expense.attributedRevenue) * 100
                      : null;
                  return [
                    formatBusinessDate(expense.expenseDate),
                    `<a class="table-link" href="#/finance/ads/${expense.campaignId}">${escapeHtml(expense.campaignName)}</a><span class="table-sub">${AD_PLATFORM_LABELS[expense.platform]}</span>`,
                    expense.storeName ? escapeHtml(expense.storeName) : '<span class="badge badge-primary">Bersama</span>',
                    `<span class="table-strong">${formatRupiah(expense.amount)}</span>`,
                    expense.impressions === null ? '—' : formatNumber(expense.impressions),
                    expense.clicks === null ? '—' : formatNumber(expense.clicks),
                    expense.attributedOrders === null ? '—' : formatNumber(expense.attributedOrders),
                    expense.attributedRevenue === null ? '<span class="muted">N/A</span>' : formatRupiah(expense.attributedRevenue),
                    roas === null ? 'N/A' : `${roas.toFixed(2)}×`,
                    acosLabel(acos),
                    `<div class="table-actions">
                      <a class="btn btn-ghost btn-sm" href="#/finance/ads/expenses/${expense.id}/edit">Ubah</a>
                      <button type="button" class="btn btn-ghost btn-icon" data-delete-expense="${escapeAttr(expense.id)}" aria-label="Hapus biaya iklan" title="Hapus biaya iklan">${icon('trash')}</button>
                    </div>`,
                  ];
                }),
              ),
            })
          : card({
              body: emptyState({
                iconName: hasFilters ? 'search' : 'receipt',
                title: hasFilters ? 'Biaya iklan tidak ditemukan' : 'Belum ada biaya iklan',
                description: hasFilters
                  ? 'Tidak ada biaya iklan pada filter ini. Ubah periode, toko, atau kampanye.'
                  : 'Buat kampanye lebih dahulu, lalu catat pengeluaran iklan harian beserta metrik opsional.',
                action: hasFilters
                  ? `<a class="btn btn-secondary" href="#/finance/ads/expenses">${icon('refresh-cw')}<span>Reset filter</span></a>`
                  : linkButton('/finance/ads/new', 'Buat kampanye', 'btn btn-primary', 'plus'),
              }),
            })
      }
      ${paginationBar({
        page: expensePage.page,
        pageSize: expensePage.pageSize,
        total: expensePage.total,
      })}
    `;

    bindListFilters(root, context);
    root.querySelector<HTMLSelectElement>('[data-campaign-filter]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      navigateQuery(context, { campaignId: target.value || null, page: null });
    });
    bindPagination(root, (nextPage) => {
      context.navigate(buildRoute(context.path, context.query, { page: nextPage }));
    });

    root.querySelectorAll<HTMLButtonElement>('[data-delete-expense]').forEach((button) => {
      button.addEventListener('click', async () => {
        const expenseId = button.dataset.deleteExpense ?? '';
        const expense = expensePage.items.find((item) => item.id === expenseId);
        if (!expense) return;
        const confirmed = await confirmDialog({
          title: 'Hapus biaya iklan?',
          message: `Biaya ${formatRupiah(expense.amount)} untuk kampanye "${expense.campaignName}" akan dihapus permanen.`,
          confirmLabel: 'Hapus biaya',
          tone: 'danger',
        });
        if (!confirmed) return;
        try {
          await services.advertisingService.deleteExpense(expenseId);
          showToast('Biaya iklan dihapus.', 'success');
          context.refresh();
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Biaya iklan gagal dihapus.', 'error');
        }
      });
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

export const adExpenseFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? null;
  const isEdit = id !== null;
  root.innerHTML = loadingBlock(isEdit ? 'Memuat biaya iklan…' : 'Menyiapkan formulir…');

  try {
    const [campaigns, expense] = await Promise.all([
      services.advertisingService.listCampaigns(),
      id ? services.advertisingService.getExpense(id) : Promise.resolve<AdvertisingExpenseListItem | null>(null),
    ]);
    if (context.signal.aborted) return;
    context.setTitle(isEdit ? 'Ubah biaya iklan' : 'Biaya iklan baru');

    if (campaigns.length === 0) {
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Iklan',
          title: isEdit ? 'Ubah biaya iklan' : 'Catat biaya iklan',
          actions: `<a class="btn btn-secondary" href="#/finance/ads">${icon('arrow-left')}<span>Kembali</span></a>`,
        })}
        ${card({
          body: emptyState({
            iconName: 'megaphone',
            title: 'Belum ada kampanye iklan',
            description: 'Biaya iklan harus terhubung ke kampanye. Buat kampanye terlebih dahulu.',
            action: linkButton('/finance/ads/new', 'Buat kampanye', 'btn btn-primary', 'plus'),
          }),
        })}
      `;
      refreshIcons(root);
      return;
    }

    const queryCampaignId = context.query.get('campaignId');
    const selectedCampaignId =
      expense?.campaignId ??
      (queryCampaignId && campaigns.some((campaign) => campaign.id === queryCampaignId)
        ? queryCampaignId
        : campaigns[0]?.id ?? '');
    const selectedCampaign = campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? campaigns[0];
    const campaignOptions = campaigns.map((campaign) => ({
      value: campaign.id,
      label: `${campaign.name} · ${AD_PLATFORM_LABELS[campaign.platform]}${campaign.storeName ? ` · ${campaign.storeName}` : ' · Semua toko'}`,
    }));

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Iklan',
        title: isEdit ? 'Ubah biaya iklan' : 'Catat biaya iklan',
        subtitle: selectedCampaign
          ? `${selectedCampaign.name} · ${AD_PLATFORM_LABELS[selectedCampaign.platform]}`
          : 'Catat pengeluaran iklan dan metrik atribusi opsional.',
        actions: `<a class="btn btn-secondary" href="#/finance/ads/expenses">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="ad-expense-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Pengeluaran iklan</h2>
            <p>Nominal wajib diisi. Impression, click, pesanan, dan omzet teratribusi opsional — kosongkan bila platform tidak menyediakannya.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'campaignId',
              label: 'Kampanye',
              type: 'select',
              value: selectedCampaignId,
              required: true,
              options: campaignOptions,
              idPrefix: 'ad-expense',
              span: true,
            })}
            ${formField({
              name: 'expenseDate',
              label: 'Tanggal',
              type: 'date',
              value: expense?.expenseDate ?? context.query.get('expenseDate') ?? todayJakarta(),
              required: true,
              idPrefix: 'ad-expense',
            })}
            ${formField({
              name: 'amount',
              label: 'Biaya iklan',
              type: 'money',
              value: expense ? String(expense.amount) : '',
              required: true,
              placeholder: '0',
              idPrefix: 'ad-expense',
            })}
            ${formField({
              name: 'impressions',
              label: 'Impression',
              type: 'integer',
              value: expense?.impressions === null || expense?.impressions === undefined ? '' : expense.impressions,
              placeholder: 'Opsional',
              idPrefix: 'ad-expense',
              help: 'Kosongkan bila tidak tersedia.',
            })}
            ${formField({
              name: 'clicks',
              label: 'Click',
              type: 'integer',
              value: expense?.clicks === null || expense?.clicks === undefined ? '' : expense.clicks,
              placeholder: 'Opsional',
              idPrefix: 'ad-expense',
              help: 'Kosongkan bila tidak tersedia.',
            })}
            ${formField({
              name: 'attributedOrders',
              label: 'Pesanan teratribusi',
              type: 'integer',
              value: expense?.attributedOrders === null || expense?.attributedOrders === undefined ? '' : expense.attributedOrders,
              placeholder: 'Opsional',
              idPrefix: 'ad-expense',
              help: 'Jumlah pesanan yang diklaim platform iklan.',
            })}
            ${formField({
              name: 'attributedRevenue',
              label: 'Omzet teratribusi',
              type: 'money',
              value: expense?.attributedRevenue === null || expense?.attributedRevenue === undefined ? '' : expense.attributedRevenue,
              placeholder: 'Opsional',
              idPrefix: 'ad-expense',
              help: 'Dipakai untuk ROAS dan ACOS. Tidak menambah omzet pesanan.',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: expense?.notes ?? '',
              rows: 3,
              placeholder: 'Nama iklan, targeting, atau catatan lain…',
              idPrefix: 'ad-expense',
              span: true,
            })}
          </div>
          <div class="form-info">
            ${icon('info')}
            <p>ROAS = omzet teratribusi ÷ biaya iklan. ACOS = biaya iklan ÷ omzet teratribusi × 100%. Keduanya N/A bila omzet teratribusi tidak diisi.</p>
          </div>
        </div>

        ${formActions(isEdit ? 'Simpan perubahan' : 'Simpan biaya', {
          submitIcon: 'save',
          cancelHref: '#/finance/ads/expenses',
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#ad-expense-form');
    if (!form) throw new Error('Formulir biaya iklan tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const input: AdvertisingExpenseInput = {
          campaignId: readText(form, 'campaignId'),
          expenseDate: readText(form, 'expenseDate'),
          amount: readMoney(form, 'amount', 'Biaya iklan', { required: true }),
          impressions: readOptionalInteger(form, 'impressions', 'Impression'),
          clicks: readOptionalInteger(form, 'clicks', 'Click'),
          attributedOrders: readOptionalInteger(form, 'attributedOrders', 'Pesanan teratribusi'),
          attributedRevenue: readOptionalMoney(form, 'attributedRevenue', 'Omzet teratribusi'),
          notes: readOptionalText(form, 'notes'),
        };
        if (isEdit && id) {
          await services.advertisingService.updateExpense(id, input);
        } else {
          await services.advertisingService.createExpense(input);
        }
        showToast(isEdit ? 'Biaya iklan diperbarui.' : 'Biaya iklan dicatat.', 'success');
        context.navigate('/finance/ads/expenses');
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Biaya iklan gagal disimpan.', 'error');
        }
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
