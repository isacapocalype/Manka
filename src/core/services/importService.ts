import type { Database } from '@/core/database/types';
import type { OrderStatus } from '@/types/entities';
import type { OrderItemCreateData } from '@/core/repositories/orderRepository';
import type { TabularData } from '@/core/import-export/spreadsheet';
import type { OrderRepository } from '@/core/repositories/orderRepository';
import type { ProductRepository } from '@/core/repositories/productRepository';
import type { StoreRepository } from '@/core/repositories/storeRepository';
import type { FeeRepository } from '@/core/repositories/feeRepository';
import type { RefundRepository } from '@/core/repositories/refundRepository';
import type { ImportRepository } from '@/core/repositories/importRepository';
import type { AuditRepository } from '@/core/repositories/auditRepository';
import type { ImportBatchWriteData, ImportErrorWriteData } from '@/core/repositories/importRepository';
import { isValidBusinessDate } from '@/core/utils/date';
import { parseIntegerInput, parseMoneyInput } from '@/core/utils/money';
import { ValidationError } from '@/core/utils/validation';

export type OrderImportFieldKey =
  | 'orderId'
  | 'orderDate'
  | 'status'
  | 'productName'
  | 'sku'
  | 'quantity'
  | 'unitPrice'
  | 'hpp'
  | 'sellerDiscount'
  | 'marketplaceDiscount'
  | 'shippingPaid'
  | 'marketplaceFee'
  | 'refundAmount'
  | 'refundQuantity'
  | 'notes';

export interface ImportFieldDefinition {
  key: OrderImportFieldKey;
  label: string;
  required: boolean;
  help: string;
  aliases: string[];
}

export const ORDER_IMPORT_FIELDS: readonly ImportFieldDefinition[] = [
  {
    key: 'orderId',
    label: 'Nomor pesanan',
    required: true,
    help: 'Nomor pesanan unik dari marketplace.',
    aliases: ['order id', 'order_id', 'no pesanan', 'nomor pesanan', 'no. pesanan', 'order no', 'id pesanan'],
  },
  {
    key: 'orderDate',
    label: 'Tanggal pesanan',
    required: true,
    help: 'Tanggal pesanan (YYYY-MM-DD atau DD/MM/YYYY).',
    aliases: ['tanggal pesanan', 'order date', 'tanggal', 'waktu pesanan', 'created at', 'order time'],
  },
  {
    key: 'status',
    label: 'Status',
    required: true,
    help: 'Status marketplace akan dipetakan ke status internal.',
    aliases: ['status pesanan', 'status', 'order status', 'status order'],
  },
  {
    key: 'productName',
    label: 'Nama produk',
    required: false,
    help: 'Nama produk pada baris pesanan. Wajib jika SKU tidak diisi.',
    aliases: ['nama produk', 'product name', 'produk', 'item name', 'nama item'],
  },
  {
    key: 'sku',
    label: 'SKU',
    required: false,
    help: 'SKU produk. Wajib jika nama produk tidak diisi.',
    aliases: ['sku', 'seller sku', 'sku produk', 'product sku'],
  },
  {
    key: 'quantity',
    label: 'Kuantitas',
    required: true,
    help: 'Jumlah barang pada baris.',
    aliases: ['kuantitas', 'quantity', 'qty', 'jumlah', 'jumlah barang'],
  },
  {
    key: 'unitPrice',
    label: 'Harga satuan',
    required: true,
    help: 'Harga jual per barang sebelum potongan.',
    aliases: ['harga satuan', 'unit price', 'harga', 'price', 'harga jual'],
  },
  {
    key: 'hpp',
    label: 'HPP',
    required: false,
    help: 'Opsional. Jika kosong, HPP diambil dari master produk. Jika produk tidak ditemukan, HPP dianggap 0 dan diberi peringatan.',
    aliases: ['hpp', 'modal', 'cost', 'harga modal'],
  },
  {
    key: 'sellerDiscount',
    label: 'Diskon penjual',
    required: false,
    help: 'Diskon yang ditanggung penjual. Nilai pesanan, bukan per baris.',
    aliases: ['diskon penjual', 'seller discount', 'diskon toko'],
  },
  {
    key: 'marketplaceDiscount',
    label: 'Diskon marketplace',
    required: false,
    help: 'Diskon yang ditanggung marketplace. Tidak mengurangi pendapatan penjual.',
    aliases: ['diskon marketplace', 'marketplace discount', 'diskon platform'],
  },
  {
    key: 'shippingPaid',
    label: 'Ongkir dibayar pembeli',
    required: false,
    help: 'Nilai ongkir yang dibayar pembeli, jika ada.',
    aliases: ['ongkir', 'shipping', 'ongkos kirim', 'shipping fee'],
  },
  {
    key: 'marketplaceFee',
    label: 'Biaya marketplace',
    required: false,
    help: 'Biaya aktual per pesanan. Akan disimpan sebagai biaya marketplace aktual.',
    aliases: ['biaya marketplace', 'marketplace fee', 'biaya admin', 'commission', 'fee', 'biaya layanan'],
  },
  {
    key: 'refundAmount',
    label: 'Nilai refund',
    required: false,
    help: 'Jika diisi, refund aktual akan dicatat untuk pesanan ini.',
    aliases: ['refund', 'nominal refund', 'pengembalian dana', 'refund amount'],
  },
  {
    key: 'refundQuantity',
    label: 'Jumlah barang refund',
    required: false,
    help: 'Opsional. Default memakai seluruh kuantitas pesanan.',
    aliases: ['jumlah refund', 'refund quantity', 'qty refund'],
  },
  {
    key: 'notes',
    label: 'Catatan',
    required: false,
    help: 'Catatan tambahan untuk pesanan.',
    aliases: ['catatan', 'notes', 'remark', 'keterangan'],
  },
];

