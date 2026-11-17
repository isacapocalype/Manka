import type { PageRenderer } from '@/app/router';
import type { BackupRestoreResult } from '@/core/services/backupService';
import type { ImportBatch, ImportError } from '@/types/entities';
import { formatDateTime } from '@/core/utils/date';
import { formatNumber } from '@/core/utils/money';
import { ValidationError } from '@/core/utils/validation';
import { escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  badge,
  card,
  confirmDialog,
  dataTable,
  emptyState,
  pageHeader,
  showToast,
} from '@/components/ui/ui';
import { renderPageError } from '@/app/pageUtils';

const TABLE_LABELS: Record<string, string> = {
  app_settings: 'Pengaturan aplikasi',
  stores: 'Toko & profil',
  products: 'Produk',
  product_costs: 'Riwayat HPP',
  product_prices: 'Riwayat harga jual',
  orders: 'Pesanan',
  order_items: 'Item pesanan',
  marketplace_fees: 'Biaya marketplace',
  advertising_campaigns: 'Kampanye iklan',
  advertising_expenses: 'Biaya iklan',
  operational_expenses: 'Biaya operasional',
  refunds: 'Refund',
  settlements: 'Settlement',
  import_batches: 'Riwayat import',
  import_errors: 'Error import',
  audit_logs: 'Audit log',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Tambah',
  update: 'Ubah',
  delete: 'Hapus',
  backup: 'Backup',
  restore: 'Restore',
  reveal: 'Tampilkan sensitif',
  reveal_sensitive: 'Tampilkan sensitif',
  copy: 'Salin sensitif',
  import: 'Import',
  open: 'Buka aplikasi',
  update_status: 'Ubah status',
  archive: 'Arsipkan',
  restore_store: 'Aktifkan toko',
};

const ENTITY_LABELS: Record<string, string> = {
  store: 'Toko',
  product: 'Produk',
  order: 'Pesanan',
  marketplace_fee: 'Biaya marketplace',
  advertising_campaign: 'Kampanye iklan',
  advertising_expense: 'Biaya iklan',
  operational_expense: 'Biaya operasional',
  refund: 'Refund',
  settlement: 'Settlement',
  database: 'Database',
  app: 'Aplikasi',
};

function countRows(summary: BackupRestoreResult['tableCounts']): string {
  return Object.entries(summary)
    .filter(([, count]) => count > 0)
    .map(
      ([table, count]) =>
        `<div class="count-item"><span>${escapeHtml(TABLE_LABELS[table] ?? table)}</span><strong>${formatNumber(count)}</strong></div>`,
    )
    .join('');
}

function auditDetails(raw: string | null): string {
  if (!raw) return '<span class="muted">—</span>';
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return escapeHtml(raw);
    const entries = Object.entries(parsed as Record<string, unknown>).filter(
      ([key]) => !/password|secret|account/i.test(key),
    );
    if (entries.length === 0) return '<span class="muted">—</span>';
    return `<span class="table-note">${entries
      .map(([key, value]) => `${escapeHtml(key)}: ${escapeHtml(String(value))}`)
      .join(' · ')}</span>`;
  } catch {
    return `<span class="table-note">${escapeHtml(raw)}</span>`;
  }
}

function batchStatus(batch: ImportBatch): string {
  if (batch.failedRows > 0) {
    return badge(`${formatNumber(batch.failedRows)} gagal`, 'warning');
  }
  return badge('Berhasil', 'success');
}

function restoreSummary(result: BackupRestoreResult): string {
  return `
    <div class="backup-inspect">
      <div class="backup-inspect-head">
        <span class="import-result-icon">${icon('shield-check')}</span>
        <div>
          <strong>Backup valid dan dapat dipulihkan</strong>
          <p>Dibuat ${formatDateTime(result.createdAt)} · skema v${formatNumber(result.schemaVersion)} · aplikasi ${escapeHtml(result.appVersion)}</p>
        </div>
      </div>
      <div class="count-grid">${countRows(result.tableCounts)}</div>
      <p class="inline-note note-warning">${icon('triangle-alert')} Pemulihan akan mengganti seluruh data saat ini, termasuk profile toko dan riwayat transaksi. Buat backup terbaru sebelum melanjutkan.</p>
      <div class="backup-actions">
        <button type="button" class="btn btn-danger" data-restore-confirm disabled>${icon('database-backup')}<span>Pulihkan backup ini</span></button>
      </div>
    </div>
  `;
}

