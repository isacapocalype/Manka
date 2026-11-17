import type { AppServices } from '@/core/services/appServices';
import { setActiveServices } from '@/core/services/appServices';
import { createLayout } from './layout';
import { APP_ROUTES } from './pages';
import { startRouter, type RouterHandle } from './router';

export interface MankaApp {
  router: RouterHandle;
  services: AppServices;
}

export function createApp(mount: HTMLElement, services: AppServices): MankaApp {
  setActiveServices(services);
  const layout = createLayout(mount, services, (path) => {
    app.router.navigate(path);
  });
  const app: MankaApp = {
    router: startRouter(APP_ROUTES, layout.pageHost, services, {
      setActive: (path) => layout.setActive(path),
      setPageLabel: (label) => layout.setPageLabel(label),
    }),
    services,
  };
  return app;
}
