import { describe, expect, it } from 'vitest';
import { createTestContext } from './helpers/testContext';
import {
  createBackupEnvelope,
  type BackupEnvelope,
} from '@/core/crypto/encryption';
import { LATEST_SCHEMA_VERSION } from '@/core/database';
import { APP_VERSION } from '@/core/services/backupService';
import { calculateCashBalance, calculateReconciliationDifference } from '@/core/calculations/cashMath';

async function makeStoreAndProduct(services: Awaited<ReturnType<typeof createTestContext>>['services']) {
  const store = await services.storeService.create({ name: 'Toko', platform: 'shopee' });
  const product = await services.productService.create({
    name: 'Kaos',
    sku: 'KAS-01',
    price: 100_000,
    cost: 60_000,
    status: 'active',
  });
  return { store, product };
}

describe('cashMath', () => {
  it('menghitung saldo dan selisih rekonsiliasi sebagai rupiah bulat', () => {
    expect(
      calculateCashBalance(100_000, [
        { direction: 'in', amount: 50_000 },
        { direction: 'out', amount: 30_000 },
      ]),
    ).toBe(120_000);
    expect(calculateReconciliationDifference(125_000, 120_000)).toBe(5_000);
    expect(calculateReconciliationDifference(115_000, 120_000)).toBe(-5_000);
  });
});

describe('cash accounts', () => {
  it('membuat, mengubah, mengarsipkan, dan menolak duplikat rekening', async () => {
    const { services } = await createTestContext();
    const account = await services.cashService.createAccount({
      name: 'Kas Tunai',
      type: 'cash',
      openingBalance: 250_000,
      status: 'active',
      notes: 'Laci toko',
    });
    expect(account).toMatchObject({
      name: 'Kas Tunai',
      type: 'cash',
      openingBalance: 250_000,
      balance: 250_000,
      entryCount: 0,
    });

    await expect(
      services.cashService.createAccount({
        name: 'kas tunai',
        type: 'bank',
        openingBalance: 0,
        status: 'active',
      }),
    ).rejects.toThrow(/sudah ada/);

    const updated = await services.cashService.updateAccount(account.id, {
      name: 'Kas Tunai Utama',
      type: 'cash',
      openingBalance: 300_000,
      status: 'archived',
    });
    expect(updated.status).toBe('archived');
    expect(updated.balance).toBe(300_000);

    const archived = await services.cashService.listAccounts({ status: 'active' });
    expect(archived).toHaveLength(0);
    const all = await services.cashService.listForSelect();
    expect(all.map((item) => item.id)).toContain(account.id);
  });

  it('menolak penghapusan rekening yang sudah memiliki riwayat kas', async () => {
    const { services } = await createTestContext();
    const account = await services.cashService.createAccount({
      name: 'BCA Utama',
      type: 'bank',
      openingBalance: 1_000_000,
      status: 'active',
    });
    await services.cashService.createAdjustment({
      accountId: account.id,
      entryDate: '2026-02-01',
      direction: 'out',
      amount: 25_000,
      description: 'Biaya admin',
    });

    await expect(services.cashService.deleteAccount(account.id)).rejects.toThrow(/riwayat kas/);
    const stillThere = await services.cashService.getAccount(account.id);
    expect(stillThere.balance).toBe(975_000);
  });
});

