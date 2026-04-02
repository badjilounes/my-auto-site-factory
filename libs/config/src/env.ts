import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  // Auth (Clerk)
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),

  // AI
  ANTHROPIC_API_KEY: z.string().min(1),

  // Deployment
  GITHUB_TOKEN: z.string().min(1),
  VERCEL_TOKEN: z.string().min(1),
  VERCEL_TEAM_ID: z.string().min(1),

  // Payments
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  // Email
  RESEND_API_KEY: z.string().min(1),
  FROM_EMAIL: z.string().email(),

  // URLs
  DASHBOARD_URL: z.string().url(),
  PORTAL_URL: z.string().url(),
  API_URL: z.string().url(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedConfig: EnvConfig | null = null;

/**
 * Parse and validate environment variables.
 * Results are cached after the first successful call.
 */
export function getConfig(): EnvConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = envSchema.parse(process.env);
  return cachedConfig;
}
