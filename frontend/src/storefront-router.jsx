import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import StorefrontLayout from './storefront/StorefrontLayout';
import ErrorBoundary from './storefront/components/custom/ErrorBoundary';
import OneLoader from './storefront/components/ui/OneLoader';

const RootLayout = lazy(() => import('./storefront/components/layouts/RootLayout'));
const StorefrontProtectedRoute = lazy(() => import('./storefront/components/custom/ProtectedRoute'));

const Home = lazy(() => import('./storefront/pages/Home'));
const StoreProducts = lazy(() => import('./storefront/pages/Products'));
const ProductDetail = lazy(() => import('./storefront/pages/ProductDetail'));
const Checkout = lazy(() => import('./storefront/pages/Checkout'));
const MyOrders = lazy(() => import('./storefront/pages/MyOrders'));
const Success = lazy(() => import('./storefront/pages/Success'));
const ErrorPage = lazy(() => import('./storefront/pages/Error'));
const Profile = lazy(() => import('./storefront/pages/Profile'));

function SFWrap({ children }) {
  return (
    <RootLayout>
      <ErrorBoundary>{children}</ErrorBoundary>
    </RootLayout>
  );
}

export const storefrontRouter = createBrowserRouter([
  {
    path: '/',
    element: <StorefrontLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <SFWrap>
              <Home />
            </SFWrap>
          </Suspense>
        ),
      },
      {
        path: 'products',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <SFWrap>
              <StoreProducts />
            </SFWrap>
          </Suspense>
        ),
      },
      {
        path: 'product/:id',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <SFWrap>
              <ProductDetail />
            </SFWrap>
          </Suspense>
        ),
      },
      {
        path: 'all-products',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <SFWrap>
              <StoreProducts />
            </SFWrap>
          </Suspense>
        ),
      },
      {
        path: 'checkout',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <StorefrontProtectedRoute>
              <RootLayout>
                <Checkout />
              </RootLayout>
            </StorefrontProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'orders',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <StorefrontProtectedRoute>
              <RootLayout>
                <MyOrders />
              </RootLayout>
            </StorefrontProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: 'success',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <SFWrap>
              <Success />
            </SFWrap>
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <StorefrontProtectedRoute>
              <RootLayout>
                <Profile />
              </RootLayout>
            </StorefrontProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><OneLoader size="large" text="Loading..." /></div>}>
            <SFWrap>
              <ErrorPage />
            </SFWrap>
          </Suspense>
        ),
      },
    ],
  },
]);
