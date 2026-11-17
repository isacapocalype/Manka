import type { Database, SqlExecutor, SqlRow } from '@/core/database/types';
import type { ImportBatch, ImportError } from '@/types/entities';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { getNullableString, getNumber, getString } from './rowUtils';

function mapBatch(row: SqlRow): ImportBatch {
  return {
    id: getString(row, 'id'),
    importType: getString(row, 'import_type'),
    fileName: getString(row, 'file_name'),
    totalRows: getNumber(row, 'total_rows'),
    successRows: getNumber(row, 'success_rows'),
    failedRows: getNumber(row, 'failed_rows'),
    skippedRows: getNumber(row, 'skipped_rows'),
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
  };
}

function mapError(row: SqlRow): ImportError {
  return {
    id: getString(row, 'id'),
    batchId: getString(row, 'batch_id'),
    rowNumber: getNumber(row, 'row_number'),
    message: getString(row, 'message'),
    rawData: getNullableString(row, 'raw_data'),
    createdAt: getString(row, 'created_at'),
  };
}

export interface ImportBatchWriteData {
  importType: string;
  fileName: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  skippedRows: number;
  notes: string | null;
}

export interface ImportErrorWriteData {
  rowNumber: number;
  message: string;
  rawData: string | null;
}

export class ImportRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async createBatch(data: ImportBatchWriteData, tx?: SqlExecutor): Promise<string> {
    const id = createId();
    await (tx ?? this.db).execute(
      `INSERT INTO import_batches (id, import_type, file_name, total_rows, success_rows, failed_rows, skipped_rows, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.importType,
        data.fileName,
        data.totalRows,
        data.successRows,
        data.failedRows,
        data.skippedRows,
        data.notes,
        nowIso(),
      ],
    );
    return id;
  }

  async addErrors(
    batchId: string,
    errors: ImportErrorWriteData[],
    tx?: SqlExecutor,
  ): Promise<void> {
    const executor = tx ?? this.db;
    const timestamp = nowIso();
    for (const error of errors) {
      await executor.execute(
        'INSERT INTO import_errors (id, batch_id, row_number, message, raw_data, created_at) VALUES (?, ?, ?, ?, ?, ?);',
        [createId(), batchId, error.rowNumber, error.message, error.rawData, timestamp],
      );
    }
  }

  async listBatches(limit = 30): Promise<ImportBatch[]> {
    const rows = await this.db.query(
      'SELECT * FROM import_batches ORDER BY created_at DESC LIMIT ?;',
      [limit],
    );
    return rows.map(mapBatch);
  }

  async getBatch(id: string): Promise<ImportBatch | null> {
    const rows = await this.db.query('SELECT * FROM import_batches WHERE id = ?;', [id]);
    return rows[0] ? mapBatch(rows[0]) : null;
  }

  async listErrors(batchId: string, limit = 300): Promise<ImportError[]> {
    const rows = await this.db.query(
      'SELECT * FROM import_errors WHERE batch_id = ? ORDER BY row_number ASC LIMIT ?;',
      [batchId, limit],
    );
    return rows.map(mapError);
  }
}
