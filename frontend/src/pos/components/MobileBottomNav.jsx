import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LUCIDE_ICON_MAP } from '../utils/lucideIconMap';
import { useAuth } from '../contexts/AuthContext';
import { useTab } from '../contexts/TabContext';
import { getComponentInfo } from '../utils/componentUtils';
import { canAccessRoute } from '../config/routeAccess';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const { openTab, tabs, switchToTab, triggerTabHighlight, activeTabId } = useTab();
  
  const [config, setConfig] = useState([]);

  const loadConfig = () => {
    const saved = localStorage.getItem('bottomNavConfig');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all paths start with /pos
        const fixed = parsed.map(item => ({
          ...item,
          href: item.href.startsWith('/pos') ? item.href : `/pos${item.href.startsWith('/') ? '' : '/'}${item.href}`
        }));
        setConfig(fixed);
      } catch (e) {
        console.error('Failed to parse bottomNavConfig', e);
        setDefaultConfig();
      }
    } else {
      setDefaultConfig();
    }
  };

  const setDefaultConfig = () => {
    const defaultConfig = [
      { name: 'Cash Receipts', href: '/pos/cash-receipts', icon: 'Receipt' },
      { name: 'Bank Receipts', href: '/pos/bank-receipts', icon: 'Receipt' },
      { name: 'Cash Payments', href: '/pos/cash-payments', icon: 'CreditCard' },
      { name: 'Bank Payments', href: '/pos/bank-payments', icon: 'CreditCard' }
    ];
    setConfig(defaultConfig);
    localStorage.setItem('bottomNavConfig', JSON.stringify(defaultConfig));
  };

  useEffect(() => {
    loadConfig();
    const handleConfigChange = () => loadConfig();
    window.addEventListener('bottomNavConfigChanged', handleConfigChange);
    return () => window.removeEventListener('bottomNavConfigChanged', handleConfigChange);
  }, []);

  const handleNavigationClick = (item) => {
    // Ensure the path starts with /pos/ to avoid navigating to storefront
    let href = item.href;
    if (!href.startsWith('/pos')) {
      href = `/pos${href.startsWith('/') ? '' : '/'}${href}`;
    }

    const componentInfo = getComponentInfo(href);
    if (componentInfo) {
      const existingTab = tabs.find(tab => tab.path === href);
      
      const reuseNavigationPaths = new Set([
        '/pos/sales-invoices',
        '/pos/sales-invoices/',
        '/pos/orders',
        '/pos/purchase-invoices',
        '/pos/settings',
        '/pos/settings2'
      ]);

      if (!componentInfo.allowMultiple && existingTab) {
        switchToTab(existingTab.id);
        triggerTabHighlight(existingTab.id);
        return;
      }

      const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      openTab({
        title: componentInfo.title,
        path: href,
        component: componentInfo.component,
        icon: componentInfo.icon,
        allowMultiple: componentInfo.allowMultiple || false,
        props: { tabId: tabId }
      });
    } else {
      navigate(href);
    }
  };

  const isActivePath = (href) => {
    const normalizedPathname = location.pathname.replace(/\/$/, '') || '/';
    
    // Check if path matches component registry
    let normalizedHref = href;
    if (!normalizedHref.startsWith('/pos')) {
      normalizedHref = `/pos${normalizedHref.startsWith('/') ? '' : '/'}${normalizedHref}`;
    }

    const componentInfo = getComponentInfo(normalizedHref);
    if (componentInfo) {
      const activeTab = tabs.find(tab => tab.id === activeTabId);
      const isActiveByTab = activeTab && activeTab.path === normalizedHref;
      const isActiveByLocation = normalizedPathname === normalizedHref.replace(/\/$/, '') || normalizedPathname === normalizedHref;
      return isActiveByTab || isActiveByLocation;
    }
    
    return normalizedPathname === normalizedHref.replace(/\/$/, '') || normalizedPathname === normalizedHref;
  };

  // Filter items based on permissions
  const visibleItems = config.filter(item => {
    return canAccessRoute(item.href, user, hasPermission);
  });

  if (visibleItems.length === 0) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] backdrop-blur-md pb-safe">
      <div className="flex items-center justify-around px-2 py-2 max-w-screen-sm mx-auto h-16">
        {visibleItems.map((item) => {
          const IconComponent = LUCIDE_ICON_MAP[item.icon] || LUCIDE_ICON_MAP.Circle;
          const isActive = isActivePath(item.href);
          
          // Determine color based on path (matching the dashboard's emerald/blue theme if possible)
          const isEmerald = item.href.includes('receipt');
          const isBlue = item.href.includes('payment');
          
          let activeClasses = 'bg-gray-100 text-gray-900 ring-2 ring-gray-400/30';
          let inactiveClasses = 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100';

          if (isEmerald) {
            activeClasses = 'bg-emerald-100 text-emerald-700 border-emerald-200 ring-2 ring-emerald-400/60 shadow-inner';
            inactiveClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
          } else if (isBlue) {
            activeClasses = 'bg-blue-100 text-blue-700 border-blue-200 ring-2 ring-blue-400/60 shadow-inner';
            inactiveClasses = 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
          }

          return (
            <button
              key={item.href}
              onClick={() => handleNavigationClick(item)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-0.5 mx-1 rounded-xl transition-all duration-300 active:scale-90 border shadow-sm ${
                isActive ? activeClasses : inactiveClasses
              }`}
            >
              <IconComponent className={`h-5 w-5 ${isActive ? 'mb-0.5 scale-110' : 'mb-0.5 opacity-80'}`} />
              <span className="text-[10px] font-black leading-tight w-full text-center break-words px-1">
                {item.name.replace('Receipts', 'Receipt').replace('Payments', 'Payment')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
