import type { Database } from '@/core/database/types';
import type { SecretStore } from '@/core/crypto/secretStore';
import { EncryptionService, PreferencesSecretStore } from '@/core/crypto/secretStore';
import { AuditRepository } from '@/core/repositories/auditRepository';
import { StoreRepository } from '@/core/repositories/storeRepository';
import { ProductRepository } from '@/core/repositories/productRepository';
import { OrderRepository } from '@/core/repositories/orderRepository';
import { FeeRepository } from '@/core/repositories/feeRepository';
import { AdvertisingRepository } from '@/core/repositories/advertisingRepository';
import { OperationalExpenseRepository } from '@/core/repositories/operationalExpenseRepository';
import { RefundRepository } from '@/core/repositories/refundRepository';
import { SettlementRepository } from '@/core/repositories/settlementRepository';
import { ImportRepository } from '@/core/repositories/importRepository';
import { SettingsRepository } from '@/core/repositories/settingsRepository';
import { BackupRepository } from '@/core/repositories/backupRepository';
import { WorkOrderRepository } from '@/core/repositories/workOrderRepository';
import { MaterialRepository } from '@/core/repositories/materialRepository';
import { ProductBomRepository } from '@/core/repositories/productBomRepository';
import { CashRepository } from '@/core/repositories/cashRepository';
import { StoreService } from './storeService';
import { ProductService } from './productService';
import { OrderService } from './orderService';
import { FeeService } from './feeService';
import { AdvertisingService } from './advertisingService';
import { OperationalExpenseService } from './operationalExpenseService';
import { RefundService } from './refundService';
import { SettlementService } from './settlementService';
import { OrderImportService } from './importService';
import { BackupService } from './backupService';
import { FinancialService } from './financialService';
import { DashboardService } from './dashboardService';
import { ReportService } from './reportService';
import { ProductProfitService } from './productProfitService';
import { DataHealthService } from './dataHealthService';
import { ProductionService } from './productionService';
import { MaterialService } from './materialService';
import { BomService } from './bomService';
import { CashService } from './cashService';

export interface AppServices {
  db: Database;
  encryption: EncryptionService;
  audit: AuditRepository;
  stores: StoreRepository;
  products: ProductRepository;
  orders: OrderRepository;
  fees: FeeRepository;
  advertising: AdvertisingRepository;
  expenses: OperationalExpenseRepository;
  refunds: RefundRepository;
  settlements: SettlementRepository;
  imports: ImportRepository;
  settings: SettingsRepository;
  backupRepo: BackupRepository;
  workOrders: WorkOrderRepository;
  materials: MaterialRepository;
  productBom: ProductBomRepository;
  cash: CashRepository;
  storeService: StoreService;
  productService: ProductService;
  orderService: OrderService;
  feeService: FeeService;
  advertisingService: AdvertisingService;
  expenseService: OperationalExpenseService;
  refundService: RefundService;
  settlementService: SettlementService;
  importService: OrderImportService;
  backupService: BackupService;
  financeService: FinancialService;
  dashboardService: DashboardService;
  reportService: ReportService;
  productProfitService: ProductProfitService;
  dataHealthService: DataHealthService;
  productionService: ProductionService;
  materialService: MaterialService;
  bomService: BomService;
  cashService: CashService;
}

export function createAppServices(
  db: Database,
  secretStore: SecretStore = new PreferencesSecretStore(),
): AppServices {
  const encryption = new EncryptionService(secretStore);
  const audit = new AuditRepository(db);
  const stores = new StoreRepository(db);
  const products = new ProductRepository(db);
  const orders = new OrderRepository(db);
  const fees = new FeeRepository(db);
  const advertising = new AdvertisingRepository(db);
  const expenses = new OperationalExpenseRepository(db);
  const refunds = new RefundRepository(db);
  const settlements = new SettlementRepository(db);
  const imports = new ImportRepository(db);
  const settings = new SettingsRepository(db);
  const backupRepo = new BackupRepository(db);
  const workOrders = new WorkOrderRepository(db);
  const materials = new MaterialRepository(db);
  const productBom = new ProductBomRepository(db);
  const cash = new CashRepository(db);

  const storeService = new StoreService(stores, audit, encryption);
  const productService = new ProductService(db, products, productBom, audit);
  const orderService = new OrderService(db, orders, products, stores, audit);
  const cashService = new CashService(db, cash, audit);
  const feeService = new FeeService(fees, stores, orders, audit);
  const advertisingService = new AdvertisingService(db, advertising, stores, audit, cashService);
  const expenseService = new OperationalExpenseService(db, expenses, stores, audit, cashService);
  const refundService = new RefundService(db, refunds, orders, settlements, audit, cashService);
  const settlementService = new SettlementService(db, settlements, stores, audit, cashService);
  const importService = new OrderImportService(
    db,
    orders,
    products,
    stores,
    fees,
    refunds,
    imports,
    audit,
  );
  const backupService = new BackupService(backupRepo, encryption, audit, settings);
  const financeService = new FinancialService(
    orders,
    fees,
    refunds,
    advertising,
    expenses,
    settlements,
  );
  const dashboardService = new DashboardService(financeService, stores, orders, cashService);
  const productProfitService = new ProductProfitService(orders, fees, refunds);
  const reportService = new ReportService(financeService, stores, productProfitService);
  const dataHealthService = new DataHealthService(orders, products, settlements, settings);
  const productionService = new ProductionService(workOrders, orders, audit);
  const materialService = new MaterialService(materials, productBom, products, audit);
  const bomService = new BomService(productBom, materials, products, audit);

  return {
    db,
    encryption,
    audit,
    stores,
    products,
    orders,
    fees,
    advertising,
    expenses,
    refunds,
    settlements,
    imports,
    settings,
    backupRepo,
    workOrders,
    materials,
    productBom,
    cash,
    storeService,
    productService,
    orderService,
    feeService,
    advertisingService,
    expenseService,
    refundService,
    settlementService,
    importService,
    backupService,
    financeService,
    dashboardService,
    reportService,
    productProfitService,
    dataHealthService,
    productionService,
    materialService,
    bomService,
    cashService,
  };
}

let activeServices: AppServices | null = null;

export function setActiveServices(services: AppServices): void {
  activeServices = services;
}

export function getActiveServices(): AppServices {
  if (!activeServices) {
    throw new Error('Aplikasi belum siap. Layanan belum diinisialisasi.');
  }
  return activeServices;
}
