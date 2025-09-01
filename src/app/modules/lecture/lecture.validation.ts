// Define your validations here

import { z } from 'zod';

export const createLectureZodSchema = z.object({
  body: z.object({
    title: z.string().min(1, { message: 'Title is required' }),
    slug: z.string().min(1, { message: 'Slug is required' }),
    videoUrl: z.string().url({ message: 'Invalid video URL' }),
    moduleId: z.string().min(1, { message: 'Module ID is required' }),
    courseId: z.string().min(1, { message: 'Course ID is required' }),
  }),
});

export const updateLectureZodSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    videoUrl: z.string().url({ message: 'Invalid video URL' }).optional(),
    moduleId: z
      .string()
      .min(1, { message: 'Module ID is required' })
      .optional(),
    courseId: z
      .string()
      .min(1, { message: 'Course ID is required' })
      .optional(),
  }),
});

export const LectureValidation = {
  createLectureZodSchema,
  updateLectureZodSchema,
};