export type OrderImportMapping = Record<OrderImportFieldKey, string | null>;

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function autoDetectMapping(headers: string[]): OrderImportMapping {
  const mapping = Object.fromEntries(
    ORDER_IMPORT_FIELDS.map((field) => [field.key, null]),
  ) as OrderImportMapping;
  const used = new Set<string>();
  for (const field of ORDER_IMPORT_FIELDS) {
    const match = headers.find((header) => {
      if (used.has(header)) return false;
      const normalized = normalizeHeader(header);
      return field.aliases.some((alias) => normalized === alias || normalized.includes(alias));
    });
    if (match) {
      mapping[field.key] = match;
      used.add(match);
    }
  }
  return mapping;
}

export function validateMapping(mapping: OrderImportMapping, headers: string[]): string[] {
  const errors: string[] = [];
  const headerSet = new Set(headers);
  const used = new Map<string, string>();
  for (const field of ORDER_IMPORT_FIELDS) {
    const header = mapping[field.key];
    if (header !== null && !headerSet.has(header)) {
      errors.push(`Kolom "${header}" untuk ${field.label} tidak ditemukan.`);
    }
    if (header !== null) {
      const existing = used.get(header);
      if (existing) {
        errors.push(`Kolom "${header}" dipetakan ke lebih dari satu field (${existing} dan ${field.label}).`);
      } else {
        used.set(header, field.label);
      }
    }
  }
  for (const field of ORDER_IMPORT_FIELDS) {
    if (field.required && mapping[field.key] === null) {
      errors.push(`${field.label} wajib dipetakan.`);
    }
  }
  if (mapping.productName === null && mapping.sku === null) {
    errors.push('Pilih minimal salah satu kolom Nama produk atau SKU.');
  }
  return errors;
}

export interface ImportRowIssue {
  rowNumber: number;
  message: string;
}

