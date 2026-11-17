import type { RouteDefinition } from './router';
import { dashboardPage } from '@/modules/dashboard/dashboardPage';
import { storeListPage } from '@/modules/stores/storeListPage';
import { storeDetailPage } from '@/modules/stores/storeDetailPage';
import { storeFormPage } from '@/modules/stores/storeFormPage';
import { productListPage } from '@/modules/products/productListPage';
import { productDetailPage } from '@/modules/products/productDetailPage';
import { productFormPage } from '@/modules/products/productFormPage';
import { orderListPage } from '@/modules/orders/orderListPage';
import { orderDetailPage } from '@/modules/orders/orderDetailPage';
import { orderFormPage } from '@/modules/orders/orderFormPage';
import { orderImportPage } from '@/modules/orders/orderImportPage';
import { financeOverviewPage } from '@/modules/finance/financeOverviewPage';
import { feeListPage, feeFormPage } from '@/modules/finance/feePages';
import {
  adCampaignDetailPage,
  adCampaignFormPage,
  adCampaignListPage,
  adExpenseFormPage,
  adExpenseListPage,
} from '@/modules/finance/adPages';
import { expenseListPage, expenseFormPage } from '@/modules/finance/expensePages';
import { refundListPage, refundFormPage } from '@/modules/finance/refundPages';
import { settlementListPage, settlementFormPage } from '@/modules/finance/settlementPages';
import { reportsPage } from '@/modules/reports/reportsPage';
import { settingsPage } from '@/modules/settings/settingsPage';
import { morePage } from '@/modules/more/morePage';

export const APP_ROUTES: RouteDefinition[] = [
  { path: '/dashboard', title: 'Dashboard', render: dashboardPage },

  { path: '/stores', title: 'Toko', render: storeListPage },
  { path: '/stores/new', title: 'Toko baru', render: storeFormPage },
  { path: '/stores/:id', title: 'Detail toko', render: storeDetailPage },
  { path: '/stores/:id/edit', title: 'Ubah toko', render: storeFormPage },

  { path: '/products', title: 'Produk', render: productListPage },
  { path: '/products/new', title: 'Produk baru', render: productFormPage },
  { path: '/products/:id', title: 'Detail produk', render: productDetailPage },
  { path: '/products/:id/edit', title: 'Ubah produk', render: productFormPage },

  { path: '/orders', title: 'Pesanan', render: orderListPage },
  { path: '/orders/new', title: 'Pesanan baru', render: orderFormPage },
  { path: '/orders/import', title: 'Import pesanan', render: orderImportPage },
  { path: '/orders/:id', title: 'Detail pesanan', render: orderDetailPage },
  { path: '/orders/:id/edit', title: 'Ubah pesanan', render: orderFormPage },

  { path: '/finance', title: 'Keuangan', render: financeOverviewPage },

  { path: '/finance/fees', title: 'Biaya marketplace', render: feeListPage },
  { path: '/finance/fees/new', title: 'Biaya marketplace baru', render: feeFormPage },
  { path: '/finance/fees/:id/edit', title: 'Ubah biaya marketplace', render: feeFormPage },

  { path: '/finance/ads', title: 'Iklan', render: adCampaignListPage },
  { path: '/finance/ads/new', title: 'Kampanye iklan baru', render: adCampaignFormPage },
  { path: '/finance/ads/expenses', title: 'Biaya iklan', render: adExpenseListPage },
  { path: '/finance/ads/expenses/new', title: 'Biaya iklan baru', render: adExpenseFormPage },
  {
    path: '/finance/ads/expenses/:id/edit',
    title: 'Ubah biaya iklan',
    render: adExpenseFormPage,
  },
  { path: '/finance/ads/:id', title: 'Detail kampanye', render: adCampaignDetailPage },
  { path: '/finance/ads/:id/edit', title: 'Ubah kampanye', render: adCampaignFormPage },

  { path: '/finance/expenses', title: 'Biaya operasional', render: expenseListPage },
  { path: '/finance/expenses/new', title: 'Biaya operasional baru', render: expenseFormPage },
  {
    path: '/finance/expenses/:id/edit',
    title: 'Ubah biaya operasional',
    render: expenseFormPage,
  },

  { path: '/finance/refunds', title: 'Refund', render: refundListPage },
  { path: '/finance/refunds/new', title: 'Refund baru', render: refundFormPage },
  { path: '/finance/refunds/:id/edit', title: 'Ubah refund', render: refundFormPage },

  { path: '/finance/settlements', title: 'Settlement', render: settlementListPage },
  { path: '/finance/settlements/new', title: 'Settlement baru', render: settlementFormPage },
  {
    path: '/finance/settlements/:id/edit',
    title: 'Ubah settlement',
    render: settlementFormPage,
  },

  { path: '/reports', title: 'Laporan', render: reportsPage },
  { path: '/settings', title: 'Pengaturan', render: settingsPage },
  { path: '/more', title: 'Lainnya', render: morePage },
];
