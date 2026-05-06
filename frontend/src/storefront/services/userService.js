import axiosInstance from '@/storefront/redux/slices/auth/axiosInstance';

/**
 * User Service
 * All user-related API calls
 */
export const userService = {
  /**
   * Get all users
   * @returns {Promise<Array>} Array of users
   */
  getAllUsers: async () => {
    // Add cache-busting parameter to ensure fresh data
    const response = await axiosInstance.get('/all-users', {
      params: { _t: Date.now() }
    });
    return Array.isArray(response.data) ? response.data : response.data?.users || [];
  },

  /**
   * Update user role
   * @param {string} userId - User ID
   * @param {number} role - New role (0: User, 1: Admin, 2: Super Admin)
   * @returns {Promise<Object>} Updated user data
   */
  updateUserRole: async (userId, role) => {
    const response = await axiosInstance.patch(`/users/${userId}/role`, { role });
    return response.data;
  },

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Delete result
   */
  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/users/${userId}`);
    return response.data;
  },

  /**
   * Request password reset (Admin only)
   * @param {string} adminName - Admin shop name
   * @returns {Promise<Object>} Request result
   */
  requestPasswordReset: async (adminName) => {
    const response = await axiosInstance.post('/admin/forgot-password', { adminName });
    return response.data;
  },

  /**
   * Get pending password reset requests (Super Admin only)
   * @returns {Promise<Array>} Array of pending requests
   */
  getPendingPasswordResetRequests: async () => {
    const response = await axiosInstance.get('/admin/password-reset-requests');
    return response.data;
  },

  /**
   * Reset admin password (Super Admin only)
   * @param {string} requestId - Password reset request ID
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Reset result
   */
  resetAdminPassword: async (requestId, newPassword) => {
    const response = await axiosInstance.put(`/admin/reset-password/${requestId}`, { newPassword });
    return response.data;
  },

  /**
   * Get audit logs (Super Admin only)
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Audit logs
   */
  getAuditLogs: async (filters = {}) => {
    const response = await axiosInstance.get('/admin/audit-logs', { params: filters });
    return response.data;
  },
};