export interface ImportOrderCandidate {
  key: string;
  rowNumbers: number[];
  orderId: string;
  orderDate: string;
  status: OrderStatus;
  items: OrderItemCreateData[];
  sellerDiscount: number;
  marketplaceDiscount: number;
  shippingPaid: number;
  marketplaceFee: number;
  refundAmount: number;
  refundQuantity: number;
  notes: string | null;
  issues: ImportRowIssue[];
  warnings: string[];
  duplicate: boolean;
}

export interface OrderImportPreview {
  fileName: string;
  storeId: string;
  totalRows: number;
  candidates: ImportOrderCandidate[];
  headerIndex: Map<string, number>;
  mappingErrors: string[];
  validCount: number;
  duplicateCount: number;
  invalidCount: number;
  warningCount: number;
  successRows: number;
  duplicateRows: number;
  invalidRows: number;
  ungroupedErrors: ImportRowIssue[];
}

export interface ImportExecutionResult {
  batchId: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  skippedRows: number;
  orderCount: number;
  warnings: string[];
  issues: ImportRowIssue[];
}

class RowValueReader {
  private readonly row: string[];
  private readonly headerIndex: Map<string, number>;
  private readonly mapping: OrderImportMapping;

  constructor(row: string[], headerIndex: Map<string, number>, mapping: OrderImportMapping) {
    this.row = row;
    this.headerIndex = headerIndex;
    this.mapping = mapping;
  }

  get(field: OrderImportFieldKey): string {
    const header = this.mapping[field];
    if (!header) return '';
    const index = this.headerIndex.get(header);
    if (index === undefined) return '';
    return (this.row[index] ?? '').trim();
  }

  has(field: OrderImportFieldKey): boolean {
    return this.get(field) !== '';
  }
}

function parseImportDate(raw: string): string | null {
  const value = raw.trim();
  if (value === '') return null;
  const isoMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(value);
  if (isoMatch) {
    const date = `${isoMatch[1]}-${(isoMatch[2] ?? '').padStart(2, '0')}-${(isoMatch[3] ?? '').padStart(2, '0')}`;
    return isValidBusinessDate(date) ? date : null;
  }
  const localMatch = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(value);
  if (localMatch) {
    let day = Number(localMatch[1]);
    let month = Number(localMatch[2]);
    const year = Number(localMatch[3]);
    if (day > 12 && month <= 12) {
      // sudah DD/MM
    } else if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    }
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return isValidBusinessDate(date) ? date : null;
  }
  return null;
}

function parseStatus(raw: string): OrderStatus | null {
  const value = raw.trim().toLowerCase();
  if (value === '') return null;
  const normalized = value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const map: Record<string, OrderStatus> = {
    pending: 'pending',
    menunggu: 'pending',
    'belum bayar': 'pending',
    unpaid: 'pending',
    processing: 'processing',
    diproses: 'processing',
    'siap kirim': 'processing',
    'ready to ship': 'processing',
    shipped: 'shipped',
    dikirim: 'shipped',
    'in transit': 'shipped',
    delivered: 'delivered',
    terkirim: 'delivered',
    diterima: 'delivered',
    completed: 'completed',
    selesai: 'completed',
    'pesanan selesai': 'completed',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    batal: 'cancelled',
    dibatalkan: 'cancelled',
    returned: 'returned',
    retur: 'returned',
    dikembalikan: 'returned',
    refunded: 'refunded',
    refund: 'refunded',
    'dana dikembalikan': 'refunded',
  };
  return map[normalized] ?? null;
}

function parseNumber(raw: string, label: string, issues: ImportRowIssue[], rowNumber: number): number {
  if (raw.trim() === '') return 0;
  const value = parseMoneyInput(raw);
  if (value === null || value < 0) {
    issues.push({ rowNumber, message: `${label} tidak valid: "${raw}".` });
    return 0;
  }
  return value;
}

