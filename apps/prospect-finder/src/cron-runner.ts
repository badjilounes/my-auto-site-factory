/**
 * Standalone cron mode: iterates through all configured cities/categories
 * and runs the full scraping + reconciliation + DB sync pipeline.
 *
 * Usage:
 *   PROSPECT_FINDER_MODE=cron nx serve prospect-finder
 *
 * With interval (run every 60 minutes):
 *   PROSPECT_FINDER_MODE=cron CRON_INTERVAL_MINUTES=60 nx serve prospect-finder
 */

import {
  findAndReconcileProspects,
  type ScrapingOptions,
} from '@my-auto-site-factory/integrations-scrapers';
import { scrapingJobRepository } from '@my-auto-site-factory/core-database';
import { syncProspectsToDb, type SyncStats } from './prospect-sync';
import type { ProspectFinderConfig } from './config';

export async function runCronMode(config: ProspectFinderConfig): Promise<void> {
  console.log('[Cron] Starting prospect finder in cron mode');
  console.log(`[Cron] Cities: ${config.cities.join(', ')}`);
  console.log(`[Cron] Categories: ${config.categories.length > 0 ? config.categories.join(', ') : '(all)'}`);

  const runOnce = async () => {
    const startTime = Date.now();
    const allStats: { city: string; category: string; stats: SyncStats }[] = [];

    // For each city × category combination
    const categories = config.categories.length > 0 ? config.categories : [undefined];

    for (const city of config.cities) {
      for (const category of categories) {
        const label = `${city}${category ? ` / ${category}` : ''}`;
        console.log(`\n[Cron] ── Scraping ${label} ──`);

        // Create a scraping job record in DB for tracking
        const job = await scrapingJobRepository.create({
          source: 'UBEREATS', // Primary source — the scraper hits both UE + Deliveroo
          city,
          cuisineType: category ?? null,
          maxResults: config.maxResultsPerCity,
        });

        await scrapingJobRepository.markRunning(job.id);

        try {
          const scrapingOptions: ScrapingOptions = {
            maxResults: config.maxResultsPerCity,
            delayMs: 2000,
            analyzeWebsites: config.analyzeWebsites,
            proxyUrl: config.proxyUrl,
            timeoutMs: 60000,
          };

          // Run the full pipeline: scrape UberEats + Deliveroo → reconcile → deduplicate
          const prospects = await findAndReconcileProspects(city, category, scrapingOptions);

          console.log(`[Cron] ${label}: ${prospects.length} prospects found, syncing to DB...`);

          // Sync to database
          const stats = await syncProspectsToDb(prospects, job.id);

          console.log(
            `[Cron] ${label}: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped (${stats.durationMs}ms)`,
          );

          allStats.push({ city, category: category ?? 'all', stats });
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error(`[Cron] ${label} FAILED: ${msg}`);
          await scrapingJobRepository.markFailed(job.id, msg);
        }

        // Rate limit between cities
        if (config.delayBetweenCities > 0) {
          console.log(`[Cron] Waiting ${config.delayBetweenCities / 1000}s before next city...`);
          await sleep(config.delayBetweenCities);
        }
      }
    }

    // Summary
    const totalDuration = Date.now() - startTime;
    const totalCreated = allStats.reduce((sum, s) => sum + s.stats.created, 0);
    const totalUpdated = allStats.reduce((sum, s) => sum + s.stats.updated, 0);
    const totalProspects = allStats.reduce((sum, s) => sum + s.stats.total, 0);

    console.log('\n[Cron] ══════════════════════════════════════');
    console.log(`[Cron] Run complete in ${Math.round(totalDuration / 1000)}s`);
    console.log(`[Cron] ${totalProspects} prospects found across ${config.cities.length} cities`);
    console.log(`[Cron] ${totalCreated} created, ${totalUpdated} updated`);
    console.log('[Cron] ══════════════════════════════════════\n');
  };

  // Run once immediately
  await runOnce();

  // If interval is set, schedule recurring runs
  if (config.cronIntervalMinutes > 0) {
    const intervalMs = config.cronIntervalMinutes * 60 * 1000;
    console.log(`[Cron] Scheduling next run in ${config.cronIntervalMinutes} minutes...`);

    const tick = async () => {
      console.log(`\n[Cron] ── Scheduled run at ${new Date().toISOString()} ──`);
      await runOnce();
      console.log(`[Cron] Next run in ${config.cronIntervalMinutes} minutes...`);
      setTimeout(tick, intervalMs);
    };

    setTimeout(tick, intervalMs);

    // Keep process alive
    await new Promise(() => {});
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
