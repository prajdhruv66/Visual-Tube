import { z } from 'zod';

export const updateAccountSchema = z.object({
  fullname: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
});
export type UpdateAccountFormValues = z.infer<typeof updateAccountSchema>;
