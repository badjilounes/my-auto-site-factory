/**
 * Site Generator — Entry point
 *
 * Three modes of operation:
 *
 * 1. WORKER MODE (default):
 *    Listens on BullMQ queues 'site-generation' and 'outreach'
 *    for jobs dispatched by the backend API.
 *
 *    Usage: nx serve site-generator
 *
 * 2. CLI MODE:
 *    Manually trigger generation or outreach for a specific prospect.
 *
 *    Usage:
 *      SITE_GENERATOR_MODE=cli PROSPECT_ID=abc123 nx serve site-generator
 *      SITE_GENERATOR_MODE=cli PROSPECT_ID=abc123 ACTION=outreach nx serve site-generator
 *
 * Environment variables:
 *   SITE_GENERATOR_MODE  — "worker" (default) or "cli"
 *   PROSPECT_ID          — Prospect ID (CLI mode only)
 *   ACTION               — "generate" (default) or "outreach" (CLI mode only)
 *   REDIS_URL            — Redis connection URL (default: redis://localhost:6379)
 *   DATABASE_URL         — PostgreSQL connection URL
 *   ANTHROPIC_API_KEY    — Claude API key (for site generation)
 *   GITHUB_TOKEN         — GitHub token (for repo creation)
 *   GITHUB_OWNER         — GitHub username/org for repos
 *   VERCEL_TOKEN         — Vercel API token (for deployment)
 *   VERCEL_TEAM_ID       — Vercel team ID (optional)
 *   STRIPE_SECRET_KEY    — Stripe API key (for outreach invoices)
 *   RESEND_API_KEY       — Resend API key (for outreach emails)
 *   PORTAL_URL           — Client portal URL (for email links)
 */

import { startWorkers } from './worker';
import { runCliMode } from './cli';

async function main() {
  const mode = process.env['SITE_GENERATOR_MODE'] || 'worker';
  const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';

  console.log('┌──────────────────────────────────────────┐');
  console.log('│       Site Generator                     │');
  console.log('│       My Auto Site Factory               │');
  console.log('├──────────────────────────────────────────┤');
  console.log(`│  Mode:     ${mode.toUpperCase().padEnd(30)}│`);
  console.log(`│  GitHub:   ${(process.env['GITHUB_OWNER'] || '(auto)').padEnd(30)}│`);
  console.log(`│  Claude:   ${(process.env['ANTHROPIC_API_KEY'] ? 'configured' : 'MISSING').padEnd(30)}│`);
  console.log(`│  Vercel:   ${(process.env['VERCEL_TOKEN'] ? 'configured' : 'MISSING').padEnd(30)}│`);
  console.log(`│  Stripe:   ${(process.env['STRIPE_SECRET_KEY'] ? 'configured' : 'MISSING').padEnd(30)}│`);
  console.log(`│  Resend:   ${(process.env['RESEND_API_KEY'] ? 'configured' : 'MISSING').padEnd(30)}│`);
  console.log('└──────────────────────────────────────────┘');

  if (mode === 'cli') {
    await runCliMode();
  } else {
    startWorkers(redisUrl);
    // Keep process alive
    await new Promise(() => {});
  }
}

main().catch((error) => {
  console.error('[Fatal] Site generator crashed:', error);
  process.exit(1);
});
