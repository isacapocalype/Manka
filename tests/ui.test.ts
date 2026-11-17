import { describe, expect, it } from 'vitest';
import { appHref, linkButton } from '@/components/ui/ui';

describe('appHref', () => {
  it('mengubah path internal menjadi route hash', () => {
    expect(appHref('/stores/new')).toBe('#/stores/new');
    expect(appHref('/finance/fees/new?storeId=abc')).toBe(
      '#/finance/fees/new?storeId=abc',
    );
    expect(appHref('stores/new')).toBe('#/stores/new');
  });

  it('tidak menggandakan prefix pada route hash yang sudah benar', () => {
    expect(appHref('#/stores/new')).toBe('#/stores/new');
  });

  it('membiarkan URL eksternal dan protokol khusus', () => {
    expect(appHref('https://example.com/toko')).toBe('https://example.com/toko');
    expect(appHref('mailto:admin@manka.id')).toBe('mailto:admin@manka.id');
    expect(appHref('tel:+628123456789')).toBe('tel:+628123456789');
  });
});

describe('linkButton', () => {
  it('merender tombol tambah toko sebagai navigasi hash', () => {
    expect(linkButton('/stores/new', 'Tambah toko')).toContain('href="#/stores/new"');
    expect(linkButton('/stores/new', 'Tambah toko pertama')).toContain(
      'href="#/stores/new"',
    );
  });
});
