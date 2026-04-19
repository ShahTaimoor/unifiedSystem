import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import StorefrontLayout from './storefront/StorefrontLayout';
import PosRoot from './pos/PosRoot';
import ErrorBoundary from './storefront/components/custom/ErrorBoundary';
import OneLoader from './storefront/components/ui/OneLoader';
import { Login } from './pos/pages/Login';
import { ProtectedRoute } from './pos/components/ProtectedRoute';
import { MultiTabLayout } from './pos/components/MultiTabLayout';
import { LoadingPage } from './pos/components/LoadingSpinner';
import { posPath } from './pos/lib/paths';

const RootLayout = lazy(() => import('./storefront/components/layouts/RootLayout'));
const StorefrontProtectedRoute = lazy(() => import('./storefront/components/custom/ProtectedRoute'));

const Home = lazy(() => import('./storefront/pages/Home'));
const StoreProducts = lazy(() => import('./storefront/pages/Products'));
const ProductDetail = lazy(() => import('./storefront/pages/ProductDetail'));
const Checkout = lazy(() => import('./storefront/pages/Checkout'));
const MyOrders = lazy(() => import('./storefront/pages/MyOrders'));
const Success = lazy(() => import('./storefront/pages/Success'));
const ErrorPage = lazy(() => import('./storefront/pages/Error'));
const Profile = lazy(() => import('./storefront/pages/Profile'));

