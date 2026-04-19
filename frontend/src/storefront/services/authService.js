import axiosInstance from '@/redux/slices/auth/axiosInstance';
import reduxAuthService from '@/redux/slices/auth/authService';

/**
 * Auth helpers used outside Redux (verify session, logout).
 */
export const authService = {
  verifyToken: async () => {
    try {
      const response = await axiosInstance.get('/auth/me', {
        withCredentials: true,
      });
      const u = response.data?.user;
      const user = u
        ? {
            ...u,
            name:
              u.name ||
              [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
              u.email ||
              '',
          }
        : null;
      return {
        ok: response.status === 200,
        data: { user },
      };
    } catch (error) {
      return {
        ok: false,
        data: null,
      };
    }
  },

  logout: () => reduxAuthService.logout(),
};
