import { escapeAttr, escapeHtml } from './dom';
import { icon, refreshIcons } from './icons';
import { showToast } from './toast';
import { ValidationError, errorMessage } from '@/core/utils/validation';
import { parseIntegerInput, parseMoneyInput } from '@/core/utils/money';
import type { BadgeTone } from '@/app/labels';

export interface PageHeaderOptions {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: string;
}

export function pageHeader(options: PageHeaderOptions): string {
  return `
    <header class="page-header">
      <div class="page-header-copy">
        ${options.eyebrow ? `<p class="eyebrow">${escapeHtml(options.eyebrow)}</p>` : ''}
        <h1>${escapeHtml(options.title)}</h1>
        ${options.subtitle ? `<p class="page-subtitle">${escapeHtml(options.subtitle)}</p>` : ''}
      </div>
      ${options.actions ? `<div class="page-actions">${options.actions}</div>` : ''}
    </header>
  `;
}

export interface CardOptions {
  title?: string;
  subtitle?: string;
  actions?: string;
  body: string;
  className?: string;
  padded?: boolean;
}

export function card(options: CardOptions): string {
  return `
    <section class="card ${options.className ?? ''}">
      ${
        options.title || options.actions
          ? `<div class="card-head">
              <div>
                ${options.title ? `<h2 class="card-title">${escapeHtml(options.title)}</h2>` : ''}
                ${options.subtitle ? `<p class="card-subtitle">${escapeHtml(options.subtitle)}</p>` : ''}
              </div>
              ${options.actions ? `<div class="card-actions">${options.actions}</div>` : ''}
            </div>`
          : ''
      }
      <div class="card-body ${options.padded === false ? 'card-body-flush' : ''}">${options.body}</div>
    </section>
  `;
}

export function sectionTitle(title: string, subtitle?: string): string {
  return `
    <div class="section-heading">
      <h2>${escapeHtml(title)}</h2>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
    </div>
  `;
}

export type KpiTone = 'default' | 'positive' | 'negative' | 'warning' | 'info';

export interface KpiOptions {
  label: string;
  value: string;
  hint?: string;
  iconName?: string;
  tone?: KpiTone;
  delta?: number | null;
  deltaLabel?: string;
}

export function kpiCard(options: KpiOptions): string {
  const tone = options.tone ?? 'default';
  return `
    <article class="kpi-card kpi-${tone}">
      <div class="kpi-top">
        <span class="kpi-label">${escapeHtml(options.label)}</span>
        ${options.iconName ? `<span class="kpi-icon">${icon(options.iconName)}</span>` : ''}
      </div>
      <p class="kpi-value">${escapeHtml(options.value)}</p>
      <div class="kpi-foot">
        ${options.delta !== undefined ? deltaBadge(options.delta, options.deltaLabel) : ''}
        ${options.hint ? `<span class="kpi-hint">${escapeHtml(options.hint)}</span>` : ''}
      </div>
    </article>
  `;
}

export function deltaBadge(value: number | null, label = 'vs periode sebelumnya'): string {
  if (value === null || !Number.isFinite(value)) {
    return `<span class="delta delta-neutral">${icon('minus', 'delta-icon')} N/A <span>${escapeHtml(label)}</span></span>`;
  }
  const positive = value >= 0;
  return `<span class="delta ${positive ? 'delta-up' : 'delta-down'}">
    ${icon(positive ? 'trending-up' : 'trending-down', 'delta-icon')}
    ${escapeHtml(`${positive ? '+' : ''}${value.toFixed(1)}%`)}
    <span>${escapeHtml(label)}</span>
  </span>`;
}

export function badge(label: string, tone: BadgeTone = 'neutral', dot = false): string {
  return `<span class="badge badge-${tone}">${dot ? '<span class="badge-dot" aria-hidden="true"></span>' : ''}${escapeHtml(label)}</span>`;
}

export function iconButton(
  iconName: string,
  label: string,
  attributes = '',
  className = 'btn btn-ghost btn-icon',
): string {
  return `<button type="button" class="${className}" aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}" ${attributes}>${icon(iconName)}</button>`;
}

export function linkButton(
  href: string,
  label: string,
  className = 'btn btn-secondary',
  iconName?: string,
): string {
  return `<a class="${className}" href="${escapeAttr(href)}">${iconName ? icon(iconName) : ''}<span>${escapeHtml(label)}</span></a>`;
}

