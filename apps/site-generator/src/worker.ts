/**
 * BullMQ workers for the site-generator application.
 *
 * Two queues:
 * 1. 'site-generation': Claude → GitHub → Vercel pipeline
 * 2. 'outreach': Stripe + email pipeline
 *
 * Jobs are dispatched by the backend-api via:
 * - POST /prospects/:id/generate-site
 * - POST /prospects/:id/send-outreach
 */

import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { runSiteGenerationPipeline } from './pipeline';
import { runOutreachPipeline } from './outreach';

interface SiteGenerationJobData {
  prospectId: string;
  businessName?: string;
}

interface OutreachJobData {
  prospectId: string;
  email?: string;
  businessName?: string;
}

export function startWorkers(redisUrl: string) {
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

  // ── Site Generation Worker ────────────────────────────────────────────

  const siteWorker = new Worker<SiteGenerationJobData>(
    'site-generation',
    async (job: Job<SiteGenerationJobData>) => {
      const { prospectId } = job.data;
      console.log(`\n[Worker] ── Site Generation Job ${job.id} ──`);

      const result = await runSiteGenerationPipeline(prospectId, (progress) => {
        job.updateProgress({ ...progress }).catch(() => {});
      });

      return result;
    },
    {
      connection,
      concurrency: 1, // One generation at a time (Claude API + heavy I/O)
      limiter: {
        max: 3,
        duration: 60_000, // Max 3 generations per minute
      },
    },
  );

  siteWorker.on('completed', (job, result) => {
    const r = result as Record<string, unknown>;
    console.log(
      `[Worker] Site generation ${job.id} completed: ${r['deploymentUrl']} (${Math.round((r['durationMs'] as number) / 1000)}s)`,
    );
  });

  siteWorker.on('failed', (job, err) => {
    console.error(
      `[Worker] Site generation ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts ?? '?'}):`,
      err.message,
    );
  });

  // ── Outreach Worker ───────────────────────────────────────────────────

  const outreachWorker = new Worker<OutreachJobData>(
    'outreach',
    async (job: Job<OutreachJobData>) => {
      const { prospectId } = job.data;
      console.log(`\n[Worker] ── Outreach Job ${job.id} ──`);

      const result = await runOutreachPipeline(prospectId);

      return result;
    },
    {
      connection,
      concurrency: 3, // Emails are lightweight, can parallelize
      limiter: {
        max: 10,
        duration: 60_000, // Max 10 emails per minute (Resend rate limit)
      },
    },
  );

  outreachWorker.on('completed', (job, result) => {
    const r = result as Record<string, unknown>;
    console.log(`[Worker] Outreach ${job.id} completed: email sent to ${r['businessName']}`);
  });

  outreachWorker.on('failed', (job, err) => {
    console.error(
      `[Worker] Outreach ${job?.id} failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts ?? '?'}):`,
      err.message,
    );
  });

  // ── Error handling ────────────────────────────────────────────────────

  for (const worker of [siteWorker, outreachWorker]) {
    worker.on('error', (err) => {
      console.error(`[Worker] Error:`, err.message);
    });
  }

  console.log('[Worker] Site generation worker started (concurrency: 1, limit: 3/min)');
  console.log('[Worker] Outreach worker started (concurrency: 3, limit: 10/min)');

  return { siteWorker, outreachWorker, connection };
}
