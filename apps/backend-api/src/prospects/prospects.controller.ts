import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  ProspectCreateSchema,
  ProspectUpdateSchema,
  ProspectFilterSchema,
} from '@my-auto-site-factory/core-types';
import { ProspectsService } from './prospects.service';
import { Roles } from '../auth';
import { ZodValidationPipe } from '../common';

@ApiTags('prospects')
@ApiBearerAuth()
@Controller('prospects')
export class ProspectsController {
  constructor(private readonly prospectsService: ProspectsService) {}

  @Get()
  @ApiOperation({ summary: 'List prospects with filters and pagination' })
  findAll(
    @Query(new ZodValidationPipe(ProspectFilterSchema))
    filters: Record<string, unknown>,
  ) {
    return this.prospectsService.findAll(filters as any);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a prospect by ID' })
  findOne(@Param('id') id: string) {
    return this.prospectsService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new prospect' })
  create(
    @Body(new ZodValidationPipe(ProspectCreateSchema))
    data: {
      businessName: string;
      ownerName?: string;
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
      city: string;
      cuisineType?: string;
      source?: string;
      sourceUrl?: string;
      notes?: string;
    },
  ) {
    return this.prospectsService.create(data);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a prospect' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ProspectUpdateSchema))
    data: Record<string, unknown>,
  ) {
    return this.prospectsService.update(id, data as any);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a prospect' })
  remove(@Param('id') id: string) {
    return this.prospectsService.remove(id);
  }

  @Post(':id/generate-site')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Trigger site generation for a prospect' })
  generateSite(@Param('id') id: string) {
    return this.prospectsService.triggerSiteGeneration(id);
  }

  @Post(':id/send-outreach')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Trigger outreach email for a prospect' })
  sendOutreach(@Param('id') id: string) {
    return this.prospectsService.triggerOutreach(id);
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update prospect status' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.prospectsService.updateStatus(id, status);
  }
}
