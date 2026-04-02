import { Prisma, Invoice, InvoiceStatus } from '@prisma/client';
import { prisma } from '../prisma';

export const invoiceRepository = {
  async create(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
    return prisma.invoice.create({ data });
  },

  async findById(id: string): Promise<Invoice | null> {
    return prisma.invoice.findUnique({
      where: { id },
      include: { clientAccount: true },
    });
  },

  async findAll(params?: {
    skip?: number;
    take?: number;
    status?: InvoiceStatus;
    orderBy?: Prisma.InvoiceOrderByWithRelationInput;
  }): Promise<{ data: Invoice[]; total: number }> {
    const where: Prisma.InvoiceWhereInput = {};
    if (params?.status) where.status = params.status;

    const [data, total] = await prisma.$transaction([
      prisma.invoice.findMany({
        where,
        skip: params?.skip,
        take: params?.take,
        orderBy: params?.orderBy ?? { createdAt: 'desc' },
        include: { clientAccount: true },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, data: Prisma.InvoiceUpdateInput): Promise<Invoice> {
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

  async findByStripeInvoiceId(stripeInvoiceId: string): Promise<Invoice | null> {
    return prisma.invoice.findUnique({ where: { stripeInvoiceId } });
  },

  async markAsPaid(id: string): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });
  },

  async findOverdue(): Promise<Invoice[]> {
    return prisma.invoice.findMany({
      where: {
        status: 'SENT',
        dueDate: { lt: new Date() },
      },
      include: { clientAccount: true },
    });
  },
};
