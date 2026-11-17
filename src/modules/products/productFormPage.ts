import type { PageRenderer } from '@/app/router';
import type { Product, ProductInput, ProductStatus } from '@/types/entities';
import { ValidationError } from '@/core/utils/validation';
import { formatRupiah } from '@/core/utils/money';
import { icon } from '@/components/ui/icons';
import {
  applyFormErrors,
  formActions,
  formErrorBanner,
  formField,
  loadingBlock,
  pageHeader,
  readMoney,
  readOptionalMoney,
  readText,
  refreshIcons,
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import { renderPageError } from '@/app/pageUtils';

export const productFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? null;
  const isEdit = id !== null;
  root.innerHTML = loadingBlock(isEdit ? 'Memuat produk…' : 'Menyiapkan formulir…');

  try {
    let product: Product | null = null;
    if (id) {
      product = await services.productService.get(id);
    }
    if (context.signal.aborted) return;
    context.setTitle(isEdit ? 'Ubah produk' : 'Produk baru');

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Master produk',
        title: isEdit ? 'Ubah produk' : 'Tambah produk',
        subtitle: isEdit
          ? 'Perubahan HPP dan harga jual dicatat sebagai riwayat baru. Pesanan lama tetap memakai snapshot HPP saat dibuat.'
          : 'HPP dan harga jual akan dicatat sebagai riwayat awal produk.',
        actions: `<a class="btn btn-secondary" href="#${isEdit && id ? `/products/${id}` : '/products'}">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="product-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Informasi produk</h2>
            <p>Nama dan SKU wajib diisi. SKU harus unik.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'name',
              label: 'Nama produk',
              value: product?.name ?? '',
              required: true,
              placeholder: 'Contoh: Kaos Polos Premium',
              idPrefix: 'product',
              span: true,
            })}
            ${formField({
              name: 'sku',
              label: 'SKU',
              value: product?.sku ?? '',
              required: true,
              placeholder: 'Contoh: KPS-001',
              help: 'SKU dipakai untuk mencocokkan produk saat import pesanan.',
              idPrefix: 'product',
            })}
            ${formField({
              name: 'status',
              label: 'Status',
              type: 'select',
              value: product?.status ?? 'active',
              options: [
                { value: 'active', label: 'Aktif' },
                { value: 'inactive', label: 'Nonaktif' },
              ],
              required: true,
              idPrefix: 'product',
            })}
            ${formField({
              name: 'category',
              label: 'Kategori',
              value: product?.category ?? '',
              placeholder: 'Contoh: Kaos',
              idPrefix: 'product',
            })}
            ${formField({
              name: 'variant',
              label: 'Varian',
              value: product?.variant ?? '',
              placeholder: 'Contoh: Hitam / L',
              idPrefix: 'product',
            })}
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-head">
            <h2>Harga dan HPP</h2>
            <p>Nominal dalam Rupiah bulat. HPP saat ini: <strong>${formatRupiah(product?.currentCost ?? 0)}</strong>.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'price',
              label: 'Harga jual',
              type: 'money',
              value: product ? String(product.price) : '',
              required: true,
              placeholder: '0',
              help: 'Harga jual aktif per unit. Perubahan akan dicatat pada riwayat harga.',
              idPrefix: 'product',
            })}
            ${formField({
              name: 'cost',
              label: 'HPP',
              type: 'money',
              value: isEdit ? '' : product ? String(product.currentCost) : '',
              placeholder: isEdit ? 'Biarkan kosong untuk mempertahankan HPP' : '0',
              help: isEdit
                ? 'Isi hanya jika HPP berubah. Nilai baru dicatat pada riwayat HPP dengan tanggal hari ini.'
                : 'Opsional. HPP akan menjadi snapshot pada pesanan baru.',
              idPrefix: 'product',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: product?.notes ?? '',
              rows: 4,
              placeholder: 'Bahan, ukuran, atau catatan produksi…',
              idPrefix: 'product',
              span: true,
            })}
          </div>
          <div class="form-info">
            ${icon('info')}
            <p>Perubahan HPP tidak mengubah laba pesanan lama. Setiap item pesanan menyimpan HPP snapshot saat transaksi dibuat atau diimpor.</p>
          </div>
        </div>

        ${formActions(isEdit ? 'Simpan perubahan' : 'Simpan produk', {
          submitIcon: 'save',
          cancelHref: `#${isEdit && id ? `/products/${id}` : '/products'}`,
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#product-form');
    if (!form) throw new Error('Formulir produk tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const costRaw = readText(form, 'cost');
        const cost = costRaw === '' ? null : readOptionalMoney(form, 'cost', 'HPP');
        const input: ProductInput = {
          name: readText(form, 'name'),
          sku: readText(form, 'sku'),
          category: readText(form, 'category') || null,
          variant: readText(form, 'variant') || null,
          price: readMoney(form, 'price', 'Harga jual', { required: true }),
          cost,
          status: readText(form, 'status') as ProductStatus,
          notes: readText(form, 'notes') || null,
        };

        const saved = isEdit && id
          ? await services.productService.update(id, input)
          : await services.productService.create(input);
        showToast(isEdit ? 'Produk tersimpan.' : 'Produk berhasil dibuat.', 'success');
        context.navigate(`/products/${saved.id}`);
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Produk gagal disimpan. Periksa kembali datanya.', 'error');
        }
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
