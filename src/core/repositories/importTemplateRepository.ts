import type { Database, SqlExecutor, SqlRow } from '@/core/database/types';
import type { ImportMappingValues, ImportTemplate, ImportType, StorePlatform } from '@/types/entities';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { getString } from './rowUtils';

function parseMapping(raw: string): ImportMappingValues {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result: ImportMappingValues = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'string' && value.trim() !== '') result[key] = value.trim();
      else result[key] = null;
    }
    return result;
  } catch {
    return {};
  }
}

function mapTemplate(row: SqlRow): ImportTemplate {
  return {
    id: getString(row, 'id'),
    name: getString(row, 'name'),
    marketplace: getString(row, 'marketplace') as StorePlatform,
    importType: getString(row, 'import_type') as ImportType,
    mapping: parseMapping(getString(row, 'mapping_json')),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
  };
}

export interface ImportTemplateWriteData {
  name: string;
  marketplace: StorePlatform;
  importType: ImportType;
  mapping: ImportMappingValues;
}

export class ImportTemplateRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async list(importType?: ImportType, marketplace?: StorePlatform): Promise<ImportTemplate[]> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (importType) {
      where.push('import_type = ?');
      params.push(importType);
    }
    if (marketplace) {
      where.push('marketplace = ?');
      params.push(marketplace);
    }
    const sql = `SELECT * FROM import_templates ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY import_type ASC, marketplace ASC, name COLLATE NOCASE ASC;`;
    const rows = await this.db.query(sql, params);
    return rows.map(mapTemplate);
  }

  async get(id: string): Promise<ImportTemplate | null> {
    const rows = await this.db.query('SELECT * FROM import_templates WHERE id = ?;', [id]);
    return rows[0] ? mapTemplate(rows[0]) : null;
  }

  async findByName(
    marketplace: StorePlatform,
    importType: ImportType,
    name: string,
  ): Promise<ImportTemplate | null> {
    const rows = await this.db.query(
      `SELECT * FROM import_templates
       WHERE marketplace = ? AND import_type = ? AND name = ? COLLATE NOCASE;`,
      [marketplace, importType, name],
    );
    return rows[0] ? mapTemplate(rows[0]) : null;
  }

  async create(data: ImportTemplateWriteData, tx?: SqlExecutor): Promise<string> {
    const id = createId();
    const timestamp = nowIso();
    await (tx ?? this.db).execute(
      `INSERT INTO import_templates (id, name, marketplace, import_type, mapping_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.name,
        data.marketplace,
        data.importType,
        JSON.stringify(data.mapping),
        timestamp,
        timestamp,
      ],
    );
    return id;
  }

  async update(id: string, data: ImportTemplateWriteData, tx?: SqlExecutor): Promise<void> {
    await (tx ?? this.db).execute(
      `UPDATE import_templates SET name = ?, marketplace = ?, import_type = ?, mapping_json = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.name,
        data.marketplace,
        data.importType,
        JSON.stringify(data.mapping),
        nowIso(),
        id,
      ],
    );
  }

  async delete(id: string, tx?: SqlExecutor): Promise<void> {
    await (tx ?? this.db).execute('DELETE FROM import_templates WHERE id = ?;', [id]);
  }
}