const Dashboard = lazy(() => import('./pos/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const SalesOrders = lazy(() => import('./pos/pages/SalesOrders'));
const Sales = lazy(() => import('./pos/pages/Sales').then((m) => ({ default: m.Sales })));
const PurchaseOrders = lazy(() => import('./pos/pages/PurchaseOrders').then((m) => ({ default: m.PurchaseOrders })));
const PurchaseInvoices = lazy(() => import('./pos/pages/PurchaseInvoices').then((m) => ({ default: m.PurchaseInvoices })));
const Purchase = lazy(() => import('./pos/pages/Purchase').then((m) => ({ default: m.Purchase })));
const PosProducts = lazy(() => import('./pos/pages/Products'));
const Customers = lazy(() => import('./pos/pages/Customers').then((m) => ({ default: m.Customers })));
const Suppliers = lazy(() => import('./pos/pages/Suppliers').then((m) => ({ default: m.Suppliers })));
const SalesInvoices = lazy(() => import('./pos/pages/Orders').then((m) => ({ default: m.Orders })));
const Inventory = lazy(() => import('./pos/pages/Inventory').then((m) => ({ default: m.Inventory })));
const InventoryAlerts = lazy(() => import('./pos/pages/InventoryAlerts'));
const CustomerAnalytics = lazy(() => import('./pos/pages/CustomerAnalytics'));
const AnomalyDetection = lazy(() => import('./pos/pages/AnomalyDetection'));
const Warehouses = lazy(() => import('./pos/pages/Warehouses'));
const Backups = lazy(() => import('./pos/pages/Backups').then((m) => ({ default: m.Backups })));
const PLStatements = lazy(() => import('./pos/pages/PLStatements').then((m) => ({ default: m.PLStatements })));
const SaleReturns = lazy(() => import('./pos/pages/SaleReturns'));
const PurchaseReturns = lazy(() => import('./pos/pages/PurchaseReturns'));
const PurchaseBySupplierReport = lazy(() => import('./pos/pages/PurchaseBySupplierReport'));
const BalanceSheets = lazy(() => import('./pos/pages/BalanceSheets'));
const Discounts = lazy(() => import('./pos/pages/Discounts'));
const SalesPerformanceReports = lazy(() => import('./pos/pages/SalesPerformanceReports'));
const InventoryReports = lazy(() => import('./pos/pages/InventoryReports'));
const CashReceipts = lazy(() => import('./pos/pages/CashReceipts'));
const CashReceiving = lazy(() => import('./pos/pages/CashReceiving'));
const CashPayments = lazy(() => import('./pos/pages/CashPayments'));
const Cities = lazy(() => import('./pos/pages/Cities'));
const Expenses = lazy(() => import('./pos/pages/Expenses'));
const BankReceipts = lazy(() => import('./pos/pages/BankReceipts'));
const BankPayments = lazy(() => import('./pos/pages/BankPayments'));
const Reports = lazy(() => import('./pos/pages/Reports').then((m) => ({ default: m.Reports })));
const Settings2 = lazy(() => import('./pos/pages/Settings').then((m) => ({ default: m.Settings2 })));
const StockMovements = lazy(() => import('./pos/pages/StockMovements').then((m) => ({ default: m.StockMovements })));
const ChartOfAccounts = lazy(() => import('./pos/pages/ChartOfAccounts'));
const AccountLedgerSummary = lazy(() => import('./pos/pages/AccountLedgerSummary'));
const Migration = lazy(() => import('./pos/pages/Migration'));
const BackdateReport = lazy(() => import('./pos/pages/BackdateReport'));
const Categories = lazy(() => import('./pos/pages/Categories'));
const Investors = lazy(() => import('./pos/pages/Investors'));
const Help = lazy(() => import('./pos/pages/Help').then((m) => ({ default: m.Help })));
const DropShipping = lazy(() => import('./pos/pages/DropShipping'));
const JournalVouchers = lazy(() => import('./pos/pages/JournalVouchers'));
const Attendance = lazy(() => import('./pos/pages/Attendance'));
const Employees = lazy(() => import('./pos/pages/Employees'));
const ProductVariants = lazy(() => import('./pos/pages/ProductVariants'));
const ProductTransformations = lazy(() => import('./pos/pages/ProductTransformations'));
const CCTVAccess = lazy(() => import('./pos/pages/CCTVAccess'));

function SFWrap({ children }) {
  return (
    <RootLayout>
      <ErrorBoundary>{children}</ErrorBoundary>
    </RootLayout>
  );
}

function posEl(Component) {
  return (
    <Suspense fallback={<LoadingPage />}>
      <Component />
    </Suspense>
  );
}

const posProtectedChildren = [
  { index: true, element: <Navigate to={posPath('/dashboard')} replace /> },
  { path: 'dashboard', element: posEl(Dashboard) },
  { path: 'sales-orders', element: posEl(SalesOrders) },
  { path: 'sales', element: posEl(Sales) },
  { path: 'purchase-orders', element: posEl(PurchaseOrders) },
  { path: 'purchase-invoices', element: posEl(PurchaseInvoices) },
  { path: 'purchase', element: posEl(Purchase) },
  { path: 'products', element: posEl(PosProducts) },
  { path: 'product-variants', element: posEl(ProductVariants) },
  { path: 'product-transformations', element: posEl(ProductTransformations) },
  { path: 'categories', element: posEl(Categories) },
  { path: 'customers', element: posEl(Customers) },
  { path: 'suppliers', element: posEl(Suppliers) },
  { path: 'investors', element: posEl(Investors) },
  { path: 'drop-shipping', element: posEl(DropShipping) },
  { path: 'sales-invoices', element: posEl(SalesInvoices) },
  { path: 'inventory', element: posEl(Inventory) },
  { path: 'inventory-alerts', element: posEl(InventoryAlerts) },
  { path: 'customer-analytics', element: posEl(CustomerAnalytics) },
  { path: 'anomaly-detection', element: posEl(AnomalyDetection) },
  { path: 'warehouses', element: posEl(Warehouses) },
  { path: 'stock-movements', element: posEl(StockMovements) },
  { path: 'backups', element: posEl(Backups) },
  { path: 'pl-statements', element: posEl(PLStatements) },
  { path: 'sale-returns', element: posEl(SaleReturns) },
  { path: 'purchase-returns', element: posEl(PurchaseReturns) },
  { path: 'purchase-by-supplier', element: posEl(PurchaseBySupplierReport) },
  { path: 'balance-sheets', element: posEl(BalanceSheets) },
  { path: 'discounts', element: posEl(Discounts) },
  { path: 'sales-performance', element: posEl(SalesPerformanceReports) },
  { path: 'inventory-reports', element: posEl(InventoryReports) },
  { path: 'cash-receipts', element: posEl(CashReceipts) },
  { path: 'cash-receiving', element: posEl(CashReceiving) },
  { path: 'cash-payments', element: posEl(CashPayments) },
  { path: 'cities', element: posEl(Cities) },
  { path: 'expenses', element: posEl(Expenses) },
  { path: 'bank-receipts', element: posEl(BankReceipts) },
  { path: 'bank-payments', element: posEl(BankPayments) },
  { path: 'journal-vouchers', element: posEl(JournalVouchers) },
  { path: 'chart-of-accounts', element: posEl(ChartOfAccounts) },
  { path: 'account-ledger', element: posEl(AccountLedgerSummary) },
  { path: 'reports', element: posEl(Reports) },
  { path: 'backdate-report', element: posEl(BackdateReport) },
  { path: 'settings', element: posEl(Settings2) },
  { path: 'migration', element: posEl(Migration) },
  { path: 'settings2', element: posEl(Settings2) },
  { path: 'attendance', element: posEl(Attendance) },
  { path: 'employees', element: posEl(Employees) },
  { path: 'cctv-access', element: posEl(CCTVAccess) },
  { path: 'help', element: posEl(Help) },
];

export const appRouter = createBrowserRouter([
  /* POS first so storefront `path: '*'` never catches `/pos/*`. */
  {
    path: 'pos',
    element: <PosRoot />,
    children: [
      { index: true, element: <Navigate to={posPath('/login')} replace /> },
      { path: 'login', element: <Login /> },
      {
        element: (
          <ProtectedRoute>
            <MultiTabLayout>
              <Outlet />
            </MultiTabLayout>
          </ProtectedRoute>
        ),
        children: posProtectedChildren,
      },
    ],
  },
  {
    path: '/',
    element: <StorefrontLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <SFWrap>
              <Home />
            </SFWrap>
          </Suspense>
        ),
      },
      {
        path: 'products',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <SFWrap>
              <StoreProducts />
            </SFWrap>
          </Suspense>
        ),
      },
      {
        path: 'product/:id',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <SFWrap>
              <ProductDetail />
            </SFWrap>
          </Suspense>
        ),
      },
      {
        path: 'all-products',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <SFWrap>
              <StoreProducts />
            </SFWrap>
          </Suspense>
        ),
      },
      {
        path: 'checkout',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <StorefrontProtectedRoute>
              <RootLayout>
                <Checkout />
              </RootLayout>
            </StorefrontProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'orders',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <StorefrontProtectedRoute>
              <RootLayout>
                <MyOrders />
              </RootLayout>
            </StorefrontProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'success',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <SFWrap>
              <Success />
            </SFWrap>
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <StorefrontProtectedRoute>
              <RootLayout>
                <Profile />
              </RootLayout>
            </StorefrontProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <SFWrap>
              <ErrorPage />
            </SFWrap>
          </Suspense>
        ),
      },
    ],
  },
]);
