import type { SqlRow } from '@/core/database/types';
import type { EncryptionService } from '@/core/crypto/secretStore';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import {
  BACKUP_TABLES,
  type BackupRepository,
} from '@/core/repositories/backupRepository';
import { LATEST_SCHEMA_VERSION } from '@/core/database';
import {
  createBackupEnvelope,
  openBackupEnvelope,
  type BackupEnvelope,
} from '@/core/crypto/encryption';
import { nowIso } from '@/core/utils/date';
import { saveFile } from '@/core/import-export/fileSaver';
import { ValidationError } from '@/core/utils/validation';

export const APP_VERSION = '1.0.0';
const BACKUP_FORMAT_VERSION = 1;

interface BackupPayload {
  schemaVersion: number;
  appVersion: string;
  createdAt: string;
  encryptionKey: string;
  tables: Record<string, SqlRow[]>;
}

export interface BackupExportResult {
  fileName: string;
  method: 'download' | 'share';
  tableCounts: Record<string, number>;
}

export interface BackupRestoreResult {
  schemaVersion: number;
  appVersion: string;
  createdAt: string;
  tableCounts: Record<string, number>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBackupEnvelope(value: unknown): value is BackupEnvelope {
  return (
    isRecord(value) &&
    value.format === 'manka-backup' &&
    value.version === 1 &&
    isRecord(value.kdf) &&
    isRecord(value.cipher) &&
    typeof value.payload === 'string'
  );
}

function validatePayload(value: unknown): BackupPayload {
  if (!isRecord(value)) {
    throw new ValidationError('Isi backup tidak valid.');
  }
  const schemaVersion = Number(value.schemaVersion);
  if (!Number.isSafeInteger(schemaVersion) || schemaVersion < 1) {
    throw new ValidationError('Versi skema backup tidak valid.');
  }
  if (schemaVersion > LATEST_SCHEMA_VERSION) {
    throw new ValidationError(
      'Backup dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi sebelum memulihkan backup ini.',
    );
  }
  if (schemaVersion < LATEST_SCHEMA_VERSION) {
    throw new ValidationError(
      'Versi skema backup ini belum didukung oleh aplikasi. Backup versi lama memerlukan migrasi khusus.',
    );
  }
  if (
    typeof value.encryptionKey !== 'string' ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value.encryptionKey)
  ) {
    throw new ValidationError('Kunci enkripsi pada backup tidak valid.');
  }
  if (!isRecord(value.tables)) {
    throw new ValidationError('Data tabel pada backup tidak valid.');
  }
  const tables: Record<string, SqlRow[]> = {};
  for (const table of BACKUP_TABLES) {
    const rows = value.tables[table.name];
    if (!Array.isArray(rows)) {
      throw new ValidationError(`Tabel "${table.name}" tidak ditemukan pada backup.`);
    }
    const validatedRows: SqlRow[] = [];
    for (const rawRow of rows) {
      if (!isRecord(rawRow)) {
        throw new ValidationError(`Baris data pada tabel "${table.name}" tidak valid.`);
      }
      const cleanRow: SqlRow = {};
      for (const column of table.columns) {
        const rowValue = rawRow[column];
        if (
          rowValue !== null &&
          typeof rowValue !== 'string' &&
          typeof rowValue !== 'number'
        ) {
          throw new ValidationError(
            `Nilai kolom "${table.name}.${column}" pada backup tidak valid.`,
          );
        }
        cleanRow[column] = (rowValue ?? null) as string | number | null;
      }
      validatedRows.push(cleanRow);
    }
    tables[table.name] = validatedRows;
  }
  return {
    schemaVersion,
    appVersion: typeof value.appVersion === 'string' ? value.appVersion : 'tidak diketahui',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : nowIso(),
    encryptionKey: value.encryptionKey,
    tables,
  };
}

export class BackupService {
  private readonly backup: BackupRepository;
  private readonly encryption: EncryptionService;
  private readonly audit: AuditRepository;

  constructor(
    backup: BackupRepository,
    encryption: EncryptionService,
    audit: AuditRepository,
  ) {
    this.backup = backup;
    this.encryption = encryption;
    this.audit = audit;
  }

  async exportBackup(password: string): Promise<BackupExportResult> {
    if (password.length < 8) {
      throw new ValidationError('Kata sandi backup minimal 8 karakter.', {
        password: 'Gunakan minimal 8 karakter.',
      });
    }
    const tables = await this.backup.readAll();
    const encryptionKey = await this.encryption.exportKeyBase64();
    const createdAt = nowIso();
    const payload: BackupPayload = {
      schemaVersion: LATEST_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      createdAt,
      encryptionKey,
      tables,
    };
    const envelope = await createBackupEnvelope(JSON.stringify(payload), password, createdAt);
    const text = JSON.stringify(envelope, null, 2);
    const stamp = createdAt.slice(0, 19).replace(/[:T]/g, '-');
    const fileName = `manka-backup-${stamp}.manka`;
    const result = await saveFile(fileName, 'application/json', text);
    await this.audit.log('backup', 'database', null, {
      schemaVersion: LATEST_SCHEMA_VERSION,
      sizeBytes: new TextEncoder().encode(text).length,
    });
    return {
      fileName: result.fileName,
      method: result.method,
      tableCounts: Object.fromEntries(
        Object.entries(tables).map(([name, rows]) => [name, rows.length]),
      ),
    };
  }

  async inspectBackup(file: File, password: string): Promise<BackupRestoreResult> {
    const payload = await this.readBackupPayload(file, password);
    return {
      schemaVersion: payload.schemaVersion,
      appVersion: payload.appVersion,
      createdAt: payload.createdAt,
      tableCounts: Object.fromEntries(
        Object.entries(payload.tables).map(([name, rows]) => [name, rows.length]),
      ),
    };
  }

  private async readBackupPayload(file: File, password: string): Promise<BackupPayload> {
    if (password.length === 0) {
      throw new ValidationError('Masukkan kata sandi backup.');
    }
    if (file.size > 60 * 1024 * 1024) {
      throw new ValidationError('Ukuran file backup terlalu besar.');
    }
    let parsed: unknown;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      throw new ValidationError('File backup tidak valid atau rusak.');
    }
    if (!isBackupEnvelope(parsed)) {
      throw new ValidationError('File ini bukan backup Manka yang valid.');
    }
    let payloadText: string;
    try {
      payloadText = await openBackupEnvelope(parsed, password);
    } catch (error) {
      throw new ValidationError(
        error instanceof Error ? error.message : 'Backup tidak dapat dibuka.',
      );
    }
    let payloadValue: unknown;
    try {
      payloadValue = JSON.parse(payloadText);
    } catch {
      throw new ValidationError('Isi backup rusak.');
    }
    return validatePayload(payloadValue);
  }

  async restoreBackup(file: File, password: string): Promise<BackupRestoreResult> {
    const payload = await this.readBackupPayload(file, password);
    await this.backup.restoreAll(payload.tables);
    await this.encryption.replaceKey(payload.encryptionKey);
    await this.audit.log('restore', 'database', null, {
      schemaVersion: payload.schemaVersion,
      appVersion: payload.appVersion,
    });
    return {
      schemaVersion: payload.schemaVersion,
      appVersion: payload.appVersion,
      createdAt: payload.createdAt,
      tableCounts: Object.fromEntries(
        Object.entries(payload.tables).map(([name, rows]) => [name, rows.length]),
      ),
    };
  }
}

export const BACKUP_FORMAT = BACKUP_FORMAT_VERSION;
