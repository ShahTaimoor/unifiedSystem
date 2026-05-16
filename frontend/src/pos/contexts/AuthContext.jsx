import { toast } from 'sonner';
import { useState, createContext, useContext, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  authApi,
  useLoginMutation,
  useRequestTwoFactorCodeMutation,
  useVerifyTwoFactorMutation,
  useCurrentUserQuery,
  useLogoutMutation,
} from '../store/services/authApi';
import { logout as logoutAction, setUser } from '../store/slices/authSlice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, isAuthenticated, status, error } = useAppSelector((s) => s.auth);
  const isLoginPage = location.pathname === '/pos/login';
  
  const hasStoredSessionHint = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      return !!(localStorage.getItem('posAuthToken') || localStorage.getItem('posAuthUser'));
    } catch {
      return false;
    }
  }, []);

  const {
    isLoading: currentUserLoading,
    isError: currentUserError,
    error: currentUserErrorData,
    refetch: refetchCurrentUser,
  } = useCurrentUserQuery(undefined, {
    skip: isLoginPage || (!isAuthenticated && !hasStoredSessionHint),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });

  const [loginMutation, { isLoading: loginLoading }] = useLoginMutation();
  const [requestTwoFactorMutation, { isLoading: requestTwoFactorLoading }] = useRequestTwoFactorCodeMutation();
  const [verifyTwoFactorMutation, { isLoading: verifyTwoFactorLoading }] = useVerifyTwoFactorMutation();
  const [logoutMutation] = useLogoutMutation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const login = useCallback(async (phone, password) => {
    try {
      await loginMutation({ phone, password }).unwrap();
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error?.data?.message || error?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [loginMutation]);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      // Clear local session first to ensure UI updates immediately
      dispatch(logoutAction());
      dispatch(authApi.util.resetApiState());
      
      // Navigate to login page
      navigate('/pos/login', { replace: true });
      toast.success('Logged out successfully');

      // Attempt server-side logout
      await logoutMutation().unwrap();
    } catch (error) {
      // Ignore server-side logout errors
    } finally {
      setIsLoggingOut(false);
    }
  }, [dispatch, isLoggingOut, logoutMutation, navigate]);

  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (!user.permissions) return false;
    return user.permissions.includes(permission);
  }, [user]);

  const requestTwoFactorCode = useCallback(async ({ channel = 'email', email, phone }) => {
    try {
      const response = await requestTwoFactorMutation({ channel, email, phone }).unwrap();
      toast.info(
        channel === 'sms'
          ? 'Verification code sent to your mobile number.'
          : 'Verification code sent to your email.'
      );
      return {
        success: true,
        twoFactorRequired: true,
        tempToken: response.tempToken,
      };
    } catch (error) {
      const message = error?.data?.message || error?.message || 'Could not send verification code';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [requestTwoFactorMutation]);

  const verifyTwoFactor = useCallback(async (tempToken, code) => {
    try {
      await verifyTwoFactorMutation({ tempToken, code }).unwrap();
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error?.data?.message || error?.message || '2FA verification failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [verifyTwoFactorMutation]);

  const loading = isLoginPage
    ? (loginLoading || verifyTwoFactorLoading || requestTwoFactorLoading)
    : (status === 'loading' || (currentUserLoading && !currentUserError)) ||
    loginLoading ||
    verifyTwoFactorLoading ||
    requestTwoFactorLoading;

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error: error || (currentUserError ? currentUserErrorData : null),
    login,
    logout,
    isLoggingOut,
    requestTwoFactorCode,
    verifyTwoFactor,
    hasPermission,
    refetchCurrentUser,
    updateUser: (userData) => dispatch(setUser(userData)),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
