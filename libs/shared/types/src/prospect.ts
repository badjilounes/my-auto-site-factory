import { z } from 'zod';

export const ProspectStatusEnum = z.enum([
  'NEW',
  'ENRICHED',
  'SITE_GENERATING',
  'SITE_GENERATED',
  'SITE_DEPLOYED',
  'OUTREACH_SENT',
  'INTERESTED',
  'CLIENT',
  'REJECTED',
]);

export type ProspectStatus = z.infer<typeof ProspectStatusEnum>;

export const ProspectCreateSchema = z.object({
  businessName: z.string().min(1),
  ownerName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().min(1),
  cuisineType: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export type ProspectCreate = z.infer<typeof ProspectCreateSchema>;

export const ProspectUpdateSchema = z.object({
  businessName: z.string().min(1).optional(),
  ownerName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().min(1).optional(),
  cuisineType: z.string().optional(),
  status: ProspectStatusEnum.optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export type ProspectUpdate = z.infer<typeof ProspectUpdateSchema>;

export const ProspectFilterSchema = z.object({
  status: ProspectStatusEnum.optional(),
  city: z.string().optional(),
  cuisineType: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export type ProspectFilter = z.infer<typeof ProspectFilterSchema>;
