import type { ImportMappingValues, ImportType } from '@/types/entities';

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

/** Semua field yang dikenal oleh ketiga jenis import. */
export type ImportFieldKey =
  | OrderImportFieldKey
  | 'feeDate'
  | 'feeType'
  | 'feeAmount'
  | 'settlementNo'
  | 'settlementDate'
  | 'grossSales'
  | 'totalDeductions'
  | 'totalPayout'
  | 'settlementStatus';

export interface ImportFieldDefinition {
  key: ImportFieldKey;
  label: string;
  required: boolean;
  help: string;
  aliases: string[];
}

export interface OrderImportFieldDefinition extends Omit<ImportFieldDefinition, 'key'> {
  key: OrderImportFieldKey;
}

export const ORDER_IMPORT_FIELDS: readonly OrderImportFieldDefinition[] = [
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

export const FEE_IMPORT_FIELDS: readonly ImportFieldDefinition[] = [
  ORDER_IMPORT_FIELDS[0]!,
  {
    key: 'feeDate',
    label: 'Tanggal biaya',
    required: false,
    help: 'Opsional. Jika kosong, tanggal biaya memakai tanggal settlement pesanan.',
    aliases: ['tanggal biaya', 'tanggal potongan', 'tanggal fee', 'fee date', 'tanggal transaksi'],
  },
  {
    key: 'feeType',
    label: 'Jenis biaya',
    required: false,
    help: 'Opsional. Nilai dikenal: admin, layanan, transaksi, komisi, promosi. Default: lainnya.',
    aliases: ['jenis biaya', 'tipe biaya', 'kategori biaya', 'fee type', 'jenis potongan', 'tipe potongan'],
  },
  {
    key: 'feeAmount',
    label: 'Nominal biaya',
    required: true,
    help: 'Nominal potongan atau biaya marketplace untuk pesanan ini.',
    aliases: ['nominal biaya', 'jumlah biaya', 'biaya', 'nominal', 'amount', 'potongan', 'deduction', 'nilai potongan'],
  },
  {
    key: 'notes',
    label: 'Catatan',
    required: false,
    help: 'Catatan tambahan untuk biaya.',
    aliases: ['catatan', 'notes', 'remark', 'keterangan'],
  },
];

export const SETTLEMENT_IMPORT_FIELDS: readonly ImportFieldDefinition[] = [
  {
    key: 'settlementNo',
    label: 'Nomor settlement',
    required: true,
    help: 'Nomor pencairan unik dari marketplace.',
    aliases: ['no settlement', 'nomor settlement', 'settlement no', 'no pencairan', 'nomor pencairan', 'payout id', 'payout no', 'id pencairan', 'no payout'],
  },
  {
    key: 'settlementDate',
    label: 'Tanggal settlement',
    required: true,
    help: 'Tanggal pencairan (YYYY-MM-DD atau DD/MM/YYYY).',
    aliases: ['tanggal settlement', 'tanggal pencairan', 'settlement date', 'payout date', 'tanggal payout', 'tanggal cair'],
  },
  {
    key: 'grossSales',
    label: 'Total penjualan',
    required: false,
    help: 'Opsional. Jika kosong, dihitung dari total pencairan + total potongan.',
    aliases: ['total penjualan', 'penjualan kotor', 'gross sales', 'gross amount', 'omzet kotor'],
  },
  {
    key: 'totalDeductions',
    label: 'Total potongan',
    required: false,
    help: 'Opsional. Jika kosong, dianggap 0.',
    aliases: ['total potongan', 'total deductions', 'total biaya', 'potongan', 'deductions'],
  },
  {
    key: 'totalPayout',
    label: 'Total pencairan',
    required: true,
    help: 'Nominal dana yang dicairkan marketplace.',
    aliases: ['total pencairan', 'total payout', 'nominal pencairan', 'dana diterima', 'payout amount', 'net payout', 'pencairan'],
  },
  {
    key: 'settlementStatus',
    label: 'Status',
    required: false,
    help: 'Opsional. Nilai dikenal: diterima/received atau pending. Default: diterima.',
    aliases: ['status settlement', 'status pencairan', 'status payout', 'status'],
  },
  {
    key: 'notes',
    label: 'Catatan',
    required: false,
    help: 'Catatan tambahan untuk settlement.',
    aliases: ['catatan', 'notes', 'remark', 'keterangan'],
  },
];

export const IMPORT_FIELDS: Readonly<Record<ImportType, readonly ImportFieldDefinition[]>> = {
  orders: ORDER_IMPORT_FIELDS,
  fees: FEE_IMPORT_FIELDS,
  settlements: SETTLEMENT_IMPORT_FIELDS,
};

export type OrderImportMapping = Record<OrderImportFieldKey, string | null>;
export type ImportMapping = ImportMappingValues;

export function importFieldsFor(importType: ImportType): readonly ImportFieldDefinition[] {
  return IMPORT_FIELDS[importType] ?? ORDER_IMPORT_FIELDS;
}

export function emptyImportMapping(importType: ImportType): ImportMapping {
  return Object.fromEntries(importFieldsFor(importType).map((field) => [field.key, null]));
}

export function normalizeImportHeader(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function autoDetectMappingFor(headers: string[], importType: ImportType): ImportMapping {
  const mapping = emptyImportMapping(importType);
  const used = new Set<string>();
  for (const field of importFieldsFor(importType)) {
    const match = headers.find((header) => {
      if (used.has(header)) return false;
      const normalized = normalizeImportHeader(header);
      return field.aliases.some((alias) => normalized === alias || normalized.includes(alias));
    });
    if (match) {
      mapping[field.key] = match;
      used.add(match);
    }
  }
  return mapping;
}

export function validateMappingFor(
  mapping: ImportMapping,
  headers: string[],
  importType: ImportType,
): string[] {
  const errors: string[] = [];
  const headerSet = new Set(headers);
  const used = new Map<string, string>();
  const fields = importFieldsFor(importType);
  for (const field of fields) {
    const header = mapping[field.key];
    if (header !== null && header !== undefined && !headerSet.has(header)) {
      errors.push(`Kolom "${header}" untuk ${field.label} tidak ditemukan.`);
    }
    if (header) {
      const existing = used.get(header);
      if (existing) {
        errors.push(`Kolom "${header}" dipetakan ke lebih dari satu field (${existing} dan ${field.label}).`);
      } else {
        used.set(header, field.label);
      }
    }
  }
  for (const field of fields) {
    if (field.required && !mapping[field.key]) {
      errors.push(`${field.label} wajib dipetakan.`);
    }
  }
  if (importType === 'orders' && !mapping.productName && !mapping.sku) {
    errors.push('Pilih minimal salah satu kolom Nama produk atau SKU.');
  }
  return errors;
}
