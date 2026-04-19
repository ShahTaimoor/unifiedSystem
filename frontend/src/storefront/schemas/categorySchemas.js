import { z } from 'zod';

// Category creation/update schema
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name must be less than 100 characters')
    .trim()
    .refine((val) => {
      // Check for valid category name (letters, numbers, spaces, hyphens, and common special chars)
      return /^[a-zA-Z0-9\s\-\&'(),./]+$/.test(val);
    }, 'Category name can only contain letters, numbers, spaces, hyphens, and special characters (&, \', ., ,, (, ), /)'),
  picture: z
    .union([
      z.instanceof(File).refine((file) => {
        if (!file) return true; // Optional
        return file.size <= 5 * 1024 * 1024; // 5MB max
      }, 'Image must be less than 5MB'),
      z.string().url('Invalid image URL'),
      z.string().length(0), // Empty string allowed
      z.null() // Allow null for updates when no new image is selected
    ])
    .optional()
    .nullable(),
  active: z.boolean().optional().default(true),
  position: z
    .number()
    .int('Position must be an integer')
    .nonnegative('Position must be non-negative')
    .optional()
});


