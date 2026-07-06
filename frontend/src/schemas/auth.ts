import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Enter your email or username'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

const requiredImageFile = (label: string) =>
  z
    .instanceof(FileList)
    .refine((files) => files.length === 1, `${label} is required`)
    .refine((files) => files[0].size <= 5 * 1024 * 1024, `${label} must be under 5MB`)
    .refine((files) => files[0].type.startsWith('image/'), `${label} must be an image`);

const optionalImageFile = (label: string) =>
  z
    .instanceof(FileList)
    .refine(
      (files) => files.length === 0 || files[0].size <= 5 * 1024 * 1024,
      `${label} must be under 5MB`
    )
    .refine(
      (files) => files.length === 0 || files[0].type.startsWith('image/'),
      `${label} must be an image`
    )
    .optional();

export const registerSchema = z.object({
  fullname: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers and underscores only'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  avatar: requiredImageFile('Avatar'),
  coverImage: optionalImageFile('Cover image'),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;