export function emptyState(options: {
  iconName?: string;
  title: string;
  description: string;
  action?: string;
  compact?: boolean;
}): string {
  return `
    <div class="empty-state ${options.compact ? 'empty-compact' : ''}">
      <div class="empty-icon">${icon(options.iconName ?? 'circle-question-mark')}</div>
      <h3>${escapeHtml(options.title)}</h3>
      <p>${escapeHtml(options.description)}</p>
      ${options.action ? `<div class="empty-actions">${options.action}</div>` : ''}
    </div>
  `;
}

export function loadingBlock(message = 'Memuat data…'): string {
  return `
    <div class="loading-state" role="status" aria-live="polite">
      <span class="spinner spinner-lg" aria-hidden="true"></span>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

export function inlineLoading(message = 'Memuat…'): string {
  return `<span class="inline-loading" role="status">${icon('loader-circle', 'spin')} ${escapeHtml(message)}</span>`;
}

export function errorState(message: string, action?: string): string {
  return `
    <div class="error-state" role="alert">
      <div class="error-icon">${icon('triangle-alert')}</div>
      <h3>Data tidak dapat dimuat</h3>
      <p>${escapeHtml(message)}</p>
      ${action ? `<div class="error-actions">${action}</div>` : ''}
    </div>
  `;
}

export function dataTable(headers: string[], rows: string[][], className = ''): string {
  if (rows.length === 0) return '';
  const head = headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join('');
  const body = rows
    .map(
      (cells) =>
        `<tr>${cells
          .map(
            (cell, index) =>
              `<td data-label="${escapeAttr(headers[index] ?? '')}">${cell}</td>`,
          )
          .join('')}</tr>`,
    )
    .join('');
  return `
    <div class="table-wrap">
      <table class="data-table ${className}">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
}

export function paginationBar(info: PaginationInfo): string {
  const totalPages = Math.max(1, Math.ceil(info.total / Math.max(1, info.pageSize)));
  if (totalPages <= 1) return '';
  const page = Math.min(Math.max(1, info.page), totalPages);
  const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
  const buttons: string[] = [];
  let previous = 0;
  for (const item of sorted) {
    if (item - previous > 1) buttons.push('<span class="page-gap">…</span>');
    buttons.push(
      `<button type="button" class="page-btn ${item === page ? 'is-active' : ''}" data-page="${item}" ${item === page ? 'aria-current="page"' : ''}>${item}</button>`,
    );
    previous = item;
  }
  return `
    <div class="pagination">
      <p class="pagination-info">Menampilkan ${info.pageSize * (page - 1) + 1}–${Math.min(info.total, info.pageSize * page)} dari ${info.total}</p>
      <div class="pagination-controls">
        <button type="button" class="page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} aria-label="Halaman sebelumnya">${icon('chevron-left')}</button>
        ${buttons.join('')}
        <button type="button" class="page-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''} aria-label="Halaman berikutnya">${icon('chevron-right')}</button>
      </div>
    </div>
  `;
}

export function bindPagination(root: ParentNode, handler: (page: number) => void): void {
  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('button[data-page]');
    if (!button || button.disabled) return;
    const page = Number(button.dataset.page);
    if (Number.isInteger(page) && page > 0) handler(page);
  });
}

