import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { scrapingJobRepository } from '@my-auto-site-factory/core-database';
import type { ScrapingJobCreate } from '@my-auto-site-factory/core-types';

@Injectable()
export class ScrapingService {
  constructor(@InjectQueue('scraping') private scrapingQueue: Queue) {}

  async startJob(data: ScrapingJobCreate) {
    const scrapingJob = await scrapingJobRepository.create({
      source: data.source,
      city: data.city,
      cuisineType: data.cuisineType ?? null,
      maxResults: data.maxResults ?? 100,
    });

    const job = await this.scrapingQueue.add(
      'scrape',
      {
        jobId: scrapingJob.id,
        source: data.source,
        city: data.city,
        cuisineType: data.cuisineType,
        maxResults: data.maxResults ?? 100,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    return {
      message: 'Scraping job queued',
      scrapingJobId: scrapingJob.id,
      bullJobId: job.id,
    };
  }

  async listJobs(params?: { status?: string; page?: number; limit?: number }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const { data, total } = await scrapingJobRepository.findAll({
      status: params?.status as any,
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const job = await scrapingJobRepository.findById(id);
    if (!job) {
      throw new NotFoundException(`Scraping job ${id} not found`);
    }
    return job;
  }
}
