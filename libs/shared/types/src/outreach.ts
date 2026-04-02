import { z } from 'zod';

export const EmailStatusEnum = z.enum([
  'DRAFT',
  'QUEUED',
  'SENT',
  'DELIVERED',
  'OPENED',
  'CLICKED',
  'BOUNCED',
  'FAILED',
]);

export type EmailStatus = z.infer<typeof EmailStatusEnum>;

export const OutreachEmailCreateSchema = z.object({
  prospectId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string().min(1),
  htmlBody: z.string().min(1),
  textBody: z.string().optional(),
  scheduledAt: z.coerce.date().optional(),
});

export type OutreachEmailCreate = z.infer<typeof OutreachEmailCreateSchema>;

export const OutreachEmailUpdateSchema = z.object({
  subject: z.string().min(1).optional(),
  htmlBody: z.string().min(1).optional(),
  textBody: z.string().optional(),
  status: EmailStatusEnum.optional(),
  scheduledAt: z.coerce.date().optional(),
  sentAt: z.coerce.date().optional(),
  openedAt: z.coerce.date().optional(),
  clickedAt: z.coerce.date().optional(),
  resendEmailId: z.string().optional(),
});

export type OutreachEmailUpdate = z.infer<typeof OutreachEmailUpdateSchema>;

export const OutreachEmailSchema = z.object({
  id: z.string().uuid(),
  prospectId: z.string().uuid(),
  to: z.string().email(),
  subject: z.string(),
  htmlBody: z.string(),
  textBody: z.string().nullable(),
  status: EmailStatusEnum,
  scheduledAt: z.coerce.date().nullable(),
  sentAt: z.coerce.date().nullable(),
  openedAt: z.coerce.date().nullable(),
  clickedAt: z.coerce.date().nullable(),
  resendEmailId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type OutreachEmail = z.infer<typeof OutreachEmailSchema>;
