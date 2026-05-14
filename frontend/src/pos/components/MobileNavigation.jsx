import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  ShoppingCart,
  Package,
  Users,
  Truck,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  User,
  Bell,
  Search,
  RotateCcw,
  Tag,
  TrendingUp,
  Warehouse,
  Clock,
  ArrowUpDown,
  ArrowRight,
  FolderTree,
  Building2,
  Receipt,
  CreditCard,
  Camera,
  Wallet
} from 'lucide-react';
import { useResponsive } from './ResponsiveContainer';
import { useAuth } from '../contexts/AuthContext';
import { loadSidebarConfig } from './MultiTabLayout';
import { canAccessRoute } from '../config/routeAccess';

const MobileNavigation = ({ user, onLogout, isLoggingOut = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { isMobile, isTablet } = useResponsive();
  const { hasPermission } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setIsSearchOpen(false);
  }, [location]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.mobile-menu')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navigationItems = [
    { path: '/pos/dashboard', icon: Home, label: 'Dashboard', badge: null },
    { path: '/pos/sales', icon: ShoppingCart, label: 'Sales', badge: null },
    { path: '/pos/sales-orders', icon: FileText, label: 'Sales Orders', badge: null },
    { path: '/pos/sales-invoices', icon: FileText, label: 'Sales Invoices', badge: null },
    { path: '/pos/purchase', icon: Truck, label: 'Purchase', badge: null },
    { path: '/pos/purchase-orders', icon: FileText, label: 'Purchase Orders', badge: null },
    { path: '/pos/purchase-invoices', icon: FileText, label: 'Purchase Invoices', badge: null },
    { path: '/pos/purchase-by-supplier', icon: BarChart3, label: 'Products by Supplier', badge: null },
    { path: '/pos/products', icon: Package, label: 'Products', badge: null },
    { path: '/pos/customers', icon: Users, label: 'Customers', badge: null },
    { path: '/pos/suppliers', icon: Truck, label: 'Suppliers', badge: null },
    { path: '/pos/banks', icon: Building2, label: 'Bank & cash opening', badge: null },
    { path: '/pos/investors', icon: TrendingUp, label: 'Investors', badge: null },
    { path: '/pos/drop-shipping', icon: ArrowRight, label: 'Drop Shipping', badge: null },
    { path: '/pos/inventory', icon: Package, label: 'Inventory', badge: null },
    { path: '/pos/stock-movements', icon: ArrowUpDown, label: 'Stock Movements', badge: null },
    { path: '/pos/stock-ledger', icon: FileText, label: 'Stock Ledger', badge: null },
    { path: '/pos/sale-returns', icon: RotateCcw, label: 'Sale Returns', badge: null },
    { path: '/pos/purchase-returns', icon: RotateCcw, label: 'Purchase Returns', badge: null },
    { path: '/pos/discounts', icon: Tag, label: 'Discounts', badge: null },
    { path: '/pos/pl-statements', icon: BarChart3, label: 'P&L Statements', badge: null },
    { path: '/pos/balance-sheet-statement', icon: FileText, label: 'Balance Sheet', badge: null },
    { path: '/pos/sales-performance', icon: TrendingUp, label: 'Sales Performance', badge: null },
    { path: '/pos/inventory-reports', icon: Warehouse, label: 'Inventory Reports', badge: null },
    { path: '/pos/reports', icon: BarChart3, label: 'Reports', badge: null },
    { path: '/pos/backdate-report', icon: Clock, label: 'Backdate Report', badge: null },
    { path: '/pos/chart-of-accounts', icon: FolderTree, label: 'Chart of Accounts', badge: null },
    { path: '/pos/journal-vouchers', icon: FileText, label: 'Journal Vouchers', badge: null },
    { path: '/pos/account-ledger', icon: FileText, label: 'Account Ledger Summary', badge: null },
    { path: '/pos/employees', icon: Users, label: 'Employees', badge: null },
    { path: '/pos/attendance', icon: Clock, label: 'Attendance', badge: null },
    { path: '/pos/settings2', icon: Settings, label: 'Settings', badge: null },
    { path: '/pos/expenses', icon: Wallet, label: 'Record Expense', badge: null },
    { path: '/pos/cash-receipts', icon: Receipt, label: 'Cash Receipts', badge: null },
    { path: '/pos/cash-payments', icon: CreditCard, label: 'Cash Payments', badge: null },
    { path: '/pos/cctv-access', icon: Camera, label: 'CCTV Access', badge: null }
  ];

  // Sidebar visibility state
  const [sidebarConfig, setSidebarConfig] = useState(() => loadSidebarConfig());

  // Listener for sidebar configuration changes
  useEffect(() => {
    const handleSidebarChange = () => {
      setSidebarConfig(loadSidebarConfig());
    };

    window.addEventListener('sidebarConfigChanged', handleSidebarChange);
    return () => window.removeEventListener('sidebarConfigChanged', handleSidebarChange);
  }, []);

  // Filter navigation based on user permissions AND sidebar configuration
  const filteredNavigationItems = navigationItems.filter(item => {
    // 1. Check sidebar configuration first
    if (sidebarConfig[item.label] === false) return false;

    // 2. Check permissions
    return canAccessRoute(item.path, user, hasPermission);
  });

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  if (!isMobile && !isTablet) {
    return null;
  }

  return (
    <>
      {/* Mobile Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, customers, orders..."
                  className="flex-1 text-sm border-none outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500">Search functionality coming soon...</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] lg:hidden">
          <div className="mobile-menu fixed inset-y-0 left-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="px-4 space-y-1">
                {filteredNavigationItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${active
                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${active ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  if (isLoggingOut) return;
                  onLogout();
                }}
                disabled={isLoggingOut}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
