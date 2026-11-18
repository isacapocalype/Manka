import type { Database } from '@/core/database/types';
import type { FeeType, SettlementStatus } from '@/types/entities';
import type { TabularData } from '@/core/import-export/spreadsheet';
import type { FeeRepository, FeeWriteData } from '@/core/repositories/feeRepository';
import type { OrderRepository } from '@/core/repositories/orderRepository';
import type { SettlementRepository, SettlementWriteData } from '@/core/repositories/settlementRepository';
import type {
  ImportRepository,
  ImportBatchWriteData,
  ImportErrorWriteData,
} from '@/core/repositories/importRepository';
import type { StoreRepository } from '@/core/repositories/storeRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import type { CashService } from './cashService';
import { feeImportSignature } from '@/core/repositories/feeRepository';
import { parseImportDate } from './importService';
import {
  validateMappingFor,
  type ImportFieldKey,
  type ImportMapping,
} from '@/core/import-export/importFields';
import { parseMoneyInput } from '@/core/utils/money';
import { ValidationError, errorMessage } from '@/core/utils/validation';

export interface MarketplaceRowIssue {
  rowNumber: number;
  message: string;
}

interface ImportPreviewBase {
  fileName: string;
  storeId: string;
  totalRows: number;
  mappingErrors: string[];
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  successRows: number;
  duplicateRows: number;
  invalidRows: number;
  ungroupedErrors: MarketplaceRowIssue[];
}

interface ImportResultBase {
  batchId: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  skippedRows: number;
  warnings: string[];
  issues: MarketplaceRowIssue[];
}

export interface FeeImportCandidate {
  rowNumbers: number[];
  marketplaceOrderId: string;
  orderId: string | null;
  feeDate: string;
  feeType: FeeType;
  amount: number;
  notes: string | null;
  signature: string;
  issues: MarketplaceRowIssue[];
  warnings: string[];
  duplicate: boolean;
}

export interface FeeImportPreview extends ImportPreviewBase {
  candidates: FeeImportCandidate[];
  warnings: string[];
}

export interface FeeImportResult extends ImportResultBase {
  feeCount: number;
}

export interface SettlementImportCandidate {
  rowNumbers: number[];
  settlementNo: string;
  settlementDate: string;
  grossSales: number;
  totalDeductions: number;
  totalPayout: number;
  status: SettlementStatus;
  notes: string | null;
  issues: MarketplaceRowIssue[];
  warnings: string[];
  duplicate: boolean;
}

export interface SettlementImportPreview extends ImportPreviewBase {
  candidates: SettlementImportCandidate[];
  accountId: string | null;
  accountError: string | null;
  warnings: string[];
}

export interface SettlementImportResult extends ImportResultBase {
  settlementCount: number;
}

class ImportRowReader {
  private readonly row: string[];
  private readonly headerIndex: Map<string, number>;
  private readonly mapping: ImportMapping;

  constructor(row: string[], headerIndex: Map<string, number>, mapping: ImportMapping) {
    this.row = row;
    this.headerIndex = headerIndex;
    this.mapping = mapping;
  }

  get(field: ImportFieldKey): string {
    const header = this.mapping[field];
    if (!header) return '';
    const index = this.headerIndex.get(header);
    if (index === undefined) return '';
    return (this.row[index] ?? '').trim();
  }
}

function readMoney(
  raw: string,
  label: string,
  issues: MarketplaceRowIssue[],
  rowNumber: number,
  required: boolean,
  fallback = 0,
): number | null {
  if (raw.trim() === '') {
    if (required) {
      issues.push({ rowNumber, message: `${label} wajib diisi.` });
      return null;
    }
    return fallback;
  }
  const value = parseMoneyInput(raw);
  if (value === null || value < 0) {
    issues.push({ rowNumber, message: `${label} tidak valid: "${raw}".` });
    return null;
  }
  return value;
}

