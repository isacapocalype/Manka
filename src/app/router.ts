import type { AppServices } from '@/core/services/appServices';
import { errorMessage } from '@/core/utils/validation';
import { closeAllModals, errorState, refreshIcons } from '@/components/ui/ui';

export interface RouteContext {
  root: HTMLElement;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  services: AppServices;
  signal: AbortSignal;
  navigate(path: string, options?: { replace?: boolean }): void;
  refresh(): void;
  onCleanup(cleanup: () => void): void;
  setTitle(title: string): void;
}

export type PageRenderer = (context: RouteContext) => Promise<void> | void;

export interface RouteDefinition {
  path: string;
  title: string;
  render: PageRenderer;
}

export interface RouterChrome {
  setActive(path: string): void;
  setPageLabel(label: string): void;
}

export interface RouterHandle {
  navigate(path: string, options?: { replace?: boolean }): void;
  refresh(): void;
  stop(): void;
}

interface ParsedHash {
  path: string;
  query: URLSearchParams;
}

interface MatchResult {
  route: RouteDefinition;
  params: Record<string, string>;
}

function parseHash(hash: string): ParsedHash {
  const raw = hash.replace(/^#/, '');
  const [pathPart = '', queryPart = ''] = raw.split('?');
  let path = pathPart.trim();
  if (path === '') path = '/dashboard';
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return { path, query: new URLSearchParams(queryPart) };
}

function matchRoute(routes: RouteDefinition[], path: string): MatchResult | null {
  const segments = path.split('/').filter(Boolean);
  for (const route of routes) {
    const routeSegments = route.path.split('/').filter(Boolean);
    if (routeSegments.length !== segments.length) continue;
    const params: Record<string, string> = {};
    let matches = true;
    for (let index = 0; index < routeSegments.length; index += 1) {
      const expected = routeSegments[index] ?? '';
      const actual = segments[index] ?? '';
      if (expected.startsWith(':')) {
        if (actual === '') {
          matches = false;
          break;
        }
        params[expected.slice(1)] = decodeURIComponent(actual);
      } else if (expected !== actual) {
        matches = false;
        break;
      }
    }
    if (matches) return { route, params };
  }
  return null;
}

export function startRouter(
  routes: RouteDefinition[],
  host: HTMLElement,
  services: AppServices,
  chrome: RouterChrome,
): RouterHandle {
  let controller: AbortController | null = null;
  let cleanups: (() => void)[] = [];
  let stopped = false;

  const navigate = (path: string, options: { replace?: boolean } = {}): void => {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    const nextHash = `#${normalized}`;
    if (window.location.hash === nextHash) {
      void renderCurrent();
      return;
    }
    if (options.replace) {
      window.history.replaceState(null, '', nextHash);
      void renderCurrent();
    } else {
      window.location.hash = normalized;
    }
  };

  const runCleanup = (): void => {
    for (const cleanup of cleanups.splice(0)) {
      try {
        cleanup();
      } catch {
        // Cleanup UI tidak boleh menghentikan navigasi.
      }
    }
  };

  const renderCurrent = async (): Promise<void> => {
    if (stopped) return;
    controller?.abort();
    controller = new AbortController();
    const localController = controller;
    runCleanup();
    closeAllModals();

    const parsed = parseHash(window.location.hash);
    let resolvedPath = parsed.path;
    let query = parsed.query;

    if (resolvedPath === '/' || resolvedPath === '') {
      resolvedPath = '/dashboard';
      query = new URLSearchParams();
      window.history.replaceState(null, '', '#/dashboard');
    }

    const match = matchRoute(routes, resolvedPath);
    const page = document.createElement('div');
    page.className = 'page';
    host.replaceChildren(page);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    chrome.setActive(resolvedPath);

    if (!match) {
      document.title = 'Halaman tidak ditemukan · Manka';
      chrome.setPageLabel('Tidak ditemukan');
      page.innerHTML = `
        <div class="page-not-found">
          ${errorState(
            'Halaman yang Anda buka tidak tersedia. Gunakan navigasi untuk kembali.',
            '<a class="btn btn-primary" href="#/dashboard">Kembali ke dashboard</a>',
          )}
        </div>
      `;
      refreshIcons(page);
      return;
    }

    const { route, params } = match;
    let currentTitle = route.title;
    document.title = `${route.title} · Manka`;
    chrome.setPageLabel(route.title);

    const context: RouteContext = {
      root: page,
      path: resolvedPath,
      params,
      query,
      services,
      signal: localController.signal,
      navigate,
      refresh: () => {
        void renderCurrent();
      },
      onCleanup: (cleanup) => {
        cleanups.push(cleanup);
      },
      setTitle: (title) => {
        currentTitle = title;
        if (localController.signal.aborted) return;
        document.title = `${title} · Manka`;
        chrome.setPageLabel(title);
      },
    };

    page.setAttribute('aria-busy', 'true');
    try {
      await route.render(context);
      if (localController.signal.aborted) return;
      page.removeAttribute('aria-busy');
      refreshIcons(page);
      if (currentTitle) chrome.setPageLabel(currentTitle);
    } catch (error) {
      if (localController.signal.aborted) return;
      page.removeAttribute('aria-busy');
      page.innerHTML = errorState(
        errorMessage(error, 'Halaman gagal dimuat. Silakan coba lagi.'),
        `<button type="button" class="btn btn-primary" data-retry-page>${'Muat ulang'}</button>`,
      );
      page.querySelector<HTMLButtonElement>('[data-retry-page]')?.addEventListener('click', () => {
        void renderCurrent();
      });
      refreshIcons(page);
    }
  };

  const handleHashChange = (): void => {
    void renderCurrent();
  };

  window.addEventListener('hashchange', handleHashChange);
  const initialPath = parseHash(window.location.hash).path;
  if (!window.location.hash || window.location.hash === '#' || initialPath === '/') {
    window.history.replaceState(null, '', '#/dashboard');
  }
  void renderCurrent();

  return {
    navigate,
    refresh: () => {
      void renderCurrent();
    },
    stop: () => {
      stopped = true;
      window.removeEventListener('hashchange', handleHashChange);
      controller?.abort();
      runCleanup();
    },
  };
}
