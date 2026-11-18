import type { PageRenderer } from '@/app/router';
import type { ImportTemplate, ImportType } from '@/types/entities';
import type { TabularData } from '@/core/import-export/spreadsheet';
import type { ImportMapping } from '@/core/import-export/importFields';
import {
  autoDetectMappingFor,
  importFieldsFor,
  validateMappingFor,
} from '@/core/import-export/importFields';
import { readTabularFile, ImportFileError } from '@/core/import-export/spreadsheet';
import { toCsv } from '@/core/import-export/csv';
import { saveFile } from '@/core/import-export/fileSaver';
import type {
  FeeImportPreview,
  FeeImportResult,
  SettlementImportPreview,
  SettlementImportResult,
} from '@/core/services/marketplaceImportService';
import { SETTLEMENT_STATUS_LABELS, FEE_TYPE_LABELS } from '@/app/labels';
import { formatBusinessDate } from '@/core/utils/date';
import { formatNumber, formatRupiah } from '@/core/utils/money';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  card,
  emptyState,
  formField,
  linkButton,
  loadingBlock,
  pageHeader,
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import { storeSelectOptions } from '@/components/ui/filters';
import { cashAccountChoices } from '@/modules/finance/cashUi';
import { renderPageError } from '@/app/pageUtils';

type Step = 1 | 2 | 3 | 4;
type ImportPreview = FeeImportPreview | SettlementImportPreview;
type ImportResult = FeeImportResult | SettlementImportResult;

interface PageConfig {
  importType: Extract<ImportType, 'fees' | 'settlements'>;
  eyebrow: string;
  title: string;
  description: string;
  backHref: string;
  fileName: string;
  nextHref: string;
  nextLabel: string;
}

interface WizardState {
  step: Step;
  storeId: string;
  accountId: string;
  tabular: TabularData | null;
  mapping: ImportMapping | null;
  preview: ImportPreview | null;
  result: ImportResult | null;
  templates: ImportTemplate[];
}

function isSettlementPreview(preview: ImportPreview): preview is SettlementImportPreview {
  return 'accountId' in preview;
}

function isSettlementResult(result: ImportResult): result is SettlementImportResult {
  return 'settlementCount' in result;
}

function stepIndicator(step: Step): string {
  const steps = [
    { number: 1, label: 'Pilih file' },
    { number: 2, label: 'Petakan kolom' },
    { number: 3, label: 'Pratinjau' },
    { number: 4, label: 'Hasil' },
  ];
  return `
    <ol class="wizard-steps" aria-label="Langkah import">
      ${steps
        .map(
          (item) => `
            <li class="wizard-step ${item.number === step ? 'is-active' : ''} ${item.number < step ? 'is-complete' : ''}">
              <span class="wizard-number">${item.number < step ? icon('check') : item.number}</span>
              <span>${item.label}</span>
            </li>
          `,
        )
        .join('')}
    </ol>
  `;
}

function errorBanner(): string {
  return `<p class="form-error" data-import-error hidden role="alert"></p>`;
}

function setError(root: HTMLElement, message: string): void {
  const banner = root.querySelector<HTMLElement>('[data-import-error]');
  if (!banner) {
    showToast(message, 'error');
    return;
  }
  banner.textContent = message;
  banner.hidden = false;
  banner.scrollIntoView({ block: 'nearest' });
}

function clearError(root: HTMLElement): void {
  const banner = root.querySelector<HTMLElement>('[data-import-error]');
  if (banner) {
    banner.textContent = '';
    banner.hidden = true;
  }
}

function issueList(issues: { rowNumber: number; message: string }[], warnings: string[]): string {
  const entries = [
    ...issues.map((issue) => `Baris ${issue.rowNumber}: ${issue.message}`),
    ...warnings,
  ];
  if (entries.length === 0) return '';
  return `<ul class="import-issue-list">${entries
    .slice(0, 50)
    .map((entry) => `<li>${escapeHtml(entry)}</li>`)
    .join('')}</ul>`;
}

