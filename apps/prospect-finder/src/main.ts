/**
 * Prospect Finder — Entry point
 *
 * Two modes of operation:
 *
 * 1. WORKER MODE (default):
 *    Listens on BullMQ 'scraping' queue for jobs dispatched by the backend API.
 *    Each job scrapes a specific city/source and syncs to DB.
 *
 *    Usage: nx serve prospect-finder
 *
 * 2. CRON MODE:
 *    Iterates through all configured cities/categories autonomously.
 *    Can run once or on a recurring interval.
 *
 *    Usage: PROSPECT_FINDER_MODE=cron nx serve prospect-finder
 *    With interval: PROSPECT_FINDER_MODE=cron CRON_INTERVAL_MINUTES=60 nx serve prospect-finder
 *
 * Environment variables:
 *   PROSPECT_FINDER_MODE    — "worker" (default) or "cron"
 *   SCRAPING_CITIES         — Comma-separated cities (default: 10 French cities from config)
 *   SCRAPING_CATEGORIES     — Comma-separated cuisines (default: all)
 *   MAX_RESULTS_PER_CITY    — Max prospects per city (default: 30)
 *   DELAY_BETWEEN_CITIES    — Delay in ms between city scrapes (default: 5000)
 *   ANALYZE_WEBSITES        — "true" or "false" (default: true)
 *   CRON_INTERVAL_MINUTES   — Recurring interval in minutes (default: 0 = run once)
 *   REDIS_URL               — Redis connection URL (default: redis://localhost:6379)
 *   SCRAPER_PROXY_URL       — Optional proxy for scrapers
 *   DATABASE_URL            — PostgreSQL connection URL
 */

import { loadConfig } from './config';
import { runCronMode } from './cron-runner';
import { runWorkerMode } from './worker';

async function main() {
  const config = loadConfig();

  console.log('┌──────────────────────────────────────────┐');
  console.log('│       Prospect Finder                    │');
  console.log('│       My Auto Site Factory               │');
  console.log('├──────────────────────────────────────────┤');
  console.log(`│  Mode:       ${config.mode.toUpperCase().padEnd(28)}│`);
  console.log(`│  Cities:     ${String(config.cities.length).padEnd(28)}│`);
  console.log(`│  Categories: ${(config.categories.length || 'all').toString().padEnd(28)}│`);
  console.log(`│  Max/city:   ${String(config.maxResultsPerCity).padEnd(28)}│`);
  console.log(`│  Websites:   ${(config.analyzeWebsites ? 'yes' : 'no').padEnd(28)}│`);
  if (config.mode === 'cron' && config.cronIntervalMinutes > 0) {
    console.log(`│  Interval:   every ${config.cronIntervalMinutes}min${' '.repeat(Math.max(0, 21 - String(config.cronIntervalMinutes).length))}│`);
  }
  console.log('└──────────────────────────────────────────┘');

  if (config.mode === 'cron') {
    await runCronMode(config);
  } else {
    await runWorkerMode(config);
  }
}

main().catch((error) => {
  console.error('[Fatal] Prospect finder crashed:', error);
  process.exit(1);
});
