import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { imageService } from '@/services/imageService';

/**
 * Get today's date in 'yyyy-mm-dd' format for Pakistan timezone
 * @returns {string} Date string in 'yyyy-mm-dd' format
 */
export const getPakistaniDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
};

/**
 * Convert image URL to base64 string for PDF generation
 * @param {string} url - Image URL
 * @returns {Promise<string>} Base64 string of the image
 */
export const getImageBase64 = async (url) => {
  try {
    const blob = await imageService.fetchImageBlob(url);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return '';
  }
};

/**
 * Order status color classes for UI badges
 */
export const statusColors = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Processing: 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
  canceled: 'bg-red-50 text-red-700 border-red-200',
};

/**
 * Order status icons mapping
 */
export const statusIcons = {
  Pending: Clock,
  Processing: Clock,
  Completed: CheckCircle,
  Cancelled: XCircle,
  canceled: XCircle,
};

