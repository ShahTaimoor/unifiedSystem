import React from 'react';
import ReactDOM from 'react-dom/client';
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
