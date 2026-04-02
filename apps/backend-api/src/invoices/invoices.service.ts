import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { invoiceRepository } from '@my-auto-site-factory/core-database';
import type { InvoiceStatus } from '@my-auto-site-factory/core-database';
import type { InvoiceCreate } from '@my-auto-site-factory/core-types';

@Injectable()
export class InvoicesService {
  async findAll(params?: { status?: string; page?: number; limit?: number }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const { data, total } = await invoiceRepository.findAll({
      status: params?.status as InvoiceStatus | undefined,
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  async findByClientAccountId(clientAccountId: string) {
    return invoiceRepository.findByClientAccountId(clientAccountId);
  }

  async create(data: InvoiceCreate) {
    return invoiceRepository.create({
      clientAccount: { connect: { id: data.clientAccountId } },
      amount: data.amount,
      currency: data.currency ?? 'EUR',
      description: data.description,
      dueDate: data.dueDate,
      stripeInvoiceId: data.stripeInvoiceId,
    });
  }

  async send(id: string) {
    const invoice = await this.findOne(id);
    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException(
        `Invoice ${id} is not in DRAFT status (current: ${invoice.status})`,
      );
    }
    return invoiceRepository.update(id, { status: 'SENT' });
  }

  async markAsPaid(id: string) {
    await this.findOne(id);
    return invoiceRepository.markAsPaid(id);
  }
}
