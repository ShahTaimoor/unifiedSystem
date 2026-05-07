import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';
import { store } from './store/store';
import { ErrorProvider } from './contexts/ErrorContext';
import { TabProvider } from './contexts/TabContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { MultiTabLayout } from './components/MultiTabLayout';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkStatus from './components/NetworkStatus';
import OfflineIndicator from './components/OfflineIndicator';
import { LoadingPage } from './components/LoadingSpinner';
import { getRouteAccess } from './config/routeAccess';
import SyncManager from './services/SyncManager';

// Critical components - load immediately (small, frequently used)
import { Login } from './pages/Login';

// ... existing lazy imports ...
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));

const SalesOrders = lazy(() => import('./pages/SalesOrders'));
const Sales = lazy(() => import('./pages/Sales').then(m => ({ default: m.Sales })));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders').then(m => ({ default: m.PurchaseOrders })));
const PurchaseInvoices = lazy(() => import('./pages/PurchaseInvoices').then(m => ({ default: m.PurchaseInvoices })));
const Purchase = lazy(() => import('./pages/Purchase').then(m => ({ default: m.Purchase })));
const Products = lazy(() => import('./pages/Products'));
const Customers = lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })));
const Suppliers = lazy(() => import('./pages/Suppliers').then(m => ({ default: m.Suppliers })));
const SalesInvoices = lazy(() => import('./pages/Orders').then(m => ({ default: m.Orders })));
const Inventory = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const InventoryAlerts = lazy(() => import('./pages/InventoryAlerts'));
const CustomerAnalytics = lazy(() => import('./pages/CustomerAnalytics'));
const AnomalyDetection = lazy(() => import('./pages/AnomalyDetection'));
const Warehouses = lazy(() => import('./pages/Warehouses'));

const PLStatements = lazy(() => import('./pages/PLStatements').then(m => ({ default: m.PLStatements })));
const BalanceSheetStatement = lazy(() => import('./pages/BalanceSheetStatement').then(m => ({ default: m.BalanceSheetStatement })));
const SaleReturns = lazy(() => import('./pages/SaleReturns'));
const PurchaseReturns = lazy(() => import('./pages/PurchaseReturns'));
const PurchaseBySupplierReport = lazy(() => import('./pages/PurchaseBySupplierReport'));
const Discounts = lazy(() => import('./pages/Discounts'));
const SalesPerformanceReports = lazy(() => import('./pages/SalesPerformanceReports'));
const InventoryReports = lazy(() => import('./pages/InventoryReports'));
const CashReceipts = lazy(() => import('./pages/CashReceipts'));
const CashReceiving = lazy(() => import('./pages/CashReceiving'));
const CashPayments = lazy(() => import('./pages/CashPayments'));
const Cities = lazy(() => import('./pages/Cities'));
const Expenses = lazy(() => import('./pages/Expenses'));
const BankReceipts = lazy(() => import('./pages/BankReceipts'));
const BankPayments = lazy(() => import('./pages/BankPayments'));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Settings2 = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings2 })));
const StockMovements = lazy(() => import('./pages/StockMovements').then(m => ({ default: m.StockMovements })));
const ChartOfAccounts = lazy(() => import('./pages/ChartOfAccounts'));
const AccountLedgerSummary = lazy(() => import('./pages/AccountLedgerSummary'));
const Migration = lazy(() => import('./pages/Migration'));
const BackdateReport = lazy(() => import('./pages/BackdateReport'));
const Categories = lazy(() => import('./pages/Categories'));
const Investors = lazy(() => import('./pages/Investors'));
const Help = lazy(() => import('./pages/Help').then(m => ({ default: m.Help })));
const DropShipping = lazy(() => import('./pages/DropShipping'));
const JournalVouchers = lazy(() => import('./pages/JournalVouchers'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Employees = lazy(() => import('./pages/Employees'));
const ProductVariants = lazy(() => import('./pages/ProductVariants'));
const ProductTransformations = lazy(() => import('./pages/ProductTransformations'));
const CCTVAccess = lazy(() => import('./pages/CCTVAccess'));

const withRouteGuard = (path, element) => {
  const access = getRouteAccess(path);
  if (!access) return element;
  return (
    <ProtectedRoute permission={access.permission} permissionAny={access.permissionAny || []}>
      {element}
    </ProtectedRoute>
  );
};

// Initialize QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: import.meta.env.DEV ? 0 : 5 * 60 * 1000,
      cacheTime: import.meta.env.DEV ? 0 : 5 * 60 * 1000,
    },
  },
});

