import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { restoreUser } from '@/redux/slices/auth/authSlice';
import { verifyToken } from '@/hooks/use-auth';

/**
 * AuthInitializer - Checks authentication on app load
 * This ensures user state is restored from cookies on page refresh
 * regardless of which route they're on
 */
const AuthInitializer = () => {
  const dispatch = useDispatch();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check once on mount
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    
    const initializeAuth = async () => {
      try {
        const result = await verifyToken();
        if (result.ok && result.user) {
          // Restore user state from token
          // This will work even if Redux state was reset on page refresh
          dispatch(restoreUser(result.user));
        }
      } catch (error) {
        // Token invalid or error - user remains unauthenticated
        // This is fine, they'll need to login
      }
    };

    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return null; // This component doesn't render anything
};

export default AuthInitializer;

