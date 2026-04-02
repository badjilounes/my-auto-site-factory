import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ProspectsService {
  constructor(
    @InjectQueue('site-generation') private siteGenerationQueue: Queue,
    @InjectQueue('outreach') private outreachQueue: Queue,
  ) {}

  async findAll(filters: {
    status?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ProspectWhereInput = {};

    if (filters.status) {
      where.status = filters.status as any;
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.prospect.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { generatedSite: true },
      }),
      prisma.prospect.count({ where }),
    ]);

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
    const prospect = await prisma.prospect.findUnique({
      where: { id },
      include: {
        generatedSite: true,
        clientAccount: true,
        outreachEmails: true,
      },
    });

    if (!prospect) {
      throw new NotFoundException(`Prospect ${id} not found`);
    }

    return prospect;
  }

  async create(data: Record<string, any>) {
    return prisma.prospect.create({ data: data as any });
  }

  async update(id: string, data: Record<string, any>) {
    await this.findOne(id);
    return prisma.prospect.update({
      where: { id },
      data: data as any,
    });
  }

  async triggerSiteGeneration(id: string) {
    const prospect = await this.findOne(id);

    await prisma.prospect.update({
      where: { id },
      data: { status: 'SITE_GENERATING' },
    });

    const job = await this.siteGenerationQueue.add('generate', {
      prospectId: id,
      businessName: prospect.businessName,
    });

    return { message: 'Site generation job queued', jobId: job.id };
  }

  async triggerOutreach(id: string) {
    const prospect = await this.findOne(id);

    const job = await this.outreachQueue.add('send-outreach', {
      prospectId: id,
      email: prospect.email,
      businessName: prospect.businessName,
    });

    return { message: 'Outreach job queued', jobId: job.id };
  }
}