function collectOrderValue(
  rows: { rowNumber: number; row: string[] }[],
  field: OrderImportFieldKey,
  headerIndex: Map<string, number>,
  mapping: OrderImportMapping,
  label: string,
  issues: ImportRowIssue[],
): string {
  const values = rows
    .map(({ row }) => new RowValueReader(row, headerIndex, mapping).get(field))
    .filter((value) => value !== '');
  if (values.length === 0) return '';
  const unique = [...new Set(values)];
  if (unique.length > 1) {
    issues.push({
      rowNumber: rows[0]?.rowNumber ?? 1,
      message: `Nilai ${label} berbeda antar baris dalam pesanan yang sama.`,
    });
  }
  return unique[0] ?? '';
}

export class OrderImportService {
  private readonly db: Database;
  private readonly orders: OrderRepository;
  private readonly products: ProductRepository;
  private readonly stores: StoreRepository;
  private readonly fees: FeeRepository;
  private readonly refunds: RefundRepository;
  private readonly imports: ImportRepository;
  private readonly audit: AuditRepository;

  constructor(
    db: Database,
    orders: OrderRepository,
    products: ProductRepository,
    stores: StoreRepository,
    fees: FeeRepository,
    refunds: RefundRepository,
    imports: ImportRepository,
    audit: AuditRepository,
  ) {
    this.db = db;
    this.orders = orders;
    this.products = products;
    this.stores = stores;
    this.fees = fees;
    this.refunds = refunds;
    this.imports = imports;
    this.audit = audit;
  }

