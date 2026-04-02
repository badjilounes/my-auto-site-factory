import { Prisma, Prospect, ProspectStatus } from '@prisma/client';
import { prisma } from '../prisma';

export const prospectRepository = {
  async create(data: Prisma.ProspectCreateInput): Promise<Prospect> {
    return prisma.prospect.create({ data });
  },

  async findById(id: string): Promise<Prospect | null> {
    return prisma.prospect.findUnique({ where: { id } });
  },

  async findAll(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.ProspectOrderByWithRelationInput;
  }): Promise<Prospect[]> {
    return prisma.prospect.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: params?.orderBy ?? { createdAt: 'desc' },
    });
  },

  async update(
    id: string,
    data: Prisma.ProspectUpdateInput,
  ): Promise<Prospect> {
    return prisma.prospect.update({ where: { id }, data });
  },

  async delete(id: string): Promise<Prospect> {
    return prisma.prospect.delete({ where: { id } });
  },

  async findByStatus(
    status: ProspectStatus,
    params?: { skip?: number; take?: number },
  ): Promise<Prospect[]> {
    return prisma.prospect.findMany({
      where: { status },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
  },

  async search(query: string, params?: { skip?: number; take?: number }): Promise<Prospect[]> {
    return prisma.prospect.findMany({
      where: {
        OR: [
          { businessName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { cuisine: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
  },

  async updateStatus(id: string, status: ProspectStatus): Promise<Prospect> {
    return prisma.prospect.update({
      where: { id },
      data: { status },
    });
  },

  async count(where?: Prisma.ProspectWhereInput): Promise<number> {
    return prisma.prospect.count({ where });
  },
};
