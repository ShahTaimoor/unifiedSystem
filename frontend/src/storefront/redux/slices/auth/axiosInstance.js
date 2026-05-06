// Enhanced Axios Instance with Token Refresh & Mobile Support
import axios from 'axios';
import { logout, setTokenExpired } from './authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 60000, // 60 second timeout for API calls (increased from 10s to handle slow networks and large uploads)
});

// Store reference will be set after store is created
let storeRef = null;
let isRefreshing = false;
let failedQueue = [];

export const setStoreReference = (store) => {
  storeRef = store;
};

// Process failed requests after token refresh by retrying with axiosInstance
const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      resolve(axiosInstance(config));
    }
  });
  failedQueue = [];
};

// Request interceptor to add retry logic
axiosInstance.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching issues on mobile
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with token refresh logic
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if it's a login POST request
    const isLoginRequest = originalRequest?.url?.includes('/login') && originalRequest?.method === 'post';
    const isRefreshRequest = originalRequest?.url?.includes('/refresh-token');
    
    // Check if it's a cart request (cart routes are at /api/, /api/add, /api/remove, etc.)
    const url = originalRequest?.url || '';
    const isCartRequest = url === '/' || 
                         url === '/add' || 
                         url === '/remove' || 
                         url === '/empty' || 
                         url === '/update' ||
                         url.includes('/cart');
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If it's a login request, don't treat it as token expiry
      if (isLoginRequest || isRefreshRequest) {
        return Promise.reject(error);
      }
      
      // For cart requests, if user is authenticated in Redux but getting 401,
      // cookies might not be ready yet after login - don't auto-refresh
      // Let the component handle the error (it will check user state)
      if (isCartRequest && storeRef) {
        const state = storeRef.getState();
        const { user, isAuthenticated } = state.auth;
        // If user is authenticated in state but getting 401, cookies might not be ready yet
        // Don't auto-refresh and open drawer, just reject and let component handle it
        if (user && isAuthenticated) {
          return Promise.reject(error);
        }
      }

      // If already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token using same instance (cookies attached)
        const refreshResponse = await axiosInstance.post('/refresh-token', null, { withCredentials: true, timeout: 30000 });

        if (refreshResponse?.data?.success) {
          processQueue(null);
          return axiosInstance(originalRequest);
        }
        throw new Error('Refresh failed');
      } catch (refreshError) {
        // Refresh failed, clear auth state
        processQueue(refreshError);
        
        if (storeRef) {
          storeRef.dispatch(logout());
          storeRef.dispatch(setTokenExpired());
        }
        
        // Attempt server logout to clear cookies
        try { await axiosInstance.post('/logout', null, { withCredentials: true }); } catch {}

        // Open auth drawer instead of redirecting to login
        if (typeof window !== 'undefined') {
          // Dispatch custom event to open auth drawer
          window.dispatchEvent(new CustomEvent('openAuthDrawer', { detail: { mode: 'login' } }));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    // Check if it's an authentication endpoint - let components handle those errors
    const isAuthEndpoint = originalRequest?.url?.includes('/login') || 
                          originalRequest?.url?.includes('/signup-or-login') ||
                          originalRequest?.url?.includes('/signup') ||
                          originalRequest?.url?.includes('/admin/login');
    
    if (error.response?.status === 403) {
      // Don't show generic toast for auth endpoints - let components handle it
    } else if (error.response?.status >= 500) {
    } else if (error.code === 'ECONNABORTED') {
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
