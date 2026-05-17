import { Routes, Route } from 'react-router-dom';
import './index.css';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import TokenExpirationHandler from './components/custom/TokenExpirationHandler';
import AuthInitializer from './components/custom/AuthInitializer';
import ErrorBoundary from './components/custom/ErrorBoundary';
import OneLoader from './components/ui/OneLoader';
import { Suspense, lazy } from 'react';
import { AuthDrawerProvider } from './contexts/AuthDrawerContext';
import AuthDrawer from './components/custom/AuthDrawer';
import { Toaster } from './components/ui/sonner';
import { CompanyProvider } from './contexts/CompanyContext';

import RootLayout from './components/layouts/RootLayout';
import ProtectedRoute from './components/custom/ProtectedRoute';
import Home from './pages/Home';

// Lazy-load pages
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Success = lazy(() => import('./pages/Success'));
const ErrorPage = lazy(() => import('./pages/Error'));
const Profile = lazy(() => import('./pages/Profile'));

const App = () => {
  return (
    <Provider store={store}>
      <CompanyProvider>
      <AuthDrawerProvider>
        <AuthInitializer />
        <TokenExpirationHandler />
        <ErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><OneLoader size="large" text="Loading..." /></div>}>
            <Routes>
              <Route path="/" element={<RootLayout><ErrorBoundary><Home /></ErrorBoundary></RootLayout>} />
              <Route path="/products" element={<RootLayout><ErrorBoundary><Products /></ErrorBoundary></RootLayout>} />
              <Route path="/product/:id" element={<RootLayout><ErrorBoundary><ProductDetail /></ErrorBoundary></RootLayout>} />
              <Route path="/all-products" element={<RootLayout><ErrorBoundary><Products /></ErrorBoundary></RootLayout>} />
              <Route path="/checkout" element={<ProtectedRoute><RootLayout><Checkout /></RootLayout></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><RootLayout><MyOrders /></RootLayout></ProtectedRoute>} />
              <Route path="/success" element={<RootLayout><Success /></RootLayout>} />
              <Route path="/profile" element={<ProtectedRoute><RootLayout><Profile /></RootLayout></ProtectedRoute>} />
              <Route path="*" element={<RootLayout><ErrorPage /></RootLayout>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Toaster />
      </AuthDrawerProvider>
      </CompanyProvider>
    </Provider>
  );
};

export default App;
