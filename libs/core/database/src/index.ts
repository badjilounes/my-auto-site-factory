export { prisma } from './prisma';

export { userRepository } from './repositories/user.repository';
export { prospectRepository } from './repositories/prospect.repository';
export { generatedSiteRepository } from './repositories/generated-site.repository';
export { clientAccountRepository } from './repositories/client-account.repository';
export { invoiceRepository } from './repositories/invoice.repository';
export { scrapingJobRepository } from './repositories/scraping-job.repository';
export { scrapingResultRepository } from './repositories/scraping-result.repository';
export { outreachEmailRepository } from './repositories/outreach-email.repository';

// Re-export Prisma types for convenience
export type {
  User,
  Account,
  Session,
  Prospect,
  GeneratedSite,
  ClientAccount,
  Invoice,
  ScrapingJob,
  ScrapingResult,
  OutreachEmail,
  ProspectStatus,
  DeploymentStatus,
  SubscriptionStatus,
  SubscriptionPlan,
  InvoiceStatus,
  ScrapingSource,
  ScrapingJobStatus,
  OutreachEmailStatus,
  UserRole,
} from '@prisma/client';
