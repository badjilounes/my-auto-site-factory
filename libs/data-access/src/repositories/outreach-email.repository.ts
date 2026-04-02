import { Prisma, OutreachEmail } from '@prisma/client';
import { prisma } from '../prisma';

export const outreachEmailRepository = {
  async create(data: Prisma.OutreachEmailCreateInput): Promise<OutreachEmail> {
    return prisma.outreachEmail.create({ data });
  },

  async findById(id: string): Promise<OutreachEmail | null> {
    return prisma.outreachEmail.findUnique({ where: { id } });
  },

  async findAll(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.OutreachEmailOrderByWithRelationInput;
  }): Promise<OutreachEmail[]> {
    return prisma.outreachEmail.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: params?.orderBy ?? { createdAt: 'desc' },
    });
  },

  async update(
    id: string,
    data: Prisma.OutreachEmailUpdateInput,
  ): Promise<OutreachEmail> {
    return prisma.outreachEmail.update({ where: { id }, data });
  },

  async delete(id: string): Promise<OutreachEmail> {
    return prisma.outreachEmail.delete({ where: { id } });
  },
};