export const settingsPage: PageRenderer = async (context) => {
  const { root, services } = context;
  context.setTitle('Pengaturan');

  try {
    const batchId = context.query.get('batchId');
    const [counts, auditLogs, batches, importErrors] = await Promise.all([
      services.backupRepo.getDataCounts(),
      services.audit.list(40),
      services.imports.listBatches(25),
      batchId ? services.imports.listErrors(batchId, 200) : Promise.resolve<ImportError[]>([]),
    ]);
    if (context.signal.aborted) return;

    const selectedBatch = batchId
      ? batches.find((batch) => batch.id === batchId) ?? null
      : null;
    const totalRows =
      counts.stores +
      counts.products +
      counts.orders +
      counts.fees +
      counts.refunds +
      counts.settlements +
      counts.campaigns +
      counts.expenses +
      counts.operationalExpenses;

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Sistem',
        title: 'Pengaturan & data',
        subtitle: 'Backup terenkripsi, riwayat import, audit aktivitas, dan informasi keamanan data lokal.',
      })}

      <div class="settings-grid">
        ${card({
          title: 'Ringkasan data',
          subtitle: 'Seluruh data tersimpan di perangkat ini',
          body: `
            <div class="count-grid">
              <div class="count-item"><span>Toko</span><strong>${formatNumber(counts.stores)}</strong></div>
              <div class="count-item"><span>Produk</span><strong>${formatNumber(counts.products)}</strong></div>
              <div class="count-item"><span>Pesanan</span><strong>${formatNumber(counts.orders)}</strong></div>
              <div class="count-item"><span>Biaya marketplace</span><strong>${formatNumber(counts.fees)}</strong></div>
              <div class="count-item"><span>Refund</span><strong>${formatNumber(counts.refunds)}</strong></div>
              <div class="count-item"><span>Settlement</span><strong>${formatNumber(counts.settlements)}</strong></div>
              <div class="count-item"><span>Kampanye iklan</span><strong>${formatNumber(counts.campaigns)}</strong></div>
              <div class="count-item"><span>Biaya iklan</span><strong>${formatNumber(counts.expenses)}</strong></div>
              <div class="count-item"><span>Biaya operasional</span><strong>${formatNumber(counts.operationalExpenses)}</strong></div>
            </div>
            <p class="inline-note">${icon('database')} ${formatNumber(totalRows)} catatan inti tersimpan. Database berjalan offline; tidak ada sinkronisasi cloud.</p>
          `,
        })}

        ${card({
          title: 'Keamanan & privasi',
          body: `
            <ul class="settings-notes">
              <li>${icon('lock')} Kata sandi marketplace dan nomor rekening disimpan terenkripsi AES-GCM.</li>
              <li>${icon('eye-off')} Data sensitif hanya ditampilkan setelah tindakan pengguna dan tidak pernah masuk URL atau log.</li>
              <li>${icon('shield-alert')} Aplikasi tidak memiliki login. Siapa pun yang dapat membuka perangkat dan aplikasi berpotensi melihat data bisnis.</li>
              <li>${icon('file-lock')} Backup memuat profile toko dan dilindungi kata sandi yang hanya Anda ketahui.</li>
            </ul>
            <p class="inline-note">${icon('info')} Kunci enkripsi perangkat ikut tersimpan di backup agar profile dapat dibuka setelah restore. Jaga file backup tetap aman.</p>
          `,
        })}
      </div>

      <div class="settings-grid">
        ${card({
          title: 'Buat backup',
          subtitle: 'Salinan lengkap database dalam satu file terenkripsi',
          body: `
            <form id="backup-export-form" class="backup-form" novalidate>
              <div class="field">
                <label class="field-label" for="backup-password">Kata sandi backup <span class="required-mark" aria-hidden="true">*</span></label>
                <input class="input" id="backup-password" name="password" type="password" autocomplete="new-password" minlength="8" required />
                <p class="field-help">Minimal 8 karakter. Kata sandi ini diperlukan saat memulihkan backup.</p>
              </div>
              <div class="field">
                <label class="field-label" for="backup-password-confirm">Ulangi kata sandi <span class="required-mark" aria-hidden="true">*</span></label>
                <input class="input" id="backup-password-confirm" name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" required />
              </div>
              <p class="form-error" data-backup-error hidden role="alert"></p>
              <div class="form-info">
                ${icon('shield-check')}
                <p>File berisi seluruh data, termasuk profile toko terenkripsi, dan dapat disalin keluar aplikasi. Simpan di tempat aman.</p>
              </div>
              <div class="backup-actions">
                <button type="submit" class="btn btn-primary">${icon('download')}<span>Buat & simpan backup</span></button>
              </div>
            </form>
            <div data-backup-result></div>
          `,
        })}

        ${card({
          title: 'Pulihkan backup',
          subtitle: 'Validasi file sebelum menimpa data',
          body: `
            <div class="field">
              <label class="field-label" for="restore-file">File backup (.manka)</label>
              <input class="input file-input" id="restore-file" type="file" accept=".manka,.json,application/json" />
            </div>
            <div class="field">
              <label class="field-label" for="restore-password">Kata sandi backup</label>
              <input class="input" id="restore-password" type="password" autocomplete="current-password" />
            </div>
            <p class="form-error" data-restore-error hidden role="alert"></p>
            <div class="backup-actions">
              <button type="button" class="btn btn-secondary" data-restore-inspect>${icon('search')}<span>Periksa backup</span></button>
            </div>
            <div data-restore-result></div>
          `,
        })}
      </div>

      ${card({
        title: 'Riwayat import',
        subtitle: batches.length > 0 ? `${formatNumber(batches.length)} batch terakhir` : 'Belum ada import',
        actions: `<a class="btn btn-secondary btn-sm" href="#/orders/import">${icon('upload')}<span>Import pesanan</span></a>`,
        padded: batches.length === 0,
        body:
          batches.length === 0
            ? emptyState({
                compact: true,
                iconName: 'file-spreadsheet',
                title: 'Belum ada riwayat import',
                description: 'Import pesanan dari CSV/XLSX akan tercatat di sini beserta ringkasan baris berhasil dan gagal.',
                action: `<a class="btn btn-secondary btn-sm" href="#/orders/import">Buka import</a>`,
              })
            : dataTable(
                ['Tanggal', 'File', 'Jenis', 'Total', 'Berhasil', 'Dilewati', 'Gagal', 'Status', ''],
                batches.map((batch) => [
                  formatDateTime(batch.createdAt),
                  `<span class="table-strong">${escapeHtml(batch.fileName)}</span>`,
                  escapeHtml(batch.importType === 'orders' ? 'Pesanan' : batch.importType),
                  formatNumber(batch.totalRows),
                  formatNumber(batch.successRows),
                  formatNumber(batch.skippedRows),
                  formatNumber(batch.failedRows),
                  batchStatus(batch),
                  `<a class="btn btn-ghost btn-sm" href="#/settings?batchId=${encodeURIComponent(batch.id)}">Lihat error</a>`,
                ]),
              ) + (
                selectedBatch
                  ? `<div class="import-error-panel">
                      <div class="section-heading"><h2>Error batch ${escapeHtml(selectedBatch.fileName)}</h2><p>${formatNumber(importErrors.length)} error ditampilkan, maksimal 200 baris.</p></div>
                      ${
                        importErrors.length > 0
                          ? dataTable(
                              ['Baris', 'Pesan', 'Data mentah'],
                              importErrors.map((error) => [
                                formatNumber(error.rowNumber),
                                escapeHtml(error.message),
                                error.rawData
                                  ? `<code class="raw-data">${escapeHtml(error.rawData)}</code>`
                                  : '<span class="muted">—</span>',
                              ]),
                            )
                          : emptyState({
                              compact: true,
                              iconName: 'circle-check',
                              title: 'Tidak ada error tersimpan',
                              description: 'Batch ini tidak memiliki pesan error per baris.',
                            })
                      }
                      <a class="btn btn-secondary btn-sm" href="#/settings">${icon('x')}<span>Tutup detail</span></a>
                    </div>`
                  : ''
              ),
      })}

      ${card({
        title: 'Audit aktivitas',
        subtitle: 'Perubahan data penting dan akses data sensitif',
        padded: auditLogs.length === 0,
        body:
          auditLogs.length === 0
            ? emptyState({
                compact: true,
                iconName: 'history',
                title: 'Belum ada aktivitas tercatat',
                description: 'Audit log akan terisi saat data dibuat, diubah, dihapus, diekspor, atau dipulihkan.',
              })
            : dataTable(
                ['Waktu', 'Aksi', 'Entitas', 'ID', 'Detail'],
                auditLogs.map((log) => [
                  formatDateTime(log.createdAt),
                  `<span class="table-strong">${escapeHtml(ACTION_LABELS[log.action] ?? log.action)}</span>`,
                  escapeHtml(ENTITY_LABELS[log.entityType] ?? log.entityType),
                  log.entityId ? `<code>${escapeHtml(log.entityId.slice(0, 12))}…</code>` : '<span class="muted">—</span>',
                  auditDetails(log.details),
                ]),
              ),
      })}

      ${card({
        title: 'Tentang Manka',
        body: `
          <dl class="detail-list detail-list-3">
            <div><dt>Versi aplikasi</dt><dd>1.0.0</dd></div>
            <div><dt>Zona waktu</dt><dd>Asia/Jakarta</dd></div>
            <div><dt>Mata uang</dt><dd>IDR (Rupiah)</dd></div>
            <div><dt>Penyimpanan</dt><dd>SQLite lokal${services.db.backend === 'web' ? ' (mode browser pengembangan)' : ''}</dd></div>
            <div><dt>Jaringan</dt><dd>Offline-first, tanpa backend</dd></div>
            <div><dt>Format backup</dt><dd>.manka · PBKDF2 + AES-GCM</dd></div>
          </dl>
          <p class="inline-note">${icon('info')} Tanggal bisnis dihitung dengan zona waktu Asia/Jakarta. File ekspor dibuat langsung di perangkat.</p>
        `,
      })}
    `;

    const exportForm = root.querySelector<HTMLFormElement>('#backup-export-form');
    const exportResult = root.querySelector<HTMLElement>('[data-backup-result]');
    exportForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const passwordInput = exportForm.querySelector<HTMLInputElement>('input[name="password"]');
      const confirmInput = exportForm.querySelector<HTMLInputElement>('input[name="passwordConfirm"]');
      const errorBox = exportForm.querySelector<HTMLElement>('[data-backup-error]');
      const submit = exportForm.querySelector<HTMLButtonElement>('button[type="submit"]');
      const password = passwordInput?.value ?? '';
      const confirmation = confirmInput?.value ?? '';
      const fail = (message: string): void => {
        if (errorBox) {
          errorBox.textContent = message;
          errorBox.hidden = false;
        }
      };
      if (errorBox) errorBox.hidden = true;
      if (password.length < 8) {
        fail('Kata sandi backup minimal 8 karakter.');
        passwordInput?.focus();
        return;
      }
      if (password !== confirmation) {
        fail('Kata sandi dan konfirmasi tidak sama.');
        confirmInput?.focus();
        return;
      }
      if (!submit) return;
      submit.disabled = true;
      submit.innerHTML = `${icon('loader-circle', 'spin')}<span>Menyiapkan backup…</span>`;
      try {
        const result = await services.backupService.exportBackup(password);
        exportForm.reset();
        if (exportResult) {
          exportResult.innerHTML = `
            <div class="backup-success">
              <div class="backup-inspect-head">
                <span class="import-result-icon">${icon('circle-check')}</span>
                <div>
                  <strong>Backup berhasil dibuat</strong>
                  <p>${escapeHtml(result.fileName)} · ${result.method === 'share' ? 'dibagikan melalui dialog berbagi' : 'diunduh ke perangkat'}</p>
                </div>
              </div>
              <div class="count-grid">${countRows(result.tableCounts)}</div>
              <p class="inline-note">${icon('shield-check')} File dapat disalin keluar aplikasi. Simpan kata sandi terpisah dari file backup.</p>
            </div>
          `;
        }
        showToast('Backup berhasil dibuat.', 'success');
      } catch (error) {
        fail(error instanceof Error ? error.message : 'Backup gagal dibuat.');
        if (!(error instanceof ValidationError)) {
          showToast('Backup gagal dibuat.', 'error');
        }
      } finally {
        submit.disabled = false;
        submit.innerHTML = `${icon('download')}<span>Buat & simpan backup</span>`;
      }
    });

    const restoreFileInput = root.querySelector<HTMLInputElement>('#restore-file');
    const restorePasswordInput = root.querySelector<HTMLInputElement>('#restore-password');
    const restoreResult = root.querySelector<HTMLElement>('[data-restore-result]');
    const restoreError = root.querySelector<HTMLElement>('[data-restore-error]');
    const inspectButton = root.querySelector<HTMLButtonElement>('[data-restore-inspect]');
    let inspectedFile: File | null = null;
    let inspectedPassword = '';

    const clearInspection = (): void => {
      inspectedFile = null;
      inspectedPassword = '';
      if (restoreResult) restoreResult.innerHTML = '';
    };

    restoreFileInput?.addEventListener('change', clearInspection);
    restorePasswordInput?.addEventListener('input', clearInspection);

    const failRestore = (message: string): void => {
      if (!restoreError) return;
      restoreError.textContent = message;
      restoreError.hidden = false;
    };

    inspectButton?.addEventListener('click', async () => {
      if (restoreError) restoreError.hidden = true;
      const file = restoreFileInput?.files?.[0] ?? null;
      const password = restorePasswordInput?.value ?? '';
      if (!file) {
        failRestore('Pilih file backup terlebih dahulu.');
        return;
      }
      if (password === '') {
        failRestore('Masukkan kata sandi backup.');
        return;
      }
      inspectButton.disabled = true;
      inspectButton.innerHTML = `${icon('loader-circle', 'spin')}<span>Memeriksa…</span>`;
      try {
        const result = await services.backupService.inspectBackup(file, password);
        inspectedFile = file;
        inspectedPassword = password;
        if (restoreResult) {
          restoreResult.innerHTML = restoreSummary(result);
          const restoreButton = restoreResult.querySelector<HTMLButtonElement>('[data-restore-confirm]');
          if (restoreButton) restoreButton.disabled = false;
        }
      } catch (error) {
        clearInspection();
        failRestore(error instanceof Error ? error.message : 'Backup gagal diperiksa.');
      } finally {
        inspectButton.disabled = false;
        inspectButton.innerHTML = `${icon('search')}<span>Periksa backup</span>`;
      }
    });

    restoreResult?.addEventListener('click', async (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>('[data-restore-confirm]');
      if (!button || button.disabled) return;
      if (!inspectedFile || !inspectedPassword) {
        failRestore('Periksa backup kembali sebelum memulihkan.');
        return;
      }
      const confirmed = await confirmDialog({
        title: 'Pulihkan backup?',
        message:
          'Seluruh data saat ini akan diganti dengan isi backup. Tindakan ini tidak dapat dibatalkan.',
        confirmLabel: 'Pulihkan sekarang',
        tone: 'danger',
        requireText: 'PULIHKAN',
        details: [
          'Semua toko, produk, pesanan, biaya, refund, settlement, dan pengaturan akan diganti.',
          'Profile toko mengikuti kunci enkripsi yang tersimpan di backup.',
          'Buat backup data saat ini terlebih dahulu bila masih diperlukan.',
        ],
      });
      if (!confirmed) return;
      button.disabled = true;
      button.innerHTML = `${icon('loader-circle', 'spin')}<span>Memulihkan…</span>`;
      try {
        const result = await services.backupService.restoreBackup(inspectedFile, inspectedPassword);
        showToast(
          `Backup dipulihkan: ${formatNumber(result.tableCounts.orders ?? 0)} pesanan, ${formatNumber(result.tableCounts.stores ?? 0)} toko.`,
          'success',
        );
        context.navigate('/dashboard');
      } catch (error) {
        button.disabled = false;
        button.innerHTML = `${icon('database-backup')}<span>Pulihkan backup ini</span>`;
        failRestore(error instanceof Error ? error.message : 'Backup gagal dipulihkan.');
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
