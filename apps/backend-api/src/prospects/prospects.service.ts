import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prospectRepository } from '@my-auto-site-factory/core-database';
import type { ProspectStatus } from '@my-auto-site-factory/core-database';
import type { ProspectCreate, ProspectUpdate, ProspectFilter } from '@my-auto-site-factory/core-types';

@Injectable()
export class ProspectsService {
  constructor(
    @InjectQueue('site-generation') private siteGenerationQueue: Queue,
    @InjectQueue('outreach') private outreachQueue: Queue,
  ) {}

  async findAll(filters: ProspectFilter) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const { data, total } = await prospectRepository.findAll({
      status: filters.status as ProspectStatus | undefined,
      city: filters.city,
      cuisineType: filters.cuisineType,
      search: filters.search,
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
    const prospect = await prospectRepository.findById(id);
    if (!prospect) {
      throw new NotFoundException(`Prospect ${id} not found`);
    }
    return prospect;
  }

  async create(data: ProspectCreate) {
    return prospectRepository.create(data);
  }

  async update(id: string, data: ProspectUpdate) {
    await this.findOne(id);
    return prospectRepository.update(id, data);
  }

  async remove(id: string) {
    await this.findOne(id);
    return prospectRepository.delete(id);
  }

  async triggerSiteGeneration(id: string) {
    const prospect = await this.findOne(id);
    await prospectRepository.updateStatus(id, 'SITE_GENERATING' as ProspectStatus);
    await this.siteGenerationQueue.add(
      'generate',
      { prospectId: id, businessName: prospect.businessName },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
    return { message: `Site generation queued for ${prospect.businessName}` };
  }

  async triggerOutreach(id: string) {
    const prospect = await this.findOne(id);
    await this.outreachQueue.add(
      'send-outreach',
      { prospectId: id, email: prospect.email, businessName: prospect.businessName },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 3000 },
      },
    );
    return { message: `Outreach queued for ${prospect.businessName}` };
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return prospectRepository.updateStatus(id, status as ProspectStatus);
  }
}
