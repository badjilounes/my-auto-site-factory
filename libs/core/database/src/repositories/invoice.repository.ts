import { Prisma, Invoice } from '@prisma/client';
import { prisma } from '../prisma';

export const invoiceRepository = {
  async create(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
    return prisma.invoice.create({ data });
  },

  async findById(id: string): Promise<Invoice | null> {
    return prisma.invoice.findUnique({ where: { id } });
  },

  async findAll(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.InvoiceOrderByWithRelationInput;
  }): Promise<Invoice[]> {
    return prisma.invoice.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: params?.orderBy ?? { createdAt: 'desc' },
    });
  },

  async update(
    id: string,
    data: Prisma.InvoiceUpdateInput,
  ): Promise<Invoice> {
    return prisma.invoice.update({ where: { id }, data });
  },

  async delete(id: string): Promise<Invoice> {
    return prisma.invoice.delete({ where: { id } });
  },

  async findByClientAccountId(
    clientAccountId: string,
    params?: { skip?: number; take?: number },
  ): Promise<Invoice[]> {
    return prisma.invoice.findMany({
      where: { clientAccountId },
      skip: params?.skip,
      take: params?.take,
      orderBy: { createdAt: 'desc' },
    });
  },
};
