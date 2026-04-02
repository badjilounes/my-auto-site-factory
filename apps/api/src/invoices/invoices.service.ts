import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class InvoicesService {
  async findAll() {
    return prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { clientAccount: { include: { prospect: true } } },
    });
  }

  async findOne(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { clientAccount: { include: { prospect: true } } },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }

    return invoice;
  }

  async create(data: {
    clientAccountId: string;
    amount: number;
    currency?: string;
    dueDate?: string;
  }) {
    return prisma.invoice.create({
      data: {
        clientAccountId: data.clientAccountId,
        amount: data.amount,
        currency: data.currency || 'EUR',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
    });
  }

  async send(id: string) {
    const invoice = await this.findOne(id);

    if (invoice.status !== 'DRAFT') {
      throw new Error(`Invoice ${id} is not in DRAFT status`);
    }

    return prisma.invoice.update({
      where: { id },
      data: { status: 'SENT' },
    });
  }
}
