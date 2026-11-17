import type { Database, SqlExecutor, SqlRow } from '@/core/database/types';
import type {
  AdPlatform,
  AdvertisingCampaign,
  AdvertisingExpense,
  PagedResult,
} from '@/types/entities';
import { createId } from '@/core/utils/id';
import { nowIso } from '@/core/utils/date';
import { getNullableNumber, getNullableString, getNumber, getString } from './rowUtils';
import type { FinanceAdvertisingExpense } from '@/types/finance';

export interface CampaignListItem extends AdvertisingCampaign {
  storeName: string | null;
  totalSpend: number;
  totalAttributedRevenue: number | null;
  totalAttributedOrders: number | null;
  attributionRows: number;
  expenseCount: number;
}

export interface AdvertisingExpenseListItem extends AdvertisingExpense {
  campaignName: string;
  platform: AdPlatform;
  storeId: string | null;
  storeName: string | null;
}

export interface CampaignWriteData {
  storeId: string | null;
  platform: AdPlatform;
  name: string;
  notes: string | null;
}

export interface AdExpenseWriteData {
  campaignId: string;
  expenseDate: string;
  amount: number;
  impressions: number | null;
  clicks: number | null;
  attributedOrders: number | null;
  attributedRevenue: number | null;
  notes: string | null;
}

export interface AdExpenseFilters {
  campaignId?: string | null;
  storeId?: string | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  pageSize?: number;
}

function mapCampaign(row: SqlRow): CampaignListItem {
  return {
    id: getString(row, 'id'),
    storeId: getNullableString(row, 'store_id'),
    platform: getString(row, 'platform') as AdPlatform,
    name: getString(row, 'name'),
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    updatedAt: getString(row, 'updated_at'),
    storeName: getNullableString(row, 'store_name'),
    totalSpend: getNumber(row, 'total_spend'),
    totalAttributedRevenue: getNullableNumber(row, 'total_attributed_revenue'),
    totalAttributedOrders: getNullableNumber(row, 'total_attributed_orders'),
    attributionRows: getNumber(row, 'attribution_rows'),
    expenseCount: getNumber(row, 'expense_count'),
  };
}

function mapExpense(row: SqlRow): AdvertisingExpenseListItem {
  return {
    id: getString(row, 'id'),
    campaignId: getString(row, 'campaign_id'),
    expenseDate: getString(row, 'expense_date'),
    amount: getNumber(row, 'amount'),
    impressions: getNullableNumber(row, 'impressions'),
    clicks: getNullableNumber(row, 'clicks'),
    attributedOrders: getNullableNumber(row, 'attributed_orders'),
    attributedRevenue: getNullableNumber(row, 'attributed_revenue'),
    notes: getNullableString(row, 'notes'),
    createdAt: getString(row, 'created_at'),
    campaignName: getString(row, 'campaign_name'),
    platform: getString(row, 'platform') as AdPlatform,
    storeId: getNullableString(row, 'store_id'),
    storeName: getNullableString(row, 'store_name'),
  };
}

const CAMPAIGN_SELECT = `
  SELECT c.*, s.name AS store_name,
    COALESCE((SELECT SUM(ae.amount) FROM advertising_expenses ae WHERE ae.campaign_id = c.id), 0) AS total_spend,
    (SELECT SUM(ae.attributed_revenue) FROM advertising_expenses ae WHERE ae.campaign_id = c.id) AS total_attributed_revenue,
    (SELECT SUM(ae.attributed_orders) FROM advertising_expenses ae WHERE ae.campaign_id = c.id) AS total_attributed_orders,
    (SELECT COUNT(*) FROM advertising_expenses ae WHERE ae.campaign_id = c.id AND (ae.attributed_revenue IS NOT NULL OR ae.attributed_orders IS NOT NULL)) AS attribution_rows,
    (SELECT COUNT(*) FROM advertising_expenses ae WHERE ae.campaign_id = c.id) AS expense_count
  FROM advertising_campaigns c
  LEFT JOIN stores s ON s.id = c.store_id
`;

const EXPENSE_SELECT = `
  SELECT ae.*, c.name AS campaign_name, c.platform AS platform, c.store_id AS store_id, s.name AS store_name
  FROM advertising_expenses ae
  JOIN advertising_campaigns c ON c.id = ae.campaign_id
  LEFT JOIN stores s ON s.id = c.store_id
`;

