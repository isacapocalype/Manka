import type { PageRenderer } from '@/app/router';
import type { ImportTemplate, StorePlatform } from '@/types/entities';
import type { TabularData } from '@/core/import-export/spreadsheet';
import type {
  ImportExecutionResult,
  OrderImportMapping,
  OrderImportPreview,
} from '@/core/services/importService';
import {
  ORDER_IMPORT_FIELDS,
  autoDetectMapping,
  validateMapping,
} from '@/core/services/importService';
import { readTabularFile, ImportFileError } from '@/core/import-export/spreadsheet';
import { toCsv } from '@/core/import-export/csv';
import { saveFile } from '@/core/import-export/fileSaver';
import { ORDER_STATUS_LABELS } from '@/app/labels';
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
import { renderPageError } from '@/app/pageUtils';

type ImportStep = 1 | 2 | 3 | 4;

interface ImportState {
  step: ImportStep;
  storeId: string;
  tabular: TabularData | null;
  mapping: OrderImportMapping | null;
  preview: OrderImportPreview | null;
  result: ImportExecutionResult | null;
  templates: ImportTemplate[];
}

const TEMPLATE_HEADERS = [
  'orderId',
  'orderDate',
  'status',
  'productName',
  'sku',
  'quantity',
  'unitPrice',
  'hpp',
  'sellerDiscount',
  'marketplaceDiscount',
  'shippingPaid',
  'marketplaceFee',
  'refundAmount',
  'refundQuantity',
  'notes',
];

