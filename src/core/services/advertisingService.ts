import type {
  AdvertisingCampaign,
  AdvertisingCampaignInput,
  AdvertisingCampaignSummary,
  AdvertisingExpenseInput,
  PagedResult,
} from '@/types/entities';
import { AD_PLATFORMS } from '@/types/entities';
import type {
  AdExpenseFilters,
  AdExpenseWriteData,
  AdvertisingExpenseListItem,
  AdvertisingRepository,
  CampaignWriteData,
} from '@/core/repositories/advertisingRepository';
import type { StoreRepository } from '@/core/repositories/storeRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import {
  NotFoundError,
  ValidationError,
  optionalText,
  requiredText,
  validateMoney,
  validateOptionalNonNegative,
} from '@/core/utils/validation';
import { isValidBusinessDate } from '@/core/utils/date';
import { calculateAdMetrics } from '@/core/calculations/financialCalculations';

function validatePlatform(value: string): (typeof AD_PLATFORMS)[number] {
  if (!AD_PLATFORMS.includes(value as (typeof AD_PLATFORMS)[number])) {
    throw new ValidationError('Platform iklan tidak valid.', {
      platform: 'Pilih platform iklan.',
    });
  }
  return value as (typeof AD_PLATFORMS)[number];
}

export class AdvertisingService {
  private readonly ads: AdvertisingRepository;
  private readonly stores: StoreRepository;
  private readonly audit: AuditRepository;

  constructor(
    ads: AdvertisingRepository,
    stores: StoreRepository,
    audit: AuditRepository,
  ) {
    this.ads = ads;
    this.stores = stores;
    this.audit = audit;
  }

  async listCampaigns(storeId?: string | null): Promise<AdvertisingCampaignSummary[]> {
    const campaigns = await this.ads.listCampaigns({ storeId: storeId ?? null });
    return campaigns.map((campaign) => {
      const metrics = calculateAdMetrics(
        campaign.totalSpend,
        campaign.totalAttributedRevenue,
        campaign.attributionRows,
      );
      return { ...campaign, ...metrics };
    });
  }

  async getCampaign(id: string): Promise<AdvertisingCampaignSummary> {
    const campaign = await this.ads.getCampaign(id);
    if (!campaign) throw new NotFoundError('Kampanye iklan tidak ditemukan.');
    return {
      ...campaign,
      ...calculateAdMetrics(
        campaign.totalSpend,
        campaign.totalAttributedRevenue,
        campaign.attributionRows,
      ),
    };
  }

  private async normalizeCampaign(input: AdvertisingCampaignInput): Promise<CampaignWriteData> {
    const name = requiredText(input.name, 'Nama kampanye', 'name');
    if (name.length > 150) {
      throw new ValidationError('Nama kampanye terlalu panjang.', {
        name: 'Nama kampanye maksimal 150 karakter.',
      });
    }
    const platform = validatePlatform(input.platform);
    const storeId = optionalText(input.storeId, 100);
    if (storeId) {
      const store = await this.stores.getPublic(storeId);
      if (!store) {
        throw new ValidationError('Toko tidak ditemukan.', { storeId: 'Pilih toko yang valid.' });
      }
    }
    return {
      storeId,
      platform,
      name,
      notes: optionalText(input.notes, 1000),
    };
  }

  async createCampaign(input: AdvertisingCampaignInput): Promise<AdvertisingCampaignSummary> {
    const data = await this.normalizeCampaign(input);
    const id = await this.ads.createCampaign(data);
    await this.audit.log('create', 'advertising_campaign', id, {
      name: data.name,
      platform: data.platform,
      storeId: data.storeId,
    });
    return this.getCampaign(id);
  }

  async updateCampaign(id: string, input: AdvertisingCampaignInput): Promise<AdvertisingCampaignSummary> {
    await this.getCampaign(id);
    const data = await this.normalizeCampaign(input);
    await this.ads.updateCampaign(id, data);
    await this.audit.log('update', 'advertising_campaign', id, {
      name: data.name,
      platform: data.platform,
      storeId: data.storeId,
    });
    return this.getCampaign(id);
  }

  async deleteCampaign(id: string): Promise<void> {
    const campaign = await this.getCampaign(id);
    await this.ads.deleteCampaign(id);
    await this.audit.log('delete', 'advertising_campaign', id, {
      name: campaign.name,
      expenseCount: campaign.expenseCount,
    });
  }

  listExpenses(filters: AdExpenseFilters = {}): Promise<PagedResult<AdvertisingExpenseListItem>> {
    return this.ads.listExpenses(filters);
  }

  async getExpense(id: string): Promise<AdvertisingExpenseListItem> {
    const expense = await this.ads.getExpense(id);
    if (!expense) throw new NotFoundError('Biaya iklan tidak ditemukan.');
    return expense;
  }

  private async normalizeExpense(input: AdvertisingExpenseInput): Promise<AdExpenseWriteData> {
    const campaign = await this.ads.getCampaignBase(input.campaignId);
    if (!campaign) {
      throw new ValidationError('Kampanye iklan tidak ditemukan.', {
        campaignId: 'Pilih kampanye iklan yang valid.',
      });
    }
    if (!isValidBusinessDate(input.expenseDate)) {
      throw new ValidationError('Tanggal biaya iklan tidak valid.', {
        expenseDate: 'Pilih tanggal yang valid.',
      });
    }
    const impressions = validateOptionalNonNegative(
      input.impressions,
      'Impression',
      'impressions',
    );
    const clicks = validateOptionalNonNegative(input.clicks, 'Click', 'clicks');
    const attributedOrders = validateOptionalNonNegative(
      input.attributedOrders,
      'Pesanan teratribusi',
      'attributedOrders',
    );
    const attributedRevenue = validateOptionalNonNegative(
      input.attributedRevenue,
      'Omzet teratribusi',
      'attributedRevenue',
    );
    return {
      campaignId: campaign.id,
      expenseDate: input.expenseDate,
      amount: validateMoney(input.amount, 'Pengeluaran iklan', 'amount'),
      impressions,
      clicks,
      attributedOrders,
      attributedRevenue,
      notes: optionalText(input.notes, 1000),
    };
  }

  async createExpense(input: AdvertisingExpenseInput): Promise<AdvertisingExpenseListItem> {
    const data = await this.normalizeExpense(input);
    const id = await this.ads.createExpense(data);
    await this.audit.log('create', 'advertising_expense', id, {
      campaignId: data.campaignId,
      amount: data.amount,
      date: data.expenseDate,
    });
    return this.getExpense(id);
  }

  async updateExpense(id: string, input: AdvertisingExpenseInput): Promise<AdvertisingExpenseListItem> {
    await this.getExpense(id);
    const data = await this.normalizeExpense(input);
    await this.ads.updateExpense(id, data);
    await this.audit.log('update', 'advertising_expense', id, {
      campaignId: data.campaignId,
      amount: data.amount,
      date: data.expenseDate,
    });
    return this.getExpense(id);
  }

  async deleteExpense(id: string): Promise<void> {
    await this.getExpense(id);
    await this.ads.deleteExpense(id);
    await this.audit.log('delete', 'advertising_expense', id);
  }

  async campaignsForSelect(): Promise<AdvertisingCampaign[]> {
    const campaigns = await this.ads.listCampaigns();
    return campaigns.map((campaign) => ({
      id: campaign.id,
      storeId: campaign.storeId,
      platform: campaign.platform,
      name: campaign.name,
      notes: campaign.notes,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    }));
  }
}
