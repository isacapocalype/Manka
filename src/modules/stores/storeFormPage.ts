import type { Store, StoreInput, StorePlatform } from '@/types/entities';
import { STORE_PLATFORMS } from '@/types/entities';
import type { PageRenderer } from '@/app/router';
import { STORE_PLATFORM_LABELS } from '@/app/labels';
import { formatBusinessDate } from '@/core/utils/date';
import { ValidationError } from '@/core/utils/validation';
import { escapeHtml } from '@/components/ui/dom';
import { icon } from '@/components/ui/icons';
import {
  applyFormErrors,
  checkboxField,
  formActions,
  formErrorBanner,
  formField,
  loadingBlock,
  pageHeader,
  readCheckbox,
  readOptionalText,
  readText,
  refreshIcons,
  setButtonLoading,
  showToast,
} from '@/components/ui/ui';
import { renderPageError } from '@/app/pageUtils';

function sensitiveInputField(options: {
  name: string;
  label: string;
  help: string;
  idPrefix: string;
  required?: boolean;
}): string {
  const id = `${options.idPrefix}-${options.name}`;
  return `
    <div class="field" data-field="${options.name}">
      <label class="field-label" for="${id}">${escapeHtml(options.label)} <span class="optional-mark">Opsional</span></label>
      <div class="input-with-action">
        <input class="input" id="${id}" name="${options.name}" type="password" autocomplete="off" spellcheck="false" />
        <button type="button" class="btn btn-ghost btn-icon input-action" data-toggle-secret="${id}" aria-label="Tampilkan ${escapeHtml(options.label.toLowerCase())}" title="Tampilkan">
          ${icon('eye')}
        </button>
      </div>
      <p class="field-help">${escapeHtml(options.help)}</p>
      <p class="field-error" data-error-for="${options.name}"></p>
    </div>
  `;
}