function parseFeeType(raw: string): FeeType | null {
  const value = raw.trim().toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (value === '') return 'other';
  if (/komisi|commission/.test(value)) return 'commission';
  if (/promo|promosi|diskon|promotion/.test(value)) return 'promotion';
  if (/transaksi|transaction/.test(value)) return 'transaction';
  if (/layanan|service/.test(value)) return 'service';
  if (/admin|administrasi/.test(value)) return 'admin';
  if (/lain|other/.test(value)) return 'other';
  return null;
}

function parseSettlementStatus(raw: string): SettlementStatus | null {
  const value = raw.trim().toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (value === '') return 'received';
  if (/diterima|received|pencairan berhasil|cair|paid|selesai|completed/.test(value)) {
    return 'received';
  }
  if (/pending|menunggu|tertunda|belum/.test(value)) return 'pending';
  return null;
}

function countPreview(base: {
  candidates: { rowNumbers: number[]; issues: MarketplaceRowIssue[]; duplicate: boolean }[];
  totalRows: number;
  ungroupedErrors: MarketplaceRowIssue[];
}): Pick<ImportPreviewBase, 'validCount' | 'duplicateCount' | 'invalidCount' | 'successRows' | 'duplicateRows' | 'invalidRows'> {
  const valid = base.candidates.filter((item) => item.issues.length === 0 && !item.duplicate);
  const duplicates = base.candidates.filter((item) => item.issues.length === 0 && item.duplicate);
  const invalid = base.candidates.filter((item) => item.issues.length > 0);
  return {
    validCount: valid.length,
    duplicateCount: duplicates.length,
    invalidCount: invalid.length,
    successRows: valid.reduce((total, item) => total + item.rowNumbers.length, 0),
    duplicateRows: duplicates.reduce((total, item) => total + item.rowNumbers.length, 0),
    invalidRows:
      invalid.reduce((total, item) => total + item.rowNumbers.length, 0) +
      base.ungroupedErrors.length,
  };
}

export class MarketplaceImportService {
  private readonly db: Database;
  private readonly stores: StoreRepository;
  private readonly orders: OrderRepository;
  private readonly fees: FeeRepository;
  private readonly settlements: SettlementRepository;
  private readonly imports: ImportRepository;
  private readonly cash: CashService;
  private readonly audit: AuditRepository;

  constructor(
    db: Database,
    stores: StoreRepository,
    orders: OrderRepository,
    fees: FeeRepository,
    settlements: SettlementRepository,
    imports: ImportRepository,
    cash: CashService,
    audit: AuditRepository,
  ) {
    this.db = db;
    this.stores = stores;
    this.orders = orders;
    this.fees = fees;
    this.settlements = settlements;
    this.imports = imports;
    this.cash = cash;
    this.audit = audit;
  }

  private async requireStore(storeId: string | null): Promise<void> {
    if (!storeId) {
      throw new ValidationError('Pilih toko tujuan import.', {
        storeId: 'Toko tujuan import wajib dipilih.',
      });
    }
    const store = await this.stores.getPublic(storeId);
    if (!store) {
      throw new ValidationError('Toko tidak ditemukan.', { storeId: 'Pilih toko yang valid.' });
    }
  }

