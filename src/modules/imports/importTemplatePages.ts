import type { PageRenderer } from '@/app/router';
import type {
  ImportMappingValues,
  ImportTemplate,
  ImportType,
  StorePlatform,
} from '@/types/entities';
import { IMPORT_TYPES, STORE_PLATFORMS } from '@/types/entities';
import { importFieldsFor } from '@/core/import-export/importFields';
import {
  IMPORT_TYPE_LABELS,
  STORE_PLATFORM_LABELS,
  labelForImportType,
} from '@/app/labels';
import { formatDateTime } from '@/core/utils/date';
import { formatNumber } from '@/core/utils/money';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  applyFormErrors,
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
  readText,
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import { buildRoute } from '@/components/ui/filters';
import { renderPageError } from '@/app/pageUtils';

function parseType(value: string | null): ImportType | 'all' {
  return value && IMPORT_TYPES.includes(value as ImportType) ? (value as ImportType) : 'all';
}

function parseMarketplace(value: string | null): StorePlatform | 'all' {
  return value && STORE_PLATFORMS.includes(value as StorePlatform)
    ? (value as StorePlatform)
    : 'all';
}

function typeOptions(): { value: string; label: string }[] {
  return [
    { value: 'all', label: 'Semua jenis' },
    ...IMPORT_TYPES.map((type) => ({
      value: type,
      label: IMPORT_TYPE_LABELS[type] ?? labelForImportType(type),
    })),
  ];
}

function marketplaceOptions(): { value: string; label: string }[] {
  return [
    { value: 'all', label: 'Semua marketplace' },
    ...STORE_PLATFORMS.map((platform) => ({
      value: platform,
      label: STORE_PLATFORM_LABELS[platform],
    })),
  ];
}