function stepIndicator(step: ImportStep): string {
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

function templateBarHtml(templates: ImportTemplate[]): string {
  return `
    <div class="inline-note">
      ${icon('clipboard-list')}
      <span>Pakai template yang tersimpan untuk marketplace ini, atau simpan mapping saat ini.</span>
    </div>
    <div class="form-grid">
      <div class="field">
        <label class="field-label" for="import-template">Template tersimpan</label>
        <select class="input select" id="import-template" data-template-select>
          <option value="">— Pilih template —</option>
          ${templates
            .map(
              (template) =>
                `<option value="${escapeAttr(template.id)}">${escapeHtml(template.name)} · ${escapeHtml(template.marketplace)}</option>`,
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

function formatCandidateItems(candidate: OrderImportPreview['candidates'][number]): string {
  const units = candidate.items.reduce((total, item) => total + item.quantity, 0);
  return `${formatNumber(candidate.items.length)} item · ${formatNumber(units)} unit`;
}

function candidateTotal(candidate: OrderImportPreview['candidates'][number]): number {
  return candidate.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}

function issueList(
  candidate: OrderImportPreview['candidates'][number],
  kind: 'issues' | 'warnings',
): string {
  const entries = candidate[kind];
  if (entries.length === 0) return '';
  return `<ul class="import-issue-list">${entries
    .map((entry) =>
      typeof entry === 'string'
        ? `<li>${escapeHtml(entry)}</li>`
        : `<li>Baris ${entry.rowNumber}: ${escapeHtml(entry.message)}</li>`,
    )
    .join('')}</ul>`;
}

export const orderImportPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Menyiapkan import pesanan…');

  try {
    const stores = await services.storeService.listAll();
    if (context.signal.aborted) return;
    context.setTitle('Import pesanan');

    const activeStores = stores.filter((store) => store.status === 'active');
    if (activeStores.length === 0) {
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Transaksi penjualan',
          title: 'Import pesanan',
          actions: `<a class="btn btn-secondary" href="#/orders">${icon('arrow-left')}<span>Kembali</span></a>`,
        })}
        ${card({
          body: emptyState({
            iconName: 'store',
            title: 'Belum ada toko aktif',
            description: 'Import pesanan membutuhkan toko tujuan. Tambahkan toko atau aktifkan kembali toko yang diarsipkan.',
            action: linkButton('/stores/new', 'Tambah toko', 'btn btn-primary', 'plus'),
          }),
        })}
      `;
      refreshIcons(root);
      return;
    }

    const requestedStore = context.query.get('storeId');
    const initialStoreId = activeStores.some((store) => store.id === requestedStore)
      ? (requestedStore as string)
      : (activeStores[0]?.id ?? '');
    const storePlatform = (storeId: string): StorePlatform =>
      activeStores.find((store) => store.id === storeId)?.platform ?? 'other';
    const initialTemplates = await services.importTemplateService
      .list('orders', storePlatform(initialStoreId))
      .catch(() => []);

    const state: ImportState = {
      step: 1,
      storeId: initialStoreId,
      tabular: null,
      mapping: null,
      preview: null,
      result: null,
      templates: initialTemplates,
    };

    const reset = (): void => {
      state.step = 1;
      state.tabular = null;
      state.mapping = null;
      state.preview = null;
      state.result = null;
      render();
    };

    const goToStep = (step: ImportStep): void => {
      state.step = step;
      render();
    };

    const reloadTemplates = async (): Promise<void> => {
      state.templates = await services.importTemplateService.list('orders', storePlatform(state.storeId));
    };

    const renderStepOne = (): string => {
      const currentName = state.tabular?.fileName ?? '';
      return `
        ${card({
          title: '1. Pilih toko dan file',
          subtitle: 'Format CSV atau XLSX. File diproses sepenuhnya di perangkat ini.',
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
                help: 'Seluruh pesanan pada file akan masuk ke toko ini. Nomor pesanan unik per toko.',
              })}
              <div class="field">
                <label class="field-label" for="import-file">File CSV / XLSX</label>
                <input class="input file-input" id="import-file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
                <p class="field-help">Maksimal 12 MB. Baris judul kolom harus berada di baris pertama.</p>
              </div>
            </div>
            ${
              currentName
                ? `<p class="inline-note">${icon('file-spreadsheet')} File siap diproses: <strong>${escapeHtml(currentName)}</strong>. Pilih file baru untuk menggantinya.</p>`
                : ''
            }
            <div class="wizard-actions">
              <button type="button" class="btn btn-ghost" data-download-template>${icon('download')}<span>Unduh template CSV</span></button>
              <span class="wizard-spacer"></span>
              <button type="button" class="btn btn-primary" data-next>${icon('arrow-right')}<span>Lanjut ke mapping</span></button>
            </div>
            <div class="form-info">
              ${icon('info')}
              <p>Kolom wajib: nomor pesanan, tanggal, status, kuantitas, dan harga satuan. Produk akan dicocokkan berdasarkan SKU atau nama. Pesanan dengan nomor yang sudah ada akan dilewati.</p>
            </div>
          `,
        })}
      `;
    };

    const renderStepTwo = (): string => {
      const tabular = state.tabular;
      const mapping = state.mapping;
      if (!tabular || !mapping) return '';
      const mappingErrors = validateMapping(mapping, tabular.headers);
      const previewRows = tabular.rows.slice(0, 5);
      return `
        ${card({
          title: '2. Petakan kolom',
          subtitle: `${formatNumber(tabular.rows.length)} baris data · ${formatNumber(tabular.headers.length)} kolom terdeteksi`,
          body: `
            ${errorBanner()}
            <p class="inline-note">${icon('file-spreadsheet')} <strong>${escapeHtml(tabular.fileName)}</strong></p>
            ${templateBarHtml(state.templates)}
            <div class="mapping-grid">
              ${ORDER_IMPORT_FIELDS.map(
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
              ).join('')}
            </div>
            ${mappingErrors.length > 0 ? `<div class="import-errors"><strong>Mapping belum lengkap</strong><ul>${mappingErrors.map((message) => `<li>${escapeHtml(message)}</li>`).join('')}</ul></div>` : ''}
            <details class="import-raw-preview">
              <summary>Lihat contoh ${previewRows.length} baris pertama</summary>
              <div class="table-wrap">
                <table class="data-table">
                  <thead><tr>${tabular.headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join('')}</tr></thead>
                  <tbody>
                    ${previewRows
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

    const renderStepThree = (): string => {
      const preview = state.preview;
      if (!preview) return '';
      const candidates = preview.candidates;
      const allIssues = [
        ...preview.ungroupedErrors.map(
          (issue) => `Baris ${issue.rowNumber}: ${issue.message}`,
        ),
        ...candidates.flatMap((candidate) =>
          candidate.issues.map((issue) => `Baris ${issue.rowNumber}: ${issue.message}`),
        ),
      ];
      const warnings = candidates.flatMap((candidate) => candidate.warnings);
      return `
        ${card({
          title: '3. Pratinjau import',
          subtitle: `${escapeHtml(preview.fileName)} · ${formatNumber(preview.totalRows)} baris`,
          body: `
            ${errorBanner()}
            <div class="kpi-grid kpi-grid-4">
              <div class="import-stat import-stat-success"><strong>${formatNumber(preview.validCount)}</strong><span>Pesanan siap</span></div>
              <div class="import-stat"><strong>${formatNumber(preview.successRows)}</strong><span>Baris akan disimpan</span></div>
              <div class="import-stat import-stat-warning"><strong>${formatNumber(preview.duplicateCount)}</strong><span>Duplikat dilewati</span></div>
              <div class="import-stat import-stat-danger"><strong>${formatNumber(preview.invalidCount)}</strong><span>Pesanan bermasalah</span></div>
            </div>
            ${
              preview.mappingErrors.length > 0
                ? `<div class="import-errors"><strong>Mapping tidak valid</strong><ul>${preview.mappingErrors.map((message) => `<li>${escapeHtml(message)}</li>`).join('')}</ul></div>`
                : ''
            }
            <div class="table-wrap import-preview-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th scope="col">Baris</th>
                    <th scope="col">Nomor pesanan</th>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Status</th>
                    <th scope="col">Item</th>
                    <th scope="col">Omzet</th>
                    <th scope="col">Hasil validasi</th>
                  </tr>
                </thead>
                <tbody>
                  ${candidates
                    .map((candidate) => {
                      const rowLabel =
                        candidate.rowNumbers.length > 1
                          ? `${candidate.rowNumbers[0]}–${candidate.rowNumbers[candidate.rowNumbers.length - 1]}`
                          : String(candidate.rowNumbers[0] ?? '');
                      const stateBadge = candidate.issues.length
                        ? '<span class="badge badge-danger">Bermasalah</span>'
                        : candidate.duplicate
                          ? '<span class="badge badge-warning">Duplikat</span>'
                          : '<span class="badge badge-success">Siap</span>';
                      const notes = [
                        issueList(candidate, 'issues'),
                        issueList(candidate, 'warnings'),
                      ]
                        .filter(Boolean)
                        .join('');
                      return `<tr class="${candidate.issues.length ? 'row-invalid' : candidate.duplicate ? 'row-muted' : ''}">
                        <td data-label="Baris">${escapeHtml(rowLabel)}</td>
                        <td data-label="Nomor pesanan"><code>${escapeHtml(candidate.orderId)}</code></td>
                        <td data-label="Tanggal">${candidate.orderDate ? formatBusinessDate(candidate.orderDate) : '<span class="value-negative">Tidak valid</span>'}</td>
                        <td data-label="Status">${candidate.issues.some((issue) => issue.message.includes('Status')) ? '<span class="value-negative">Tidak valid</span>' : ORDER_STATUS_LABELS[candidate.status]}</td>
                        <td data-label="Item">${formatCandidateItems(candidate)}</td>
                        <td data-label="Omzet">${formatRupiah(candidateTotal(candidate))}</td>
                        <td data-label="Hasil validasi">${stateBadge}${notes}</td>
                      </tr>`;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
            ${
              allIssues.length > 0
                ? `<details class="import-errors" open><summary>${formatNumber(allIssues.length)} pesan kesalahan</summary><ul class="import-issue-list">${allIssues
                    .slice(0, 200)
                    .map((message) => `<li>${escapeHtml(message)}</li>`)
                    .join('')}</ul>${allIssues.length > 200 ? `<p class="inline-note">Ditampilkan 200 pesan pertama.</p>` : ''}</details>`
                : ''
            }
            ${
              warnings.length > 0
                ? `<details class="import-warnings"><summary>${formatNumber(warnings.length)} peringatan produk/HPP</summary><ul class="import-issue-list">${warnings
                    .slice(0, 200)
                    .map((message) => `<li>${escapeHtml(message)}</li>`)
                    .join('')}</ul></details>`
                : ''
            }
            <div class="form-info">
              ${icon('shield-check')}
              <p>Hanya pesanan valid yang akan disimpan dalam satu transaksi database. Duplikat dan baris bermasalah tidak disimpan. Refund dan biaya marketplace pada file ikut dicatat sekali.</p>
            </div>
            <div class="wizard-actions">
              <button type="button" class="btn btn-secondary" data-back>${icon('arrow-left')}<span>Ubah mapping</span></button>
              <span class="wizard-spacer"></span>
              <button type="button" class="btn btn-primary" data-execute ${preview.validCount === 0 || preview.mappingErrors.length > 0 ? 'disabled' : ''}>${icon('upload')}<span>Import ${formatNumber(preview.validCount)} pesanan</span></button>
            </div>
          `,
        })}
      `;
    };

    const renderStepFour = (): string => {
      const result = state.result;
      if (!result) return '';
      return `
        ${card({
          title: '4. Hasil import',
          subtitle: 'Import selesai dan tersimpan di database lokal',
          body: `
            <div class="import-result-hero">
              <span class="import-result-icon">${icon('check')}</span>
              <div>
                <h2>${formatNumber(result.orderCount)} pesanan berhasil dibuat</h2>
                <p>${formatNumber(result.successRows)} baris tersimpan · ${formatNumber(result.skippedRows)} baris duplikat dilewati · ${formatNumber(result.failedRows)} baris gagal</p>
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
            ${
              result.warnings.length > 0
                ? `<details class="import-warnings"><summary>${formatNumber(result.warnings.length)} peringatan</summary><ul class="import-issue-list">${result.warnings
                    .slice(0, 200)
                    .map((message) => `<li>${escapeHtml(message)}</li>`)
                    .join('')}</ul></details>`
                : ''
            }
            <div class="wizard-actions">
              <button type="button" class="btn btn-secondary" data-restart>${icon('upload')}<span>Import file lain</span></button>
              <span class="wizard-spacer"></span>
              ${linkButton(`/orders?storeId=${encodeURIComponent(state.storeId)}`, 'Lihat pesanan toko', 'btn btn-secondary', 'shopping-bag')}
              ${linkButton('/orders/new', 'Tambah pesanan manual', 'btn btn-primary', 'plus')}
            </div>
          `,
        })}
      `;
    };

    const renderShell = (content: string): string => `
      ${pageHeader({
        eyebrow: 'Transaksi penjualan',
        title: 'Import pesanan',
        subtitle: 'Tarik data pesanan dari file CSV/XLSX marketplace. Tidak ada data yang dikirim ke internet.',
        actions: `<a class="btn btn-secondary" href="#/orders">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}
      ${stepIndicator(state.step)}
      <div class="wizard-panel">${content}</div>
    `;

    const bindEvents = (): void => {
      const storeSelect = root.querySelector<HTMLSelectElement>('[data-field="storeId"] select, select[name="storeId"]');
      storeSelect?.addEventListener('change', async () => {
        state.storeId = storeSelect.value;
        state.preview = null;
        try {
          await reloadTemplates();
        } catch {
          state.templates = [];
        }
      });

      root.querySelector<HTMLButtonElement>('[data-download-template]')?.addEventListener('click', async (event) => {
        const button = event.currentTarget as HTMLButtonElement;
        setButtonLoading(button, true, 'Menyiapkan…');
        try {
          const csv = toCsv(TEMPLATE_HEADERS, []);
          await saveFile('template-import-pesanan.csv', 'text/csv;charset=utf-8', csv);
          showToast('Template import berhasil dibuat.', 'success');
        } catch (error) {
          showToast(error instanceof Error ? error.message : 'Template gagal dibuat.', 'error');
        } finally {
          setButtonLoading(button, false);
        }
      });

      root.querySelector<HTMLButtonElement>('[data-back]')?.addEventListener('click', () => {
        if (state.step === 3) goToStep(2);
        else goToStep(1);
      });

      root.querySelector<HTMLButtonElement>('[data-restart]')?.addEventListener('click', reset);

      if (state.step === 1) {
        root.querySelector<HTMLButtonElement>('[data-next]')?.addEventListener('click', async (event) => {
          const button = event.currentTarget as HTMLButtonElement;
          clearError(root);
          const storeSelectValue = root.querySelector<HTMLSelectElement>('select[name="storeId"]');
          state.storeId = storeSelectValue?.value ?? '';
          if (!state.storeId) {
            setError(root, 'Pilih toko tujuan import terlebih dahulu.');
            return;
          }
          const fileInput = root.querySelector<HTMLInputElement>('#import-file');
          const file = fileInput?.files?.[0] ?? null;
          if (!file && !state.tabular) {
            setError(root, 'Pilih file CSV atau XLSX terlebih dahulu.');
            return;
          }
          setButtonLoading(button, true, 'Membaca file…');
          try {
            if (file) {
              state.tabular = await readTabularFile(file);
              state.mapping = autoDetectMapping(state.tabular.headers);
              state.preview = null;
            }
            if (!state.tabular || !state.mapping) {
              throw new ImportFileError('File tidak dapat dibaca.');
            }
            goToStep(2);
          } catch (error) {
            setButtonLoading(button, false);
            setError(root, error instanceof Error ? error.message : 'File gagal dibaca.');
          }
        });
      }

      if (state.step === 2 && state.mapping) {
        root.querySelector<HTMLButtonElement>('[data-apply-template]')?.addEventListener('click', () => {
          const templateId = root.querySelector<HTMLSelectElement>('[data-template-select]')?.value ?? '';
          const template = state.templates.find((item) => item.id === templateId);
          if (!template || !state.tabular) {
            setError(root, 'Pilih template tersimpan terlebih dahulu.');
            return;
          }
          state.mapping = services.importTemplateService.apply(
            template,
            state.tabular.headers,
          ) as OrderImportMapping;
          state.preview = null;
          render();
          showToast(`Template "${template.name}" diterapkan.`, 'success');
        });

        root.querySelector<HTMLButtonElement>('[data-save-template]')?.addEventListener('click', async (event) => {
          const button = event.currentTarget as HTMLButtonElement;
          const name = root.querySelector<HTMLInputElement>('[data-template-name]')?.value.trim() ?? '';
          if (!name || !state.mapping) {
            setError(root, 'Isi nama template terlebih dahulu.');
            return;
          }
          setButtonLoading(button, true, 'Menyimpan…');
          try {
            await services.importTemplateService.create({
              name,
              marketplace: storePlatform(state.storeId),
              importType: 'orders',
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
            const key = select.dataset.mapField as keyof OrderImportMapping;
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
          const mappingErrors = validateMapping(mapping, tabular.headers);
          if (mappingErrors.length > 0) {
            setError(root, mappingErrors.join(' '));
            return;
          }
          setButtonLoading(button, true, 'Memvalidasi…');
          try {
            state.preview = await services.importService.preview(tabular, mapping, state.storeId);
            goToStep(3);
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
            state.result = await services.importService.execute(preview);
            state.preview = null;
            goToStep(4);
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