  async previewFees(
    tabular: TabularData,
    mapping: ImportMapping,
    storeId: string | null,
  ): Promise<FeeImportPreview> {
    await this.requireStore(storeId);
    const mappingErrors = validateMappingFor(mapping, tabular.headers, 'fees');
    if (mappingErrors.length > 0) {
      return {
        fileName: tabular.fileName,
        storeId: storeId as string,
        totalRows: tabular.rows.length,
        candidates: [],
        mappingErrors,
        ...countPreview({ candidates: [], totalRows: tabular.rows.length, ungroupedErrors: [] }),
        ungroupedErrors: [],
        warnings: [],
      };
    }

    const headerIndex = new Map(tabular.headers.map((header, index) => [header, index]));
    const orderIds = tabular.rows
      .map((row) => new ImportRowReader(row.values, headerIndex, mapping).get('orderId'))
      .filter((value) => value !== '');
    const [orderInfos, existingSignatures] = await Promise.all([
      this.orders.findImportOrderInfo(storeId as string, orderIds),
      this.fees.findImportSignatures(storeId as string),
    ]);
    const seen = new Set<string>();
    const candidates: FeeImportCandidate[] = [];
    const ungroupedErrors: MarketplaceRowIssue[] = [];

    for (const row of tabular.rows) {
      const reader = new ImportRowReader(row.values, headerIndex, mapping);
      const marketplaceOrderId = reader.get('orderId');
      if (marketplaceOrderId === '') {
        ungroupedErrors.push({ rowNumber: row.rowNumber, message: 'Nomor pesanan kosong.' });
        continue;
      }
      const issues: MarketplaceRowIssue[] = [];
      const orderInfo = orderInfos.get(marketplaceOrderId);
      if (!orderInfo) {
        issues.push({
          rowNumber: row.rowNumber,
          message: `Pesanan "${marketplaceOrderId}" tidak ditemukan pada toko ini. Import pesanan terlebih dahulu.`,
        });
      }
      const amount = readMoney(
        reader.get('feeAmount'),
        'Nominal biaya',
        issues,
        row.rowNumber,
        true,
      );
      const feeType = parseFeeType(reader.get('feeType'));
      if (feeType === null) {
        issues.push({
          rowNumber: row.rowNumber,
          message: `Jenis biaya tidak dikenali: "${reader.get('feeType')}".`,
        });
      }
      const rawDate = reader.get('feeDate');
      let feeDate = rawDate === '' ? null : parseImportDate(rawDate);
      if (rawDate !== '' && !feeDate) {
        issues.push({
          rowNumber: row.rowNumber,
          message: `Tanggal biaya tidak valid: "${rawDate}". Gunakan YYYY-MM-DD atau DD/MM/YYYY.`,
        });
      }
      feeDate = feeDate ?? orderInfo?.orderDate ?? null;
      if (!feeDate) {
        issues.push({ rowNumber: row.rowNumber, message: 'Tanggal biaya tidak dapat ditentukan.' });
      }
      const notes = reader.get('notes') || null;
      const signature = feeImportSignature(
        orderInfo?.id ?? marketplaceOrderId,
        feeType ?? 'other',
        amount ?? 0,
        feeDate ?? '',
      );
      const duplicate = existingSignatures.has(signature) || seen.has(signature);
      seen.add(signature);
      candidates.push({
        rowNumbers: [row.rowNumber],
        marketplaceOrderId,
        orderId: orderInfo?.id ?? null,
        feeDate: feeDate ?? '',
        feeType: feeType ?? 'other',
        amount: amount ?? 0,
        notes,
        signature,
        issues,
        warnings: [],
        duplicate,
      });
    }

    return {
      fileName: tabular.fileName,
      storeId: storeId as string,
      totalRows: tabular.rows.length,
      candidates,
      mappingErrors,
      ...countPreview({ candidates, totalRows: tabular.rows.length, ungroupedErrors }),
      ungroupedErrors,
      warnings: candidates.flatMap((candidate) => candidate.warnings),
    };
  }

