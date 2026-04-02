import { z } from 'zod';

export const DeploymentStatusEnum = z.enum([
  'PENDING',
  'BUILDING',
  'DEPLOYED',
  'FAILED',
]);

export type DeploymentStatus = z.infer<typeof DeploymentStatusEnum>;

export const GeneratedSiteCreateSchema = z.object({
  prospectId: z.string().uuid(),
  template: z.string().min(1),
  subdomain: z.string().min(1),
  customDomain: z.string().optional(),
  content: z.record(z.unknown()).optional(),
});

export type GeneratedSiteCreate = z.infer<typeof GeneratedSiteCreateSchema>;

export const GeneratedSiteUpdateSchema = z.object({
  template: z.string().min(1).optional(),
  subdomain: z.string().min(1).optional(),
  customDomain: z.string().optional(),
  content: z.record(z.unknown()).optional(),
  deploymentStatus: DeploymentStatusEnum.optional(),
  deploymentUrl: z.string().url().optional(),
  vercelProjectId: z.string().optional(),
  vercelDeploymentId: z.string().optional(),
  githubRepoUrl: z.string().url().optional(),
  lastDeployedAt: z.coerce.date().optional(),
});

export type GeneratedSiteUpdate = z.infer<typeof GeneratedSiteUpdateSchema>;

export const GeneratedSiteSchema = z.object({
  id: z.string().uuid(),
  prospectId: z.string().uuid(),
  template: z.string(),
  subdomain: z.string(),
  customDomain: z.string().nullable(),
  content: z.record(z.unknown()).nullable(),
  deploymentStatus: DeploymentStatusEnum,
  deploymentUrl: z.string().nullable(),
  vercelProjectId: z.string().nullable(),
  vercelDeploymentId: z.string().nullable(),
  githubRepoUrl: z.string().nullable(),
  lastDeployedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type GeneratedSite = z.infer<typeof GeneratedSiteSchema>;
