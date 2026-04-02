import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class GeneratedSitesService {
  async findAll() {
    return prisma.generatedSite.findMany({
      orderBy: { createdAt: 'desc' },
      include: { prospect: true },
    });
  }

  async findOne(id: string) {
    const site = await prisma.generatedSite.findUnique({
      where: { id },
      include: { prospect: true },
    });

    if (!site) {
      throw new NotFoundException(`Generated site ${id} not found`);
    }

    return site;
  }

  async findByProspectId(prospectId: string) {
    const site = await prisma.generatedSite.findUnique({
      where: { prospectId },
      include: { prospect: true },
    });

    if (!site) {
      throw new NotFoundException(
        `Generated site for prospect ${prospectId} not found`,
      );
    }

    return site;
  }
}
