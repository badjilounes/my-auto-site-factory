/**
 * BullMQ worker mode: listens on the 'scraping' queue for jobs
 * dispatched by the backend-api (POST /scraping/start).
 *
 * Job data shape (from ScrapingService):
 *   { source, city, cuisineType?, jobId }
 *
 * This is the default mode when PROSPECT_FINDER_MODE is not set.
 */

import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import {
  findAndReconcileProspects,
  scrapeUberEats,
  scrapeDeliveroo,
  type ScrapingOptions,
} from '@my-auto-site-factory/integrations-scrapers';
import { scrapingJobRepository } from '@my-auto-site-factory/core-database';
import { syncProspectsToDb } from './prospect-sync';
import type { ProspectFinderConfig } from './config';

interface ScrapingJobData {
  source: 'UBEREATS' | 'DELIVEROO' | 'GOOGLE' | 'WEBSITE';
  city: string;
  cuisineType?: string;
  jobId: string;
  maxResults?: number;
}

export async function runWorkerMode(config: ProspectFinderConfig): Promise<void> {
  const connection = new IORedis(config.redisUrl, {
    maxRetriesPerRequest: null,
  });

  const worker = new Worker<ScrapingJobData>(
    'scraping',
    async (job: Job<ScrapingJobData>) => {
      const { source, city, cuisineType, jobId, maxResults } = job.data;
      const label = `${source} / ${city}${cuisineType ? ` / ${cuisineType}` : ''}`;

      console.log(`[Worker] Processing job ${job.id}: ${label}`);

      // Mark job as running
      await scrapingJobRepository.markRunning(jobId);

      const scrapingOptions: ScrapingOptions = {
        maxResults: maxResults ?? config.maxResultsPerCity,
        delayMs: 2000,
        analyzeWebsites: config.analyzeWebsites,
        proxyUrl: config.proxyUrl,
        timeoutMs: 60000,
      };

      try {
        let prospects;

        if (source === 'UBEREATS' || source === 'DELIVEROO') {
          // Single source: still use findAndReconcileProspects for consistency
          // (it handles partial failures gracefully)
          prospects = await findAndReconcileProspects(city, cuisineType, scrapingOptions);
        } else {
          // For GOOGLE/WEBSITE sources, use the full pipeline
          prospects = await findAndReconcileProspects(city, cuisineType, scrapingOptions);
        }

        console.log(`[Worker] ${label}: ${prospects.length} prospects found, syncing...`);

        // Sync to database
        const stats = await syncProspectsToDb(prospects, jobId);

        console.log(
          `[Worker] ${label}: ${stats.created} created, ${stats.updated} updated, ${stats.skipped} skipped`,
        );

        // Update job progress
        await job.updateProgress({
          found: prospects.length,
          created: stats.created,
          updated: stats.updated,
        });

        return {
          success: true,
          prospectCount: prospects.length,
          ...stats,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[Worker] ${label} FAILED: ${msg}`);
        await scrapingJobRepository.markFailed(jobId, msg);
        throw error; // Re-throw so BullMQ can retry
      }
    },
    {
      connection,
      concurrency: 2, // Max 2 scraping jobs in parallel (Playwright is heavy)
      limiter: {
        max: 5,
        duration: 60000, // Max 5 jobs per minute
      },
    },
  );

  worker.on('completed', (job, result) => {
    console.log(`[Worker] Job ${job.id} completed:`, result);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed after ${job?.attemptsMade} attempts:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err.message);
  });

  console.log('[Worker] Prospect finder worker started, listening on queue "scraping"...');
  console.log(`[Worker] Concurrency: 2, Rate limit: 5 jobs/min`);

  // Keep process alive
  await new Promise(() => {});
}
