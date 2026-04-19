import { useState, useCallback } from 'react';
import { mediaService } from '@/services/mediaService';

/**
 * Custom hook for media management
 * Handles fetching, uploading, and deleting media
 */
export const useMedia = () => {
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Fetch media from database
   * @param {number} limit - Maximum number of items to fetch
   */
  const fetchMedia = useCallback(async (limit = 2000) => {
    setMediaLoading(true);
    try {
      const data = await mediaService.getMedia(limit);
      setUploadedMedia(data);
    } catch (error) {
      // Error handled silently - user will see empty state
    } finally {
      setMediaLoading(false);
    }
  }, []);

  /**
   * Upload media files
   * @param {Array<File>} files - Array of files to upload
   */
  const uploadMedia = useCallback(async (files) => {
    if (files.length === 0) {
      return { success: false, message: 'No files selected' };
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await mediaService.uploadMedia(formData);
      
      if (response.success) {
        await fetchMedia();
        return { success: true, data: response.data };
      }
      
      throw new Error(response.message || 'Upload failed');
    } catch (error) {
      return { success: false, message: error.message || 'Upload failed' };
    } finally {
      setIsImporting(false);
    }
  }, [fetchMedia]);

  /**
   * Delete single media item
   * @param {string} mediaId - Media ID
   */
  const deleteMedia = useCallback(async (mediaId) => {
    setIsDeleting(true);
    try {
      const response = await mediaService.deleteMedia(mediaId);
      
      if (response.success) {
        await fetchMedia();
        return { success: true };
      }
      
      throw new Error(response.message || 'Delete failed');
    } catch (error) {
      return { success: false, message: error.message || 'Delete failed' };
    } finally {
      setIsDeleting(false);
    }
  }, [fetchMedia]);

  /**
   * Bulk delete media items
   * @param {Array<string>} mediaIds - Array of media IDs
   */
  const bulkDeleteMedia = useCallback(async (mediaIds) => {
    if (mediaIds.length === 0) {
      return { success: false, message: 'No items selected' };
    }

    setIsDeleting(true);
    try {
      const response = await mediaService.bulkDeleteMedia(mediaIds);
      
      if (response.success) {
        await fetchMedia();
        return { success: true };
      }
      
      throw new Error(response.message || 'Bulk delete failed');
    } catch (error) {
      return { success: false, message: error.message || 'Bulk delete failed' };
    } finally {
      setIsDeleting(false);
    }
  }, [fetchMedia]);

  return {
    uploadedMedia,
    mediaLoading,
    isDeleting,
    isImporting,
    fetchMedia,
    uploadMedia,
    deleteMedia,
    bulkDeleteMedia,
  };
};

