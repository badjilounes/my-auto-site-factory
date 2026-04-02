import { Prisma, ScrapingResult } from '@prisma/client';
import { prisma } from '../prisma';

export const scrapingResultRepository = {
  async createMany(data: Prisma.ScrapingResultCreateManyInput[]): Promise<number> {
    const result = await prisma.scrapingResult.createMany({ data });
    return result.count;
  },

  async create(data: Prisma.ScrapingResultCreateInput): Promise<ScrapingResult> {
    return prisma.scrapingResult.create({ data });
  },

  async findById(id: string): Promise<ScrapingResult | null> {
    return prisma.scrapingResult.findUnique({ where: { id } });
  },

  async findByJobId(
    scrapingJobId: string,
    params?: { skip?: number; take?: number },
  ): Promise<ScrapingResult[]> {
    return prisma.scrapingResult.findMany({
      where: { scrapingJobId },
      skip: params?.skip,
      take: params?.take,
      orderBy: { scrapedAt: 'desc' },
    });
  },

  async findUnlinked(): Promise<ScrapingResult[]> {
    return prisma.scrapingResult.findMany({
      where: { prospectId: null },
      orderBy: { scrapedAt: 'desc' },
    });
  },

  async linkToProspect(id: string, prospectId: string): Promise<ScrapingResult> {
    return prisma.scrapingResult.update({
      where: { id },
      data: { prospectId },
    });
  },

  async delete(id: string): Promise<ScrapingResult> {
    return prisma.scrapingResult.delete({ where: { id } });
  },
};
