import type { PageRenderer } from '@/app/router';
import {
  BOM_ITEM_TYPE_LABELS,
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_TONES,
} from '@/app/labels';
import {
  calculateProductMarginAmount,
  calculateProductMarginPercent,
} from '@/core/calculations/productMath';
import { formatBusinessDate, formatDateTime } from '@/core/utils/date';
import { formatNumber, formatPercent, formatQuantity, formatRupiah } from '@/core/utils/money';
import { escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  badge,
  card,
  confirmDialog,
  dataTable,
  emptyState,
  kpiCard,
  linkButton,
  loadingBlock,
  pageHeader,
  showToast,
} from '@/components/ui/ui';
import { renderPageError } from '@/app/pageUtils';

export const productDetailPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? '';
  root.innerHTML = loadingBlock('Memuat produk…');

  try {
    const [product, costs, prices, bom] = await Promise.all([
      services.productService.get(id),
      services.productService.listCosts(id),
      services.productService.listPrices(id),
      services.bomService.getSummary(id),
    ]);
    if (context.signal.aborted) return;
    context.setTitle(product.name);

    const activeCost = bom.usingBom ? bom.totalCost : product.currentCost;
    const margin = calculateProductMarginPercent(product.price, activeCost);
    const marginAmount = calculateProductMarginAmount(product.price, activeCost);

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Master produk',
        title: product.name,
        subtitle: `${product.sku}${product.category ? ` · ${product.category}` : ''}${product.variant ? ` · ${product.variant}` : ''}`,
        actions: `
          <a class="btn btn-secondary" href="#/products">${icon('arrow-left')}<span>Kembali</span></a>
          ${linkButton(`/products/${product.id}/bom`, 'BOM & HPP', 'btn btn-secondary', 'boxes')}
          ${linkButton(`/products/${product.id}/edit`, 'Ubah produk', 'btn btn-primary', 'pencil')}
        `,
      })}
      <div class="detail-meta">
        ${badge(PRODUCT_STATUS_LABELS[product.status], PRODUCT_STATUS_TONES[product.status])}
        <span class="muted">HPP dan harga jual memiliki riwayat perubahan</span>
      </div>

      <div class="kpi-grid kpi-grid-3">
        ${kpiCard({ label: 'Harga jual aktif', value: formatRupiah(product.price), iconName: 'banknote' })}
        ${kpiCard({
          label: 'HPP aktif',
          value: formatRupiah(activeCost),
          iconName: 'package',
          hint: bom.usingBom ? 'Dihitung dari BOM' : 'HPP manual',
        })}
        ${kpiCard({
          label: 'Margin kotor',
          value: margin === null ? 'N/A' : formatPercent(margin),
          iconName: marginAmount >= 0 ? 'trending-up' : 'trending-down',
          tone: marginAmount >= 0 ? 'positive' : 'negative',
          hint: `${formatRupiah(marginAmount)} per unit`,
        })}
      </div>

      <div class="detail-grid">
        ${card({
          title: 'Informasi produk',
          body: `
            <dl class="detail-list">
              <div><dt>Nama</dt><dd>${escapeHtml(product.name)}</dd></div>
              <div><dt>SKU</dt><dd><code>${escapeHtml(product.sku)}</code></dd></div>
              <div><dt>Kategori</dt><dd>${product.category ? escapeHtml(product.category) : '<span class="muted">Belum diisi</span>'}</dd></div>
              <div><dt>Varian</dt><dd>${product.variant ? escapeHtml(product.variant) : '<span class="muted">Belum diisi</span>'}</dd></div>
              <div><dt>Status</dt><dd>${badge(PRODUCT_STATUS_LABELS[product.status], PRODUCT_STATUS_TONES[product.status])}</dd></div>
              <div><dt>Sumber HPP</dt><dd>${bom.usingBom ? `${badge('BOM', 'success')} ${formatNumber(bom.componentCount)} komponen` : badge('Manual', 'neutral')}</dd></div>
              <div><dt>Dibuat</dt><dd>${formatDateTime(product.createdAt)}</dd></div>
              <div><dt>Terakhir diubah</dt><dd>${formatDateTime(product.updatedAt)}</dd></div>
            </dl>
            ${product.notes ? `<div class="notes-block"><span class="sensitive-label">Catatan</span><p>${escapeHtml(product.notes)}</p></div>` : ''}
          `,
        })}
        ${card({
          title: 'Kebijakan HPP',
          body: `
            <div class="security-banner">
              ${icon('shield-check')}
              <p>Pesanan menyimpan HPP snapshot masing-masing. Mengubah HPP produk tidak mengubah laba pesanan yang sudah tercatat.</p>
            </div>
            <p class="inline-note">${icon('info')} ${
              bom.usingBom
                ? 'HPP aktif dihitung dari BOM. Perubahan komponen BOM atau biaya material mencatat riwayat HPP baru.'
                : 'HPP masih diisi manual. Buat BOM untuk menghitung HPP dari material, tenaga kerja, dan overhead.'
            }</p>
          `,
        })}
      </div>

      ${card({
        title: 'Struktur BOM & HPP',
        subtitle: bom.usingBom
          ? `${formatNumber(bom.componentCount)} komponen · total ${formatRupiah(bom.totalCost)} per unit`
          : 'Belum ada komponen BOM',
        actions: linkButton(
          `/products/${product.id}/bom`,
          bom.usingBom ? 'Kelola BOM' : 'Buat BOM',
          'btn btn-secondary btn-sm',
          'boxes',
        ),
        padded: bom.usingBom,
        body: bom.usingBom
          ? `
            <div class="bom-breakdown">
              <div><span>Material</span><strong>${formatRupiah(bom.materialCost)}</strong></div>
              <div><span>Tenaga kerja</span><strong>${formatRupiah(bom.laborCost)}</strong></div>
              <div><span>Overhead</span><strong>${formatRupiah(bom.overheadCost)}</strong></div>
              <div class="bom-breakdown-total"><span>HPP per unit</span><strong>${formatRupiah(bom.totalCost)}</strong></div>
            </div>
            ${dataTable(
              ['Komponen', 'Jenis', 'Kuantitas', 'Subtotal'],
              bom.items.map((item) => [
                escapeHtml(
                  item.type === 'material'
                    ? (item.materialName ?? 'Material tidak ditemukan')
                    : (item.label ?? 'Komponen'),
                ),
                BOM_ITEM_TYPE_LABELS[item.type],
                item.type === 'material'
                  ? `${formatQuantity(item.quantity)} ${escapeHtml(item.materialUnit ?? '')}`
                  : 'per unit',
                formatRupiah(item.lineCost),
              ]),
            )}
          `
          : emptyState({
              compact: true,
              iconName: 'boxes',
              title: 'HPP belum disusun dari BOM',
              description:
                'Buat BOM untuk menjumlahkan biaya material, tenaga kerja, dan overhead menjadi HPP per unit. HPP manual tetap dipakai sampai komponen pertama ditambahkan.',
              action: linkButton(
                `/products/${product.id}/bom`,
                'Buat BOM',
                'btn btn-primary btn-sm',
                'plus',
              ),
            }),
      })}

      ${card({
        title: 'Riwayat HPP',
        subtitle: `${costs.length} perubahan tercatat`,
        padded: false,
        body: costs.length
          ? dataTable(
              ['Tanggal berlaku', 'HPP', 'Catatan', 'Dicatat'],
              costs.map((entry) => [
                formatBusinessDate(entry.effectiveAt),
                `<strong>${formatRupiah(entry.cost)}</strong>`,
                entry.note ? escapeHtml(entry.note) : '<span class="muted">—</span>',
                formatDateTime(entry.createdAt),
              ]),
            )
          : emptyState({
              compact: true,
              iconName: 'package',
              title: 'Belum ada riwayat HPP',
              description: 'Riwayat muncul saat HPP produk diisi atau diubah.',
            }),
      })}

      ${card({
        title: 'Riwayat harga jual',
        subtitle: `${prices.length} perubahan tercatat`,
        padded: false,
        body: prices.length
          ? dataTable(
              ['Tanggal berlaku', 'Harga jual', 'Dicatat'],
              prices.map((entry) => [
                formatBusinessDate(entry.effectiveAt),
                `<strong>${formatRupiah(entry.price)}</strong>`,
                formatDateTime(entry.createdAt),
              ]),
            )
          : emptyState({
              compact: true,
              iconName: 'banknote',
              title: 'Belum ada riwayat harga',
              description: 'Riwayat muncul saat harga jual produk diisi atau diubah.',
            }),
      })}

      ${card({
        title: 'Hapus produk',
        body: `
          <div class="danger-zone danger-row">
            <div>
              <strong>Hapus produk secara permanen</strong>
              <p>Produk yang sudah dipakai pada pesanan tidak dapat dihapus. Nonaktifkan produk agar riwayat tetap utuh.</p>
            </div>
            <button type="button" class="btn btn-danger btn-sm" data-delete-product>${icon('trash')}<span>Hapus produk</span></button>
          </div>
        `,
      })}
    `;

    root.querySelector<HTMLButtonElement>('[data-delete-product]')?.addEventListener('click', async () => {
      const confirmed = await confirmDialog({
        title: 'Hapus produk?',
        message: `Produk "${product.name}" akan dihapus permanen. Produk yang sudah dipakai pada pesanan akan ditolak oleh sistem.`,
        confirmLabel: 'Hapus produk',
        tone: 'danger',
        requireText: product.sku,
      });
      if (!confirmed) return;
      try {
        await services.productService.delete(product.id);
        showToast('Produk dihapus.', 'success');
        context.navigate('/products');
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Produk gagal dihapus.',
          'error',
        );
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
