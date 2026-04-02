import { Prisma, ScrapingJob } from '@prisma/client';
import { prisma } from '../prisma';

export const scrapingJobRepository = {
  async create(data: Prisma.ScrapingJobCreateInput): Promise<ScrapingJob> {
    return prisma.scrapingJob.create({ data });
  },

  async findById(id: string): Promise<ScrapingJob | null> {
    return prisma.scrapingJob.findUnique({ where: { id } });
  },

  async findAll(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.ScrapingJobOrderByWithRelationInput;
  }): Promise<ScrapingJob[]> {
    return prisma.scrapingJob.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: params?.orderBy ?? { createdAt: 'desc' },
    });
  },

  async update(
    id: string,
    data: Prisma.ScrapingJobUpdateInput,
  ): Promise<ScrapingJob> {
    return prisma.scrapingJob.update({ where: { id }, data });
  },

  async delete(id: string): Promise<ScrapingJob> {
    return prisma.scrapingJob.delete({ where: { id } });
  },
};
