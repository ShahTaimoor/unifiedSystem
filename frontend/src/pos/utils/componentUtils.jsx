// Utility functions for component management
// This file avoids circular dependencies by not importing components directly

// Component registry mapping routes to component metadata
export const componentRegistry = {
  '/pos/dashboard': {
    title: 'Dashboard',
    icon: 'LayoutDashboard',
    allowMultiple: true,
    component: () => import('../pages/Dashboard').then(m => m.default || m.Dashboard)
  },
  '/pos/sales': {
    title: 'Sales',
    icon: 'CreditCard',
    allowMultiple: true,
    component: () => import('../pages/Sales').then(m => m.default || m.Sales)
  },
  '/pos/purchase': {
    title: 'Purchase',
    icon: 'Truck',
    allowMultiple: true,
    component: () => import('../pages/Purchase').then(m => m.default || m.Purchase)
  },
  '/pos/products': {
    title: 'Products',
    icon: 'Package',
    component: () => import('../pages/Products').then(m => m.default || m.Products)
  },
  '/pos/customers': {
    title: 'Customers',
    icon: 'Users',
    component: () => import('../pages/Customers').then(m => m.default || m.Customers)
  },
  '/pos/customer-analytics': {
    title: 'Customer Analytics',
    icon: 'BarChart3',
    component: () => import('../pages/CustomerAnalytics').then(m => m.default || m.CustomerAnalytics)
  },
  '/pos/anomaly-detection': {
    title: 'Anomaly Detection',
    icon: 'AlertTriangle',
    component: () => import('../pages/AnomalyDetection').then(m => m.default || m.AnomalyDetection)
  },
  '/pos/suppliers': {
    title: 'Suppliers',
    icon: 'Building',
    component: () => import('../pages/Suppliers').then(m => m.default || m.Suppliers)
  },
  '/pos/investors': {
    title: 'Investors',
    icon: 'TrendingUp',
    allowMultiple: true,
    component: () => import('../pages/Investors').then(m => m.default || m.Investors)
  },
  '/pos/orders': {
    title: 'Orders',
    icon: 'ShoppingCart',
    component: () => import('../pages/Orders').then(m => m.default || m.Orders)
  },
  '/pos/sales-invoices': {
    title: 'Sales Invoices',
    icon: 'Search',
    component: () => import('../pages/Orders').then(m => m.default || m.Orders)
  },
  '/pos/inventory': {
    title: 'Inventory',
    icon: 'Warehouse',
    component: () => import('../pages/Inventory').then(m => m.default || m.Inventory)
  },
  '/pos/inventory-alerts': {
    title: 'Inventory Alerts',
    icon: 'AlertTriangle',
    component: () => import('../pages/InventoryAlerts').then(m => m.default || m.InventoryAlerts)
  },
  '/pos/warehouses': {
    title: 'Warehouses',
    icon: 'Warehouse',
    component: () => import('../pages/Warehouses').then(m => m.default)
  },
  '/pos/stock-movements': {
    title: 'Stock Movements',
    icon: 'ArrowUpDown',
    component: () => import('../pages/StockMovements').then(m => m.default || m.StockMovements)
  },
  '/pos/stock-ledger': {
    title: 'Stock Ledger',
    icon: 'FileText',
    component: () => import('../pages/StockLedger').then(m => m.default || m.StockLedger)
  },
  '/pos/sale-returns': {
    title: 'Sale Returns',
    icon: 'RotateCcw',
    component: () => import('../pages/SaleReturns').then(m => m.default || m.SaleReturns)
  },
  '/pos/purchase-returns': {
    title: 'Purchase Returns',
    icon: 'RotateCcw',
    component: () => import('../pages/PurchaseReturns').then(m => m.default || m.PurchaseReturns)
  },
  '/pos/sales-orders': {
    title: 'Sales Orders',
    icon: 'FileText',
    allowMultiple: true,
    component: () => import('../pages/SalesOrders').then(m => m.default || m.SalesOrders)
  },
  '/pos/purchase-orders': {
    title: 'Purchase Orders',
    icon: 'FileText',
    allowMultiple: true,
    component: () => import('../pages/PurchaseOrders').then(m => m.default || m.PurchaseOrders)
  },
  '/pos/purchase-invoices': {
    title: 'Purchase Invoices',
    icon: 'Search',
    component: () => import('../pages/PurchaseInvoices').then(m => m.default || m.PurchaseInvoices)
  },
  '/pos/purchase-by-supplier': {
    title: 'Products by Supplier',
    icon: 'BarChart3',
    component: () => import('../pages/PurchaseBySupplierReport').then(m => m.default)
  },
  '/pos/help': {
    title: 'Help & Support',
    icon: 'HelpCircle',
    component: () => import('../pages/Help').then(m => m.default || m.Help)
  },
  '/pos/reports': {
    title: 'Reports',
    icon: 'BarChart3',
    component: () => import('../pages/Reports').then(m => m.default || m.Reports)
  },
  '/pos/backdate-report': {
    title: 'Backdate Report',
    icon: 'Clock',
    component: () => import('../pages/BackdateReport').then(m => m.default || m.BackdateReport)
  },
  '/pos/pl-statements': {
    title: 'P&L Statements',
    icon: 'BarChart3',
    component: () => import('../pages/PLStatements').then(m => m.default || m.PLStatements)
  },
  '/pos/balance-sheet-statement': {
    title: 'Balance Sheet',
    icon: 'FileText',
    component: () => import('../pages/BalanceSheetStatement').then(m => m.default || m.BalanceSheetStatement)
  },
  '/pos/discounts': {
    title: 'Discounts',
    icon: 'Tag',
    component: () => import('../pages/Discounts').then(m => m.default || m.Discounts)
  },
  '/pos/sales-performance': {
    title: 'Sales Performance',
    icon: 'TrendingUp',
    component: () => import('../pages/SalesPerformanceReports').then(m => m.default || m.SalesPerformanceReports)
  },
  '/pos/inventory-reports': {
    title: 'Inventory Reports',
    icon: 'Warehouse',
    component: () => import('../pages/InventoryReports').then(m => m.default || m.InventoryReports)
  },
  '/pos/cash-payments': {
    title: 'Cash Payments',
    icon: 'CreditCard',
    allowMultiple: true,
    component: () => import('../pages/CashPayments').then(m => m.default || m.CashPayments)
  },
  '/pos/expenses': {
    title: 'Expenses',
    icon: 'Wallet',
    component: () => import('../pages/Expenses').then(m => m.default || m.Expenses)
  },
  '/pos/bank-payments': {
    title: 'Bank Payments',
    icon: 'CreditCard',
    allowMultiple: true,
    component: () => import('../pages/BankPayments').then(m => m.default || m.BankPayments)
  },
  '/pos/cash-receipts': {
    title: 'Cash Receipts',
    icon: 'Receipt',
    allowMultiple: true,
    component: () => import('../pages/CashReceipts').then(m => m.default || m.CashReceipts)
  },
  '/pos/cash-receiving': {
    title: 'Cash Receiving',
    icon: 'Receipt',
    allowMultiple: true,
    component: () => import('../pages/CashReceiving').then(m => m.default || m.CashReceiving)
  },
  '/pos/bank-receipts': {
    title: 'Bank Receipts',
    icon: 'Receipt',
    allowMultiple: true,
    component: () => import('../pages/BankReceipts').then(m => m.default || m.BankReceipts)
  },
  '/pos/cities': {
    title: 'Cities',
    icon: 'MapPin',
    component: () => import('../pages/Cities').then(m => m.default || m.Cities)
  },
  '/pos/banks': {
    title: 'Bank & cash opening',
    icon: 'Building',
    component: () => import('../pages/Banks').then(m => m.default || m.Banks)
  },
  '/pos/settings': {
    title: 'Settings',
    icon: 'Settings',
    component: () => import('../pages/Settings').then(m => m.default || m.Settings2)
  },
  '/pos/settings2': {
    title: 'Settings',
    icon: 'Settings',
    component: () => import('../pages/Settings').then(m => m.default || m.Settings2)
  },
  '/pos/chart-of-accounts': {
    title: 'Chart of Accounts',
    icon: 'FolderTree',
    component: () => import('../pages/ChartOfAccounts').then(m => m.default || m.ChartOfAccounts)
  },
  '/pos/account-ledger': {
    title: 'Account Ledger Summary',
    icon: 'Book',
    allowMultiple: true,
    component: () => import('../pages/AccountLedgerSummary').then(m => m.default || m.AccountLedgerSummary)
  },
  '/pos/journal-vouchers': {
    title: 'Journal Vouchers',
    icon: 'FileText',
    allowMultiple: true,
    component: () => import('../pages/JournalVouchers').then(m => m.default || m.JournalVouchers)
  },
  '/pos/categories': {
    title: 'Categories',
    icon: 'Tag',
    component: () => import('../pages/Categories').then(m => m.default || m.Categories)
  },
  '/pos/product-variants': {
    title: 'Product Variants',
    icon: 'Tag',
    allowMultiple: true,
    component: () => import('../pages/ProductVariants').then(m => m.default || m.ProductVariants)
  },
  '/pos/product-transformations': {
    title: 'Product Transformations',
    icon: 'ArrowRight',
    allowMultiple: true,
    component: () => import('../pages/ProductTransformations').then(m => m.default || m.ProductTransformations)
  },
  '/pos/drop-shipping': {
    title: 'Drop Shipping',
    icon: 'ArrowRight',
    allowMultiple: true,
    component: () => import('../pages/DropShipping').then(m => m.default || m.DropShipping)
  },
  '/pos/attendance': {
    title: 'Attendance',
    icon: 'Clock',
    allowMultiple: true,
    component: () => import('../pages/Attendance').then(m => m.default || m.Attendance)
  },
  '/pos/employees': {
    title: 'Employees',
    icon: 'Users',
    allowMultiple: true,
    component: () => import('../pages/Employees').then(m => m.default || m.Employees)
  },
  '/pos/cctv-access': {
    title: 'CCTV Access',
    icon: 'Camera',
    allowMultiple: true,
    component: () => import('../pages/CCTVAccess').then(m => m.default || m.CCTVAccess)
  }
};

// Helper function to get component info by path
export const getComponentInfo = (path) => {
  return componentRegistry[path] || null;
};

// Helper function to get all available routes
export const getAllRoutes = () => {
  return Object.keys(componentRegistry);
};
