import { fileToWebpFile } from './convertImageToWebp';

function getApiRoot() {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return String(raw).replace(/\/$/, '');
}

/**
 * Upload image (converted to WebP in-browser when possible) to POST /api/images/upload.
 * Uses cookies (same as RTK Query) for auth.
 *
 * @param {File} file
 * @returns {Promise<string>} Optimized image URL (e.g. /api/images/...)
 */
export async function uploadImageAsWebp(file) {
  const webpFile = await fileToWebpFile(file);
  const form = new FormData();
  form.append('image', webpFile, webpFile.name);

  const url = `${getApiRoot()}/images/upload`;
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Image upload failed');
  }

  const optimized = data.urls?.optimized;
  if (!optimized) {
    throw new Error('Invalid response from image upload');
  }
  return optimized;
}
