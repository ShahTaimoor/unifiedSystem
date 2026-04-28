import React from 'react';
import { Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@pos/components/ui/sonner';
import { store } from './store/store';
import { ErrorProvider } from './contexts/ErrorContext';
import { TabProvider } from './contexts/TabContext';
import ErrorBoundary from './components/ErrorBoundary';
import NetworkStatus from './components/NetworkStatus';
import OfflineIndicator from './components/OfflineIndicator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: import.meta.env.DEV ? 0 : 5 * 60 * 1000,
      gcTime: import.meta.env.DEV ? 0 : 5 * 60 * 1000,
    },
  },
});

export default function PosRoot() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <ErrorProvider>
            <TabProvider>
              <NetworkStatus />
              <OfflineIndicator />
              <Outlet />
            </TabProvider>
          </ErrorProvider>
        </ErrorBoundary>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              success: 'border-green-500/50',
              error: 'border-red-500/50',
            },
          }}
        />
      </QueryClientProvider>
    </Provider>
  );
}