export interface FormFieldOptions {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'password' | 'search' | 'money' | 'integer' | 'select' | 'textarea';
  value?: string | number | null;
  required?: boolean;
  placeholder?: string;
  help?: string;
  autocomplete?: string;
  idPrefix?: string;
  span?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

export function formField(options: FormFieldOptions): string {
  const id = `${options.idPrefix ?? 'field'}-${options.name}`;
  const type = options.type ?? 'text';
  const value = options.value === null || options.value === undefined ? '' : String(options.value);
  const aria = options.required ? ' required aria-required="true"' : '';
  const disabled = options.disabled ? ' disabled' : '';
  let control: string;
  if (type === 'select') {
    control = `<select class="input select" id="${escapeAttr(id)}" name="${escapeAttr(options.name)}"${aria}${disabled}>
      ${(options.options ?? [])
        .map(
          (option) =>
            `<option value="${escapeAttr(option.value)}" ${String(option.value) === value ? 'selected' : ''}>${escapeHtml(option.label)}</option>`,
        )
        .join('')}
    </select>`;
  } else if (type === 'textarea') {
    control = `<textarea class="input textarea" id="${escapeAttr(id)}" name="${escapeAttr(options.name)}" rows="${options.rows ?? 3}" placeholder="${escapeAttr(options.placeholder ?? '')}"${aria}${disabled}>${escapeHtml(value)}</textarea>`;
  } else if (type === 'money' || type === 'integer') {
    control = `<div class="input-affix"><span class="affix">${type === 'money' ? 'Rp' : '#'}</span><input class="input" id="${escapeAttr(id)}" name="${escapeAttr(options.name)}" type="text" inputmode="numeric" value="${escapeAttr(value)}" placeholder="${escapeAttr(options.placeholder ?? (type === 'money' ? '0' : '1'))}"${aria}${disabled} /></div>`;
  } else {
    const autocomplete = options.autocomplete
      ? ` autocomplete="${escapeAttr(options.autocomplete)}"`
      : ' autocomplete="off"';
    const numeric = type === 'date' ? '' : ' inputmode="text"';
    control = `<input class="input" id="${escapeAttr(id)}" name="${escapeAttr(options.name)}" type="${type}" value="${escapeAttr(value)}" placeholder="${escapeAttr(options.placeholder ?? '')}"${aria}${disabled}${autocomplete}${numeric}${options.min !== undefined ? ` min="${escapeAttr(options.min)}"` : ''}${options.max !== undefined ? ` max="${escapeAttr(options.max)}"` : ''}${options.step !== undefined ? ` step="${escapeAttr(options.step)}"` : ''} />`;
  }
  return `
    <div class="field ${options.span ? 'span-2' : ''}" data-field="${escapeAttr(options.name)}">
      <label class="field-label" for="${escapeAttr(id)}">
        ${escapeHtml(options.label)}
        ${options.required ? '<span class="required-mark" aria-hidden="true">*</span>' : '<span class="optional-mark">Opsional</span>'}
      </label>
      ${control}
      ${options.help ? `<p class="field-help">${escapeHtml(options.help)}</p>` : ''}
      <p class="field-error" data-error-for="${escapeAttr(options.name)}"></p>
    </div>
  `;
}

export function checkboxField(options: {
  name: string;
  label: string;
  description?: string;
  checked?: boolean;
  idPrefix?: string;
}): string {
  const id = `${options.idPrefix ?? 'field'}-${options.name}`;
  return `
    <label class="checkbox-field" for="${escapeAttr(id)}">
      <input type="checkbox" id="${escapeAttr(id)}" name="${escapeAttr(options.name)}" ${options.checked ? 'checked' : ''} />
      <span>
        <strong>${escapeHtml(options.label)}</strong>
        ${options.description ? `<small>${escapeHtml(options.description)}</small>` : ''}
      </span>
    </label>
  `;
}

export function formErrorBanner(): string {
  return `<p class="form-error" data-form-error hidden role="alert"></p>`;
}

export function formActions(
  submitLabel: string,
  options: {
    cancelLabel?: string;
    cancelHref?: string;
    extra?: string;
    submitIcon?: string;
  } = {},
): string {
  const cancel = options.cancelHref
    ? `<a class="btn btn-secondary" href="${escapeAttr(options.cancelHref)}">${escapeHtml(options.cancelLabel ?? 'Batal')}</a>`
    : `<button type="button" class="btn btn-secondary" data-modal-cancel>${escapeHtml(options.cancelLabel ?? 'Batal')}</button>`;
  return `
    <div class="form-actions">
      ${cancel}
      <button type="submit" class="btn btn-primary">${options.submitIcon ? icon(options.submitIcon) : ''}<span>${escapeHtml(submitLabel)}</span></button>
      ${options.extra ?? ''}
    </div>
  `;
}

export function setButtonLoading(
  button: HTMLButtonElement,
  loading: boolean,
  loadingLabel?: string,
): void {
  if (loading) {
    if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${escapeHtml(loadingLabel ?? 'Memproses…')}</span>`;
  } else {
    if (button.dataset.originalHtml) button.innerHTML = button.dataset.originalHtml;
    delete button.dataset.originalHtml;
    button.disabled = false;
  }
}

export function fieldElement(form: ParentNode, name: string): HTMLElement | null {
  return form.querySelector<HTMLElement>(`[data-field="${name}"]`);
}

export function setFieldError(form: ParentNode, name: string, message: string): void {
  const field = fieldElement(form, name);
  if (!field) return;
  field.classList.add('has-error');
  const error = field.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
  if (error) error.textContent = message;
}

export function clearFormErrors(form: ParentNode): void {
  form.querySelectorAll('.field.has-error').forEach((field) => field.classList.remove('has-error'));
  form.querySelectorAll<HTMLElement>('[data-error-for]').forEach((error) => {
    error.textContent = '';
  });
  const banner = form.querySelector<HTMLElement>('[data-form-error]');
  if (banner) {
    banner.textContent = '';
    banner.hidden = true;
  }
}

/** Menampilkan error validasi dekat field dan banner form. */
export function applyFormErrors(form: ParentNode, error: unknown): string {
  clearFormErrors(form);
  const message = errorMessage(error);
  if (error instanceof ValidationError && Object.keys(error.fieldErrors).length > 0) {
    for (const [name, fieldMessage] of Object.entries(error.fieldErrors)) {
      setFieldError(form, name, fieldMessage);
    }
    const first = form.querySelector<HTMLElement>('.field.has-error input, .field.has-error select, .field.has-error textarea');
    first?.focus();
  }
  const banner = form.querySelector<HTMLElement>('[data-form-error]');
  if (banner) {
    banner.textContent = message;
    banner.hidden = false;
  } else if (!(error instanceof ValidationError)) {
    showToast(message, 'error');
  }
  return message;
}

export function readText(form: HTMLFormElement, name: string): string {
  const element = form.elements.namedItem(name);
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    return element.value.trim();
  }
  return '';
}

export function readOptionalText(form: HTMLFormElement, name: string): string | null {
  const value = readText(form, name);
  return value === '' ? null : value;
}

export function readMoney(
  form: HTMLFormElement,
  name: string,
  label: string,
  options: { required?: boolean } = {},
): number {
  const raw = readText(form, name);
  if (raw === '') {
    if (options.required) {
      throw new ValidationError(`${label} wajib diisi.`, { [name]: `${label} wajib diisi.` });
    }
    return 0;
  }
  const value = parseMoneyInput(raw);
  if (value === null || value < 0) {
    throw new ValidationError(`${label} tidak valid.`, {
      [name]: `${label} harus berupa nominal Rupiah bulat minimal 0.`,
    });
  }
  return value;
}

export function readOptionalMoney(
  form: HTMLFormElement,
  name: string,
  label: string,
): number | null {
  const raw = readText(form, name);
  if (raw === '') return null;
  const value = parseMoneyInput(raw);
  if (value === null || value < 0) {
    throw new ValidationError(`${label} tidak valid.`, {
      [name]: `${label} harus berupa nominal Rupiah bulat minimal 0.`,
    });
  }
  return value;
}

export function readInteger(
  form: HTMLFormElement,
  name: string,
  label: string,
  options: { required?: boolean; min?: number } = {},
): number {
  const raw = readText(form, name);
  if (raw === '') {
    if (options.required) {
      throw new ValidationError(`${label} wajib diisi.`, { [name]: `${label} wajib diisi.` });
    }
    return 0;
  }
  const value = parseIntegerInput(raw);
  const min = options.min ?? 0;
  if (value === null || value < min) {
    throw new ValidationError(`${label} tidak valid.`, {
      [name]: `${label} harus berupa bilangan bulat minimal ${min}.`,
    });
  }
  return value;
}

export function readOptionalInteger(
  form: HTMLFormElement,
  name: string,
  label: string,
): number | null {
  const raw = readText(form, name);
  if (raw === '') return null;
  const value = parseIntegerInput(raw);
  if (value === null || value < 0) {
    throw new ValidationError(`${label} tidak valid.`, {
      [name]: `${label} harus berupa bilangan bulat minimal 0.`,
    });
  }
  return value;
}

export function readCheckbox(form: HTMLFormElement, name: string): boolean {
  const element = form.elements.namedItem(name);
  return element instanceof HTMLInputElement ? element.checked : false;
}

export function busyButton(button: HTMLButtonElement, loading: boolean, label?: string): void {
  setButtonLoading(button, loading, label);
}

let modalCounter = 0;
const activeModals = new Set<HTMLDialogElement>();

export interface ModalOptions {
  title: string;
  description?: string;
  body: string;
  footer?: string;
  size?: 'sm' | 'md' | 'lg';
  onMount?: (dialog: HTMLDialogElement) => void | (() => void);
}

export interface ModalHandle {
  dialog: HTMLDialogElement;
  close: () => void;
}

export function openModal(options: ModalOptions): ModalHandle {
  const overlay = document.getElementById('overlay-root') ?? document.body;
  const titleId = `modal-title-${++modalCounter}`;
  const dialog = document.createElement('dialog');
  dialog.className = `modal modal-${options.size ?? 'md'}`;
  dialog.setAttribute('aria-labelledby', titleId);
  dialog.innerHTML = `
    <div class="modal-panel">
      <div class="modal-head">
        <div>
          <h2 id="${titleId}">${escapeHtml(options.title)}</h2>
          ${options.description ? `<p>${escapeHtml(options.description)}</p>` : ''}
        </div>
        <button type="button" class="btn btn-ghost btn-icon modal-close" aria-label="Tutup dialog" title="Tutup">${icon('x')}</button>
      </div>
      <div class="modal-body">${options.body}</div>
      ${options.footer ? `<div class="modal-foot">${options.footer}</div>` : ''}
    </div>
  `;
  let cleanup: void | (() => void);
  const close = (): void => {
    if (dialog.open) dialog.close();
    if (dialog.isConnected) dialog.remove();
    activeModals.delete(dialog);
  };
  dialog.addEventListener('close', () => {
    activeModals.delete(dialog);
    dialog.remove();
    if (typeof cleanup === 'function') cleanup();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  dialog.querySelector<HTMLButtonElement>('.modal-close')?.addEventListener('click', close);
  dialog.querySelectorAll<HTMLElement>('[data-modal-cancel]').forEach((button) => {
    button.addEventListener('click', close);
  });
  overlay.appendChild(dialog);
  activeModals.add(dialog);
  dialog.showModal();
  refreshIcons(dialog);
  cleanup = options.onMount?.(dialog);
  return { dialog, close };
}

export function closeAllModals(): void {
  for (const dialog of [...activeModals]) {
    if (dialog.open) dialog.close();
    dialog.remove();
    activeModals.delete(dialog);
  }
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  requireText?: string;
  details?: string[];
}

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let confirmed = false;
    const requirement = options.requireText
      ? `<div class="confirm-requirement">
          <label class="field-label" for="confirm-text">Ketik <strong>${escapeHtml(options.requireText)}</strong> untuk melanjutkan</label>
          <input class="input" id="confirm-text" type="text" autocomplete="off" spellcheck="false" />
        </div>`
      : '';
    const details = options.details?.length
      ? `<ul class="confirm-details">${options.details.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : '';
    const handle = openModal({
      title: options.title,
      size: 'sm',
      body: `<p class="confirm-message">${escapeHtml(options.message)}</p>${details}${requirement}`,
      footer: `
        <button type="button" class="btn btn-secondary" data-confirm-cancel>${escapeHtml(options.cancelLabel ?? 'Batal')}</button>
        <button type="button" class="btn ${options.tone === 'danger' ? 'btn-danger' : 'btn-primary'}" data-confirm-ok ${options.requireText ? 'disabled' : ''}>${escapeHtml(options.confirmLabel ?? 'Lanjutkan')}</button>
      `,
    });
    const ok = handle.dialog.querySelector<HTMLButtonElement>('[data-confirm-ok]');
    const input = handle.dialog.querySelector<HTMLInputElement>('#confirm-text');
    if (input && ok) {
      input.addEventListener('input', () => {
        ok.disabled = input.value.trim() !== (options.requireText ?? '');
      });
      input.focus();
    }
    handle.dialog.querySelector('[data-confirm-cancel]')?.addEventListener('click', () => {
      handle.close();
    });
    ok?.addEventListener('click', () => {
      if (ok.disabled) return;
      confirmed = true;
      handle.close();
    });
    handle.dialog.addEventListener('close', () => {
      resolve(confirmed);
    });
  });
}

export async function copyText(value: string, successMessage = 'Disalin ke clipboard.'): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      if (!ok) throw new Error('Clipboard tidak tersedia.');
    }
    showToast(successMessage, 'success');
  } catch {
    showToast('Data tidak dapat disalin pada perangkat ini.', 'error');
  }
}

export { refreshIcons, showToast };