describe('automatic cash posting', () => {
  it('mencatat settlement diterima sebagai kas masuk dan menghapusnya saat dihapus', async () => {
    const { services } = await createTestContext();
    const { store } = await makeStoreAndProduct(services);
    const account = await services.cashService.createAccount({
      name: 'Bank settlement',
      type: 'bank',
      openingBalance: 0,
      status: 'active',
    });

    const pending = await services.settlementService.create({
      storeId: store.id,
      settlementNo: 'ST-1',
      settlementDate: '2026-02-01',
      grossSales: 500_000,
      totalDeductions: 50_000,
      totalPayout: 450_000,
      status: 'pending',
      notes: null,
      accountId: account.id,
    });
    expect(await services.cashService.listEntries({ sourceType: 'settlement' })).toMatchObject({
      total: 0,
    });

    await services.settlementService.update(pending.id, {
      storeId: store.id,
      settlementNo: 'ST-1',
      settlementDate: '2026-02-01',
      grossSales: 500_000,
      totalDeductions: 50_000,
      totalPayout: 450_000,
      status: 'received',
      notes: null,
      accountId: account.id,
    });
    const posted = await services.cashService.listEntries({ sourceType: 'settlement' });
    expect(posted.total).toBe(1);
    expect(posted.items[0]).toMatchObject({
      accountId: account.id,
      direction: 'in',
      amount: 450_000,
      sourceId: pending.id,
    });
    expect((await services.cashService.getAccount(account.id)).balance).toBe(450_000);

    await services.settlementService.update(pending.id, {
      storeId: store.id,
      settlementNo: 'ST-1',
      settlementDate: '2026-02-01',
      grossSales: 500_000,
      totalDeductions: 50_000,
      totalPayout: 400_000,
      status: 'received',
      notes: null,
      accountId: account.id,
    });
    const adjusted = await services.cashService.listEntries({ sourceType: 'settlement' });
    expect(adjusted.total).toBe(1);
    expect(adjusted.items[0]?.amount).toBe(400_000);

    await services.settlementService.delete(pending.id);
    expect((await services.cashService.listEntries({ sourceType: 'settlement' })).total).toBe(0);
    expect((await services.cashService.getAccount(account.id)).balance).toBe(0);
  });

  it('mewajibkan rekening untuk settlement diterima', async () => {
    const { services } = await createTestContext();
    const { store } = await makeStoreAndProduct(services);
    await expect(
      services.settlementService.create({
        storeId: store.id,
        settlementNo: 'ST-2',
        settlementDate: '2026-02-01',
        grossSales: 100_000,
        totalDeductions: 0,
        totalPayout: 100_000,
        status: 'received',
        notes: null,
      }),
    ).rejects.toThrow(/rekening tujuan wajib/i);
  });

  it('hanya memposting biaya operasional dan iklan yang sudah dibayar', async () => {
    const { services } = await createTestContext();
    const account = await services.cashService.createAccount({
      name: 'Kas Uang Keluar',
      type: 'cash',
      openingBalance: 1_000_000,
      status: 'active',
    });

    const unpaid = await services.expenseService.create({
      storeId: null,
      category: 'internet',
      amount: 100_000,
      expenseDate: '2026-02-02',
      description: 'Internet belum bayar',
      receiptNote: null,
      isPaid: false,
    });
    expect((await services.cashService.listEntries({ sourceType: 'operational_expense' })).total).toBe(0);

    await services.expenseService.update(unpaid.id, {
      storeId: null,
      category: 'internet',
      amount: 100_000,
      expenseDate: '2026-02-02',
      description: 'Internet sudah bayar',
      receiptNote: null,
      accountId: account.id,
      isPaid: true,
    });
    const expenseEntry = await services.cashService.listEntries({ sourceType: 'operational_expense' });
    expect(expenseEntry.total).toBe(1);
    expect(expenseEntry.items[0]).toMatchObject({ direction: 'out', amount: 100_000 });
    expect((await services.cashService.getAccount(account.id)).balance).toBe(900_000);

    await expect(
      services.expenseService.create({
        storeId: null,
        category: 'supplies',
        amount: 50_000,
        expenseDate: '2026-02-02',
        description: 'Belum ada rekening',
        receiptNote: null,
        isPaid: true,
      }),
    ).rejects.toThrow(/rekening kas wajib/i);

    const campaign = await services.advertisingService.createCampaign({
      name: 'Ads Shopee',
      platform: 'shopee',
      storeId: null,
      notes: null,
    });
    await services.advertisingService.createExpense({
      campaignId: campaign.id,
      expenseDate: '2026-02-03',
      amount: 75_000,
      notes: null,
    });
    expect((await services.cashService.listEntries({ sourceType: 'advertising_expense' })).total).toBe(0);

    await services.advertisingService.createExpense({
      campaignId: campaign.id,
      expenseDate: '2026-02-03',
      amount: 75_000,
      accountId: account.id,
      isPaid: true,
    });
    const adEntries = await services.cashService.listEntries({ sourceType: 'advertising_expense' });
    expect(adEntries.total).toBe(1);
    expect(adEntries.items[0]).toMatchObject({ direction: 'out', amount: 75_000 });
    expect((await services.cashService.getAccount(account.id)).balance).toBe(825_000);
  });

  it('mencatat refund selesai tanpa settlement sebagai kas keluar', async () => {
    const { services } = await createTestContext();
    const { store, product } = await makeStoreAndProduct(services);
    const account = await services.cashService.createAccount({
      name: 'Kas Refund',
      type: 'cash',
      openingBalance: 500_000,
      status: 'active',
    });
    const order = await services.orderService.create({
      storeId: store.id,
      marketplaceOrderId: 'MP-REFUND-1',
      orderDate: '2026-02-01',
      status: 'completed',
      sellerDiscount: 0,
      marketplaceDiscount: 0,
      shippingPaid: 0,
      items: [
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: 2,
          unitPrice: 100_000,
        },
      ],
    });
    const settlement = await services.settlementService.create({
      storeId: store.id,
      settlementNo: 'ST-REFUND',
      settlementDate: '2026-02-04',
      grossSales: 100_000,
      totalDeductions: 10_000,
      totalPayout: 90_000,
      status: 'received',
      notes: null,
      accountId: account.id,
    });

    const linked = await services.refundService.create({
      orderId: order.id,
      settlementId: settlement.id,
      refundDate: '2026-02-04',
      amount: 20_000,
      quantity: 1,
      reason: 'Refund dari settlement',
      status: 'completed',
      accountId: account.id,
    });
    expect((await services.cashService.listEntries({ sourceType: 'refund' })).total).toBe(0);

    await services.refundService.create({
      orderId: order.id,
      refundDate: '2026-02-05',
      amount: 30_000,
      quantity: 1,
      reason: 'Refund langsung',
      status: 'completed',
      accountId: account.id,
    });
    const entries = await services.cashService.listEntries({ sourceType: 'refund' });
    expect(entries.total).toBe(1);
    expect(entries.items[0]).toMatchObject({ direction: 'out', amount: 30_000 });
    expect(entries.items[0]?.sourceId).not.toBe(linked.id);
    // Saldo awal 500.000 + settlement 90.000 − refund 30.000.
    expect((await services.cashService.getAccount(account.id)).balance).toBe(560_000);

    const summary = await services.cashService.getSummary();
    expect(summary.unlinkedRefunds.count).toBe(1);
    expect(summary.unlinkedRefunds.amount).toBe(30_000);
  });
});