  async executeFees(preview: FeeImportPreview): Promise<FeeImportResult> {
    if (preview.mappingErrors.length > 0) {
      throw new ValidationError('Mapping kolom masih bermasalah.', {
        mapping: preview.mappingErrors.join(' '),
      });
    }
    await this.requireStore(preview.storeId);
    const valid = preview.candidates.filter(
      (candidate) => candidate.issues.length === 0 && !candidate.duplicate,
    ).filter((candidate) => candidate.orderId !== null);
    const invalid = preview.candidates.filter((candidate) => candidate.issues.length > 0);
    const duplicateCandidates = preview.candidates.filter(
      (candidate) => candidate.duplicate && candidate.issues.length === 0,
    );
    const existingSignatures = await this.fees.findImportSignatures(preview.storeId);
    const toInsert = valid.filter((candidate) => !existingSignatures.has(candidate.signature));
    const skipped = [...duplicateCandidates, ...valid.filter((candidate) => !toInsert.includes(candidate))];

    const errors: ImportErrorWriteData[] = [
      ...preview.ungroupedErrors.map((issue) => ({
        rowNumber: issue.rowNumber,
        message: issue.message,
        rawData: null,
      })),
      ...invalid.flatMap((candidate) =>
        candidate.issues.map((issue) => ({
          rowNumber: issue.rowNumber,
          message: issue.message,
          rawData: null,
        })),
      ),
    ];
    const successRows = toInsert.reduce(
      (total, candidate) => total + candidate.rowNumbers.length,
      0,
    );
    const skippedRows = skipped.reduce(
      (total, candidate) => total + candidate.rowNumbers.length,
      0,
    );
    const warnings = preview.candidates.flatMap((candidate) => candidate.warnings);

    const batchId = await this.db.transaction(async (tx) => {
      for (const candidate of toInsert) {
        const data: FeeWriteData = {
          storeId: preview.storeId,
          orderId: candidate.orderId,
          feeType: candidate.feeType,
          amount: candidate.amount,
          feeDate: candidate.feeDate,
          source: 'actual',
          notes: candidate.notes
            ? `Biaya dari import laporan fee. ${candidate.notes}`
            : 'Biaya dari import laporan fee',
        };
        await this.fees.create(data, tx);
      }
      const batchData: ImportBatchWriteData = {
        importType: 'fees',
        fileName: preview.fileName,
        totalRows: preview.totalRows,
        successRows,
        failedRows: preview.invalidRows,
        skippedRows,
        notes: `${toInsert.length} biaya marketplace dibuat dari laporan.`,
      };
      const createdBatchId = await this.imports.createBatch(batchData, tx);
      if (errors.length > 0) {
        await this.imports.addErrors(createdBatchId, errors.slice(0, 1000), tx);
      }
      return createdBatchId;
    });

    await this.audit.log('import', 'marketplace_fee', null, {
      batchId,
      storeId: preview.storeId,
      successRows,
      failedRows: preview.invalidRows,
      skippedRows,
      fees: toInsert.length,
    });

    return {
      batchId,
      totalRows: preview.totalRows,
      successRows,
      failedRows: preview.invalidRows,
      skippedRows,
      feeCount: toInsert.length,
      warnings,
      issues: [
        ...preview.ungroupedErrors,
        ...invalid.flatMap((candidate) => candidate.issues),
      ],
    };
  }

