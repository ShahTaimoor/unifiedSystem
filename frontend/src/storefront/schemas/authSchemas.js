import { z } from 'zod';

const phoneRefine = (val) => {
  const d = String(val || '').replace(/\D/g, '');
  return d.length >= 7 && d.length <= 15;
};

/** Storefront: phone + password only (accounts are provisioned in POS / bulk script). */
export const authSchema = z.object({
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine(phoneRefine, 'Enter a valid phone number (7–15 digits)'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
});
