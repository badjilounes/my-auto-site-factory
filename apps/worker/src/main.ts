import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { processScrapingJob } from './processors/scraping.processor';
import { processSiteGenerationJob } from './processors/site-generation.processor';
import { processOutreachJob } from './processors/outreach.processor';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

function createLogger(queueName: string) {
  return {
    onCompleted(job: Job) {
      console.log(
        `[${queueName}] Job ${job.id} completed successfully (${job.name})`,
        { data: job.data, duration: Date.now() - (job.timestamp ?? 0) }
      );
    },
    onFailed(job: Job | undefined, error: Error) {
      console.error(
        `[${queueName}] Job ${job?.id ?? 'unknown'} failed (${job?.name ?? 'unknown'})`,
        { error: error.message, data: job?.data }
      );
    },
    onActive(job: Job) {
      console.log(
        `[${queueName}] Job ${job.id} started (${job.name})`,
        { data: job.data }
      );
    },
  };
}

// ─── Scraping Worker ────────────────────────────────────────────────────────

const scrapingWorker = new Worker(
  'scraping',
  async (job: Job) => {
    return processScrapingJob(job);
  },
  { connection, concurrency: 3 }
);

const scrapingLogger = createLogger('scraping');
scrapingWorker.on('completed', scrapingLogger.onCompleted);
scrapingWorker.on('failed', scrapingLogger.onFailed);
scrapingWorker.on('active', scrapingLogger.onActive);

// ─── Site Generation Worker ─────────────────────────────────────────────────

const siteGenerationWorker = new Worker(
  'site-generation',
  async (job: Job) => {
    return processSiteGenerationJob(job);
  },
  { connection, concurrency: 2 }
);

const siteGenLogger = createLogger('site-generation');
siteGenerationWorker.on('completed', siteGenLogger.onCompleted);
siteGenerationWorker.on('failed', siteGenLogger.onFailed);
siteGenerationWorker.on('active', siteGenLogger.onActive);

// ─── Outreach Worker ────────────────────────────────────────────────────────

const outreachWorker = new Worker(
  'outreach',
  async (job: Job) => {
    return processOutreachJob(job);
  },
  { connection, concurrency: 5 }
);

const outreachLogger = createLogger('outreach');
outreachWorker.on('completed', outreachLogger.onCompleted);
outreachWorker.on('failed', outreachLogger.onFailed);
outreachWorker.on('active', outreachLogger.onActive);

// ─── Graceful Shutdown ──────────────────────────────────────────────────────

async function shutdown() {
  console.log('Shutting down workers...');
  await Promise.all([
    scrapingWorker.close(),
    siteGenerationWorker.close(),
    outreachWorker.close(),
  ]);
  await connection.quit();
  console.log('All workers shut down gracefully.');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('Workers started and listening for jobs on queues: scraping, site-generation, outreach');
