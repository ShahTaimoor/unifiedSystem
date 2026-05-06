import { Routes, Route } from 'react-router-dom';
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

// Lazy-load pages
const RootLayout = lazy(() => import('./components/layouts/RootLayout'));
const AdminLayout = lazy(() => import('./components/layouts/AdminLayout'));
const ProtectedRoute = lazy(() => import('./components/custom/ProtectedRoute'));

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Checkout = lazy(() => import('./pages/Checkout'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Success = lazy(() => import('./pages/Success'));
const ErrorPage = lazy(() => import('./pages/Error'));
const Category = lazy(() => import('./pages/Category'));
const Users = lazy(() => import('./pages/Users'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));

const CreateProducts = lazy(() => import('./components/custom/CreateProducts'));
const AllProducts = lazy(() => import('./components/custom/AllProducts'));
const LowStock = lazy(() => import('./components/custom/LowStock'));
const UpdateProduct = lazy(() => import('./components/custom/UpdateProduct'));
const Orders = lazy(() => import('./components/custom/Orders'));
const Media = lazy(() => import('./pages/Media'));
const Attendance = lazy(() => import('./pages/Attendance'));
const AttendancePerformance = lazy(() => import('./pages/AttendancePerformance'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));

const App = () => {
  return (
    <Provider store={store}>
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
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<ProtectedRoute><AdminLayout><CreateProducts /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/category" element={<ProtectedRoute><AdminLayout><Category /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/dashboard/all-products" element={<ProtectedRoute><AdminLayout><AllProducts /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/dashboard/low-stock" element={<ProtectedRoute><AdminLayout><LowStock /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/dashboard/update/:id" element={<ProtectedRoute><AdminLayout><UpdateProduct /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/dashboard/users" element={<ProtectedRoute><AdminLayout><Users /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/dashboard/orders" element={<ProtectedRoute><AdminLayout><Orders /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/dashboard/media" element={<ProtectedRoute><AdminLayout><Media /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/dashboard/attendance" element={<ProtectedRoute><AdminLayout><Attendance /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/dashboard/attendance-performance" element={<ProtectedRoute><AdminLayout><AttendancePerformance /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/profile" element={<ProtectedRoute><AdminLayout><AdminProfile /></AdminLayout></ProtectedRoute>} />
              <Route path="*" element={<RootLayout><ErrorPage /></RootLayout>} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Toaster />
      </AuthDrawerProvider>
    </Provider>
  );
};

export default App;
