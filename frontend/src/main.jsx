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

// Storefront entry component
import StorefrontApp from './storefront/App';
// POS entry component
import POSApp from './pos/App';

import './index.css';

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
    <Routes>
      <Route path="/pos/*" element={<POSApp />} />
      <Route path="/*" element={<StorefrontApp />} />
    </Routes>
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
