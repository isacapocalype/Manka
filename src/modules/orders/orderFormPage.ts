import type { PageRenderer } from '@/app/router';
import type {
  OrderDetail,
  OrderInput,
  OrderItemInput,
  OrderStatus,
  Product,
} from '@/types/entities';
import { ORDER_STATUSES } from '@/types/entities';
import { ORDER_STATUS_LABELS } from '@/app/labels';
import { calculateOrderMath, isRevenueOrderStatus } from '@/core/calculations/orderMath';
import { todayJakarta } from '@/core/utils/date';
import { parseIntegerInput, parseMoneyInput, formatRupiah } from '@/core/utils/money';
import { ValidationError } from '@/core/utils/validation';
import { escapeAttr, escapeHtml } from '@/components/ui/dom';
import { icon, refreshIcons } from '@/components/ui/icons';
import {
  applyFormErrors,
  emptyState,
  formActions,
  formErrorBanner,
  formField,
  loadingBlock,
  pageHeader,
  readMoney,
  readOptionalMoney,
  readText,
  refreshIcons as refreshUiIcons,
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import { storeSelectOptions } from '@/components/ui/filters';
import { renderPageError } from '@/app/pageUtils';

interface ItemRowData {
  id?: string;
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  hppSnapshot: number;
}

function productOptions(products: Product[], selectedId: string | null): string {
  return `
    <option value="" ${selectedId === null ? 'selected' : ''}>Produk manual / tidak tertaut</option>
    ${products
      .map(
        (product) =>
          `<option value="${escapeAttr(product.id)}" ${product.id === selectedId ? 'selected' : ''}>${escapeHtml(product.name)} — ${escapeHtml(product.sku)}${product.status === 'inactive' ? ' (nonaktif)' : ''}</option>`,
      )
      .join('')}
  `;
}

function itemRowMarkup(data: ItemRowData, products: Product[], counter: number): string {
  const linked = data.productId !== null;
  return `
    <div class="order-item" data-item-row data-item-id="${escapeAttr(data.id ?? '')}">
      <div class="order-item-head">
        <strong data-item-title>Item ${counter}</strong>
        <button type="button" class="btn btn-ghost btn-icon" data-remove-item aria-label="Hapus item" title="Hapus item">${icon('trash')}</button>
      </div>
      <div class="order-item-grid">
        <div class="field item-product-field">
          <label class="field-label">Produk</label>
          <select class="input select" data-item-product>${productOptions(products, data.productId)}</select>
        </div>
        <div class="field">
          <label class="field-label">Nama produk</label>
          <input class="input" data-item-name value="${escapeAttr(data.productName)}" ${linked ? 'readonly' : ''} placeholder="Nama produk" />
        </div>
        <div class="field">
          <label class="field-label">SKU</label>
          <input class="input" data-item-sku value="${escapeAttr(data.sku)}" ${linked ? 'readonly' : ''} placeholder="SKU" />
        </div>
        <div class="field">
          <label class="field-label">Kuantitas</label>
          <input class="input" data-item-qty type="text" inputmode="numeric" value="${data.quantity > 0 ? data.quantity : 1}" />
        </div>
        <div class="field">
          <label class="field-label">Harga satuan</label>
          <div class="input-affix"><span class="affix">Rp</span><input class="input" data-item-price type="text" inputmode="numeric" value="${data.unitPrice > 0 ? data.unitPrice : ''}" placeholder="0" /></div>
        </div>
        <div class="field">
          <label class="field-label">HPP snapshot</label>
          <div class="input-affix"><span class="affix">Rp</span><input class="input" data-item-hpp type="text" inputmode="numeric" value="${data.hppSnapshot}" ${linked ? 'readonly' : ''} /></div>
          <p class="field-help" data-item-hpp-hint>${linked ? 'HPP tersimpan pada item ini' : 'Isi HPP manual jika produk tidak tertaut'}</p>
        </div>
      </div>
      <p class="field-error" data-item-error></p>
    </div>
  `;
}

function emptyRow(): ItemRowData {
  return {
    productId: null,
    productName: '',
    sku: '',
    quantity: 1,
    unitPrice: 0,
    hppSnapshot: 0,
  };
}

export const orderFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? null;
  const isEdit = id !== null;
  root.innerHTML = loadingBlock(isEdit ? 'Memuat pesanan…' : 'Menyiapkan formulir pesanan…');

  try {
    const [allStores, products, order] = await Promise.all([
      services.storeService.listAll(),
      services.productService.list(),
      id ? services.orderService.getDetail(id) : Promise.resolve<OrderDetail | null>(null),
    ]);
    if (context.signal.aborted) return;
    context.setTitle(isEdit ? 'Ubah pesanan' : 'Pesanan baru');

    const requestedStoreId = context.query.get('storeId');
    const activeStores = allStores.filter((store) => store.status === 'active');
    const selectedStoreId =
      order?.storeId ??
      (requestedStoreId && activeStores.some((store) => store.id === requestedStoreId)
        ? requestedStoreId
        : activeStores[0]?.id ?? '');

    if (!isEdit && activeStores.length === 0) {
      root.innerHTML = `
        ${pageHeader({
          eyebrow: 'Transaksi penjualan',
          title: 'Pesanan baru',
          actions: `<a class="btn btn-secondary" href="#/orders">${icon('arrow-left')}<span>Kembali</span></a>`,
        })}
        <div class="card"><div class="card-body">
          ${emptyState({
            iconName: 'store',
            title: 'Belum ada toko aktif',
            description:
              'Pesanan harus terkait toko. Tambahkan toko atau aktifkan kembali toko yang diarsipkan terlebih dahulu.',
            action: `<a class="btn btn-primary" href="#/stores/new">${icon('plus')}<span>Tambah toko</span></a>
              <a class="btn btn-secondary" href="#/stores?archived=1">Lihat toko diarsipkan</a>`,
          })}
        </div></div>
      `;
      refreshIcons(root);
      return;
    }

    const storeOptions = storeSelectOptions(allStores, selectedStoreId, { activeOnly: true });
    const initialItems: ItemRowData[] =
      order?.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        hppSnapshot: item.hppSnapshot,
      })) ?? [emptyRow()];

    const existingRefunds =
      order?.refunds
        .filter((refund) => refund.status === 'completed')
        .reduce((total, refund) => total + refund.amount, 0) ?? 0;

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Transaksi penjualan',
        title: isEdit ? 'Ubah pesanan' : 'Pesanan baru',
        subtitle: isEdit
          ? 'HPP snapshot item yang sudah ada dipertahankan. Perubahan item dapat memakai HPP produk saat ini.'
          : 'HPP setiap item disimpan sebagai snapshot saat pesanan dibuat. Perubahan HPP produk tidak akan mengubah pesanan ini.',
        actions: `<a class="btn btn-secondary" href="#${isEdit && id ? `/orders/${id}` : '/orders'}">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card order-form" id="order-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Informasi pesanan</h2>
            <p>Nomor pesanan harus unik per toko. Status batal, retur, dan refund tidak dihitung sebagai penjualan.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'storeId',
              label: 'Toko',
              type: 'select',
              value: selectedStoreId,
              options: storeOptions,
              required: true,
              idPrefix: 'order',
            })}
            ${formField({
              name: 'marketplaceOrderId',
              label: 'Nomor pesanan marketplace',
              value: order?.marketplaceOrderId ?? '',
              required: true,
              placeholder: 'Contoh: 240615ABC123',
              idPrefix: 'order',
            })}
            ${formField({
              name: 'orderDate',
              label: 'Tanggal pesanan',
              type: 'date',
              value: order?.orderDate ?? todayJakarta(),
              required: true,
              idPrefix: 'order',
            })}
            ${formField({
              name: 'status',
              label: 'Status pesanan',
              type: 'select',
              value: order?.status ?? 'completed',
              options: ORDER_STATUSES.map((status) => ({ value: status, label: ORDER_STATUS_LABELS[status] })),
              required: true,
              idPrefix: 'order',
            })}
            ${formField({
              name: 'sellerDiscount',
              label: 'Diskon penjual',
              type: 'money',
              value: order ? String(order.sellerDiscount) : '0',
              help: 'Diskon yang ditanggung penjual. Mengurangi penjualan bersih.',
              idPrefix: 'order',
            })}
            ${formField({
              name: 'marketplaceDiscount',
              label: 'Diskon marketplace',
              type: 'money',
              value: order ? String(order.marketplaceDiscount) : '0',
              help: 'Ditanggung marketplace; tidak mengurangi pendapatan penjual.',
              idPrefix: 'order',
            })}
            ${formField({
              name: 'shippingPaid',
              label: 'Ongkir dibayar pembeli',
              type: 'money',
              value: order ? String(order.shippingPaid) : '0',
              help: 'Nilai ongkir yang dibayar pembeli, jika ada.',
              idPrefix: 'order',
            })}
            ${formField({
              name: 'settlementValue',
              label: 'Nilai pencairan',
              type: 'money',
              value: order?.settlementValue !== null && order?.settlementValue !== undefined ? String(order.settlementValue) : '',
              help: 'Opsional. Nilai bersih yang dicairkan marketplace untuk pesanan ini.',
              idPrefix: 'order',
            })}
            ${formField({
              name: 'notes',
              label: 'Catatan',
              type: 'textarea',
              value: order?.notes ?? '',
              rows: 3,
              placeholder: 'Catatan pesanan…',
              idPrefix: 'order',
              span: true,
            })}
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-head">
            <h2>Item pesanan</h2>
            <p>Pilih produk agar HPP dan SKU terisi otomatis, atau isi item manual.</p>
          </div>
          <div class="order-items" id="order-items">
            ${initialItems.map((item, index) => itemRowMarkup(item, products, index + 1)).join('')}
          </div>
          <div class="order-items-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-add-item>${icon('plus')}<span>Tambah item</span></button>
            <a class="btn btn-ghost btn-sm" href="#/products/new">${icon('package')}<span>Produk belum ada?</span></a>
          </div>
          ${products.length === 0 ? `<p class="inline-note note-warning">${icon('triangle-alert')} Belum ada master produk. Item manual tetap dapat disimpan tanpa tautan produk.</p>` : ''}
        </div>

        <div class="form-section order-summary-section">
          <div class="form-section-head">
            <h2>Ringkasan nilai pesanan</h2>
            <p>Estimasi ini belum memasukkan biaya marketplace, iklan, dan operasional.</p>
          </div>
          <div class="order-summary" data-order-summary>
            <div><span>Omzet item</span><strong data-preview-gross>Rp 0</strong></div>
            <div><span>Diskon penjual</span><strong data-preview-discount class="value-negative">Rp 0</strong></div>
            ${existingRefunds > 0 ? `<div><span>Refund selesai</span><strong data-preview-refund class="value-negative">${formatRupiah(-existingRefunds)}</strong></div>` : ''}
            <div class="summary-strong"><span>Penjualan bersih</span><strong data-preview-net>Rp 0</strong></div>
            <div><span>HPP snapshot</span><strong data-preview-cogs>Rp 0</strong></div>
            <div class="summary-strong"><span>Laba kotor estimasi</span><strong data-preview-profit>Rp 0</strong></div>
          </div>
          <p class="inline-note" data-preview-note hidden></p>
        </div>

        ${formActions(isEdit ? 'Simpan perubahan' : 'Simpan pesanan', {
          submitIcon: 'save',
          cancelHref: `#${isEdit && id ? `/orders/${id}` : '/orders'}`,
        })}
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('#order-form');
    const itemsWrap = root.querySelector<HTMLElement>('#order-items');
    if (!form || !itemsWrap) throw new Error('Formulir pesanan tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const productMap = new Map(products.map((product) => [product.id, product]));

    const clearItemErrors = (): void => {
      itemsWrap.querySelectorAll('.order-item.has-error').forEach((row) => row.classList.remove('has-error'));
      itemsWrap.querySelectorAll<HTMLElement>('[data-item-error]').forEach((error) => {
        error.textContent = '';
      });
    };

    const resetItemCounter = (): void => {
      itemsWrap.querySelectorAll<HTMLElement>('[data-item-row]').forEach((row, index) => {
        const title = row.querySelector<HTMLElement>('[data-item-title]');
        if (title) title.textContent = `Item ${index + 1}`;
      });
    };

    const updateSummary = (): void => {
      const status = readText(form, 'status') as OrderStatus;
      const items: { quantity: number; unitPrice: number; hppSnapshot: number }[] = [];
      for (const row of itemsWrap.querySelectorAll<HTMLElement>('[data-item-row]')) {
        const quantity = parseIntegerInput(row.querySelector<HTMLInputElement>('[data-item-qty]')?.value ?? '') ?? 0;
        const unitPrice = parseMoneyInput(row.querySelector<HTMLInputElement>('[data-item-price]')?.value ?? '') ?? 0;
        const hppSnapshot = parseMoneyInput(row.querySelector<HTMLInputElement>('[data-item-hpp]')?.value ?? '') ?? 0;
        items.push({ quantity: Math.max(0, quantity), unitPrice: Math.max(0, unitPrice), hppSnapshot: Math.max(0, hppSnapshot) });
      }
      const sellerDiscount = parseMoneyInput(readText(form, 'sellerDiscount')) ?? 0;
      const math = calculateOrderMath({
        status,
        sellerDiscount: Math.max(0, sellerDiscount),
        items,
        completedRefundTotal: existingRefunds,
        marketplaceFees: 0,
      });
      const revenue = isRevenueOrderStatus(status);
      const gross = readEl('[data-preview-gross]');
      const discount = readEl('[data-preview-discount]');
      const net = readEl('[data-preview-net]');
      const cogs = readEl('[data-preview-cogs]');
      const profit = readEl('[data-preview-profit]');
      const note = root.querySelector<HTMLElement>('[data-preview-note]');
      if (gross) gross.textContent = formatRupiah(math.grossSales);
      if (discount) discount.textContent = formatRupiah(-math.sellerDiscount);
      if (net) net.textContent = revenue ? formatRupiah(math.netSales) : 'Tidak dihitung';
      if (cogs) cogs.textContent = formatRupiah(math.cogs);
      if (profit) profit.textContent = revenue ? formatRupiah(math.estimatedProfit) : '—';
      if (note) {
        note.hidden = revenue;
        note.textContent = revenue
          ? ''
          : 'Status pesanan ini tidak dihitung sebagai penjualan. Nilai item tetap disimpan untuk riwayat.';
      }
    };

    const readEl = (selector: string): HTMLElement | null => root.querySelector<HTMLElement>(selector);

    const syncProductRow = (row: HTMLElement, prefillPrice: boolean): void => {
      const select = row.querySelector<HTMLSelectElement>('[data-item-product]');
      const name = row.querySelector<HTMLInputElement>('[data-item-name]');
      const sku = row.querySelector<HTMLInputElement>('[data-item-sku]');
      const hpp = row.querySelector<HTMLInputElement>('[data-item-hpp]');
      const price = row.querySelector<HTMLInputElement>('[data-item-price]');
      const hint = row.querySelector<HTMLElement>('[data-item-hpp-hint]');
      if (!select || !name || !sku || !hpp || !price) return;
      const product = select.value ? productMap.get(select.value) : undefined;
      const linked = product !== undefined;
      name.readOnly = linked;
      sku.readOnly = linked;
      hpp.readOnly = linked;
      if (product) {
        name.value = product.name;
        sku.value = product.sku;
        hpp.value = String(product.currentCost);
        if (prefillPrice) price.value = String(product.price);
        if (hint) hint.textContent = 'HPP mengikuti master produk saat ini';
      } else {
        if (hint) hint.textContent = 'Isi HPP manual jika produk tidak tertaut';
        if (hpp.value === '') hpp.value = '0';
      }
    };

    itemsWrap.addEventListener('change', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement) || !target.matches('[data-item-product]')) return;
      const row = target.closest<HTMLElement>('[data-item-row]');
      if (row) syncProductRow(row, true);
      updateSummary();
    });

    form.addEventListener('input', () => updateSummary());

    root.querySelector<HTMLButtonElement>('[data-add-item]')?.addEventListener('click', () => {
      const row = itemRowMarkup(emptyRow(), products, itemsWrap.children.length + 1);
      itemsWrap.insertAdjacentHTML('beforeend', row);
      resetItemCounter();
      refreshUiIcons(itemsWrap.lastElementChild ?? itemsWrap);
      updateSummary();
    });

    itemsWrap.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>('[data-remove-item]');
      if (!button) return;
      const row = button.closest<HTMLElement>('[data-item-row]');
      if (!row) return;
      const rows = itemsWrap.querySelectorAll('[data-item-row]');
      if (rows.length <= 1) {
        showToast('Pesanan harus memiliki minimal satu item.', 'info');
        return;
      }
      row.remove();
      resetItemCounter();
      updateSummary();
    });

    updateSummary();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      clearItemErrors();
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const items: OrderItemInput[] = [];
        let rowIndex = 0;
        for (const row of itemsWrap.querySelectorAll<HTMLElement>('[data-item-row]')) {
          rowIndex += 1;
          const fail = (message: string): never => {
            row.classList.add('has-error');
            const error = row.querySelector<HTMLElement>('[data-item-error]');
            if (error) error.textContent = message;
            throw new ValidationError(`Item ${rowIndex}: ${message}`, { items: `Item ${rowIndex}: ${message}` });
          };
          const productSelect = row.querySelector<HTMLSelectElement>('[data-item-product]');
          const productId = productSelect?.value || null;
          const product = productId ? productMap.get(productId) : undefined;
          const quantityRaw = row.querySelector<HTMLInputElement>('[data-item-qty]')?.value ?? '';
          const quantity = parseIntegerInput(quantityRaw);
          if (quantity === null || quantity <= 0) fail('Kuantitas harus bilangan bulat lebih dari 0.');
          const priceRaw = row.querySelector<HTMLInputElement>('[data-item-price]')?.value ?? '';
          const unitPrice = parseMoneyInput(priceRaw);
          if (unitPrice === null || unitPrice < 0) fail('Harga satuan harus nominal Rupiah bulat minimal 0.');
          const hppRaw = row.querySelector<HTMLInputElement>('[data-item-hpp]')?.value ?? '';
          const hpp = parseMoneyInput(hppRaw);
          if (hpp === null || hpp < 0) fail('HPP harus nominal Rupiah bulat minimal 0.');
          const name = row.querySelector<HTMLInputElement>('[data-item-name]')?.value.trim() ?? '';
          const sku = row.querySelector<HTMLInputElement>('[data-item-sku]')?.value.trim() ?? '';
          if (!productId && name === '') fail('Nama produk wajib diisi untuk item manual.');
          if (!productId && sku === '') fail('SKU wajib diisi untuk item manual.');

          const item: OrderItemInput = {
            productId,
            productName: product?.name ?? name,
            sku: product?.sku ?? sku,
            quantity: quantity as number,
            unitPrice: unitPrice as number,
          };
          const itemId = row.dataset.itemId;
          if (itemId) item.id = itemId;
          if (!productId) item.hppSnapshot = hpp as number;
          items.push(item);
        }

        if (items.length === 0) {
          throw new ValidationError('Pesanan harus memiliki minimal satu item.', {
            items: 'Tambahkan minimal satu item.',
          });
        }

        const input: OrderInput = {
          storeId: readText(form, 'storeId'),
          marketplaceOrderId: readText(form, 'marketplaceOrderId'),
          orderDate: readText(form, 'orderDate'),
          status: readText(form, 'status') as OrderStatus,
          sellerDiscount: readMoney(form, 'sellerDiscount', 'Diskon penjual'),
          marketplaceDiscount: readMoney(form, 'marketplaceDiscount', 'Diskon marketplace'),
          shippingPaid: readMoney(form, 'shippingPaid', 'Ongkir dibayar pembeli'),
          settlementValue: readOptionalMoney(form, 'settlementValue', 'Nilai pencairan'),
          notes: readText(form, 'notes') || null,
          items,
        };

        const saved = isEdit && id
          ? await services.orderService.update(id, input)
          : await services.orderService.create(input);
        showToast(isEdit ? 'Perubahan pesanan tersimpan.' : 'Pesanan berhasil dibuat.', 'success');
        context.navigate(`/orders/${saved.id}`);
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Pesanan gagal disimpan.', 'error');
        }
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
