import { Injectable, NotFoundException } from '@nestjs/common';
import { generatedSiteRepository } from '@my-auto-site-factory/core-database';
import type { DeploymentStatus } from '@my-auto-site-factory/core-database';

@Injectable()
export class GeneratedSitesService {
  async findAll(params?: { deploymentStatus?: string; page?: number; limit?: number }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const { data, total } = await generatedSiteRepository.findAll({
      deploymentStatus: params?.deploymentStatus as DeploymentStatus | undefined,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const site = await generatedSiteRepository.findById(id);
    if (!site) throw new NotFoundException(`GeneratedSite ${id} not found`);
    return site;
  }

  async findByProspectId(prospectId: string) {
    const site = await generatedSiteRepository.findByProspectId(prospectId);
    if (!site) throw new NotFoundException(`No site found for prospect ${prospectId}`);
    return site;
  }
}
