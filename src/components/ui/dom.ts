export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttr(value: unknown): string {
  return escapeHtml(value);
}

export function qs<T extends Element = HTMLElement>(
  root: ParentNode,
  selector: string,
): T | null {
  return root.querySelector<T>(selector);
}

export function qsa<T extends Element = HTMLElement>(
  root: ParentNode,
  selector: string,
): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

export function setHtml(target: Element, html: string): void {
  target.innerHTML = html;
}

export function clearElement(target: Element): void {
  target.replaceChildren();
}

export function formatCount(value: number, singular: string, plural: string = singular): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function debounce<T extends (...args: never[]) => void>(fn: T, delay = 250): T {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
