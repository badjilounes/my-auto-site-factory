import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import {
  clientAccountRepository,
  prospectRepository,
} from '@my-auto-site-factory/core-database';

@Injectable()
export class ClientsService {
  async findAll() {
    return clientAccountRepository.findAll();
  }

  async findOne(id: string) {
    const client = await clientAccountRepository.findById(id);
    if (!client) throw new NotFoundException(`Client ${id} not found`);
    return client;
  }

  async findByUserId(userId: string) {
    const client = await clientAccountRepository.findByUserId(userId);
    if (!client) throw new NotFoundException(`No client account for user ${userId}`);
    return client;
  }

  async create(data: { prospectId: string; email: string }) {
    // Check prospect exists
    const prospect = await prospectRepository.findById(data.prospectId);
    if (!prospect) throw new NotFoundException(`Prospect ${data.prospectId} not found`);

    // Prevent duplicate client accounts
    const existing = await clientAccountRepository.findByProspectId(data.prospectId);
    if (existing) throw new ConflictException(`Client account already exists for prospect ${data.prospectId}`);

    const client = await clientAccountRepository.create({
      prospect: { connect: { id: data.prospectId } },
      email: data.email,
      businessName: prospect.businessName,
      ownerName: prospect.ownerName,
      phone: prospect.phone,
    });

    // Update prospect status
    await prospectRepository.updateStatus(data.prospectId, 'CLIENT');

    return client;
  }
}
