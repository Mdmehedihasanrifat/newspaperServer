import { z } from 'zod';

export const newsValidationSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string(),
  image: z.string().optional(), // Make the image optional
  categoryIds: z.array(z.number()).optional(),
  userId: z.number(),
});
