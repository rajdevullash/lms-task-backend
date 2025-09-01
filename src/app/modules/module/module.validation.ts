// Define your validations here
import { z } from 'zod';

const createModuleZodSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(3, 'Title must be at least 3 characters long'),

    courseId: z.string({ required_error: 'Course ID is required' }),
  }),
});

const updateModuleZodSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    courseId: z.string().optional(),
  }),
});
export const ModuleValidation = {
  createModuleZodSchema,
  updateModuleZodSchema,
};