function App() {
  useEffect(() => {
    // Initialize offline sync manager
    SyncManager.init();
  }, []);

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ErrorProvider>
            <TabProvider>
              <NetworkStatus />
              <OfflineIndicator />
              <Routes>
                <Route path="login" element={<Login />} />
                <Route
                  path="*"
                  element={
                    <ProtectedRoute>
                      <MultiTabLayout>
                        <Routes>
                          <Route path="/" element={<Navigate to="dashboard" replace />} />
                          <Route path="dashboard" element={withRouteGuard('/pos/dashboard', <Suspense fallback={<LoadingPage />}><Dashboard /></Suspense>)} />
                          <Route path="sales-orders" element={withRouteGuard('/pos/sales-orders', <Suspense fallback={<LoadingPage />}><SalesOrders /></Suspense>)} />
                          <Route path="sales" element={withRouteGuard('/pos/sales', <Suspense fallback={<LoadingPage />}><Sales /></Suspense>)} />
                          <Route path="purchase-orders" element={withRouteGuard('/pos/purchase-orders', <Suspense fallback={<LoadingPage />}><PurchaseOrders /></Suspense>)} />
                          <Route path="purchase-invoices" element={withRouteGuard('/pos/purchase-invoices', <Suspense fallback={<LoadingPage />}><PurchaseInvoices /></Suspense>)} />
                          <Route path="purchase" element={withRouteGuard('/pos/purchase', <Suspense fallback={<LoadingPage />}><Purchase /></Suspense>)} />
                          <Route path="products" element={withRouteGuard('/pos/products', <Suspense fallback={<LoadingPage />}><Products /></Suspense>)} />
                          <Route path="product-variants" element={withRouteGuard('/pos/product-variants', <Suspense fallback={<LoadingPage />}><ProductVariants /></Suspense>)} />
                          <Route path="product-transformations" element={withRouteGuard('/pos/product-transformations', <Suspense fallback={<LoadingPage />}><ProductTransformations /></Suspense>)} />
                          <Route path="categories" element={withRouteGuard('/pos/categories', <Suspense fallback={<LoadingPage />}><Categories /></Suspense>)} />
                          <Route path="customers" element={withRouteGuard('/pos/customers', <Suspense fallback={<LoadingPage />}><Customers /></Suspense>)} />
                          <Route path="suppliers" element={withRouteGuard('/pos/suppliers', <Suspense fallback={<LoadingPage />}><Suppliers /></Suspense>)} />
                          <Route path="investors" element={withRouteGuard('/pos/investors', <Suspense fallback={<LoadingPage />}><Investors /></Suspense>)} />
                          <Route path="drop-shipping" element={withRouteGuard('/pos/drop-shipping', <Suspense fallback={<LoadingPage />}><DropShipping /></Suspense>)} />
                          <Route path="sales-invoices" element={withRouteGuard('/pos/sales-invoices', <Suspense fallback={<LoadingPage />}><SalesInvoices /></Suspense>)} />
                          <Route path="inventory" element={withRouteGuard('/pos/inventory', <Suspense fallback={<LoadingPage />}><Inventory /></Suspense>)} />
                          <Route path="inventory-alerts" element={withRouteGuard('/pos/inventory-alerts', <Suspense fallback={<LoadingPage />}><InventoryAlerts /></Suspense>)} />
                          <Route path="customer-analytics" element={withRouteGuard('/pos/customer-analytics', <Suspense fallback={<LoadingPage />}><CustomerAnalytics /></Suspense>)} />
                          <Route path="anomaly-detection" element={withRouteGuard('/pos/anomaly-detection', <Suspense fallback={<LoadingPage />}><AnomalyDetection /></Suspense>)} />
                          <Route path="warehouses" element={withRouteGuard('/pos/warehouses', <Suspense fallback={<LoadingPage />}><Warehouses /></Suspense>)} />
                          <Route path="stock-movements" element={withRouteGuard('/pos/stock-movements', <Suspense fallback={<LoadingPage />}><StockMovements /></Suspense>)} />

                          <Route path="pl-statements" element={withRouteGuard('/pos/pl-statements', <Suspense fallback={<LoadingPage />}><PLStatements /></Suspense>)} />
                          <Route path="balance-sheet-statement" element={withRouteGuard('/pos/balance-sheet-statement', <Suspense fallback={<LoadingPage />}><BalanceSheetStatement /></Suspense>)} />
                          <Route path="sale-returns" element={withRouteGuard('/pos/sale-returns', <Suspense fallback={<LoadingPage />}><SaleReturns /></Suspense>)} />
                          <Route path="purchase-returns" element={withRouteGuard('/pos/purchase-returns', <Suspense fallback={<LoadingPage />}><PurchaseReturns /></Suspense>)} />
                          <Route path="purchase-by-supplier" element={withRouteGuard('/pos/purchase-by-supplier', <Suspense fallback={<LoadingPage />}><PurchaseBySupplierReport /></Suspense>)} />
                          <Route path="discounts" element={withRouteGuard('/pos/discounts', <Suspense fallback={<LoadingPage />}><Discounts /></Suspense>)} />
                          <Route path="sales-performance" element={withRouteGuard('/pos/sales-performance', <Suspense fallback={<LoadingPage />}><SalesPerformanceReports /></Suspense>)} />
                          <Route path="inventory-reports" element={withRouteGuard('/pos/inventory-reports', <Suspense fallback={<LoadingPage />}><InventoryReports /></Suspense>)} />
                          <Route path="cash-receipts" element={withRouteGuard('/pos/cash-receipts', <Suspense fallback={<LoadingPage />}><CashReceipts /></Suspense>)} />
                          <Route path="cash-receiving" element={withRouteGuard('/pos/cash-receiving', <Suspense fallback={<LoadingPage />}><CashReceiving /></Suspense>)} />
                          <Route path="cash-payments" element={withRouteGuard('/pos/cash-payments', <Suspense fallback={<LoadingPage />}><CashPayments /></Suspense>)} />
                          <Route path="cities" element={withRouteGuard('/pos/cities', <Suspense fallback={<LoadingPage />}><Cities /></Suspense>)} />
                          <Route path="expenses" element={withRouteGuard('/pos/expenses', <Suspense fallback={<LoadingPage />}><Expenses /></Suspense>)} />
                          <Route path="bank-receipts" element={withRouteGuard('/pos/bank-receipts', <Suspense fallback={<LoadingPage />}><BankReceipts /></Suspense>)} />
                          <Route path="bank-payments" element={withRouteGuard('/pos/bank-payments', <Suspense fallback={<LoadingPage />}><BankPayments /></Suspense>)} />
                          <Route path="journal-vouchers" element={withRouteGuard('/pos/journal-vouchers', <Suspense fallback={<LoadingPage />}><JournalVouchers /></Suspense>)} />
                          <Route path="chart-of-accounts" element={withRouteGuard('/pos/chart-of-accounts', <Suspense fallback={<LoadingPage />}><ChartOfAccounts /></Suspense>)} />
                          <Route path="account-ledger" element={withRouteGuard('/pos/account-ledger', <Suspense fallback={<LoadingPage />}><AccountLedgerSummary /></Suspense>)} />
                          <Route path="reports" element={withRouteGuard('/pos/reports', <Suspense fallback={<LoadingPage />}><Reports /></Suspense>)} />
                          <Route path="backdate-report" element={withRouteGuard('/pos/backdate-report', <Suspense fallback={<LoadingPage />}><BackdateReport /></Suspense>)} />
                          <Route path="settings" element={withRouteGuard('/pos/settings', <Suspense fallback={<LoadingPage />}><Settings2 /></Suspense>)} />
                          <Route path="migration" element={withRouteGuard('/pos/migration', <Suspense fallback={<LoadingPage />}><Migration /></Suspense>)} />
                          <Route path="settings2" element={withRouteGuard('/pos/settings2', <Suspense fallback={<LoadingPage />}><Settings2 /></Suspense>)} />
                          <Route path="attendance" element={withRouteGuard('/pos/attendance', <Suspense fallback={<LoadingPage />}><Attendance /></Suspense>)} />
                          <Route path="employees" element={withRouteGuard('/pos/employees', <Suspense fallback={<LoadingPage />}><Employees /></Suspense>)} />
                          <Route path="cctv-access" element={withRouteGuard('/pos/cctv-access', <Suspense fallback={<LoadingPage />}><CCTVAccess /></Suspense>)} />
                          <Route path="help" element={withRouteGuard('/pos/help', <Suspense fallback={<LoadingPage />}><Help /></Suspense>)} />
                        </Routes>
                      </MultiTabLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
              <Toaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{
                  duration: 4000,
                  classNames: {
                    success: 'border-green-500/50',
                    error: 'border-red-500/50',
                  },
                }}
              />
            </TabProvider>
          </ErrorProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;

