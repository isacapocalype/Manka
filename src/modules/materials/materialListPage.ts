import type { PageRenderer } from '@/app/router';
import type { MaterialStatus } from '@/types/bom';
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUS_TONES } from '@/app/labels';
import { formatNumber, formatRupiah } from '@/core/utils/money';
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

export const materialListPage: PageRenderer = async (context) => {
  const { root, services } = context;
  root.innerHTML = loadingBlock('Memuat material…');

  try {
    const search = context.query.get('search')?.trim() ?? '';
    const statusParam = context.query.get('status') ?? 'all';
    const status: MaterialStatus | 'all' =
      statusParam === 'active' || statusParam === 'inactive' ? statusParam : 'all';

    const materials = await services.materialService.list({ search, status });
    if (context.signal.aborted) return;
    context.setTitle('Material');

    const hasFilters = search !== '' || status !== 'all';
    const rows = materials.map((material) => [
      `<a class="table-link" href="#/materials/${material.id}/edit">${escapeHtml(material.name)}</a>${
        material.notes ? `<span class="table-sub">${escapeHtml(material.notes)}</span>` : ''
      }`,
      `<code>${escapeHtml(material.unit)}</code>`,
      `<strong>${formatRupiah(material.unitCost)}</strong><span class="table-sub">per ${escapeHtml(material.unit)}</span>`,
      material.usageCount > 0
        ? `${formatNumber(material.usageCount)} komponen BOM`
        : '<span class="muted">Belum dipakai</span>',
      badge(PRODUCT_STATUS_LABELS[material.status], PRODUCT_STATUS_TONES[material.status]),
      `<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/materials/${material.id}/edit">Ubah</a>
      </div>`,
    ]);

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Master produk',
        title: 'Material',
        subtitle: `${formatNumber(materials.length)} material pada filter aktif. Biaya material dipakai untuk menghitung HPP dari BOM.`,
        actions: `
          ${linkButton('/products', 'Produk', 'btn btn-secondary', 'package')}
          ${linkButton('/materials/new', 'Tambah material', 'btn btn-primary', 'plus')}
        `,
      })}

      <div class="filter-bar product-filter-bar">
        <form class="filter-search" data-material-search role="search">
          <label class="filter-label" for="material-search">Cari material</label>
          <div class="search-input-wrap">
            ${icon('search', 'search-icon')}
            <input class="input" id="material-search" name="search" type="search" value="${escapeAttr(search)}" placeholder="Nama, satuan, atau catatan…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        <div class="filter-control">
          <label class="filter-label" for="material-status">Status</label>
          <select class="input select" id="material-status" data-material-status>
            <option value="all" ${status === 'all' ? 'selected' : ''}>Semua status</option>
            <option value="active" ${status === 'active' ? 'selected' : ''}>Aktif</option>
            <option value="inactive" ${status === 'inactive' ? 'selected' : ''}>Nonaktif</option>
          </select>
        </div>
        ${hasFilters ? `<a class="filter-reset" href="#/materials">${icon('x')} Reset</a>` : ''}
      </div>

      ${
        materials.length > 0
          ? card({
              title: 'Daftar material',
              subtitle: 'Tidak ada pencatatan stok; biaya material langsung dipakai pada BOM',
              padded: false,
              body: dataTable(
                ['Material', 'Satuan', 'Biaya satuan', 'Dipakai', 'Status', ''],
                rows,
              ),
            })
          : card({
              body: emptyState({
                iconName: hasFilters ? 'search' : 'boxes',
                title: hasFilters ? 'Material tidak ditemukan' : 'Belum ada material',
                description: hasFilters
                  ? 'Tidak ada material yang sesuai pencarian atau filter status.'
                  : 'Tambahkan material seperti kain, benang, atau kemasan. Biaya satuan material akan dipakai untuk menghitung HPP produk melalui BOM.',
                action: hasFilters
                  ? `<a class="btn btn-secondary" href="#/materials">${icon('refresh-cw')}<span>Reset filter</span></a>`
                  : linkButton('/materials/new', 'Tambah material pertama', 'btn btn-primary', 'plus'),
              }),
            })
      }
    `;

    const searchForm = root.querySelector<HTMLFormElement>('[data-material-search]');
    searchForm?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = searchForm.querySelector<HTMLInputElement>('input[name="search"]');
      context.navigate(
        buildRoute(context.path, context.query, { search: input?.value.trim() || null }),
      );
    });
    root
      .querySelector<HTMLSelectElement>('[data-material-status]')
      ?.addEventListener('change', (event) => {
        const target = event.currentTarget as HTMLSelectElement;
        context.navigate(
          buildRoute(context.path, context.query, {
            status: target.value === 'all' ? null : target.value,
          }),
        );
      });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
