import React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

// Shim for ReactDOM.findDOMNode for React 19 compatibility with legacy libraries
// Many libraries like older versions of react-to-print still use this.
const shimFindDOMNode = (instance) => {
  if (!instance) return null;
  if (instance instanceof HTMLElement) return instance;
  try {
    // If it's a component instance, we can't easily find the node in React 19 without refs,
    // but returning null is better than throwing a "not a function" error.
    return null;
  } catch (e) {
    return null;
  }
};

const patchObj = (obj) => {
  if (!obj) return;
  try {
    if (typeof obj.findDOMNode !== 'function') {
      Object.defineProperty(obj, 'findDOMNode', {
        value: shimFindDOMNode,
        configurable: true,
        writable: true
      });
    }
  } catch (e) {
    try {
      obj.findDOMNode = shimFindDOMNode;
    } catch (e2) {}
  }
};

// Patch all possible entry points
patchObj(ReactDOM);
if (ReactDOM.default) patchObj(ReactDOM.default);

if (typeof window !== 'undefined') {
  window.ReactDOM = ReactDOM;
  patchObj(window.ReactDOM);
}

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// Lazy-load entry apps for bundle splitting
const StorefrontApp = React.lazy(() => import('./storefront/App'));
const POSApp = React.lazy(() => import('./pos/App'));

import './index.css';

const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    transition: 'all 0.3s ease'
  }}>
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
      <div style={{
        position: 'absolute',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        border: '3px solid rgba(99, 102, 241, 0.1)',
        borderTop: '3px solid #6366f1',
        borderRight: '3px solid #a855f7',
        animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite'
      }} />
      <div style={{
        width: '54px',
        height: '54px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
        animation: 'pulse 2s infinite ease-in-out'
      }}>
        <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '0.05em' }}>U</span>
      </div>
    </div>
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.025em', color: '#f8fafc' }}>
        Unified System
      </h3>
      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: '#94a3b8', opacity: 0.8 }}>
        Loading modules...
      </p>
    </div>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(0.95); opacity: 0.85; }
      }
    `}} />
  </div>
);

const AppContent = () => {
  const { pathname } = useLocation();
  
  React.useEffect(() => {
    if (pathname.startsWith('/pos')) {
      document.body.classList.add('pos-app');
      document.body.classList.remove('storefront-app');
    } else {
      document.body.classList.add('storefront-app');
      document.body.classList.remove('pos-app');
    }
  }, [pathname]);

  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/pos/*" element={<POSApp />} />
        <Route path="/*" element={<StorefrontApp />} />
      </Routes>
    </React.Suspense>
  );
};

const Main = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

ReactDOMClient.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
