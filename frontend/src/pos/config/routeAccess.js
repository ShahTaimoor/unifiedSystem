import { PERMISSIONS } from './rbacConfig';

export const ROUTE_ACCESS = {
  '/pos/dashboard': { permission: PERMISSIONS.VIEW_DASHBOARD },
  '/pos/sales-orders': { permissionAny: [PERMISSIONS.VIEW_SALES_ORDERS, PERMISSIONS.CREATE_SALES_ORDERS, PERMISSIONS.EDIT_SALES_ORDERS] },
  '/pos/sales': { permissionAny: [PERMISSIONS.CREATE_ORDERS, PERMISSIONS.EDIT_ORDERS, PERMISSIONS.MANAGE_SALES] },
  '/pos/purchase-orders': { permissionAny: [PERMISSIONS.VIEW_PURCHASE_ORDERS, PERMISSIONS.CREATE_PURCHASE_ORDERS, PERMISSIONS.EDIT_PURCHASE_ORDERS] },
  '/pos/purchase-invoices': { permissionAny: [PERMISSIONS.VIEW_PURCHASE_INVOICES, PERMISSIONS.CREATE_PURCHASE_INVOICES, PERMISSIONS.EDIT_PURCHASE_INVOICES] },
  '/pos/purchase': { permissionAny: [PERMISSIONS.CREATE_ORDERS, PERMISSIONS.EDIT_ORDERS] },
  '/pos/products': { permission: PERMISSIONS.VIEW_PRODUCTS },
  '/pos/product-variants': { permission: PERMISSIONS.VIEW_PRODUCTS },
  '/pos/product-transformations': { permission: PERMISSIONS.VIEW_PRODUCTS },
  '/pos/categories': { permission: PERMISSIONS.VIEW_PRODUCTS },
  '/pos/customers': { permission: PERMISSIONS.VIEW_PRODUCTS },
  '/pos/suppliers': { permission: PERMISSIONS.VIEW_PRODUCTS },
  '/pos/investors': { permission: PERMISSIONS.VIEW_REPORTS },
  '/pos/drop-shipping': { permission: PERMISSIONS.VIEW_SALES },
  '/pos/sales-invoices': { permissionAny: [PERMISSIONS.VIEW_SALES_INVOICES, PERMISSIONS.CREATE_SALES_INVOICES, PERMISSIONS.EDIT_SALES_INVOICES] },
  '/pos/inventory': { permission: PERMISSIONS.VIEW_INVENTORY },
  '/pos/inventory-alerts': { permission: PERMISSIONS.VIEW_INVENTORY },
  '/pos/customer-analytics': { permission: PERMISSIONS.VIEW_REPORTS },
  '/pos/anomaly-detection': { permission: PERMISSIONS.VIEW_REPORTS },
  '/pos/warehouses': { permission: PERMISSIONS.VIEW_INVENTORY },
  '/pos/stock-movements': { permission: PERMISSIONS.VIEW_INVENTORY },
  '/pos/pl-statements': { permission: PERMISSIONS.VIEW_FINANCIAL_DATA },
  '/pos/balance-sheet-statement': { permission: PERMISSIONS.VIEW_FINANCIAL_DATA },
  '/pos/sale-returns': { permission: PERMISSIONS.MANAGE_SALES },
  '/pos/purchase-returns': { permission: PERMISSIONS.MANAGE_INVENTORY },
  '/pos/purchase-by-supplier': { permission: PERMISSIONS.VIEW_REPORTS },
  '/pos/discounts': { permission: PERMISSIONS.MANAGE_SETTINGS },
  '/pos/sales-performance': { permission: PERMISSIONS.VIEW_REPORTS },
  '/pos/inventory-reports': { permission: PERMISSIONS.VIEW_REPORTS },
  '/pos/cash-receipts': { permissionAny: [PERMISSIONS.VIEW_CASH_RECEIPTS, 'create_cash_receipts', 'edit_cash_receipts'] },
  '/pos/cash-receiving': { permissionAny: [PERMISSIONS.VIEW_CASH_RECEIPTS, 'create_cash_receipts', 'edit_cash_receipts'] },
  '/pos/cash-payments': { permissionAny: [PERMISSIONS.VIEW_CASH_PAYMENTS, 'create_cash_payments', 'edit_cash_payments'] },
  '/pos/cities': { permission: PERMISSIONS.MANAGE_SETTINGS },
  '/pos/expenses': { permissionAny: [PERMISSIONS.VIEW_EXPENSES, 'create_expenses', 'edit_expenses'] },
  '/pos/bank-receipts': { permissionAny: [PERMISSIONS.VIEW_BANK_RECEIPTS, 'create_bank_receipts', 'edit_bank_receipts'] },
  '/pos/bank-payments': { permissionAny: [PERMISSIONS.VIEW_BANK_PAYMENTS, 'create_bank_payments', 'edit_bank_payments'] },
  '/pos/journal-vouchers': { permission: PERMISSIONS.VIEW_ACCOUNTING_TRANSACTIONS },
  '/pos/chart-of-accounts': { permission: PERMISSIONS.VIEW_CHART_OF_ACCOUNTS },
  '/pos/account-ledger': { permission: PERMISSIONS.VIEW_ACCOUNTING_SUMMARY },
  '/pos/reports': { permission: PERMISSIONS.VIEW_REPORTS },
  '/pos/backdate-report': { permission: PERMISSIONS.VIEW_BACKDATE_REPORT },
  '/pos/settings': { permission: PERMISSIONS.MANAGE_USERS },
  '/pos/settings2': { permission: PERMISSIONS.MANAGE_USERS },
  '/pos/migration': { permission: PERMISSIONS.MANAGE_SETTINGS },
  '/pos/attendance': { permission: PERMISSIONS.VIEW_OWN_ATTENDANCE },
  '/pos/employees': { permission: PERMISSIONS.MANAGE_USERS },
  '/pos/cctv-access': { permission: PERMISSIONS.VIEW_SALES_INVOICES },
};

export const getRouteAccess = (path) => ROUTE_ACCESS[path] || null;

export const canAccessRoute = (path, user, hasPermission) => {
  const access = getRouteAccess(path);
  if (!access) return true;
  if (user?.role === 'admin') return true;
  if (Array.isArray(access.permissionAny) && access.permissionAny.length > 0) {
    return access.permissionAny.some((permission) => hasPermission(permission));
  }
  if (!access.permission) return true;
  return hasPermission(access.permission);
};
