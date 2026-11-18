import type {
  DataHealthCheck,
  DataHealthItem,
  DataHealthReport,
  DataHealthSeverity,
} from '@/types/health';
import type { OrderRepository } from '@/core/repositories/orderRepository';
import type { ProductRepository } from '@/core/repositories/productRepository';
import type { SettlementRepository } from '@/core/repositories/settlementRepository';
import type { SettingsRepository } from '@/core/repositories/settingsRepository';
import { LAST_BACKUP_AT_KEY } from './backupService';
import { addDays, formatBusinessDate, formatDateTime, nowIso, todayJakarta } from '@/core/utils/date';
import { formatRupiah } from '@/core/utils/money';

const BACKUP_MAX_AGE_DAYS = 7;
const SETTLEMENT_MAX_AGE_DAYS = 7;
const MAX_ITEMS_PER_CHECK = 5;

function check(
  code: DataHealthCheck['code'],
  title: string,
  description: string,
  severity: DataHealthSeverity,
  items: DataHealthItem[],
  actionHref: string,
  actionLabel: string,
  count = items.length,
): DataHealthCheck {
  return {
    code,
    title,
    description,
    severity,
    count,
    items: items.slice(0, MAX_ITEMS_PER_CHECK),
    actionHref,
    actionLabel,
  };
}

export class DataHealthService {
  private readonly orders: OrderRepository;
  private readonly products: ProductRepository;
  private readonly settlements: SettlementRepository;
  private readonly settings: SettingsRepository;

  constructor(
    orders: OrderRepository,
    products: ProductRepository,
    settlements: SettlementRepository,
    settings: SettingsRepository,
  ) {
    this.orders = orders;
    this.products = products;
    this.settlements = settlements;
    this.settings = settings;
  }

  async check(now: Date = new Date()): Promise<DataHealthReport> {
    const today = todayJakarta();
    const [ordersWithoutFees, products, pendingSettlements, lastBackupAt] = await Promise.all([
      this.orders.findCompletedWithoutFees(),
      this.products.list({ status: 'active' }),
      this.settlements.findPendingBefore(addDays(today, -SETTLEMENT_MAX_AGE_DAYS)),
      this.settings.get(LAST_BACKUP_AT_KEY),
    ]);

    const productsWithoutHpp = products.filter((product) => product.currentCost === 0);

    const orderItems: DataHealthItem[] = ordersWithoutFees.map((order) => ({
      id: order.id,
      title: `#${order.marketplaceOrderId}`,
      description: `${order.storeName} · ${formatBusinessDate(order.orderDate)}`,
      href: `#/orders/${order.id}`,
    }));

    const productItems: DataHealthItem[] = productsWithoutHpp.map((product) => ({
      id: product.id,
      title: product.name,
      description: `${product.sku}${product.category ? ` · ${product.category}` : ''}`,
      href: `#/products/${product.id}/edit`,
    }));

    const settlementItems: DataHealthItem[] = pendingSettlements.map((settlement) => ({
      id: settlement.id,
      title: settlement.settlementNo,
      description: `${settlement.storeName} · ${formatBusinessDate(settlement.settlementDate)} · ${formatRupiah(settlement.totalPayout)}`,
      href: `#/finance/settlements/${settlement.id}/edit`,
    }));

    const backupIssues: DataHealthItem[] = [];
    if (!lastBackupAt) {
      backupIssues.push({
        id: 'never',
        title: 'Belum pernah membuat backup',
        description: 'Data hanya tersimpan di perangkat ini.',
        href: '#/settings',
      });
    } else {
      const lastBackupTime = Date.parse(lastBackupAt);
      const maxAgeMs = BACKUP_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      if (!Number.isFinite(lastBackupTime)) {
        backupIssues.push({
          id: 'invalid',
          title: 'Waktu backup terakhir tidak valid',
          description: 'Buat backup baru untuk memastikan data aman.',
          href: '#/settings',
        });
      } else if (now.getTime() - lastBackupTime > maxAgeMs) {
        backupIssues.push({
          id: 'overdue',
          title: `Backup terakhir ${formatDateTime(lastBackupAt)}`,
          description: `Sudah lebih dari ${BACKUP_MAX_AGE_DAYS} hari.`,
          href: '#/settings',
        });
      }
    }

    const checks: DataHealthCheck[] = [
      check(
        'completed_orders_without_fees',
        'Pesanan selesai tanpa biaya marketplace',
        'Laba pesanan bisa terlalu besar jika fee aktual belum dicatat.',
        'warning',
        orderItems,
        '/orders?status=completed',
        'Lihat pesanan selesai',
      ),
      check(
        'products_without_hpp',
        'Produk aktif dengan HPP 0',
        'Laba produk akan terlihat lebih besar sampai HPP diisi.',
        'warning',
        productItems,
        '/products',
        'Lengkapi HPP',
      ),
      check(
        'stale_pending_settlements',
        'Settlement pending terlalu lama',
        `Settlement berstatus pending lebih dari ${SETTLEMENT_MAX_AGE_DAYS} hari.`,
        'warning',
        settlementItems,
        '/finance/settlements?status=pending',
        'Buka settlement',
      ),
      check(
        'backup_overdue',
        'Backup data terlambat',
        `Buat backup minimal setiap ${BACKUP_MAX_AGE_DAYS} hari agar data aman.`,
        'critical',
        backupIssues,
        '/settings',
        'Buat backup',
      ),
    ];

    return {
      checkedAt: nowIso(),
      totalIssues: checks.reduce((total, item) => total + item.count, 0),
      criticalChecks: checks.filter((item) => item.severity === 'critical' && item.count > 0).length,
      warningChecks: checks.filter((item) => item.severity === 'warning' && item.count > 0).length,
      checks,
    };
  }
}
