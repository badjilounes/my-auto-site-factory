import { Prisma, Prospect, ProspectStatus } from '@prisma/client';
import { prisma } from '../prisma';

export const prospectRepository = {
  async create(data: Prisma.ProspectCreateInput): Promise<Prospect> {
    return prisma.prospect.create({ data });
  },

  async findById(id: string): Promise<Prospect | null> {
    return prisma.prospect.findUnique({
      where: { id },
      include: {
        generatedSite: true,
        clientAccount: true,
        outreachEmails: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  },

  async findAll(params?: {
    skip?: number;
    take?: number;
    status?: ProspectStatus;
    city?: string;
    cuisineType?: string;
    search?: string;
    orderBy?: Prisma.ProspectOrderByWithRelationInput;
  }): Promise<{ data: Prospect[]; total: number }> {
    const where: Prisma.ProspectWhereInput = {};

    if (params?.status) {
      where.status = params.status;
    }
    if (params?.city) {
      where.city = { contains: params.city, mode: 'insensitive' };
    }
    if (params?.cuisineType) {
      where.cuisineType = { contains: params.cuisineType, mode: 'insensitive' };
    }
    if (params?.search) {
      where.OR = [
        { businessName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
        { cuisineType: { contains: params.search, mode: 'insensitive' } },
        { ownerName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await prisma.$transaction([
      prisma.prospect.findMany({
        where,
        skip: params?.skip,
        take: params?.take,
        orderBy: params?.orderBy ?? { createdAt: 'desc' },
        include: { generatedSite: true },
      }),
      prisma.prospect.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, data: Prisma.ProspectUpdateInput): Promise<Prospect> {
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

  async updateStatus(id: string, status: ProspectStatus): Promise<Prospect> {
    return prisma.prospect.update({
      where: { id },
      data: { status },
    });
  },

  async count(where?: Prisma.ProspectWhereInput): Promise<number> {
    return prisma.prospect.count({ where });
  },

  async countByStatus(): Promise<Record<string, number>> {
    const results = await prisma.prospect.groupBy({
      by: ['status'],
      _count: true,
    });
    return Object.fromEntries(results.map((r) => [r.status, r._count]));
  },
};
