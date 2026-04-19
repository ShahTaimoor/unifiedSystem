const cloudinary = require('cloudinary').v2;

// Configure cloudinary with env variables (will be undefined if not set in .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a base64 string or file path to Cloudinary.
 * @param {string} fileStr - Base64 string or file path
 * @param {string} folder - Optional folder name in Cloudinary
 * @returns {Promise<string>} The secure URL of the uploaded image
 */
const uploadImage = async (fileStr, folder = 'unified-system') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.warn('⚠️ Cloudinary is not configured in .env. Skipping upload, keeping original fileStr.');
    return fileStr; // Fallback to storing original base64 if no config found
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      folder: folder,
      resource_type: 'auto',
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Iterates through an object payload and dynamically checks if there are base64 images that need uploading.
 * Optionally converts base64 fields like `imageUrl`, `logo`, `avatar` etc.
 */
const processImagesInPayload = async (payload, fieldsToProcess = ['imageUrl', 'logo', 'favicon', 'receipt', 'attachmentUrl', 'signature'], folder = 'unified-system/general') => {
  if (!payload || typeof payload !== 'object') return payload;

  const newPayload = { ...payload };

  for (const field of fieldsToProcess) {
    const fileStr = newPayload[field];
    // Check if the field exists and is a base64 Data URL
    if (fileStr && typeof fileStr === 'string' && fileStr.startsWith('data:image/')) {
      try {
        console.log(`Uploading ${field} to Cloudinary...`);
        const secureUrl = await uploadImage(fileStr, folder);
        newPayload[field] = secureUrl;
      } catch (err) {
        console.error(`Failed to upload ${field}:`, err);
        // Leave it as original base64 on failure so it doesn't just crash out.
      }
    }
  }

  return newPayload;
};

module.exports = {
  cloudinary,
  uploadImage,
  processImagesInPayload
};