function templateBarHtml(templates: ImportTemplate[], selectedId: string): string {
  return `
    <div class="inline-note">
      ${icon('clipboard-list')}
      <span>Pakai template yang tersimpan untuk marketplace dan jenis ini, atau simpan mapping saat ini.</span>
    </div>
    <div class="form-grid">
      <div class="field">
        <label class="field-label" for="import-template">Template tersimpan</label>
        <select class="input select" id="import-template" data-template-select>
          <option value="">— Pilih template —</option>
          ${templates
            .map(
              (template) =>
                `<option value="${escapeAttr(template.id)}" ${template.id === selectedId ? 'selected' : ''}>${escapeHtml(template.name)} · ${escapeHtml(template.marketplace)}</option>`,
            )
            .join('')}
        </select>
      </div>
      <div class="field">
        <label class="field-label" for="template-save-name">Simpan mapping saat ini</label>
        <div class="inline-actions">
          <input class="input" id="template-save-name" data-template-name placeholder="Nama template" maxlength="100" />
          <button type="button" class="btn btn-secondary" data-save-template>${icon('save')}<span>Simpan</span></button>
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-ghost" data-apply-template ${templates.length === 0 ? 'disabled' : ''}>${icon('refresh-cw')}<span>Pakai template terpilih</span></button>
  `;
}