describe('transfers and reconciliation', () => {
  it('membuat dua entri transfer dan menghapus keduanya saat transfer dihapus', async () => {
    const { services } = await createTestContext();
    const from = await services.cashService.createAccount({
      name: 'Kas',
      type: 'cash',
      openingBalance: 1_000_000,
      status: 'active',
    });
    const to = await services.cashService.createAccount({
      name: 'Bank',
      type: 'bank',
      openingBalance: 500_000,
      status: 'active',
    });

    const transfer = await services.cashService.createTransfer({
      fromAccountId: from.id,
      toAccountId: to.id,
      transferDate: '2026-02-06',
      amount: 250_000,
      notes: 'Setoran kas',
    });
    const entries = await services.cashService.listEntries({ sourceType: 'transfer' });
    expect(entries.total).toBe(2);
    expect(entries.items.map((entry) => entry.direction).sort()).toEqual(['in', 'out']);
    expect((await services.cashService.getAccount(from.id)).balance).toBe(750_000);
    expect((await services.cashService.getAccount(to.id)).balance).toBe(750_000);

    await expect(
      services.cashService.createTransfer({
        fromAccountId: from.id,
        toAccountId: from.id,
        transferDate: '2026-02-06',
        amount: 10_000,
      }),
    ).rejects.toThrow(/berbeda/);

    await services.cashService.deleteTransfer(transfer.id);
    expect((await services.cashService.listEntries({ sourceType: 'transfer' })).total).toBe(0);
    expect((await services.cashService.getAccount(from.id)).balance).toBe(1_000_000);
    expect((await services.cashService.getAccount(to.id)).balance).toBe(500_000);
  });

  it('merekonsiliasi saldo dan membuat penyesuaian bila diminta', async () => {
    const { services } = await createTestContext();
    const account = await services.cashService.createAccount({
      name: 'Bank Rekonsiliasi',
      type: 'bank',
      openingBalance: 1_000_000,
      status: 'active',
    });
    await services.cashService.createAdjustment({
      accountId: account.id,
      entryDate: '2026-02-01',
      direction: 'in',
      amount: 50_000,
      description: 'Bunga bank',
    });

    const matched = await services.cashService.createReconciliation({
      accountId: account.id,
      reconciliationDate: '2026-02-10',
      statementBalance: 1_050_000,
      createAdjustment: true,
    });
    expect(matched.reconciliation).toMatchObject({ difference: 0 });
    expect(matched.adjustmentEntryId).toBeNull();

    const mismatched = await services.cashService.createReconciliation({
      accountId: account.id,
      reconciliationDate: '2026-02-11',
      statementBalance: 1_040_000,
      createAdjustment: true,
      notes: 'Selisih biaya admin',
    });
    expect(mismatched.reconciliation).toMatchObject({ difference: -10_000 });
    expect(mismatched.adjustmentEntryId).not.toBeNull();

    const adjustment = await services.cashService.getEntry(mismatched.adjustmentEntryId!);
    expect(adjustment).toMatchObject({
      accountId: account.id,
      direction: 'out',
      amount: 10_000,
      sourceType: 'adjustment',
    });
    expect((await services.cashService.getAccount(account.id)).balance).toBe(1_040_000);
    expect(await services.cashService.getBalanceAsOf(account.id, '2026-02-10')).toBe(1_050_000);
  });

  it('menghitung ringkasan saldo, settlement menunggu, dan dana belum tercatat', async () => {
    const { services } = await createTestContext();
    const { store } = await makeStoreAndProduct(services);
    const account = await services.cashService.createAccount({
      name: 'Semua Kas',
      type: 'cash',
      openingBalance: 100_000,
      status: 'active',
    });
    await services.settlementService.create({
      storeId: store.id,
      settlementNo: 'ST-PENDING',
      settlementDate: '2026-02-01',
      grossSales: 200_000,
      totalDeductions: 20_000,
      totalPayout: 180_000,
      status: 'pending',
      notes: null,
    });
    // Simulasikan data lama hasil restore: settlement diterima tanpa rekening.
    const unassigned = await services.settlementService.create({
      storeId: store.id,
      settlementNo: 'ST-TANPA-REKENING',
      settlementDate: '2026-02-02',
      grossSales: 300_000,
      totalDeductions: 30_000,
      totalPayout: 270_000,
      status: 'pending',
      notes: null,
    });
    await services.settlements.update(unassigned.id, {
      storeId: store.id,
      settlementNo: 'ST-TANPA-REKENING',
      settlementDate: '2026-02-02',
      grossSales: 300_000,
      totalDeductions: 30_000,
      totalPayout: 270_000,
      status: 'received',
      notes: null,
      accountId: null,
    });
    await services.settlementService.create({
      storeId: store.id,
      settlementNo: 'ST-MASUK',
      settlementDate: '2026-02-03',
      grossSales: 400_000,
      totalDeductions: 40_000,
      totalPayout: 360_000,
      status: 'received',
      notes: null,
      accountId: account.id,
    });

    const summary = await services.cashService.getSummary();
    expect(summary.accountCount).toBe(1);
    expect(summary.totalOpeningBalance).toBe(100_000);
    expect(summary.totalBalance).toBe(460_000);
    expect(summary.pendingSettlements).toEqual({ count: 1, amount: 180_000 });
    expect(summary.unassignedSettlements).toEqual({ count: 1, amount: 270_000 });
  });
});