export const storeFormPage: PageRenderer = async (context) => {
  const { root, services } = context;
  const id = context.params.id ?? null;
  const isEdit = id !== null;
  root.innerHTML = loadingBlock(isEdit ? 'Memuat data toko…' : 'Menyiapkan formulir…');

  try {
    let store: Store | null = null;
    if (id) {
      store = await services.storeService.get(id);
    }
    if (context.signal.aborted) return;

    context.setTitle(isEdit ? 'Ubah toko' : 'Toko baru');

    const platformOptions = STORE_PLATFORMS.map((platform) => ({
      value: platform,
      label: STORE_PLATFORM_LABELS[platform],
    }));

    root.innerHTML = `
      ${pageHeader({
        eyebrow: 'Toko',
        title: isEdit ? 'Ubah informasi toko' : 'Tambah toko',
        subtitle: isEdit
          ? `Dibuat ${store ? formatBusinessDate(store.createdAt.slice(0, 10), 'long') : ''}. Data sensitif tidak pernah dimuat ke formulir ini.`
          : 'Lengkapi identitas toko. Field profile tambahan dapat diisi nanti melalui halaman profile toko.',
        actions: `<a class="btn btn-secondary" href="#${isEdit && id ? `/stores/${id}` : '/stores'}">${icon('arrow-left')}<span>Kembali</span></a>`,
      })}

      <form class="form-card" id="store-form" novalidate>
        ${formErrorBanner()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Informasi toko</h2>
            <p>Nama dan platform wajib diisi.</p>
          </div>
          <div class="form-grid">
            ${formField({
              name: 'name',
              label: 'Nama toko',
              value: store?.name ?? '',
              required: true,
              placeholder: 'Contoh: Manka Official',
              idPrefix: 'store',
              span: true,
            })}
            ${formField({
              name: 'platform',
              label: 'Platform',
              type: 'select',
              value: store?.platform ?? 'shopee',
              options: platformOptions,
              required: true,
              idPrefix: 'store',
            })}
            ${formField({
              name: 'email',
              label: 'Email toko',
              type: 'email',
              value: store?.email ?? '',
              placeholder: 'toko@contoh.com',
              idPrefix: 'store',
            })}
            ${formField({
              name: 'phone',
              label: 'Nomor HP',
              type: 'tel',
              value: store?.phone ?? '',
              placeholder: '0812…',
              idPrefix: 'store',
            })}
            ${formField({
              name: 'ktpName',
              label: 'Nama KTP',
              value: store?.ktpName ?? '',
              help: 'Nama pemilik sesuai identitas, jika diperlukan untuk administrasi.',
              idPrefix: 'store',
            })}
            ${
              isEdit
                ? formField({
                    name: 'status',
                    label: 'Status toko',
                    type: 'select',
                    value: store?.status ?? 'active',
                    options: [
                      { value: 'active', label: 'Aktif' },
                      { value: 'archived', label: 'Diarsipkan' },
                    ],
                    idPrefix: 'store',
                  })
                : ''
            }
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-head">
            <h2>Informasi pemilik & akses</h2>
            <p>Nomor rekening dan kata sandi disimpan terenkripsi. Nilai tersimpan tidak ditampilkan pada formulir.</p>
          </div>
          <div class="form-grid">
            ${sensitiveInputField({
              name: 'bankAccount',
              label: 'Nomor rekening',
              help: isEdit
                ? 'Biarkan kosong untuk mempertahankan nomor rekening tersimpan. Isi hanya jika ingin menggantinya.'
                : 'Opsional. Hanya ditampilkan setelah tindakan eksplisit di halaman profile.',
              idPrefix: 'store',
            })}
            ${sensitiveInputField({
              name: 'password',
              label: 'Kata sandi marketplace',
              help: isEdit
                ? 'Biarkan kosong untuk mempertahankan kata sandi tersimpan. Kata sandi bukan autentikasi aplikasi.'
                : 'Opsional. Catatan kredensial marketplace, bukan login aplikasi.',
              idPrefix: 'store',
            })}
          </div>
          ${
            isEdit
              ? `<div class="form-checks">
                  ${checkboxField({
                    name: 'clearBankAccount',
                    label: 'Hapus nomor rekening tersimpan',
                    description: 'Nomor rekening akan dikosongkan setelah disimpan.',
                    idPrefix: 'store',
                  })}
                  ${checkboxField({
                    name: 'clearPassword',
                    label: 'Hapus kata sandi tersimpan',
                    description: 'Kata sandi marketplace akan dikosongkan setelah disimpan.',
                    idPrefix: 'store',
                  })}
                </div>
                <p class="inline-note note-warning">${icon('shield-alert')} Tindakan menghapus data sensitif tidak dapat dibatalkan.</p>`
              : ''
          }
        </div>

        <div class="form-section form-section-note">
          <div class="security-note">
            ${icon('shield-check')}
            <div>
              <strong>Data sensitif tidak masuk ke log atau URL</strong>
              <p>Backup yang memuat profile toko juga dilindungi kata sandi saat dibuat melalui menu Pengaturan.</p>
            </div>
          </div>
        </div>

        ${formActions(isEdit ? 'Simpan perubahan' : 'Simpan toko', {
          submitIcon: 'save',
          cancelHref: `#${isEdit && id ? `/stores/${id}` : '/stores'}`,
        })}
      </form>
    `;

    for (const toggle of root.querySelectorAll<HTMLButtonElement>('[data-toggle-secret]')) {
      toggle.addEventListener('click', () => {
        const targetId = toggle.dataset.toggleSecret;
        const input = targetId ? root.querySelector<HTMLInputElement>(`#${CSS.escape(targetId)}`) : null;
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        toggle.innerHTML = icon(show ? 'eye-off' : 'eye');
        toggle.setAttribute('aria-label', show ? 'Sembunyikan data' : 'Tampilkan data');
        toggle.setAttribute('title', show ? 'Sembunyikan' : 'Tampilkan');
        refreshIcons(toggle);
      });
    }

    const form = root.querySelector<HTMLFormElement>('#store-form');
    if (!form) throw new Error('Formulir toko tidak ditemukan.');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!submit) return;
      applyFormErrors(form, null);
      setButtonLoading(submit, true, 'Menyimpan…');
      try {
        const passwordValue = readText(form, 'password');
        const bankValue = readText(form, 'bankAccount');
        const input: StoreInput = {
          name: readText(form, 'name'),
          platform: readText(form, 'platform') as StorePlatform,
          email: readOptionalText(form, 'email'),
          phone: readOptionalText(form, 'phone'),
          ktpName: readOptionalText(form, 'ktpName'),
          status: isEdit ? (readText(form, 'status') === 'archived' ? 'archived' : 'active') : 'active',
        };
        if (passwordValue !== '') {
          input.password = passwordValue;
        } else if (isEdit && readCheckbox(form, 'clearPassword')) {
          input.password = null;
        }
        if (bankValue !== '') {
          input.bankAccount = bankValue;
        } else if (isEdit && readCheckbox(form, 'clearBankAccount')) {
          input.bankAccount = null;
        }

        const saved = isEdit && id
          ? await services.storeService.update(id, input)
          : await services.storeService.create(input);
        showToast(isEdit ? 'Perubahan toko tersimpan.' : 'Toko berhasil dibuat.', 'success');
        context.navigate(`/stores/${saved.id}`);
      } catch (error) {
        applyFormErrors(form, error);
        setButtonLoading(submit, false);
        if (!(error instanceof ValidationError)) {
          showToast('Periksa kembali data toko.', 'error');
        }
      }
    });

    refreshIcons(root);
  } catch (error) {
    renderPageError(root, context, error);
  }
};
