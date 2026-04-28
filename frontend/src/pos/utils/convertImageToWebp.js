/**
 * Convert a user-selected image file to WebP in the browser before upload.
 * Falls back to the original file if WebP encoding is not supported or conversion fails.
 */

function supportsWebpEncoding() {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * @param {File} file - Original image file
 * @param {{ quality?: number, maxWidth?: number, maxHeight?: number }} [options]
 * @returns {Promise<File>}
 */
export async function fileToWebpFile(file, options = {}) {
  const { quality = 0.82, maxWidth = 2000, maxHeight = 2000 } = options;

  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please choose an image file');
  }

  if (file.type === 'image/webp') {
    return file;
  }

  // Animated GIF / unsupported for canvas path — upload as-is (server can optimize)
  if (file.type === 'image/gif') {
    return file;
  }

  if (!supportsWebpEncoding()) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size === 0) {
            resolve(file);
            return;
          }
          const base = (file.name && file.name.replace(/\.[^.]+$/, '')) || 'image';
          resolve(new File([blob], `${base}.webp`, { type: 'image/webp' }));
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image'));
    };

    img.src = url;
  });
}

