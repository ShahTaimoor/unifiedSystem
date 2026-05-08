import React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

// Shim for ReactDOM.findDOMNode for React 19 compatibility with legacy libraries
// Many libraries like react-quill or older versions of react-to-print still use this.
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

import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Storefront entry component
import StorefrontApp from './storefront/App';
// POS entry component
import POSApp from './pos/App';

import './index.css';

const Main = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/pos/*" 
          element={
            <div className="pos-app">
              <POSApp />
            </div>
          } 
        />
        <Route 
          path="/*" 
          element={
            <div className="storefront-app">
              <StorefrontApp />
            </div>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
};

ReactDOMClient.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
