import { Prisma, ClientAccount } from '@prisma/client';
import { prisma } from '../prisma';

export const clientAccountRepository = {
  async create(data: Prisma.ClientAccountCreateInput): Promise<ClientAccount> {
    return prisma.clientAccount.create({ data });
  },

  async findById(id: string): Promise<ClientAccount | null> {
    return prisma.clientAccount.findUnique({ where: { id } });
  },

  async findAll(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.ClientAccountOrderByWithRelationInput;
  }): Promise<ClientAccount[]> {
    return prisma.clientAccount.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: params?.orderBy ?? { createdAt: 'desc' },
    });
  },

  async update(
    id: string,
    data: Prisma.ClientAccountUpdateInput,
  ): Promise<ClientAccount> {
    return prisma.clientAccount.update({ where: { id }, data });
  },

  async delete(id: string): Promise<ClientAccount> {
    return prisma.clientAccount.delete({ where: { id } });
  },

  async findByClerkUserId(clerkUserId: string): Promise<ClientAccount | null> {
    return prisma.clientAccount.findUnique({ where: { clerkUserId } });
  },

  async findByProspectId(prospectId: string): Promise<ClientAccount | null> {
    return prisma.clientAccount.findUnique({ where: { prospectId } });
  },
};
