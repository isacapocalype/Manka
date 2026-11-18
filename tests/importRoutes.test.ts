import { describe, expect, it } from 'vitest';
import { APP_ROUTES } from '@/app/pages';
import { IMPORT_TYPE_LABELS } from '@/app/labels';
import {
  autoDetectMappingFor,
  importFieldsFor,
  validateMappingFor,
} from '@/core/import-export/importFields';

describe('rute import marketplace', () => {
  it('mendaftarkan rute import sebelum rute dinamis', () => {
    const paths = APP_ROUTES.map((route) => route.path);
    expect(paths).toContain('/orders/import');
    expect(paths).toContain('/finance/fees/import');
    expect(paths).toContain('/finance/settlements/import');
    expect(paths).toContain('/imports/templates');
    expect(paths).toContain('/imports/templates/new');
    expect(paths).toContain('/imports/templates/:id/edit');

    expect(paths.indexOf('/finance/fees/import')).toBeLessThan(
      paths.indexOf('/finance/fees/:id/edit'),
    );
    expect(paths.indexOf('/finance/settlements/import')).toBeLessThan(
      paths.indexOf('/finance/settlements/:id/edit'),
    );
    expect(paths.indexOf('/imports/templates/new')).toBeLessThan(
      paths.indexOf('/imports/templates/:id/edit'),
    );

    for (const path of [
      '/finance/fees/import',
      '/finance/settlements/import',
      '/imports/templates',
      '/imports/templates/new',
    ]) {
      expect(paths.filter((item) => item === path)).toHaveLength(1);
    }
  });

  it('menyediakan label untuk ketiga jenis import', () => {
    expect(IMPORT_TYPE_LABELS.orders).toBe('Pesanan');
    expect(IMPORT_TYPE_LABELS.fees).toBe('Biaya marketplace');
    expect(IMPORT_TYPE_LABELS.settlements).toBe('Settlement');
  });

  it('mendeteksi header camelCase dan memvalidasi field tiap jenis import', () => {
    const feeHeaders = ['orderId', 'feeDate', 'feeType', 'feeAmount', 'notes'];
    const feeMapping = autoDetectMappingFor(feeHeaders, 'fees');
    expect(feeMapping).toMatchObject({
      orderId: 'orderId',
      feeDate: 'feeDate',
      feeType: 'feeType',
      feeAmount: 'feeAmount',
      notes: 'notes',
    });
    expect(validateMappingFor(feeMapping, feeHeaders, 'fees')).toEqual([]);

    const settlementHeaders = [
      'settlementNo',
      'settlementDate',
      'totalDeductions',
      'totalPayout',
      'settlementStatus',
    ];
    const settlementMapping = autoDetectMappingFor(settlementHeaders, 'settlements');
    expect(validateMappingFor(settlementMapping, settlementHeaders, 'settlements')).toEqual([]);

    expect(importFieldsFor('orders').some((field) => field.key === 'sku')).toBe(true);
    expect(importFieldsFor('fees').some((field) => field.key === 'feeAmount')).toBe(true);
    expect(importFieldsFor('settlements').some((field) => field.key === 'totalPayout')).toBe(true);
  });
});
