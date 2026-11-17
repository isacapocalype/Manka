import { escapeHtml } from './dom';
import { refreshIcons } from './icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

const ICON_BY_TYPE: Record<ToastType, string> = {
  success: 'circle-check',
  error: 'circle-x',
  info: 'info',
  warning: 'triangle-alert',
};

export function showToast(message: string, type: ToastType = 'success', durationMs?: number): void {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.innerHTML = `
    <i data-lucide="${ICON_BY_TYPE[type]}" aria-hidden="true"></i>
    <span>${escapeHtml(message)}</span>
  `;
  root.appendChild(toast);
  refreshIcons(toast);
  const duration = durationMs ?? (type === 'error' ? 6500 : 3800);
  window.setTimeout(() => {
    toast.classList.add('toast-leaving');
    window.setTimeout(() => toast.remove(), 220);
  }, duration);
}

export function showErrorToast(error: unknown, fallback = 'Terjadi kesalahan.'): void {
  const message = error instanceof Error && error.message ? error.message : fallback;
  showToast(message, 'error');
}
