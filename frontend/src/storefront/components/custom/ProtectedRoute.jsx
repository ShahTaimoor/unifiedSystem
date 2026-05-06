import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearTokenExpired, logout, setTokenExpired, restoreUser } from '@/storefront/redux/slices/auth/authSlice';
import { fetchCart } from '@/storefront/redux/slices/cart/cartSlice';
import { verifyToken } from '@/storefront/hooks/use-auth';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const { user, isAuthenticated, tokenExpired } = useSelector((state) => state.auth);
  const { items: cartItems = [] } = useSelector((state) => state.cart);
  
  // Track when user logged in to avoid immediate token checks
  const loginTimeRef = useRef(null);
  const lastCheckTimeRef = useRef(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(!isAuthenticated);

  // Check authentication on mount if not authenticated (page refresh scenario)
  useEffect(() => {
    const checkAuthOnMount = async () => {
      if (!isAuthenticated && !user) {
        try {
          const result = await verifyToken();
          if (result.ok && result.user) {
            // Restore user state from token
            dispatch(restoreUser(result.user));
            loginTimeRef.current = Date.now();
          }
        } catch (error) {
          // Token invalid or error - user will be redirected
        } finally {
          setIsCheckingAuth(false);
        }
      } else {
        setIsCheckingAuth(false);
      }
    };

    checkAuthOnMount();
  }, [dispatch, isAuthenticated, user]);

  // Track login time when user becomes authenticated
  useEffect(() => {
    if (user && isAuthenticated && !loginTimeRef.current) {
      loginTimeRef.current = Date.now();
    } else if (!user || !isAuthenticated) {
      loginTimeRef.current = null;
      lastCheckTimeRef.current = null;
    }
  }, [user, isAuthenticated]);

  // Enhanced auth check for mobile devices
  const checkAuthentication = useCallback(async () => {
    if (user && isAuthenticated) {
      const now = Date.now();
      const timeSinceLogin = loginTimeRef.current ? now - loginTimeRef.current : Infinity;
      const timeSinceLastCheck = lastCheckTimeRef.current ? now - lastCheckTimeRef.current : Infinity;
      
      // Don't check if:
      // 1. Less than 30 seconds since login (cookies might not be ready)
      // 2. Less than 5 minutes since last check (avoid too frequent checks)
      if (timeSinceLogin < 30000) {
        return; // Too soon after login, skip check
      }
      
      if (timeSinceLastCheck < 5 * 60 * 1000) {
        return; // Already checked recently, skip
      }
      
      try {
        const result = await verifyToken();
        lastCheckTimeRef.current = Date.now();
        if (!result.ok) {
          dispatch(setTokenExpired());
        } else if (result.user && (!user || user._id !== result.user._id || user.id !== result.user.id)) {
          // Update user if it changed
          dispatch(restoreUser(result.user));
        }
      } catch (error) {
        // Don't logout on network errors
        // Error logging should be handled by error boundary or monitoring service
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('Token verification error:', error);
        }
      }
    }
  }, [user, isAuthenticated, dispatch]);

  useEffect(() => {
    if (user && isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, user, isAuthenticated]);

  // Periodic auth check for mobile (every 5 minutes, but only after 30 seconds from login)
  useEffect(() => {
    if (user && isAuthenticated) {
      // Wait 30 seconds after login before starting periodic checks
      const initialDelay = loginTimeRef.current 
        ? Math.max(0, 30000 - (Date.now() - loginTimeRef.current))
        : 30000;
      
      let intervalId = null;
      
      const timeoutId = setTimeout(() => {
        // First check after delay
        checkAuthentication();
        
        // Then set up periodic checks every 5 minutes
        intervalId = setInterval(checkAuthentication, 5 * 60 * 1000);
      }, initialDelay);
      
      return () => {
        clearTimeout(timeoutId);
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [user, isAuthenticated, checkAuthentication]);

  const publicPaths = ['/', '/products', '/all-products', '/search', '/success'];

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return null; // or a loading spinner
  }

  // Handle token expiration - stay on current page
  if (tokenExpired) {
    dispatch(clearTokenExpired());
    dispatch(logout());
    return children; // Allow access, user will see logged out state
  }

  // Check if user is not authenticated and trying to access protected route
  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    // If trying to access admin route, redirect to admin login
    if (pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    // Otherwise redirect to home page
    return <Navigate to="/" replace />;
  }

  // Normal user trying to access admin route
  if (user?.role === 0 && pathname.startsWith('/admin')) {
    return <Navigate to="/" replace />;
  }

  // Authenticated but not admin trying to access admin route
  if (isAuthenticated && user && user.role !== 1 && user.role !== 2 && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return <Navigate to="/admin/login" replace />;
  }

  // Empty cart, disallow checkout
  if (user && pathname === '/checkout' && cartItems.length === 0) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
