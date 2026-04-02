import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

interface ScrapingJobData {
  source: 'UBEREATS' | 'DELIVEROO' | 'GOOGLE' | 'WEBSITE';
  city: string;
  cuisine?: string;
  jobId: string;
}

const worker = new Worker<ScrapingJobData>(
  'scraping',
  async (job) => {
    const { source, city, cuisine, jobId } = job.data;
    console.log(`[Prospect Finder] Starting ${source} scrape for ${city}${cuisine ? ` - ${cuisine}` : ''}`);

    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    try {
      let results: any[] = [];

      // Import scrapers dynamically to avoid loading playwright at startup
      if (source === 'UBEREATS') {
        const { scrapeUberEats } = await import('@my-auto-site-factory/integrations-scrapers');
        results = await scrapeUberEats(city, cuisine);
      } else if (source === 'DELIVEROO') {
        const { scrapeDeliveroo } = await import('@my-auto-site-factory/integrations-scrapers');
        results = await scrapeDeliveroo(city, cuisine);
      }

      // Reconcile and save prospects
      for (const result of results) {
        const existing = await prisma.prospect.findFirst({
          where: {
            businessName: { contains: result.name, mode: 'insensitive' },
            city: { equals: city, mode: 'insensitive' },
          },
        });

        if (existing) {
          await prisma.prospect.update({
            where: { id: existing.id },
            data: {
              rating: result.rating || existing.rating,
              priceRange: result.priceRange || existing.priceRange,
              ...(source === 'UBEREATS' ? { uberEatsUrl: result.url } : {}),
              ...(source === 'DELIVEROO' ? { deliverooUrl: result.url } : {}),
              status: 'ENRICHED',
            },
          });
        } else {
          await prisma.prospect.create({
            data: {
              businessName: result.name,
              address: result.address || '',
              city,
              cuisine: result.cuisine || cuisine || '',
              rating: result.rating,
              priceRange: result.priceRange,
              ...(source === 'UBEREATS' ? { uberEatsUrl: result.url } : {}),
              ...(source === 'DELIVEROO' ? { deliverooUrl: result.url } : {}),
              logoUrl: result.imageUrl,
              status: 'NEW',
            },
          });
        }
      }

      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          resultCount: results.length,
          completedAt: new Date(),
        },
      });

      console.log(`[Prospect Finder] Completed: ${results.length} results for ${city}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', error: errorMessage, completedAt: new Date() },
      });
      throw error;
    }
  },
  { connection, concurrency: 2 }
);

worker.on('completed', (job) => {
  console.log(`[Prospect Finder] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Prospect Finder] Job ${job?.id} failed:`, err.message);
});

console.log('[Prospect Finder] Worker started, waiting for scraping jobs...');
