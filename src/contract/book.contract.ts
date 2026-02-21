import { z } from 'zod';

// 24-hex Mongo ObjectId
export const objectId = z.string().length(24).regex(/^[0-9a-fA-F]{24}$/);

export const idParamSchema = z.object({
  id: objectId
});

export const createBookSchema = z.object({
  title: z.string().trim().min(1),
  author: z.string().trim().min(1),
  publishedDate: z.iso.datetime().or(z.coerce.date()).optional(),
  pages: z.coerce.number().int().positive(),
  authorCountry: z.string().trim().min(1),
  library: objectId
});

export const updateBookSchema = z.object({
  title: z.string().trim().min(1).optional(),
  author: z.string().trim().min(1).optional(),
  publishedDate: z.iso.datetime().or(z.coerce.date()).optional(),
  pages: z.coerce.number().int().positive().optional(),
  authorCountry: z.string().trim().min(1).optional(),
  library: objectId.optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});
