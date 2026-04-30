import { Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import TokenExpirationHandler from './components/custom/TokenExpirationHandler';
import AuthInitializer from './components/custom/AuthInitializer';
import ErrorBoundary from './components/custom/ErrorBoundary';
import { Suspense } from 'react';
import { AuthDrawerProvider } from './contexts/AuthDrawerContext';
import { StorefrontSettingsProvider } from './contexts/StorefrontSettingsContext';
import { Toaster } from './components/ui/sonner';
import OneLoader from './components/ui/OneLoader';

export default function StorefrontLayout() {
  return (
    <Provider store={store}>
      <StorefrontSettingsProvider>
        <AuthDrawerProvider>
          <AuthInitializer />
          <TokenExpirationHandler />
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <OneLoader size="large" text="Loading..." />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary>
          <Toaster />
        </AuthDrawerProvider>
      </StorefrontSettingsProvider>
    </Provider>
  );
}