  async previewSettlements(
    tabular: TabularData,
    mapping: ImportMapping,
    storeId: string | null,
    accountId: string | null,
  ): Promise<SettlementImportPreview> {
    await this.requireStore(storeId);
    const mappingErrors = validateMappingFor(mapping, tabular.headers, 'settlements');
    let accountError: string | null = null;
    if (accountId) {
      try {
        await this.cash.requireAccount(accountId, 'accountId');
      } catch (error) {
        accountError = errorMessage(error);
      }
    }

    if (mappingErrors.length > 0) {
      return {
        fileName: tabular.fileName,
        storeId: storeId as string,
        accountId,
        accountError,
        totalRows: tabular.rows.length,
        candidates: [],
        mappingErrors,
        ...countPreview({ candidates: [], totalRows: tabular.rows.length, ungroupedErrors: [] }),
        ungroupedErrors: [],
        warnings: [],
      };
    }

    const headerIndex = new Map(tabular.headers.map((header, index) => [header, index]));
    const numbers = tabular.rows
      .map((row) => new ImportRowReader(row.values, headerIndex, mapping).get('settlementNo'))
      .filter((value) => value !== '');
    const existingNumbers = await this.settlements.findExistingNumbers(storeId as string, numbers);
    const seen = new Set<string>();
    const candidates: SettlementImportCandidate[] = [];
    const ungroupedErrors: MarketplaceRowIssue[] = [];

    for (const row of tabular.rows) {
      const reader = new ImportRowReader(row.values, headerIndex, mapping);
      const settlementNo = reader.get('settlementNo');
      if (settlementNo === '') {
        ungroupedErrors.push({ rowNumber: row.rowNumber, message: 'Nomor settlement kosong.' });
        continue;
      }
      const issues: MarketplaceRowIssue[] = [];
      const warnings: string[] = [];
      const rawDate = reader.get('settlementDate');
      const settlementDate = parseImportDate(rawDate);
      if (!settlementDate) {
        issues.push({
          rowNumber: row.rowNumber,
          message: `Tanggal settlement tidak valid: "${rawDate || '(kosong)'}". Gunakan YYYY-MM-DD atau DD/MM/YYYY.`,
        });
      }
      const totalPayout = readMoney(
        reader.get('totalPayout'),
        'Total pencairan',
        issues,
        row.rowNumber,
        true,
      );
      let totalDeductions = readMoney(
        reader.get('totalDeductions'),
        'Total potongan',
        issues,
        row.rowNumber,
        false,
        0,
      );
      let grossSales = readMoney(
        reader.get('grossSales'),
        'Total penjualan',
        issues,
        row.rowNumber,
        false,
        0,
      );
      if (totalDeductions === null) totalDeductions = 0;
      if (grossSales === null) grossSales = 0;
      const hasGrossColumn = Boolean(mapping.grossSales);
      const hasGrossValue = reader.get('grossSales') !== '';
      if ((!hasGrossColumn || !hasGrossValue) && totalPayout !== null) {
        grossSales = totalPayout + totalDeductions;
      }
      if (
        hasGrossValue &&
        totalPayout !== null &&
        grossSales - totalDeductions !== totalPayout
      ) {
        warnings.push(
          `Baris ${row.rowNumber}: total pencairan (${totalPayout}) tidak sama dengan penjualan dikurangi potongan (${grossSales - totalDeductions}). Periksa kembali laporan.`,
        );
      }
      const status = parseSettlementStatus(reader.get('settlementStatus'));
      if (status === null) {
        issues.push({
          rowNumber: row.rowNumber,
          message: `Status settlement tidak dikenali: "${reader.get('settlementStatus')}".`,
        });
      }
      const resolvedStatus = status ?? 'received';
      if (resolvedStatus === 'received' && !accountId) {
        accountError = 'Pilih rekening tujuan untuk settlement berstatus diterima.';
      }
      const notes = reader.get('notes') || null;
      const duplicate = existingNumbers.has(settlementNo) || seen.has(settlementNo);
      seen.add(settlementNo);
      candidates.push({
        rowNumbers: [row.rowNumber],
        settlementNo,
        settlementDate: settlementDate ?? '',
        grossSales,
        totalDeductions,
        totalPayout: totalPayout ?? 0,
        status: resolvedStatus,
        notes,
        issues,
        warnings,
        duplicate,
      });
    }

    return {
      fileName: tabular.fileName,
      storeId: storeId as string,
      accountId,
      accountError,
      totalRows: tabular.rows.length,
      candidates,
      mappingErrors,
      ...countPreview({ candidates, totalRows: tabular.rows.length, ungroupedErrors }),
      ungroupedErrors,
      warnings: candidates.flatMap((candidate) => candidate.warnings),
    };
  }

