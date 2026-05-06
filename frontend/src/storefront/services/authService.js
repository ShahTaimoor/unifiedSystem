import axiosInstance from '@/storefront/redux/slices/auth/axiosInstance';

/**
 * Auth Service
 * All authentication-related API calls
 */
export const authService = {
  /**
   * Verify token
   * @returns {Promise<Object>} Verification response
   */
  verifyToken: async () => {
    try {
      const response = await axiosInstance.get('/verify-token', {
        withCredentials: true,
      });
      return {
        ok: response.status === 200,
        data: response.data,
      };
    } catch (error) {
      return {
        ok: false,
        data: null,
      };
    }
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  logout: async () => {
    await axiosInstance.get('/logout', {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};

