import type { PageRenderer } from '@/app/router';
import type { ProductStatus } from '@/types/entities';
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_TONES } from '@/app/labels';
import { calculateProductMarginPercent } from '@/core/calculations/productMath';
import { formatNumber, formatPercent, formatRupiah } from '@/core/utils/money';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  badge,
  card,
  dataTable,
  emptyState,
  linkButton,
  loadingBlock,
  pageHeader,
} from '@/components/ui/ui';
import { buildRoute } from '@/components/ui/filters';
import { renderPageError } from '@/app/pageUtils';

export const productListPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat produk…');

  try {
    const search = context.query.get('search')?.trim() ?? '';
    const statusParam = context.query.get('status') ?? 'all';
    const status: ProductStatus | 'all' =
      statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';
    const category = context.query.get('category')?.trim() || null;

    const [products, categories, allProducts] = await Promise.all([
      services.productService.list({ search, status, category }),
      services.productService.listCategories(),
      services.productService.list(),
    ]);
    if (context.signal.aborted) return;

    context.setTitle('Produk');
    const hasFilters = search !== '' || status !== 'all' || category !== null;
    const activeCount = allProducts.filter((product) => product.status === 'active').length;

    const rows = products.map((product) => {
      const margin = calculateProductMarginPercent(product.price, product.currentCost);
      return [
        `<a class="table-link" href="#/products/${product.id}">${escapeHtml(product.name)}</a><span class="table-sub">${escapeHtml(product.sku)}${product.category ? ` · ${escapeHtml(product.category)}` : ''}</span>`,
        formatRupiah(product.price),
        formatRupiah(product.currentCost),
        margin === null ? 'N/A' : `<span class="${margin >= 0 ? 'value-positive' : 'value-negative'}">${formatPercent(margin)}</span>`,
        badge(PRODUCT_STATUS_LABELS[product.status], PRODUCT_STATUS_TONES[product.status]),
        `<div class="table-actions">
          <a class="btn btn-ghost btn-sm" href="#/products/${product.id}">Detail</a>
          <a class="btn btn-ghost btn-icon" href="#/products/${product.id}/edit" aria-label="Ubah ${escapeAttr(product.name)}" title="Ubah">${icon('pencil')}</a>
        </div>`,
      ];
    });

    const empty =
      allProducts.length === 0
        ? emptyState({
            iconName: 'package',
            title: 'Belum ada produk',
            description:
              'Tambahkan produk beserta SKU, harga jual, dan HPP. HPP akan tersimpan sebagai riwayat dan menjadi snapshot pada pesanan.',
            action: linkButton('/products/new', 'Tambah produk pertama', 'btn btn-primary', 'plus'),
          })
        : emptyState({
            iconName: 'search',
            title: 'Produk tidak ditemukan',
            description: 'Tidak ada produk yang sesuai dengan pencarian atau filter.',
            action: `<a class="btn btn-secondary" href="#/products">${icon('refresh-cw')}<span>Reset filter</span></a>`,
          });

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Master produk',
        title: 'Produk',
        subtitle: `${formatNumber(allProducts.length)} produk · ${formatNumber(activeCount)} aktif`,
        actions: linkButton('/products/new', 'Tambah produk', 'btn btn-primary', 'plus'),
      })}

      <div class="filter-bar product-filter-bar">
        <form class="filter-search" data-product-search role="search">
          <label class="filter-label" for="product-search">Cari produk</label>
          <div class="search-input-wrap">
            ${icon('search', 'search-icon')}
            <input class="input" id="product-search" name="search" type="search" value="${escapeAttr(search)}" placeholder="Nama produk, SKU, atau kategori…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        <div class="filter-control">
          <label class="filter-label" for="product-status">Status</label>
          <select class="input select" id="product-status" data-product-status>
            <option value="all" ${status === 'all' ? 'selected' : ''}>Semua status</option>
            <option value="active" ${status === 'active' ? 'selected' : ''}>Aktif</option>
            <option value="inactive" ${status === 'inactive' ? 'selected' : ''}>Nonaktif</option>
          </select>
        </div>
        <div class="filter-control">
          <label class="filter-label" for="product-category">Kategori</label>
          <select class="input select" id="product-category" data-product-category>
            <option value="">Semua kategori</option>
            ${categories
              .map(
                (item) =>
                  `<option value="${escapeAttr(item)}" ${item === category ? 'selected' : ''}>${escapeHtml(item)}</option>`,
              )
              .join('')}
          </select>
        </div>
        ${hasFilters ? `<a class="filter-reset" href="#/products">${icon('x')} Reset</a>` : ''}
      </div>

      ${
        products.length > 0
          ? card({
              title: 'Daftar produk',
              subtitle: 'Margin dihitung dari harga jual dan HPP aktif',
              padded: false,
              body: dataTable(
                ['Produk', 'Harga jual', 'HPP aktif', 'Margin', 'Status', ''],
                rows,
              ),
            })
          : card({ body: empty })
      }
    `;

    const searchForm = root.querySelector<HTMLFormElement>('[data-product-search]');
    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = searchForm.querySelector<HTMLInputElement>('input[name="search"]');
      context.navigate(buildRoute(context.path, context.query, { search: input?.value.trim() || null }));
    });
    root.querySelector<HTMLSelectElement>('[data-product-status]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      context.navigate(buildRoute(context.path, context.query, { status: target.value === 'all' ? null : target.value }));
    });
    root.querySelector<HTMLSelectElement>('[data-product-category]')?.addEventListener('change', (event) => {
      const target = event.currentTarget as HTMLSelectElement;
      context.navigate(buildRoute(context.path, context.query, { category: target.value || null }));
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
