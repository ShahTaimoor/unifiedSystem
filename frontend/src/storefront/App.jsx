import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import TokenExpirationHandler from './components/custom/TokenExpirationHandler';
import AuthInitializer from './components/custom/AuthInitializer';
import ErrorBoundary from './components/custom/ErrorBoundary';
import OneLoader from './components/ui/OneLoader';
import { Suspense, lazy } from 'react';
import { AuthDrawerProvider } from './contexts/AuthDrawerContext';
import { Toaster } from './components/ui/sonner';

/** Storefront routes; staff/admin uses `/pos/*` in the same app (see root `router.jsx`). */

const RootLayout = lazy(() => import('./components/layouts/RootLayout'));
const ProtectedRoute = lazy(() => import('./components/custom/ProtectedRoute'));

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Success = lazy(() => import('./pages/Success'));
const ErrorPage = lazy(() => import('./pages/Error'));
const Profile = lazy(() => import('./pages/Profile'));

const App = () => {
  const router = createBrowserRouter([
    {
      path: '/',
      element: (
        <RootLayout>
          <ErrorBoundary>
            <Home />
          </ErrorBoundary>
        </RootLayout>
      ),
    },
    {
      path: '/products',
      element: (
        <RootLayout>
          <ErrorBoundary>
            <Products />
          </ErrorBoundary>
        </RootLayout>
      ),
    },
    {
      path: '/product/:id',
      element: (
        <RootLayout>
          <ErrorBoundary>
            <ProductDetail />
          </ErrorBoundary>
        </RootLayout>
      ),
    },
    {
      path: '/all-products',
      element: (
        <RootLayout>
          <ErrorBoundary>
            <Products />
          </ErrorBoundary>
        </RootLayout>
      ),
    },
    {
      path: '/checkout',
      element: (
        <ProtectedRoute>
          <RootLayout>
            <Checkout />
          </RootLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/orders',
      element: (
        <ProtectedRoute>
          <RootLayout>
            <MyOrders />
          </RootLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '/success',
      element: (
        <RootLayout>
          <Success />
        </RootLayout>
      ),
    },
    {
      path: '/profile',
      element: (
        <ProtectedRoute>
          <RootLayout>
            <Profile />
          </RootLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: '*',
      element: (
        <RootLayout>
          <ErrorPage />
        </RootLayout>
      ),
    },
  ]);

  return (
    <Provider store={store}>
      <AuthDrawerProvider>
        <AuthInitializer />
        <TokenExpirationHandler />
        <ErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><OneLoader size="large" text="Loading..." /></div>}>
            <RouterProvider router={router} />
          </Suspense>
        </ErrorBoundary>
        <Toaster />
      </AuthDrawerProvider>
    </Provider>
  );
};

export default App;
