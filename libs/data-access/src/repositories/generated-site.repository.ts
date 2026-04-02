import { Prisma, GeneratedSite, DeploymentStatus } from '@prisma/client';
import { prisma } from '../prisma';

export const generatedSiteRepository = {
  async create(data: Prisma.GeneratedSiteCreateInput): Promise<GeneratedSite> {
    return prisma.generatedSite.create({ data });
  },

  async findById(id: string): Promise<GeneratedSite | null> {
    return prisma.generatedSite.findUnique({ where: { id } });
  },

  async findAll(params?: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.GeneratedSiteOrderByWithRelationInput;
  }): Promise<GeneratedSite[]> {
    return prisma.generatedSite.findMany({
      skip: params?.skip,
      take: params?.take,
      orderBy: params?.orderBy ?? { createdAt: 'desc' },
    });
  },

  async update(
    id: string,
    data: Prisma.GeneratedSiteUpdateInput,
  ): Promise<GeneratedSite> {
    return prisma.generatedSite.update({ where: { id }, data });
  },

  async delete(id: string): Promise<GeneratedSite> {
    return prisma.generatedSite.delete({ where: { id } });
  },

  async findByProspectId(prospectId: string): Promise<GeneratedSite | null> {
    return prisma.generatedSite.findUnique({ where: { prospectId } });
  },

  async updateDeploymentStatus(
    id: string,
    deploymentStatus: DeploymentStatus,
  ): Promise<GeneratedSite> {
    return prisma.generatedSite.update({
      where: { id },
      data: { deploymentStatus },
    });
  },
};
