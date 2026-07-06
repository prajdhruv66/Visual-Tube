import { z } from 'zod';

export const uploadVideoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  tags: z.string().min(1, 'Add at least one tag'),
  isPublished: z.boolean(),
  video: z
    .instanceof(FileList)
    .refine((files) => files.length === 1, 'A video file is required')
    .refine((files) => files.length === 0 || files[0].type.startsWith('video/'), 'File must be a video'),
  thumbnail: z
    .instanceof(FileList)
    .refine((files) => files.length === 1, 'A thumbnail image is required')
    .refine((files) => files.length === 0 || files[0].type.startsWith('image/'), 'Thumbnail must be an image'),
});
export type UploadVideoFormValues = z.infer<typeof uploadVideoSchema>;

export const editVideoSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  tags: z.string().min(1, 'Add at least one tag'),
});
export type EditVideoFormValues = z.infer<typeof editVideoSchema>;
