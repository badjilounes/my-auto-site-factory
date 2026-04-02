import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ClientsService {
  async findAll() {
    return prisma.clientAccount.findMany({
      orderBy: { createdAt: 'desc' },
      include: { prospect: true, invoices: true },
    });
  }

  async findOne(id: string) {
    const client = await prisma.clientAccount.findUnique({
      where: { id },
      include: { prospect: true, invoices: true },
    });

    if (!client) {
      throw new NotFoundException(`Client account ${id} not found`);
    }

    return client;
  }

  async create(data: { prospectId: string; email: string }) {
    const existing = await prisma.clientAccount.findUnique({
      where: { prospectId: data.prospectId },
    });

    if (existing) {
      throw new ConflictException(
        `Client account already exists for prospect ${data.prospectId}`,
      );
    }

    const client = await prisma.clientAccount.create({
      data: {
        prospectId: data.prospectId,
        email: data.email,
      },
    });

    await prisma.prospect.update({
      where: { id: data.prospectId },
      data: { status: 'CLIENT' },
    });

    return client;
  }
}