describe('backup kas', () => {
  it('memutar-balik rekening dan mutasi kas pada backup versi terbaru', async () => {
    const source = await createTestContext();
    const { store } = await makeStoreAndProduct(source.services);
    const account = await source.services.cashService.createAccount({
      name: 'Rekening Backup',
      type: 'bank',
      openingBalance: 200_000,
      status: 'active',
      notes: 'Disimpan di backup',
    });
    await source.services.settlementService.create({
      storeId: store.id,
      settlementNo: 'ST-BACKUP',
      settlementDate: '2026-02-01',
      grossSales: 500_000,
      totalDeductions: 50_000,
      totalPayout: 450_000,
      status: 'received',
      notes: null,
      accountId: account.id,
    });

    const tables = await source.services.backupRepo.readAll();
    const cashEntries = tables.cash_entries!;
    const settlements = tables.settlements!;
    expect(tables.cash_accounts).toHaveLength(1);
    expect(cashEntries).toHaveLength(1);
    expect(cashEntries[0]).toMatchObject({ source_type: 'settlement', amount: 450_000 });
    expect(settlements[0]).toMatchObject({ account_id: account.id });

    const password = 'kata-sandi-kas';
    const createdAt = '2026-02-10T10:00:00.000Z';
    const envelope = await createBackupEnvelope(
      JSON.stringify({
        schemaVersion: LATEST_SCHEMA_VERSION,
        appVersion: APP_VERSION,
        createdAt,
        encryptionKey: await source.services.encryption.exportKeyBase64(),
        tables,
      }),
      password,
      createdAt,
    );
    const file = new File([JSON.stringify(envelope, null, 2)], 'kas.manka', {
      type: 'application/json',
    });

    const target = await createTestContext();
    const inspection = await target.services.backupService.inspectBackup(file, password);
    expect(inspection.schemaVersion).toBe(LATEST_SCHEMA_VERSION);
    expect(inspection.tableCounts.cash_accounts).toBe(1);
    expect(inspection.tableCounts.cash_entries).toBe(1);
    expect((envelope as BackupEnvelope).format).toBe('manka-backup');

    await target.services.backupService.restoreBackup(file, password);
    const restored = await target.services.cashService.getAccount(account.id);
    expect(restored).toMatchObject({
      name: 'Rekening Backup',
      type: 'bank',
      openingBalance: 200_000,
      balance: 650_000,
      entryCount: 1,
    });
    const entry = (await target.services.cashService.listEntries({ sourceType: 'settlement' })).items[0];
    expect(entry).toMatchObject({ direction: 'in', amount: 450_000, sourceId: settlements[0]!.id });
  });
});
