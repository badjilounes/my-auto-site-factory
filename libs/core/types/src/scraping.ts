import { z } from 'zod';

export const ScrapingSourceEnum = z.enum([
  'UBEREATS',
  'DELIVEROO',
  'GOOGLE',
  'WEBSITE',
]);

export type ScrapingSource = z.infer<typeof ScrapingSourceEnum>;

export const ScrapingJobCreateSchema = z.object({
  source: ScrapingSourceEnum,
  city: z.string().min(1),
  cuisineType: z.string().optional(),
  maxResults: z.number().int().positive().max(500).optional().default(100),
});

export type ScrapingJobCreate = z.infer<typeof ScrapingJobCreateSchema>;

export const ScrapingJobSchema = z.object({
  id: z.string().uuid(),
  source: ScrapingSourceEnum,
  city: z.string(),
  cuisineType: z.string().nullable(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']),
  maxResults: z.number(),
  resultsCount: z.number().default(0),
  errorMessage: z.string().nullable(),
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ScrapingJob = z.infer<typeof ScrapingJobSchema>;

export const ScrapedBusinessDataSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  cuisineType: z.string().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  priceRange: z.string().optional(),
  openingHours: z.record(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
  menuUrl: z.string().optional(),
  description: z.string().optional(),
  source: ScrapingSourceEnum,
  sourceUrl: z.string(),
  scrapedAt: z.coerce.date(),
  rawData: z.record(z.unknown()).optional(),
});

export type ScrapedBusinessData = z.infer<typeof ScrapedBusinessDataSchema>;
