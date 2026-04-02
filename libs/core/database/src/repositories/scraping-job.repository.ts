import { Prisma, ScrapingJob, ScrapingJobStatus } from '@prisma/client';
import { prisma } from '../prisma';

export const scrapingJobRepository = {
  async create(data: Prisma.ScrapingJobCreateInput): Promise<ScrapingJob> {
    return prisma.scrapingJob.create({ data });
  },

  async findById(id: string): Promise<ScrapingJob | null> {
    return prisma.scrapingJob.findUnique({
      where: { id },
      include: { results: { take: 20 } },
    });
  },

  async findAll(params?: {
    skip?: number;
    take?: number;
    status?: ScrapingJobStatus;
    orderBy?: Prisma.ScrapingJobOrderByWithRelationInput;
  }): Promise<{ data: ScrapingJob[]; total: number }> {
    const where: Prisma.ScrapingJobWhereInput = {};
    if (params?.status) where.status = params.status;

    const [data, total] = await prisma.$transaction([
      prisma.scrapingJob.findMany({
        where,
        skip: params?.skip,
        take: params?.take,
        orderBy: params?.orderBy ?? { createdAt: 'desc' },
      }),
      prisma.scrapingJob.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, data: Prisma.ScrapingJobUpdateInput): Promise<ScrapingJob> {
    return prisma.scrapingJob.update({ where: { id }, data });
  },

  async delete(id: string): Promise<ScrapingJob> {
    return prisma.scrapingJob.delete({ where: { id } });
  },

  async markRunning(id: string): Promise<ScrapingJob> {
    return prisma.scrapingJob.update({
      where: { id },
      data: { status: 'RUNNING', startedAt: new Date() },
    });
  },

  async markCompleted(id: string, resultsCount: number): Promise<ScrapingJob> {
    return prisma.scrapingJob.update({
      where: { id },
      data: { status: 'COMPLETED', resultsCount, completedAt: new Date() },
    });
  },

  async markFailed(id: string, errorMessage: string): Promise<ScrapingJob> {
    return prisma.scrapingJob.update({
      where: { id },
      data: { status: 'FAILED', errorMessage, completedAt: new Date() },
    });
  },
};
