import axiosInstance from '@/redux/slices/auth/axiosInstance';

/**
 * Media Service
 * All media-related API calls
 */
export const mediaService = {
  /**
   * Get all media items
   * @param {number} limit - Maximum number of items to fetch
   * @returns {Promise<Array>} Array of media items
   */
  getMedia: async (limit = 2000) => {
    const response = await axiosInstance.get(`/media?limit=${limit}`);
    return response.data.success ? response.data.data : [];
  },

  /**
   * Upload media files
   * @param {FormData} formData - FormData containing files
   * @returns {Promise<Object>} Upload response
   */
  uploadMedia: async (formData) => {
    const response = await axiosInstance.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete single media item
   * @param {string} mediaId - Media ID
   * @returns {Promise<Object>} Delete response
   */
  deleteMedia: async (mediaId) => {
    const response = await axiosInstance.delete(`/media/${mediaId}`);
    return response.data;
  },

  /**
   * Bulk delete media items
   * @param {Array<string>} mediaIds - Array of media IDs
   * @returns {Promise<Object>} Delete response
   */
  bulkDeleteMedia: async (mediaIds) => {
    const response = await axiosInstance.delete('/media/bulk', {
      data: { ids: mediaIds },
    });
    return response.data;
  },
};