export class AdvertisingRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async listCampaigns(filters: { storeId?: string | null; includeAll?: boolean } = {}): Promise<CampaignListItem[]> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.storeId) {
      where.push('c.store_id = ?');
      params.push(filters.storeId);
    }
    const rows = await this.db.query(
      `${CAMPAIGN_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY c.created_at DESC;`,
      params,
    );
    return rows.map(mapCampaign);
  }

  async getCampaign(id: string): Promise<CampaignListItem | null> {
    const rows = await this.db.query(`${CAMPAIGN_SELECT} WHERE c.id = ?;`, [id]);
    return rows[0] ? mapCampaign(rows[0]) : null;
  }

  async getCampaignBase(id: string): Promise<AdvertisingCampaign | null> {
    const rows = await this.db.query('SELECT * FROM advertising_campaigns WHERE id = ?;', [id]);
    if (!rows[0]) return null;
    const row = rows[0];
    return {
      id: getString(row, 'id'),
      storeId: getNullableString(row, 'store_id'),
      platform: getString(row, 'platform') as AdPlatform,
      name: getString(row, 'name'),
      notes: getNullableString(row, 'notes'),
      createdAt: getString(row, 'created_at'),
      updatedAt: getString(row, 'updated_at'),
    };
  }

  async createCampaign(data: CampaignWriteData, tx?: SqlExecutor): Promise<string> {
    const id = createId();
    const timestamp = nowIso();
    await (tx ?? this.db).execute(
      `INSERT INTO advertising_campaigns (id, store_id, platform, name, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [id, data.storeId, data.platform, data.name, data.notes, timestamp, timestamp],
    );
    return id;
  }

  async updateCampaign(id: string, data: CampaignWriteData): Promise<void> {
    await this.db.execute(
      `UPDATE advertising_campaigns SET store_id = ?, platform = ?, name = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [data.storeId, data.platform, data.name, data.notes, nowIso(), id],
    );
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.db.execute('DELETE FROM advertising_campaigns WHERE id = ?;', [id]);
  }

  async listExpenses(filters: AdExpenseFilters = {}): Promise<PagedResult<AdvertisingExpenseListItem>> {
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.campaignId) {
      where.push('ae.campaign_id = ?');
      params.push(filters.campaignId);
    }
    if (filters.storeId) {
      where.push('c.store_id = ?');
      params.push(filters.storeId);
    }
    if (filters.from) {
      where.push('ae.expense_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      where.push('ae.expense_date <= ?');
      params.push(filters.to);
    }
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(filters.pageSize ?? 40, 100));
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRows = await this.db.query(
      `SELECT COUNT(*) AS total FROM advertising_expenses ae JOIN advertising_campaigns c ON c.id = ae.campaign_id ${whereSql};`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);
    const rows = await this.db.query(
      `${EXPENSE_SELECT} ${whereSql} ORDER BY ae.expense_date DESC, ae.created_at DESC LIMIT ? OFFSET ?;`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { items: rows.map(mapExpense), total, page, pageSize };
  }

  async getExpense(id: string): Promise<AdvertisingExpenseListItem | null> {
    const rows = await this.db.query(`${EXPENSE_SELECT} WHERE ae.id = ?;`, [id]);
    return rows[0] ? mapExpense(rows[0]) : null;
  }

  async createExpense(data: AdExpenseWriteData, tx?: SqlExecutor): Promise<string> {
    const id = createId();
    await (tx ?? this.db).execute(
      `INSERT INTO advertising_expenses (id, campaign_id, expense_date, amount, impressions, clicks, attributed_orders, attributed_revenue, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.campaignId,
        data.expenseDate,
        data.amount,
        data.impressions,
        data.clicks,
        data.attributedOrders,
        data.attributedRevenue,
        data.notes,
        nowIso(),
      ],
    );
    return id;
  }

  async updateExpense(id: string, data: AdExpenseWriteData): Promise<void> {
    await this.db.execute(
      `UPDATE advertising_expenses SET campaign_id = ?, expense_date = ?, amount = ?, impressions = ?, clicks = ?,
        attributed_orders = ?, attributed_revenue = ?, notes = ?
       WHERE id = ?;`,
      [
        data.campaignId,
        data.expenseDate,
        data.amount,
        data.impressions,
        data.clicks,
        data.attributedOrders,
        data.attributedRevenue,
        data.notes,
        id,
      ],
    );
  }

  async deleteExpense(id: string): Promise<void> {
    await this.db.execute('DELETE FROM advertising_expenses WHERE id = ?;', [id]);
  }

  async findForFinance(from: string, to: string): Promise<FinanceAdvertisingExpense[]> {
    const rows = await this.db.query(
      `SELECT c.store_id AS store_id, ae.expense_date AS expense_date, ae.amount AS amount
       FROM advertising_expenses ae
       JOIN advertising_campaigns c ON c.id = ae.campaign_id
       WHERE ae.expense_date >= ? AND ae.expense_date <= ?;`,
      [from, to],
    );
    return rows.map((row) => ({
      storeId: getNullableString(row, 'store_id'),
      expenseDate: getString(row, 'expense_date'),
      amount: getNumber(row, 'amount'),
    }));
  }
}
