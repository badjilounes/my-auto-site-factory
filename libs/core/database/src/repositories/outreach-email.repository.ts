import { Prisma, OutreachEmail, OutreachEmailStatus } from '@prisma/client';
import { prisma } from '../prisma';

export const outreachEmailRepository = {
  async create(data: Prisma.OutreachEmailCreateInput): Promise<OutreachEmail> {
    return prisma.outreachEmail.create({ data });
  },

  async findById(id: string): Promise<OutreachEmail | null> {
    return prisma.outreachEmail.findUnique({
      where: { id },
      include: { prospect: true },
    });
  },

  async findAll(params?: {
    skip?: number;
    take?: number;
    status?: OutreachEmailStatus;
    orderBy?: Prisma.OutreachEmailOrderByWithRelationInput;
  }): Promise<{ data: OutreachEmail[]; total: number }> {
    const where: Prisma.OutreachEmailWhereInput = {};
    if (params?.status) where.status = params.status;

    const [data, total] = await prisma.$transaction([
      prisma.outreachEmail.findMany({
        where,
        skip: params?.skip,
        take: params?.take,
        orderBy: params?.orderBy ?? { createdAt: 'desc' },
        include: { prospect: true },
      }),
      prisma.outreachEmail.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, data: Prisma.OutreachEmailUpdateInput): Promise<OutreachEmail> {
    return prisma.outreachEmail.update({ where: { id }, data });
  },

  async delete(id: string): Promise<OutreachEmail> {
    return prisma.outreachEmail.delete({ where: { id } });
  },

  async findByProspectId(prospectId: string): Promise<OutreachEmail[]> {
    return prisma.outreachEmail.findMany({
      where: { prospectId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async markSent(id: string, resendEmailId: string): Promise<OutreachEmail> {
    return prisma.outreachEmail.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), resendEmailId },
    });
  },

  async markOpened(id: string): Promise<OutreachEmail> {
    return prisma.outreachEmail.update({
      where: { id },
      data: { status: 'OPENED', openedAt: new Date() },
    });
  },

  async markClicked(id: string): Promise<OutreachEmail> {
    return prisma.outreachEmail.update({
      where: { id },
      data: { status: 'CLICKED', clickedAt: new Date() },
    });
  },

  async findScheduledToSend(): Promise<OutreachEmail[]> {
    return prisma.outreachEmail.findMany({
      where: {
        status: 'QUEUED',
        scheduledAt: { lte: new Date() },
      },
      include: { prospect: true },
    });
  },
};
