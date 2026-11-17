import type { Database } from '@/core/database/types';
import type { AuditLog } from '@/types/entities';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { getNullableString, getString } from './rowUtils';
import type { SqlRow } from '@/core/database/types';

function mapAuditLog(row: SqlRow): AuditLog {
  return {
    id: getString(row, 'id'),
    action: getString(row, 'action'),
    entityType: getString(row, 'entity_type'),
    entityId: getNullableString(row, 'entity_id'),
    details: getNullableString(row, 'details'),
    createdAt: getString(row, 'created_at'),
  };
}

export class AuditRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async log(
    action: string,
    entityType: string,
    entityId: string | null,
    details?: Record<string, string | number | boolean | null>,
  ): Promise<void> {
    const sanitized = details
      ? JSON.stringify(details, (_key, value: unknown) => {
          if (typeof value === 'string' && value.length > 500) return value.slice(0, 500);
          return value;
        })
      : null;
    await this.db.execute(
      'INSERT INTO audit_logs (id, action, entity_type, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?);',
      [createId(), action, entityType, entityId, sanitized, nowIso()],
    );
  }

  async list(limit = 60): Promise<AuditLog[]> {
    const rows = await this.db.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?;',
      [Math.max(1, Math.min(limit, 300))],
    );
    return rows.map(mapAuditLog);
  }
}
