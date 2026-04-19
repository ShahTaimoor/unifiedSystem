import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearTokenExpired, logout, setTokenExpired, restoreUser } from '@/redux/slices/auth/authSlice';
import { fetchCart } from '@/redux/slices/cart/cartSlice';
import { verifyToken } from '@/hooks/use-auth';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const { user, isAuthenticated, tokenExpired } = useSelector((state) => state.auth);
  const { items: cartItems = [] } = useSelector((state) => state.cart);
  
  const loginTimeRef = useRef(null);
  const lastCheckTimeRef = useRef(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(!isAuthenticated);

  useEffect(() => {
    const checkAuthOnMount = async () => {
      if (!isAuthenticated && !user) {
        try {
          const result = await verifyToken();
          if (result.ok && result.user) {
            dispatch(restoreUser(result.user));
            loginTimeRef.current = Date.now();
          }
        } catch (error) {
          // Token invalid
        } finally {
          setIsCheckingAuth(false);
        }
      } else {
        setIsCheckingAuth(false);
      }
    };

    checkAuthOnMount();
  }, [dispatch, isAuthenticated, user]);

  useEffect(() => {
    if (user && isAuthenticated && !loginTimeRef.current) {
      loginTimeRef.current = Date.now();
    } else if (!user || !isAuthenticated) {
      loginTimeRef.current = null;
      lastCheckTimeRef.current = null;
    }
  }, [user, isAuthenticated]);

  const checkAuthentication = useCallback(async () => {
    if (user && isAuthenticated) {
      const now = Date.now();
      const timeSinceLogin = loginTimeRef.current ? now - loginTimeRef.current : Infinity;
      const timeSinceLastCheck = lastCheckTimeRef.current ? now - lastCheckTimeRef.current : Infinity;
      
      if (timeSinceLogin < 30000) {
        return;
      }
      
      if (timeSinceLastCheck < 5 * 60 * 1000) {
        return;
      }
      
      try {
        const result = await verifyToken();
        lastCheckTimeRef.current = Date.now();
        if (!result.ok) {
          dispatch(setTokenExpired());
        } else if (result.user && (!user || user._id !== result.user._id || user.id !== result.user.id)) {
          dispatch(restoreUser(result.user));
        }
      } catch (error) {
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

  useEffect(() => {
    if (user && isAuthenticated) {
      const initialDelay = loginTimeRef.current 
        ? Math.max(0, 30000 - (Date.now() - loginTimeRef.current))
        : 30000;
      
      let intervalId = null;
      
      const timeoutId = setTimeout(() => {
        checkAuthentication();
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

  if (isCheckingAuth) {
    return null;
  }

  if (tokenExpired) {
    dispatch(clearTokenExpired());
    dispatch(logout());
    return children;
  }

  if (!isAuthenticated && !publicPaths.includes(pathname)) {
    return <Navigate to="/" replace />;
  }

  if (user && pathname === '/checkout' && cartItems.length === 0) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
