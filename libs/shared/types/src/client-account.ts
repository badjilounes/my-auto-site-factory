import { z } from 'zod';

export const SubscriptionStatusEnum = z.enum([
  'TRIAL',
  'ACTIVE',
  'CANCELLED',
  'EXPIRED',
]);

export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;

export const ClientAccountCreateSchema = z.object({
  prospectId: z.string().uuid(),
  email: z.string().email(),
  businessName: z.string().min(1),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  subscriptionPlan: z.enum(['monthly', 'yearly']).optional(),
});

export type ClientAccountCreate = z.infer<typeof ClientAccountCreateSchema>;

export const ClientAccountUpdateSchema = z.object({
  email: z.string().email().optional(),
  businessName: z.string().min(1).optional(),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  subscriptionStatus: SubscriptionStatusEnum.optional(),
  subscriptionPlan: z.enum(['monthly', 'yearly']).optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  trialEndsAt: z.coerce.date().optional(),
  currentPeriodEndsAt: z.coerce.date().optional(),
});

export type ClientAccountUpdate = z.infer<typeof ClientAccountUpdateSchema>;

export const ClientAccountSchema = z.object({
  id: z.string().uuid(),
  prospectId: z.string().uuid(),
  email: z.string().email(),
  businessName: z.string(),
  ownerName: z.string().nullable(),
  phone: z.string().nullable(),
  subscriptionStatus: SubscriptionStatusEnum,
  subscriptionPlan: z.enum(['monthly', 'yearly']).nullable(),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
  trialEndsAt: z.coerce.date().nullable(),
  currentPeriodEndsAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ClientAccount = z.infer<typeof ClientAccountSchema>;