  async preview(
    tabular: TabularData,
    mapping: OrderImportMapping,
    storeId: string | null,
  ): Promise<OrderImportPreview> {
    if (!storeId) {
      throw new ValidationError('Pilih toko tujuan import.', {
        storeId: 'Toko tujuan import wajib dipilih.',
      });
    }
    const store = await this.stores.getPublic(storeId);
    if (!store) {
      throw new ValidationError('Toko tidak ditemukan.', { storeId: 'Pilih toko yang valid.' });
    }
    const mappingErrors = validateMapping(mapping, tabular.headers);
    if (mappingErrors.length > 0) {
      return {
        fileName: tabular.fileName,
        storeId,
        totalRows: tabular.rows.length,
        candidates: [],
        headerIndex: new Map(tabular.headers.map((header, index) => [header, index])),
        mappingErrors,
        validCount: 0,
        duplicateCount: 0,
        invalidCount: 0,
        warningCount: 0,
        successRows: 0,
        duplicateRows: 0,
        invalidRows: 0,
        ungroupedErrors: [],
      };
    }

    const headerIndex = new Map(tabular.headers.map((header, index) => [header, index]));
    const groups = new Map<string, { rowNumber: number; row: string[] }[]>();
    const ungroupedErrors: ImportRowIssue[] = [];

    for (const row of tabular.rows) {
      const reader = new RowValueReader(row.values, headerIndex, mapping);
      const orderId = reader.get('orderId');
      if (orderId === '') {
        ungroupedErrors.push({
          rowNumber: row.rowNumber,
          message: 'Nomor pesanan kosong.',
        });
        continue;
      }
      const group = groups.get(orderId) ?? [];
      group.push({ rowNumber: row.rowNumber, row: row.values });
      groups.set(orderId, group);
    }

    const existing = await this.orders.findExistingMarketplaceIds(storeId, [...groups.keys()]);
    const productCache = new Map<string, { id: string | null; name: string; sku: string; cost: number }>();
    const candidates: ImportOrderCandidate[] = [];

    for (const [orderId, rows] of groups) {
      const issues: ImportRowIssue[] = [];
      const warnings: string[] = [];
      const rowNumbers = rows.map((row) => row.rowNumber);
      const firstRowNumber = rowNumbers[0] ?? 1;
      const dateRaw = collectOrderValue(rows, 'orderDate', headerIndex, mapping, 'tanggal pesanan', issues);
      const orderDate = parseImportDate(dateRaw);
      if (!orderDate) {
        issues.push({
          rowNumber: firstRowNumber,
          message: `Tanggal pesanan tidak valid: "${dateRaw || '(kosong)'}". Gunakan YYYY-MM-DD atau DD/MM/YYYY.`,
        });
      }
      const statusRaw = collectOrderValue(rows, 'status', headerIndex, mapping, 'status', issues);
      const status = parseStatus(statusRaw);
      if (!status) {
        issues.push({
          rowNumber: firstRowNumber,
          message: `Status pesanan tidak dikenali: "${statusRaw || '(kosong)'}".`,
        });
      }
      const sellerDiscount = parseNumber(
        collectOrderValue(rows, 'sellerDiscount', headerIndex, mapping, 'diskon penjual', issues),
        'Diskon penjual',
        issues,
        firstRowNumber,
      );
      const marketplaceDiscount = parseNumber(
        collectOrderValue(rows, 'marketplaceDiscount', headerIndex, mapping, 'diskon marketplace', issues),
        'Diskon marketplace',
        issues,
        firstRowNumber,
      );
      const shippingPaid = parseNumber(
        collectOrderValue(rows, 'shippingPaid', headerIndex, mapping, 'ongkir', issues),
        'Ongkir',
        issues,
        firstRowNumber,
      );
      const marketplaceFee = parseNumber(
        collectOrderValue(rows, 'marketplaceFee', headerIndex, mapping, 'biaya marketplace', issues),
        'Biaya marketplace',
        issues,
        firstRowNumber,
      );
      const refundAmount = parseNumber(
        collectOrderValue(rows, 'refundAmount', headerIndex, mapping, 'refund', issues),
        'Nilai refund',
        issues,
        firstRowNumber,
      );
      const refundQuantityRaw = collectOrderValue(
        rows,
        'refundQuantity',
        headerIndex,
        mapping,
        'jumlah barang refund',
        issues,
      );
      const notes = collectOrderValue(rows, 'notes', headerIndex, mapping, 'catatan', issues) || null;

      const items: OrderItemCreateData[] = [];
      let totalQuantity = 0;
      for (const { rowNumber, row } of rows) {
        const reader = new RowValueReader(row, headerIndex, mapping);
        const productName = reader.get('productName');
        const rawSku = reader.get('sku');
        const quantityRaw = reader.get('quantity');
        const priceRaw = reader.get('unitPrice');
        const hppRaw = reader.get('hpp');
        const quantity = parseIntegerInput(quantityRaw) ?? 0;
        const unitPrice = parseMoneyInput(priceRaw) ?? NaN;
        let lineValid = true;

        if (productName === '' && rawSku === '') {
          issues.push({ rowNumber, message: 'Nama produk atau SKU wajib diisi.' });
          lineValid = false;
        }
        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
          issues.push({ rowNumber, message: `Kuantitas tidak valid: "${quantityRaw}".` });
          lineValid = false;
        }
        if (!Number.isSafeInteger(unitPrice) || unitPrice < 0) {
          issues.push({ rowNumber, message: `Harga satuan tidak valid: "${priceRaw}".` });
          lineValid = false;
        }
        if (!lineValid) continue;

        const cacheKey = (rawSku || productName).toLowerCase();
        let product = productCache.get(cacheKey);
        if (!product) {
          const matched = rawSku
            ? await this.products.getBySku(rawSku)
            : await this.products.getByName(productName);
          product = matched
            ? { id: matched.id, name: matched.name, sku: matched.sku, cost: matched.currentCost }
            : { id: null, name: productName, sku: rawSku, cost: 0 };
          productCache.set(cacheKey, product);
        }

        let hppSnapshot = product.cost;
        if (hppRaw !== '') {
          const parsedHpp = parseMoneyInput(hppRaw);
          if (parsedHpp === null || parsedHpp < 0) {
            issues.push({ rowNumber, message: `HPP tidak valid: "${hppRaw}".` });
            continue;
          }
          hppSnapshot = parsedHpp;
        } else if (product.id === null) {
          warnings.push(
            `Produk "${productName || rawSku}" tidak ditemukan di master produk. HPP baris ${rowNumber} dianggap 0.`,
          );
        }

        items.push({
          productId: product.id,
          productName: product.name || productName || rawSku,
          sku: product.sku || rawSku || productName,
          quantity,
          unitPrice,
          hppSnapshot,
        });
        totalQuantity += quantity;
      }

      if (items.length === 0) {
        issues.push({ rowNumber: firstRowNumber, message: 'Pesanan tidak memiliki item yang valid.' });
      }

      let refundQuantity = 0;
      if (refundAmount > 0) {
        if (refundQuantityRaw !== '') {
          const parsed = parseIntegerInput(refundQuantityRaw);
          if (parsed === null || parsed <= 0) {
            issues.push({ rowNumber: firstRowNumber, message: `Jumlah barang refund tidak valid: "${refundQuantityRaw}".` });
          } else {
            refundQuantity = parsed;
          }
        } else {
          refundQuantity = totalQuantity;
        }
        if (refundQuantity > totalQuantity) {
          issues.push({
            rowNumber: firstRowNumber,
            message: `Jumlah barang refund (${refundQuantity}) melebihi jumlah barang pesanan (${totalQuantity}).`,
          });
        }
        const gross = items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
        if (refundAmount > gross) {
          issues.push({
            rowNumber: firstRowNumber,
            message: `Nilai refund (${refundAmount}) melebihi nilai pesanan (${gross}).`,
          });
        }
      }

      const duplicate = existing.has(orderId);
      candidates.push({
        key: orderId,
        rowNumbers,
        orderId,
        orderDate: orderDate ?? '',
        status: status ?? 'pending',
        items,
        sellerDiscount,
        marketplaceDiscount,
        shippingPaid,
        marketplaceFee,
        refundAmount,
        refundQuantity,
        notes,
        issues,
        warnings,
        duplicate,
      });
    }

