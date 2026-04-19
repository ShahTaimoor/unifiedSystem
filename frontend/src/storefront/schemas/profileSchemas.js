import { z } from 'zod';

// Matches Profile.jsx fields: username, phone, address, city
export const profileSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(2, 'Username must be at least 2 characters')
    .max(100, 'Username must be less than 100 characters')
    .trim(),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => {
      if (!val || val.trim() === '') return false;
      const digitsOnly = val.replace(/\D/g, '');
      return /^[\d\s\-\+\(\)]+$/.test(val) && digitsOnly.length === 11;
    }, 'Phone number must be exactly 11 digits'),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(500, 'Address must be less than 500 characters')
    .trim(),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be less than 100 characters')
    .trim()
});