export const importTemplateListPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat template import…');

  try {
    const type = parseType(context.query.get('type'));
    const marketplace = parseMarketplace(context.query.get('marketplace'));
    const templates = await services.importTemplateService.list(
      type === 'all' ? undefined : type,
      marketplace === 'all' ? undefined : marketplace,
    );
    if (context.signal.aborted) return;
    context.setTitle('Template import');

    const hasFilters = type !== 'all' || marketplace !== 'all';
    const rows = templates.map((template) => {
      const mapped = Object.values(template.mapping).filter(Boolean).length;
      const required = importFieldsFor(template.importType).filter((field) => field.required);
      const complete = required.every((field) => Boolean(template.mapping[field.key]));
      return [
        `<a class="table-link" href="#/imports/templates/${template.id}/edit">${escapeHtml(template.name)}</a>`,
        STORE_PLATFORM_LABELS[template.marketplace],
        IMPORT_TYPE_LABELS[template.importType] ?? labelForImportType(template.importType),
        complete
          ? `${formatNumber(mapped)} kolom`
          : `<span class="badge badge-warning">${formatNumber(mapped)} kolom · belum lengkap</span>`,
        formatDateTime(template.updatedAt),
        `<div class="table-actions">
          <a class="btn btn-ghost btn-sm" href="#/imports/templates/${template.id}/edit">Ubah</a>
        </div>`,
      ];
    });

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Import',
        title: 'Template import',
        subtitle: 'Simpan pemetaan kolom per marketplace agar laporan dengan format sama tidak perlu dipetakan ulang.',
        actions: `
          ${linkButton('/orders/import', 'Import pesanan', 'btn btn-secondary', 'upload')}
          ${linkButton('/imports/templates/new', 'Tambah template', 'btn btn-primary', 'plus')}
        `,
      })}

      <div class="filter-bar">
        <div class="filter-control">
          <label class="filter-label" for="template-type">Jenis import</label>
          <select class="input select" id="template-type" data-template-type>
            ${typeOptions()
              .map(
                (option) =>
                  `<option value="${escapeAttr(option.value)}" ${option.value === type ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
              )
              .join('')}
          </select>
        </div>
        <div class="filter-control">
          <label class="filter-label" for="template-marketplace">Marketplace</label>
          <select class="input select" id="template-marketplace" data-template-marketplace>
            ${marketplaceOptions()
              .map(
                (option) =>
                  `<option value="${escapeAttr(option.value)}" ${option.value === marketplace ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
              )
              .join('')}
          </select>
        </div>
        ${hasFilters ? `<a class="filter-reset" href="#/imports/templates">${icon('x')} Reset</a>` : ''}
      </div>

      ${
        templates.length > 0
          ? card({
              title: 'Daftar template',
              subtitle: 'Template hanya menyimpan nama kolom, bukan data transaksi.',
              padded: false,
              body: dataTable(
                ['Nama template', 'Marketplace', 'Jenis import', 'Pemetaan', 'Diubah', ''],
                rows,
              ),
            })
          : card({
              body: emptyState({
                iconName: hasFilters ? 'search' : 'clipboard-list',
                title: hasFilters ? 'Template tidak ditemukan' : 'Belum ada template',
                description: hasFilters
                  ? 'Tidak ada template yang sesuai filter.'
                  : 'Buat template secara manual di sini, atau simpan pemetaan langsung dari wizard import pesanan, biaya, dan settlement.',
                action: hasFilters
                  ? `<a class="btn btn-secondary" href="#/imports/templates">${icon('refresh-cw')}<span>Reset filter</span></a>`
                  : linkButton('/imports/templates/new', 'Tambah template pertama', 'btn btn-primary', 'plus'),
              }),
            })
      }
    `;

    root
      .querySelector<HTMLSelectElement>('[data-template-type]')
      ?.addEventListener('change', (event) => {
        const value = (event.currentTarget as HTMLSelectElement).value;
        context.navigate(buildRoute(context.path, context.query, {
          type: value === 'all' ? null : value,
        }));
      });
    root
      .querySelector<HTMLSelectElement>('[data-template-marketplace]')
      ?.addEventListener('change', (event) => {
        const value = (event.currentTarget as HTMLSelectElement).value;
        context.navigate(buildRoute(context.path, context.query, {
          marketplace: value === 'all' ? null : value,
        }));
      });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};

function mappingGridHtml(type: ImportType, mapping: ImportMappingValues): string {
  return `
    <div class="mapping-grid" data-mapping-grid>
      ${importFieldsFor(type)
        .map(
          (field) => `
            <div class="field ${field.required ? 'field-required' : ''}" data-field="map-${field.key}">
              <label class="field-label" for="map-${field.key}">
                ${escapeHtml(field.label)}
                ${field.required ? '<span class="required-mark" aria-hidden="true">*</span>' : '<span class="optional-mark">Opsional</span>'}
              </label>
              <input class="input" id="map-${field.key}" name="map-${field.key}" type="text" value="${escapeAttr(mapping[field.key] ?? '')}" placeholder="Nama kolom di file, mis. Order ID" autocomplete="off" maxlength="200" />
              <p class="field-help">${escapeHtml(field.help)}</p>
              <p class="field-error" data-error-for="map-${field.key}"></p>
            </div>
          `,
        )
        .join('')}
    </div>
  `;
}

export const importTemplateFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? null;
  const isEdit = id !== null;
  root.innerHTML = loadingBlock(isEdit ? 'Memuat template…' : 'Menyiapkan formulir…');

  try {
    let template: ImportTemplate | null = null;
    if (id) template = await services.importTemplateService.get(id);
    if (context.signal.aborted) return;
    context.setTitle(isEdit ? 'Ubah template' : 'Template baru');

    const initialType: ImportType = template?.importType ?? 'orders';
    const initialMarketplace: StorePlatform = template?.marketplace ?? 'shopee';
    const initialMapping: ImportMappingValues = template?.mapping ?? {};
    let currentType: ImportType = initialType;
    const mappingsByType: Record<ImportType, ImportMappingValues> = {
      orders: initialType === 'orders' ? { ...initialMapping } : {},
      fees: initialType === 'fees' ? { ...initialMapping } : {},
      settlements: initialType === 'settlements' ? { ...initialMapping } : {},
    };

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Import',
        title: isEdit ? 'Ubah template import' : 'Tambah template import',
        subtitle: 'Tulis nama kolom persis seperti pada baris judul file CSV/XLSX marketplace.',
        actions: `<a class="btn btn-secondary" href="#/imports/templates">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="template-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Identitas template</h2>
            <p>Nama template unik untuk kombinasi marketplace dan jenis import.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'name',
              label: 'Nama template',
              value: template?.name ?? '',
              required: true,
              placeholder: 'Contoh: Shopee laporan biaya',
              help: 'Maksimal 100 karakter.',
              idPrefix: 'template',
            })}
            ${formField({
              name: 'marketplace',
              label: 'Marketplace',
              type: 'select',
              value: initialMarketplace,
              required: true,
              options: marketplaceOptions().slice(1),
              idPrefix: 'template',
            })}
            ${formField({
              name: 'importType',
              label: 'Jenis import',
              type: 'select',
              value: initialType,
              required: true,
              options: typeOptions().slice(1),
              help: 'Field yang tersedia di bawah menyesuaikan jenis import.',
              idPrefix: 'template',
            })}
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-head">
            <h2>Pemetaan kolom</h2>
            <p>Isi dengan nama kolom pada file. Biarkan kosong jika field tidak tersedia pada laporan.</p>
          </div>
          <div data-mapping-container>${mappingGridHtml(initialType, initialMapping)}</div>
          <div class="form-info">
            ${icon('info')}
            <p>Pemetaan tidak memeriksa isi file saat disimpan. Saat template dipakai, kolom yang tidak ditemukan pada file akan dikosongkan dan tetap divalidasi oleh wizard import.</p>
          </div>
        </div>

        ${formActions(isEdit ? 'Simpan perubahan' : 'Simpan template', {
          submitIcon: 'save',
          cancelHref: '#/imports/templates',
        })}
      </form>

      ${
        isEdit && template
          ? `
            ${card({
              title: 'Hapus template',
              body: `
                <div class="danger-zone danger-row">
                  <div>
                    <strong>Hapus template secara permanen</strong>
                    <p>Template akan dihapus dari penyimpanan. File laporan dan data yang sudah diimpor tidak terpengaruh.</p>
                  </div>
                  <button type="button" class="btn btn-danger btn-sm" data-delete-template>${icon('trash')}<span>Hapus template</span></button>
                </div>
              `,
            })}
          `
          : ''
      }
    `;

    const form = root.querySelector<HTMLFormElement>('#template-form');
    if (!form) throw new Error('Formulir template tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const mappingContainer = root.querySelector<HTMLElement>('[data-mapping-container]');
    const typeSelect = form.querySelector<HTMLSelectElement>('select[name="importType"]');

    const captureMapping = (): ImportMappingValues => {
      const mapping: ImportMappingValues = {};
      for (const field of importFieldsFor(currentType)) {
        mapping[field.key] = readText(form, `map-${field.key}`) || null;
      }
      mappingsByType[currentType] = mapping;
      return mapping;
    };

    typeSelect?.addEventListener('change', () => {
      if (!mappingContainer) return;
      captureMapping();
      currentType = typeSelect.value as ImportType;
      mappingContainer.innerHTML = mappingGridHtml(currentType, mappingsByType[currentType]);
      refreshIcons(mappingContainer);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const input = {
          name: readText(form, 'name'),
          marketplace: readText(form, 'marketplace') as StorePlatform,
          importType: readText(form, 'importType') as ImportType,
          mapping: captureMapping(),
        };
        if (isEdit && id) {
          await services.importTemplateService.update(id, input);
          showToast('Template diperbarui.', 'success');
        } else {
          await services.importTemplateService.create(input);
          showToast('Template dibuat.', 'success');
        }
        context.navigate('/imports/templates');
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
      }
    });

    root
      .querySelector<HTMLButtonElement>('[data-delete-template]')
      ?.addEventListener('click', async (event) => {
        if (!template) return;
        const button = event.currentTarget as HTMLButtonElement;
        const confirmed = await confirmDialog({
          title: 'Hapus template?',
          message: `Template "${template.name}" akan dihapus permanen.`,
          confirmLabel: 'Hapus template',
          tone: 'danger',
          requireText: template.name,
        });
        if (!confirmed) return;
        setButtonLoading(button, true, 'Menghapus…');
        try {
          await services.importTemplateService.delete(template.id);
          showToast('Template dihapus.', 'success');
          context.navigate('/imports/templates');
        } catch (error) {
          setButtonLoading(button, false);
          showToast(error instanceof Error ? error.message : 'Template gagal dihapus.', 'error');
        }
      });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
