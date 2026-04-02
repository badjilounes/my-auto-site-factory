import { z } from 'zod';

export const InvoiceStatusEnum = z.enum([
  'DRAFT',
  'SENT',
  'PAID',
  'OVERDUE',
  'CANCELLED',
]);

export type InvoiceStatus = z.infer<typeof InvoiceStatusEnum>;

export const InvoiceCreateSchema = z.object({
  clientAccountId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('EUR'),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
  stripeInvoiceId: z.string().optional(),
});

export type InvoiceCreate = z.infer<typeof InvoiceCreateSchema>;

export const InvoiceUpdateSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  description: z.string().optional(),
  status: InvoiceStatusEnum.optional(),
  dueDate: z.coerce.date().optional(),
  paidAt: z.coerce.date().optional(),
  stripeInvoiceId: z.string().optional(),
  stripePaymentIntentId: z.string().optional(),
});

export type InvoiceUpdate = z.infer<typeof InvoiceUpdateSchema>;

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  clientAccountId: z.string().uuid(),
  amount: z.number(),
  currency: z.string(),
  description: z.string().nullable(),
  status: InvoiceStatusEnum,
  dueDate: z.coerce.date(),
  paidAt: z.coerce.date().nullable(),
  stripeInvoiceId: z.string().nullable(),
  stripePaymentIntentId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;