  async executeSettlements(preview: SettlementImportPreview): Promise<SettlementImportResult> {
    if (preview.mappingErrors.length > 0) {
      throw new ValidationError('Mapping kolom masih bermasalah.', {
        mapping: preview.mappingErrors.join(' '),
      });
    }
    if (preview.accountError) {
      throw new ValidationError(preview.accountError, { accountId: preview.accountError });
    }
    await this.requireStore(preview.storeId);
    if (preview.accountId) {
      await this.cash.requireAccount(preview.accountId, 'accountId');
    }
    const valid = preview.candidates.filter(
      (candidate) => candidate.issues.length === 0 && !candidate.duplicate,
    );
    const invalid = preview.candidates.filter((candidate) => candidate.issues.length > 0);
    const duplicateCandidates = preview.candidates.filter(
      (candidate) => candidate.duplicate && candidate.issues.length === 0,
    );
    const existingNumbers = await this.settlements.findExistingNumbers(
      preview.storeId,
      valid.map((candidate) => candidate.settlementNo),
    );
    const toInsert = valid.filter(
      (candidate) =>
        !existingNumbers.has(candidate.settlementNo) &&
        (candidate.status !== 'received' || Boolean(preview.accountId)),
    );
    const skipped = [
      ...duplicateCandidates,
      ...valid.filter((candidate) => !toInsert.includes(candidate)),
    ];
    const errors: ImportErrorWriteData[] = [
      ...preview.ungroupedErrors.map((issue) => ({
        rowNumber: issue.rowNumber,
        message: issue.message,
        rawData: null,
      })),
      ...invalid.flatMap((candidate) =>
        candidate.issues.map((issue) => ({
          rowNumber: issue.rowNumber,
          message: issue.message,
          rawData: null,
        })),
      ),
    ];
    const successRows = toInsert.reduce(
      (total, candidate) => total + candidate.rowNumbers.length,
      0,
    );
    const skippedRows = skipped.reduce(
      (total, candidate) => total + candidate.rowNumbers.length,
      0,
    );
    const warnings = preview.candidates.flatMap((candidate) => candidate.warnings);

    const batchId = await this.db.transaction(async (tx) => {
      for (const candidate of toInsert) {
        const data: SettlementWriteData = {
          storeId: preview.storeId,
          settlementNo: candidate.settlementNo,
          settlementDate: candidate.settlementDate,
          grossSales: candidate.grossSales,
          totalDeductions: candidate.totalDeductions,
          totalPayout: candidate.totalPayout,
          status: candidate.status,
          notes: candidate.notes,
          accountId: candidate.status === 'received' ? preview.accountId : null,
        };
        const settlementId = await this.settlements.create(data, tx);
        await this.cash.syncSettlement(settlementId, data, tx);
      }
      const batchData: ImportBatchWriteData = {
        importType: 'settlements',
        fileName: preview.fileName,
        totalRows: preview.totalRows,
        successRows,
        failedRows: preview.invalidRows,
        skippedRows,
        notes: [
          `${toInsert.length} settlement dibuat dari laporan pencairan.`,
          preview.accountId ? 'Pencairan diterima diposting ke rekening tujuan.' : null,
        ]
          .filter((value): value is string => value !== null)
          .join(' '),
      };
      const createdBatchId = await this.imports.createBatch(batchData, tx);
      if (errors.length > 0) {
        await this.imports.addErrors(createdBatchId, errors.slice(0, 1000), tx);
      }
      return createdBatchId;
    });

    await this.audit.log('import', 'settlement', null, {
      batchId,
      storeId: preview.storeId,
      successRows,
      failedRows: preview.invalidRows,
      skippedRows,
      settlements: toInsert.length,
      accountId: preview.accountId,
    });

    return {
      batchId,
      totalRows: preview.totalRows,
      successRows,
      failedRows: preview.invalidRows,
      skippedRows,
      settlementCount: toInsert.length,
      warnings,
      issues: [
        ...preview.ungroupedErrors,
        ...invalid.flatMap((candidate) => candidate.issues),
      ],
    };
  }
}
