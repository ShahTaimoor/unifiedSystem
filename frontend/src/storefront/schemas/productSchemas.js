import { z } from 'zod';

// Product creation/update schema
export const productSchema = z.object({
  title: z
    .string()
    .min(1, 'Product title is required')
    .min(3, 'Product title must be at least 3 characters')
    .max(200, 'Product title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .trim(),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, 'Price must be a positive number')
    .refine((val) => {
      const num = parseFloat(val);
      return num <= 10000000; // Max 10 million
    }, 'Price must be less than 10,000,000'),
  stock: z
    .string()
    .min(1, 'Stock quantity is required')
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 0;
    }, 'Stock must be a non-negative integer')
    .refine((val) => {
      const num = parseInt(val, 10);
      return num <= 1000000; // Max 1 million
    }, 'Stock must be less than 1,000,000'),
  category: z
    .string()
    .min(1, 'Category is required')
    .refine((val) => val !== 'all', 'Please select a valid category'),
  picture: z
    .union([
      z.string().url('Invalid image URL'),
      z.instanceof(File).refine((file) => {
        if (!file) return true; // Optional
        return file.size <= 5 * 1024 * 1024; // 5MB max
      }, 'Image must be less than 5MB'),
      z.string().length(0) // Empty string allowed
    ])
    .optional(),
  isFeatured: z.boolean().optional().default(false)
});

// Transform schema for form submission (convert strings to numbers)
export const productFormSchema = productSchema.extend({
  price: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    z.number().positive('Price must be a positive number').max(10000000)
  ),
  stock: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    z.number().int('Stock must be an integer').nonnegative('Stock must be non-negative').max(1000000)
  )
});


