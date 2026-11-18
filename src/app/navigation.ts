export interface NavItem {
  href: string;
  label: string;
  iconName: string;
  /** Prefix halaman yang membuat item ini aktif. */
  match: string[];
  section?: 'main' | 'finance' | 'secondary';
}

export const MAIN_NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    iconName: 'layout-dashboard',
    match: ['/dashboard'],
    section: 'main',
  },
  {
    href: '/stores',
    label: 'Toko',
    iconName: 'store',
    match: ['/stores'],
    section: 'main',
  },
  {
    href: '/orders',
    label: 'Pesanan',
    iconName: 'shopping-bag',
    match: ['/orders'],
    section: 'main',
  },
  {
    href: '/production',
    label: 'Produksi',
    iconName: 'factory',
    match: ['/production'],
    section: 'main',
  },
  {
    href: '/products',
    label: 'Produk',
    iconName: 'package',
    match: ['/products'],
    section: 'main',
  },
  {
    href: '/materials',
    label: 'Material',
    iconName: 'boxes',
    match: ['/materials'],
    section: 'main',
  },
  {
    href: '/finance',
    label: 'Keuangan',
    iconName: 'wallet',
    match: ['/finance'],
    section: 'main',
  },
  {
    href: '/reports',
    label: 'Laporan',
    iconName: 'chart-column',
    match: ['/reports'],
    section: 'main',
  },
  {
    href: '/health',
    label: 'Kesehatan',
    iconName: 'shield-check',
    match: ['/health'],
    section: 'main',
  },
  {
    href: '/settings',
    label: 'Pengaturan',
    iconName: 'settings',
    match: ['/settings'],
    section: 'main',
  },
];

export const FINANCE_NAV: NavItem[] = [
  {
    href: '/finance',
    label: 'Ringkasan',
    iconName: 'chart-pie',
    match: ['/finance'],
    section: 'finance',
  },
  {
    href: '/finance/cash',
    label: 'Kas & rekening',
    iconName: 'landmark',
    match: ['/finance/cash'],
    section: 'finance',
  },
  {
    href: '/finance/fees',
    label: 'Biaya marketplace',
    iconName: 'credit-card',
    match: ['/finance/fees'],
    section: 'finance',
  },
  {
    href: '/finance/ads',
    label: 'Iklan',
    iconName: 'megaphone',
    match: ['/finance/ads'],
    section: 'finance',
  },
  {
    href: '/finance/expenses',
    label: 'Operasional',
    iconName: 'receipt',
    match: ['/finance/expenses'],
    section: 'finance',
  },
  {
    href: '/finance/refunds',
    label: 'Refund',
    iconName: 'refresh-cw',
    match: ['/finance/refunds'],
    section: 'finance',
  },
  {
    href: '/finance/settlements',
    label: 'Settlement',
    iconName: 'banknote',
    match: ['/finance/settlements'],
    section: 'finance',
  },
];

export const MOBILE_NAV: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    iconName: 'layout-dashboard',
    match: ['/dashboard'],
  },
  {
    href: '/orders',
    label: 'Pesanan',
    iconName: 'shopping-bag',
    match: ['/orders'],
  },
  {
    href: '/products',
    label: 'Produk',
    iconName: 'package',
    match: ['/products'],
  },
  {
    href: '/finance',
    label: 'Keuangan',
    iconName: 'wallet',
    match: ['/finance'],
  },
  {
    href: '/more',
    label: 'Lainnya',
    iconName: 'menu',
    match: [
      '/more',
      '/stores',
      '/reports',
      '/production',
      '/materials',
      '/imports',
      '/health',
      '/settings',
    ],
  },
];

export function isNavActive(item: NavItem, path: string): boolean {
  return item.match.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function activeMainHref(path: string): string {
  if (path.startsWith('/finance')) return '/finance';
  if (path.startsWith('/stores')) return '/stores';
  if (path.startsWith('/orders')) return '/orders';
  if (path.startsWith('/production')) return '/production';
  if (path.startsWith('/products')) return '/products';
  if (path.startsWith('/materials')) return '/materials';
  if (path.startsWith('/reports')) return '/reports';
  if (path.startsWith('/imports')) return '/more';
  if (path.startsWith('/health')) return '/more';
  if (path.startsWith('/settings')) return '/settings';
  if (path.startsWith('/more')) return '/more';
  return '/dashboard';
}
