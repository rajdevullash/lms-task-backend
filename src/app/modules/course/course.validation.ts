// Define your validations here
import { z } from 'zod';

export const createCourseZodSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .min(3, 'Title must be at least 3 characters long'),

    description: z
      .string({ required_error: 'Description is required' })
      .min(10, 'Description must be at least 10 characters long'),

    price: z
      .string({ required_error: 'Price is required' })
      .min(1, 'Price must be at least 1 character long')
      .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid number'),

    //.nonnegative('Price cannot be negative'),
  }),
});

export const updateCourseZodSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    price: z.number().nonnegative().optional(),
  }),
});

export const CourseValidation = {
  createCourseZodSchema,
  updateCourseZodSchema,
};
