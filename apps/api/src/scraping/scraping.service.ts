import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ScrapingService {
  constructor(@InjectQueue('scraping') private scrapingQueue: Queue) {}

  async startJob(data: { source: string; query: string; city?: string }) {
    const scrapingJob = await prisma.scrapingJob.create({
      data: {
        source: data.source as any,
        query: data.query,
        city: data.city,
      },
    });

    const job = await this.scrapingQueue.add('scrape', {
      jobId: scrapingJob.id,
      source: data.source,
      query: data.query,
      city: data.city,
    });

    return {
      message: 'Scraping job queued',
      scrapingJobId: scrapingJob.id,
      bullJobId: job.id,
    };
  }

  async listJobs() {
    return prisma.scrapingJob.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
