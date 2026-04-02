// GitHub Integration
export {
  GitHubIntegration,
  createGitHubClient,
  type GitHubFile,
} from './github/client';

// Vercel Integration
export {
  VercelIntegration,
  createVercelClient,
  type VercelProject,
  type VercelDeployment,
  type VercelDomain,
} from './vercel/client';

// Anthropic Integration
export {
  AnthropicIntegration,
  createAnthropicClient,
  type BusinessData,
  type GeneratedFile,
} from './anthropic/client';

// Stripe Integration
export {
  StripeIntegration,
  createStripeClient,
  type InvoiceItem,
  type WebhookEvent,
} from './stripe/client';

// Resend Integration
export {
  ResendIntegration,
  createResendClient,
  type InvoiceEmailData,
  type EmailResult,
} from './resend/client';

// Scraper
export {
  scrapeUberEats,
  type ScrapedBusiness,
} from './scraper/ubereats';

export { scrapeDeliveroo } from './scraper/deliveroo';

export {
  analyzeWebsite,
  type WebsiteAnalysis,
} from './scraper/website-analyzer';

export {
  reconcileBusinessData,
  type EnrichedProspect,
} from './scraper/reconciliation';
