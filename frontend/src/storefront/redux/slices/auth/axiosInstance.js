// Enhanced Axios Instance with Token Refresh & Mobile Support
import axios from 'axios';
import { logout, setTokenExpired } from './authSlice';

// Same VITE_API_URL as POS admin (`src/pos`). Use absolute URL (dev) or `/api` when store + admin share one origin.
// Page routes: `/` = storefront, `/pos/` = admin — API stays `/api` for both.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 60000, // 60 second timeout for API calls (increased from 10s to handle slow networks and large uploads)
  headers: {
    // Prefer storefront session on shared routes (e.g. /auth/profile) when both pos_token and store_token exist
    'X-Client': 'storefront',
  },
});

// Store reference will be set after store is created
let storeRef = null;

export const setStoreReference = (store) => {
  storeRef = store;
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

    const url = originalRequest?.url || '';
    const isLoginRequest =
      (url.includes('/auth/login') || url.includes('/login')) &&
      originalRequest?.method === 'post';
    const isStorefrontLoginRequest =
      url.includes('/storefront/login') && originalRequest?.method === 'post';
    const isSessionProbe = url.includes('/auth/me') && originalRequest?.method === 'get';

    // POS backend uses HTTP-only cookie + JWT; no refresh endpoint — clear session on 401.
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isLoginRequest || isSignupRequest || isSessionProbe) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      if (storeRef) {
        storeRef.dispatch(logout());
        storeRef.dispatch(setTokenExpired());
      }
      try {
        await axiosInstance.post('/auth/store/logout', null, { withCredentials: true });
      } catch {
        /* ignore */
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('openAuthDrawer', { detail: { mode: 'login' } })
        );
      }
      return Promise.reject(error);
    }

    // Handle other errors
    // Check if it's an authentication endpoint - let components handle those errors
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/login') ||
      originalRequest?.url?.includes('/storefront/login') ||
      originalRequest?.url?.includes('/signup');
    
    if (error.response?.status === 403) {
      // Don't show generic toast for auth endpoints - let components handle it
    } else if (error.response?.status >= 500) {
    } else if (error.code === 'ECONNABORTED') {
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
