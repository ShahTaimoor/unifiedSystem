import { z } from 'zod';

// Profile update schema
export const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim(),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => {
      if (!val || val.trim() === '') return false; // Required
      const digitsOnly = val.replace(/\D/g, '');
      return /^[\d\s\-\+\(\)]+$/.test(val) && digitsOnly.length === 11;
    }, 'Phone number must be exactly 11 digits'),
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  city: z
    .string()
    .max(100, 'City must be less than 100 characters')
    .optional()
});


