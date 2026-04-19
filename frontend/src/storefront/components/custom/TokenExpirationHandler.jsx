import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useCallback, useRef } from 'react';
import { clearTokenExpired, logout, setTokenExpired } from '@/redux/slices/auth/authSlice';
import { useAuthDrawer } from '@/contexts/AuthDrawerContext';
import { verifyToken } from '@/hooks/use-auth';

const TokenExpirationHandler = () => {
  const dispatch = useDispatch();
  const { tokenExpired, user } = useSelector((state) => state.auth);
  const { openDrawer } = useAuthDrawer();
  const loginTimeRef = useRef(null);

  // Track login time
  useEffect(() => {
    if (user && !loginTimeRef.current) {
      loginTimeRef.current = Date.now();
    } else if (!user) {
      loginTimeRef.current = null;
    }
  }, [user]);

  // Enhanced redirect logic with mobile support
  const handleTokenExpiration = useCallback(() => {
    if (tokenExpired) {
      // Clear token expired state
      dispatch(clearTokenExpired());
      
      // Clear user data
      dispatch(logout());
      
      // Open auth drawer instead of redirecting
      openDrawer('login');
    }
  }, [tokenExpired, dispatch, openDrawer]);

  useEffect(() => {
    handleTokenExpiration();
  }, [handleTokenExpiration]);

  // Handle page visibility change for mobile (when app comes back to foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        const now = Date.now();
        const timeSinceLogin = loginTimeRef.current ? now - loginTimeRef.current : Infinity;
        
        // Don't check if less than 30 seconds since login (cookies might not be ready)
        if (timeSinceLogin < 30000) {
          return;
        }
        
        // Check if user is still authenticated when app becomes visible
        // This helps with mobile browser tab switching
        const checkAuth = async () => {
          try {
            const result = await verifyToken();
            if (!result.ok) {
              dispatch(setTokenExpired());
            }
          } catch (error) {
            // Don't automatically logout on network errors
          }
        };
        
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, dispatch]);

  return null;
};

export default TokenExpirationHandler; 