    const valid = candidates.filter((candidate) => candidate.issues.length === 0 && !candidate.duplicate);
    const duplicates = candidates.filter((candidate) => candidate.issues.length === 0 && candidate.duplicate);
    const invalid = candidates.filter((candidate) => candidate.issues.length > 0);
    return {
      fileName: tabular.fileName,
      storeId,
      totalRows: tabular.rows.length,
      candidates,
      headerIndex,
      mappingErrors,
      validCount: valid.length,
      duplicateCount: duplicates.length,
      invalidCount: invalid.length,
      warningCount: candidates.reduce(
        (total, candidate) => total + candidate.warnings.length,
        0,
      ),
      successRows: valid.reduce((total, candidate) => total + candidate.rowNumbers.length, 0),
      duplicateRows: duplicates.reduce((total, candidate) => total + candidate.rowNumbers.length, 0),
      invalidRows:
        invalid.reduce((total, candidate) => total + candidate.rowNumbers.length, 0) +
        ungroupedErrors.length,
      ungroupedErrors,
    };
  }

  async execute(preview: OrderImportPreview): Promise<ImportExecutionResult> {
    if (preview.mappingErrors.length > 0) {
      throw new ValidationError('Mapping kolom masih bermasalah.', {
        mapping: preview.mappingErrors.join(' '),
      });
    }
    const store = await this.stores.getPublic(preview.storeId);
    if (!store) {
      throw new ValidationError('Toko tujuan import tidak ditemukan.');
    }
    const validCandidates = preview.candidates.filter(
      (candidate) => candidate.issues.length === 0 && !candidate.duplicate,
    );
    const invalidCandidates = preview.candidates.filter((candidate) => candidate.issues.length > 0);
    const duplicateCandidates = preview.candidates.filter(
      (candidate) => candidate.duplicate && candidate.issues.length === 0,
    );
    const duplicateIds = await this.orders.findExistingMarketplaceIds(
      preview.storeId,
      validCandidates.map((candidate) => candidate.orderId),
    );

    const skipped = [
      ...duplicateCandidates,
      ...validCandidates.filter((candidate) => duplicateIds.has(candidate.orderId)),
    ];
    const toInsert = validCandidates.filter((candidate) => !duplicateIds.has(candidate.orderId));
    const errors: ImportErrorWriteData[] = [];
    for (const issue of preview.ungroupedErrors) {
      errors.push({ rowNumber: issue.rowNumber, message: issue.message, rawData: null });
    }
    for (const candidate of invalidCandidates) {
      for (const issue of candidate.issues) {
        errors.push({ rowNumber: issue.rowNumber, message: issue.message, rawData: null });
      }
    }

    const skippedRows = skipped.reduce(
      (total, candidate) => total + candidate.rowNumbers.length,
      0,
    );
    const successRows = toInsert.reduce(
      (total, candidate) => total + candidate.rowNumbers.length,
      0,
    );
    const warnings = preview.candidates.flatMap((candidate) => candidate.warnings);

    const batchId = await this.db.transaction(async (tx) => {
      let insertedOrders = 0;
      for (const candidate of toInsert) {
        const orderId = await this.orders.insertOrder(
          {
            storeId: preview.storeId,
            marketplaceOrderId: candidate.orderId,
            orderDate: candidate.orderDate,
            status: candidate.status,
            sellerDiscount: candidate.sellerDiscount,
            marketplaceDiscount: candidate.marketplaceDiscount,
            shippingPaid: candidate.shippingPaid,
            settlementValue: null,
            notes: candidate.notes,
          },
          candidate.items,
          tx,
        );
        insertedOrders += 1;
        if (candidate.marketplaceFee > 0) {
          await this.fees.create(
            {
              storeId: preview.storeId,
              orderId,
              feeType: 'other',
              amount: candidate.marketplaceFee,
              feeDate: candidate.orderDate,
              source: 'actual',
              notes: 'Biaya dari import pesanan',
            },
            tx,
          );
        }
        if (candidate.refundAmount > 0) {
          await this.refunds.create(
            {
              orderId,
              storeId: preview.storeId,
              settlementId: null,
              refundDate: candidate.orderDate,
              amount: candidate.refundAmount,
              quantity: candidate.refundQuantity,
              reason: 'Refund dari import marketplace',
              status: 'completed',
              notes: 'Dibuat dari import pesanan',
              accountId: null,
            },
            tx,
          );
        }
      }

      const batchData: ImportBatchWriteData = {
        importType: 'orders',
        fileName: preview.fileName,
        totalRows: preview.totalRows,
        successRows,
        failedRows: preview.invalidRows,
        skippedRows,
        notes: [
          `${insertedOrders} pesanan dibuat`,
          warnings.length > 0 ? `${warnings.length} peringatan HPP/produk` : null,
        ]
          .filter((value): value is string => value !== null)
          .join('. '),
      };
      const createdBatchId = await this.imports.createBatch(batchData, tx);
      if (errors.length > 0) {
        await this.imports.addErrors(createdBatchId, errors.slice(0, 1000), tx);
      }
      return createdBatchId;
    });

    await this.audit.log('import', 'order', null, {
      batchId,
      storeId: preview.storeId,
      successRows,
      failedRows: preview.invalidRows,
      skippedRows,
      orders: toInsert.length,
    });

    return {
      batchId,
      totalRows: preview.totalRows,
      successRows,
      failedRows: preview.invalidRows,
      skippedRows,
      orderCount: toInsert.length,
      warnings,
      issues: [
        ...preview.ungroupedErrors,
        ...invalidCandidates.flatMap((candidate) => candidate.issues),
      ],
    };
  }
}