function createMarketplaceImportPage(config: PageConfig): PageRenderer {
  return async (context) => {
    const { root, services } = context;
    root.innerHTML = loadingBlock(`Menyiapkan ${config.title.toLowerCase()}…`);

    try {
      const [stores, cashAccounts] = await Promise.all([
        services.storeService.listAll(),
        config.importType === 'settlements'
          ? services.cashService.listForSelect()
          : Promise.resolve([]),
      ]);
      if (context.signal.aborted) return;
      context.setTitle(config.title);

      const activeStores = stores.filter((store) => store.status === 'active');
      if (activeStores.length === 0) {
        root.innerHTML = `
          ${pageHeader({
            eyebrow: config.eyebrow,
            title: config.title,
            actions: `<a class="btn btn-secondary" href="#${config.backHref}">${icon('arrow-left')}<span>Kembali</span></a>`,
          })}
          ${card({
            body: emptyState({
              iconName: 'store',
              title: 'Belum ada toko aktif',
              description: 'Import membutuhkan toko tujuan. Tambahkan toko atau aktifkan kembali toko yang diarsipkan.',
              action: linkButton('/stores/new', 'Tambah toko', 'btn btn-primary', 'plus'),
            }),
          })}
        `;
        refreshIcons(root);
        return;
      }

      const requestedStore = context.query.get('storeId');
      const initialStore = activeStores.find((store) => store.id === requestedStore) ?? activeStores[0]!;
      const loadTemplates = async (): Promise<ImportTemplate[]> =>
        services.importTemplateService.list(config.importType, initialStore.platform).catch(() => []);

      const state: WizardState = {
        step: 1,
        storeId: initialStore.id,
        accountId: '',
        tabular: null,
        mapping: null,
        preview: null,
        result: null,
        templates: await loadTemplates(),
      };

      const currentStore = () => stores.find((store) => store.id === state.storeId) ?? initialStore;
      const reloadTemplates = async (): Promise<void> => {
        state.templates = await services.importTemplateService.list(
          config.importType,
          currentStore().platform,
        );
      };

      const renderStepOne = (): string => `
        ${card({
          title: '1. Pilih toko dan file',
          subtitle: 'Format CSV atau XLSX. Seluruh proses berlangsung di perangkat ini.',
          body: `
            ${errorBanner()}
            <div class="form-grid">
              ${formField({
                name: 'storeId',
                label: 'Toko tujuan',
                type: 'select',
                value: state.storeId,
                required: true,
                options: storeSelectOptions(activeStores, state.storeId),
                idPrefix: 'import',
                help: `Data pada file akan disimpan untuk toko ini. Marketplace template: ${currentStore().platform}.`,
              })}
              ${
                config.importType === 'settlements'
                  ? formField({
                      name: 'accountId',
                      label: 'Rekening tujuan pencairan',
                      type: 'select',
                      value: state.accountId,
                      options: cashAccountChoices(cashAccounts, state.accountId || null, {
                        allLabel: '— Tidak diisi (hanya settlement pending) —',
                      }),
                      idPrefix: 'import',
                      help: 'Wajib dipilih bila laporan berisi settlement berstatus diterima.',
                    })
                  : ''
              }
              <div class="field">
                <label class="field-label" for="import-file">File CSV / XLSX</label>
                <input class="input file-input" id="import-file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
                <p class="field-help">Maksimal 12 MB. Baris judul kolom harus berada di baris pertama.</p>
              </div>
            </div>
            ${
              state.tabular
                ? `<p class="inline-note">${icon('file-spreadsheet')} File siap diproses: <strong>${escapeHtml(state.tabular.fileName)}</strong>.</p>`
                : ''
            }
            <div class="wizard-actions">
              <button type="button" class="btn btn-ghost" data-download-template>${icon('download')}<span>Unduh template CSV</span></button>
              <span class="wizard-spacer"></span>
              <button type="button" class="btn btn-primary" data-next>${icon('arrow-right')}<span>Lanjut ke mapping</span></button>
            </div>
            <div class="form-info">
              ${icon('info')}
              <p>${escapeHtml(config.description)} Gunakan template mapping yang tersimpan agar kolom dengan format sama tidak perlu dipetakan ulang.</p>
            </div>
          `,
        })}
      `;

      const renderStepTwo = (): string => {
        const tabular = state.tabular;
        const mapping = state.mapping;
        if (!tabular || !mapping) return '';
        const mappingErrors = validateMappingFor(mapping, tabular.headers, config.importType);
        return `
          ${card({
            title: '2. Petakan kolom',
            subtitle: `${formatNumber(tabular.rows.length)} baris data · ${formatNumber(tabular.headers.length)} kolom terdeteksi`,
            body: `
              ${errorBanner()}
              <p class="inline-note">${icon('file-spreadsheet')} <strong>${escapeHtml(tabular.fileName)}</strong></p>
              ${templateBarHtml(state.templates, '')}
              <div class="mapping-grid">
                ${importFieldsFor(config.importType)
                  .map(
                    (field) => `
                      <div class="field ${field.required ? 'field-required' : ''}" data-field="${field.key}">
                        <label class="field-label" for="map-${field.key}">
                          ${escapeHtml(field.label)}
                          ${field.required ? '<span class="required-mark" aria-hidden="true">*</span>' : '<span class="optional-mark">Opsional</span>'}
                        </label>
                        <select class="input select" id="map-${field.key}" data-map-field="${field.key}">
                          <option value="">— Tidak dipakai —</option>
                          ${tabular.headers
                            .map(
                              (header) =>
                                `<option value="${escapeAttr(header)}" ${mapping[field.key] === header ? 'selected' : ''}>${escapeHtml(header)}</option>`,
                            )
                            .join('')}
                        </select>
                        <p class="field-help">${escapeHtml(field.help)}</p>
                      </div>
                    `,
                  )
                  .join('')}
              </div>
              ${mappingErrors.length > 0 ? `<div class="import-errors"><strong>Mapping belum lengkap</strong><ul>${mappingErrors.map((message) => `<li>${escapeHtml(message)}</li>`).join('')}</ul></div>` : ''}
              <details class="import-raw-preview">
                <summary>Lihat contoh ${Math.min(5, tabular.rows.length)} baris pertama</summary>
                <div class="table-wrap">
                  <table class="data-table">
                    <thead><tr>${tabular.headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join('')}</tr></thead>
                    <tbody>
                      ${tabular.rows
                        .slice(0, 5)
                        .map(
                          (row) =>
                            `<tr>${row.values.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`,
                        )
                        .join('')}
                    </tbody>
                  </table>
                </div>
              </details>
              <div class="wizard-actions">
                <button type="button" class="btn btn-secondary" data-back>${icon('arrow-left')}<span>Kembali</span></button>
                <span class="wizard-spacer"></span>
                <button type="button" class="btn btn-primary" data-next ${mappingErrors.length > 0 ? 'disabled' : ''}>${icon('list-checks')}<span>Validasi dan pratinjau</span></button>
              </div>
            `,
          })}
        `;
      };

      const renderPreviewRows = (preview: ImportPreview): string => {
        if (isSettlementPreview(preview)) {
          return preview.candidates
            .map((candidate) => {
              const stateBadge = candidate.issues.length
                ? '<span class="badge badge-danger">Bermasalah</span>'
                : candidate.duplicate
                  ? '<span class="badge badge-warning">Duplikat</span>'
                  : '<span class="badge badge-success">Siap</span>';
              return `<tr class="${candidate.issues.length ? 'row-invalid' : candidate.duplicate ? 'row-muted' : ''}">
                <td data-label="Baris">${candidate.rowNumbers[0]}</td>
                <td data-label="No settlement"><code>${escapeHtml(candidate.settlementNo)}</code></td>
                <td data-label="Tanggal">${candidate.settlementDate ? formatBusinessDate(candidate.settlementDate) : '<span class="value-negative">Tidak valid</span>'}</td>
                <td data-label="Penjualan">${formatRupiah(candidate.grossSales)}</td>
                <td data-label="Potongan">${formatRupiah(candidate.totalDeductions)}</td>
                <td data-label="Pencairan">${formatRupiah(candidate.totalPayout)}</td>
                <td data-label="Status">${SETTLEMENT_STATUS_LABELS[candidate.status]}</td>
                <td data-label="Hasil validasi">${stateBadge}${issueList(candidate.issues, candidate.warnings)}</td>
              </tr>`;
            })
            .join('');
        }
        return preview.candidates
          .map((candidate) => {
            const stateBadge = candidate.issues.length
              ? '<span class="badge badge-danger">Bermasalah</span>'
              : candidate.duplicate
                ? '<span class="badge badge-warning">Duplikat</span>'
                : '<span class="badge badge-success">Siap</span>';
            return `<tr class="${candidate.issues.length ? 'row-invalid' : candidate.duplicate ? 'row-muted' : ''}">
              <td data-label="Baris">${candidate.rowNumbers[0]}</td>
              <td data-label="Pesanan"><code>${escapeHtml(candidate.marketplaceOrderId)}</code></td>
              <td data-label="Tanggal">${candidate.feeDate ? formatBusinessDate(candidate.feeDate) : '<span class="value-negative">Tidak valid</span>'}</td>
              <td data-label="Jenis">${FEE_TYPE_LABELS[candidate.feeType]}</td>
              <td data-label="Nominal">${formatRupiah(candidate.amount)}</td>
              <td data-label="Hasil validasi">${stateBadge}${issueList(candidate.issues, candidate.warnings)}</td>
            </tr>`;
          })
          .join('');
      };

      const previewHeaders = (): string[] =>
        isSettlement(config)
          ? ['Baris', 'No settlement', 'Tanggal', 'Penjualan', 'Potongan', 'Pencairan', 'Status', 'Hasil validasi']
          : ['Baris', 'Pesanan', 'Tanggal', 'Jenis', 'Nominal', 'Hasil validasi'];

      const renderStepThree = (): string => {
        const preview = state.preview;
        if (!preview) return '';
        const warnings = preview.warnings;
        const accountError = isSettlementPreview(preview) ? preview.accountError : null;
        const readyLabel = isSettlementPreview(preview) ? 'settlement' : 'biaya';
        return `
          ${card({
            title: '3. Pratinjau import',
            subtitle: `${escapeHtml(preview.fileName)} · ${formatNumber(preview.totalRows)} baris`,
            body: `
              ${errorBanner()}
              <div class="kpi-grid kpi-grid-4">
                <div class="import-stat import-stat-success"><strong>${formatNumber(preview.validCount)}</strong><span>${readyLabel} siap</span></div>
                <div class="import-stat"><strong>${formatNumber(preview.successRows)}</strong><span>Baris akan disimpan</span></div>
                <div class="import-stat import-stat-warning"><strong>${formatNumber(preview.duplicateCount)}</strong><span>Duplikat dilewati</span></div>
                <div class="import-stat import-stat-danger"><strong>${formatNumber(preview.invalidCount)}</strong><span>Bermasalah</span></div>
              </div>
              ${
                accountError
                  ? `<div class="import-errors"><strong>Rekening tujuan belum valid</strong><ul><li>${escapeHtml(accountError)}</li></ul></div>`
                  : ''
              }
              ${
                preview.mappingErrors.length > 0
                  ? `<div class="import-errors"><strong>Mapping tidak valid</strong><ul>${preview.mappingErrors.map((message) => `<li>${escapeHtml(message)}</li>`).join('')}</ul></div>`
                  : ''
              }
              <div class="table-wrap import-preview-table">
                <table class="data-table">
                  <thead><tr>${previewHeaders().map((header) => `<th scope="col">${header}</th>`).join('')}</tr></thead>
                  <tbody>${renderPreviewRows(preview)}</tbody>
                </table>
              </div>
              ${
                warnings.length > 0
                  ? `<details class="import-warnings" open><summary>${formatNumber(warnings.length)} peringatan</summary><ul class="import-issue-list">${warnings
                      .slice(0, 200)
                      .map((message) => `<li>${escapeHtml(message)}</li>`)
                      .join('')}</ul></details>`
                  : ''
              }
              <div class="form-info">
                ${icon('shield-check')}
                <p>Hanya baris valid yang disimpan dalam satu transaksi database. Duplikat dan baris bermasalah tidak disimpan. Settlement diterima otomatis mencatat kas masuk ke rekening tujuan.</p>
              </div>
              <div class="wizard-actions">
                <button type="button" class="btn btn-secondary" data-back>${icon('arrow-left')}<span>Ubah mapping</span></button>
                <span class="wizard-spacer"></span>
                <button type="button" class="btn btn-primary" data-execute ${preview.validCount === 0 || preview.mappingErrors.length > 0 || accountError ? 'disabled' : ''}>${icon('upload')}<span>Import ${formatNumber(preview.validCount)} ${readyLabel}</span></button>
              </div>
            `,
          })}
        `;
      };

      const renderStepFour = (): string => {
        const result = state.result;
        if (!result) return '';
        const count = isSettlementResult(result) ? result.settlementCount : result.feeCount;
        const noun = isSettlementResult(result) ? 'settlement' : 'biaya marketplace';
        return `
          ${card({
            title: '4. Hasil import',
            subtitle: 'Import tersimpan di database lokal',
            body: `
              <div class="import-result-hero">
                <span class="import-result-icon">${icon('check')}</span>
                <div>
                  <h2>${formatNumber(count)} ${noun} berhasil dibuat</h2>
                  <p>${formatNumber(result.successRows)} baris tersimpan · ${formatNumber(result.skippedRows)} duplikat dilewati · ${formatNumber(result.failedRows)} baris gagal</p>
                </div>
              </div>
              <dl class="detail-list">
                <div><dt>ID batch</dt><dd><code>${escapeHtml(result.batchId)}</code></dd></div>
                <div><dt>Total baris file</dt><dd>${formatNumber(result.totalRows)}</dd></div>
                <div><dt>Peringatan</dt><dd>${formatNumber(result.warnings.length)}</dd></div>
              </dl>
              ${
                result.issues.length > 0
                  ? `<details class="import-errors"><summary>${formatNumber(result.issues.length)} baris gagal</summary><ul class="import-issue-list">${result.issues
                      .slice(0, 200)
                      .map((issue) => `<li>Baris ${issue.rowNumber}: ${escapeHtml(issue.message)}</li>`)
                      .join('')}</ul></details>`
                  : ''
              }
              <div class="wizard-actions">
                <button type="button" class="btn btn-secondary" data-restart>${icon('upload')}<span>Import file lain</span></button>
                <span class="wizard-spacer"></span>
                ${linkButton(config.nextHref, config.nextLabel, 'btn btn-primary', 'arrow-right')}
              </div>
            `,
          })}
        `;
      };

      const renderShell = (content: string): string => `
        ${pageHeader({
          eyebrow: config.eyebrow,
          title: config.title,
          subtitle: config.description,
          actions: `<a class="btn btn-secondary" href="#${config.backHref}">${icon('arrow-left')}<span>Kembali</span></a>`,
        })}
        ${stepIndicator(state.step)}
        <div class="wizard-panel">${content}</div>
      `;

      const bindEvents = (): void => {
        root.querySelector<HTMLSelectElement>('select[name="storeId"]')?.addEventListener('change', async (event) => {
          state.storeId = (event.currentTarget as HTMLSelectElement).value;
          state.preview = null;
          try {
            await reloadTemplates();
          } catch {
            state.templates = [];
          }
          if (state.step === 2) render();
        });

        root.querySelector<HTMLSelectElement>('select[name="accountId"]')?.addEventListener('change', (event) => {
          state.accountId = (event.currentTarget as HTMLSelectElement).value;
          state.preview = null;
        });

        root.querySelector<HTMLButtonElement>('[data-download-template]')?.addEventListener('click', async (event) => {
          const button = event.currentTarget as HTMLButtonElement;
          setButtonLoading(button, true, 'Menyiapkan…');
          try {
            const headers = importFieldsFor(config.importType).map((field) => field.key);
            await saveFile(config.fileName, 'text/csv;charset=utf-8', toCsv(headers, []));
            showToast('Template CSV berhasil dibuat.', 'success');
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Template gagal dibuat.', 'error');
          } finally {
            setButtonLoading(button, false);
          }
        });

        root.querySelector<HTMLButtonElement>('[data-back]')?.addEventListener('click', () => {
          state.step = state.step === 3 ? 2 : 1;
          render();
        });

        root.querySelector<HTMLButtonElement>('[data-restart]')?.addEventListener('click', () => {
          state.step = 1;
          state.tabular = null;
          state.mapping = null;
          state.preview = null;
          state.result = null;
          render();
        });

        if (state.step === 1) {
          root.querySelector<HTMLButtonElement>('[data-next]')?.addEventListener('click', async (event) => {
            const button = event.currentTarget as HTMLButtonElement;
            clearError(root);
            if (!state.storeId) {
              setError(root, 'Pilih toko tujuan import terlebih dahulu.');
              return;
            }
            const file = root.querySelector<HTMLInputElement>('#import-file')?.files?.[0] ?? null;
            if (!file && !state.tabular) {
              setError(root, 'Pilih file CSV atau XLSX terlebih dahulu.');
              return;
            }
            setButtonLoading(button, true, 'Membaca file…');
            try {
              if (file) {
                state.tabular = await readTabularFile(file);
                state.mapping = autoDetectMappingFor(state.tabular.headers, config.importType);
                state.preview = null;
              }
              if (!state.tabular || !state.mapping) throw new ImportFileError('File tidak dapat dibaca.');
              state.step = 2;
              render();
            } catch (error) {
              setButtonLoading(button, false);
              setError(root, error instanceof Error ? error.message : 'File gagal dibaca.');
            }
          });
        }

        if (state.step === 2 && state.mapping) {
          root.querySelector<HTMLButtonElement>('[data-apply-template]')?.addEventListener('click', async () => {
            const id = root.querySelector<HTMLSelectElement>('[data-template-select]')?.value ?? '';
            const template = state.templates.find((item) => item.id === id);
            if (!template || !state.tabular) {
              setError(root, 'Pilih template tersimpan terlebih dahulu.');
              return;
            }
            state.mapping = services.importTemplateService.apply(template, state.tabular.headers);
            state.preview = null;
            render();
            showToast(`Template "${template.name}" diterapkan.`, 'success');
          });

          root.querySelector<HTMLButtonElement>('[data-save-template]')?.addEventListener('click', async (event) => {
            const button = event.currentTarget as HTMLButtonElement;
            const nameInput = root.querySelector<HTMLInputElement>('[data-template-name]');
            const name = nameInput?.value.trim() ?? '';
            if (!name || !state.mapping) {
              setError(root, 'Isi nama template terlebih dahulu.');
              return;
            }
            setButtonLoading(button, true, 'Menyimpan…');
            try {
              await services.importTemplateService.create({
                name,
                marketplace: currentStore().platform,
                importType: config.importType,
                mapping: state.mapping,
              });
              await reloadTemplates();
              render();
              showToast('Template mapping disimpan.', 'success');
            } catch (error) {
              setButtonLoading(button, false);
              setError(root, error instanceof Error ? error.message : 'Template gagal disimpan.');
            }
          });

          root.querySelectorAll<HTMLSelectElement>('[data-map-field]').forEach((select) => {
            select.addEventListener('change', () => {
              if (!state.mapping) return;
              const key = select.dataset.mapField as keyof ImportMapping;
              state.mapping[key] = select.value === '' ? null : select.value;
              const errorBlock = root.querySelector<HTMLElement>('.import-errors');
              if (errorBlock) errorBlock.remove();
              const next = root.querySelector<HTMLButtonElement>('[data-next]');
              if (next) next.disabled = false;
            });
          });

          root.querySelector<HTMLButtonElement>('[data-next]')?.addEventListener('click', async (event) => {
            const button = event.currentTarget as HTMLButtonElement;
            const tabular = state.tabular;
            const mapping = state.mapping;
            if (!tabular || !mapping) return;
            clearError(root);
            const mappingErrors = validateMappingFor(mapping, tabular.headers, config.importType);
            if (mappingErrors.length > 0) {
              setError(root, mappingErrors.join(' '));
              return;
            }
            setButtonLoading(button, true, 'Memvalidasi…');
            try {
              state.preview =
                config.importType === 'fees'
                  ? await services.feeImportService.previewFees(tabular, mapping, state.storeId)
                  : await services.settlementImportService.previewSettlements(
                      tabular,
                      mapping,
                      state.storeId,
                      state.accountId || null,
                    );
              state.step = 3;
              render();
            } catch (error) {
              setButtonLoading(button, false);
              setError(root, error instanceof Error ? error.message : 'Pratinjau gagal dibuat.');
            }
          });
        }

        if (state.step === 3) {
          root.querySelector<HTMLButtonElement>('[data-execute]')?.addEventListener('click', async (event) => {
            const button = event.currentTarget as HTMLButtonElement;
            const preview = state.preview;
            if (!preview) return;
            clearError(root);
            setButtonLoading(button, true, 'Mengimpor…');
            try {
              state.result =
                isSettlementPreview(preview)
                  ? await services.settlementImportService.executeSettlements(preview)
                  : await services.feeImportService.executeFees(preview);
              state.preview = null;
              state.step = 4;
              render();
            } catch (error) {
              setButtonLoading(button, false);
              setError(root, error instanceof Error ? error.message : 'Import gagal disimpan.');
            }
          });
        }
      };

      const render = (): void => {
        let content = '';
        if (state.step === 1) content = renderStepOne();
        else if (state.step === 2) content = renderStepTwo();
        else if (state.step === 3) content = renderStepThree();
        else content = renderStepFour();
        root.innerHTML = renderShell(content);
        bindEvents();
        refreshIcons(root);
      };

      render();
    } catch (error) {
      renderPageError(root, context, error);
    }
  };
}

function isSettlement(config: PageConfig): boolean {
  return config.importType === 'settlements';
}

export const feeImportPage: PageRenderer = createMarketplaceImportPage({
  importType: 'fees',
  eyebrow: 'Keuangan',
  title: 'Import biaya marketplace',
  description: 'Tarik laporan potongan marketplace menjadi biaya aktual yang terhubung ke pesanan.',
  backHref: '/finance/fees',
  fileName: 'template-import-biaya-marketplace.csv',
  nextHref: '/finance/fees',
  nextLabel: 'Lihat biaya marketplace',
});

export const settlementImportPage: PageRenderer = createMarketplaceImportPage({
  importType: 'settlements',
  eyebrow: 'Keuangan',
  title: 'Import settlement',
  description: 'Tarik laporan pencairan marketplace. Settlement diterima otomatis menambah saldo rekening tujuan.',
  backHref: '/finance/settlements',
  fileName: 'template-import-settlement.csv',
  nextHref: '/finance/settlements',
  nextLabel: 'Lihat settlement',
});
