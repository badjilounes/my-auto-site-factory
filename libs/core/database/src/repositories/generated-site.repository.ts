import { Prisma, GeneratedSite, DeploymentStatus } from '@prisma/client';
import { prisma } from '../prisma';

export const generatedSiteRepository = {
  async create(data: Prisma.GeneratedSiteCreateInput): Promise<GeneratedSite> {
    return prisma.generatedSite.create({ data });
  },

  async findById(id: string): Promise<GeneratedSite | null> {
    return prisma.generatedSite.findUnique({
      where: { id },
      include: { prospect: true },
    });
  },

  async findAll(params?: {
    skip?: number;
    take?: number;
    deploymentStatus?: DeploymentStatus;
    orderBy?: Prisma.GeneratedSiteOrderByWithRelationInput;
  }): Promise<{ data: GeneratedSite[]; total: number }> {
    const where: Prisma.GeneratedSiteWhereInput = {};
    if (params?.deploymentStatus) {
      where.deploymentStatus = params.deploymentStatus;
    }

    const [data, total] = await prisma.$transaction([
      prisma.generatedSite.findMany({
        where,
        skip: params?.skip,
        take: params?.take,
        orderBy: params?.orderBy ?? { createdAt: 'desc' },
        include: { prospect: true },
      }),
      prisma.generatedSite.count({ where }),
    ]);

    return { data, total };
  },

  async update(id: string, data: Prisma.GeneratedSiteUpdateInput): Promise<GeneratedSite> {
    return prisma.generatedSite.update({ where: { id }, data });
  },

  async delete(id: string): Promise<GeneratedSite> {
    return prisma.generatedSite.delete({ where: { id } });
  },

  async findByProspectId(prospectId: string): Promise<GeneratedSite | null> {
    return prisma.generatedSite.findUnique({
      where: { prospectId },
      include: { prospect: true },
    });
  },

  async findBySubdomain(subdomain: string): Promise<GeneratedSite | null> {
    return prisma.generatedSite.findUnique({ where: { subdomain } });
  },

  async updateDeploymentStatus(
    id: string,
    deploymentStatus: DeploymentStatus,
    deploymentUrl?: string,
  ): Promise<GeneratedSite> {
    return prisma.generatedSite.update({
      where: { id },
      data: {
        deploymentStatus,
        ...(deploymentUrl && { deploymentUrl }),
        ...(deploymentStatus === 'DEPLOYED' && { lastDeployedAt: new Date() }),
      },
    });
  },
};
