import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProspectsService } from './prospects.service';

@ApiTags('Prospects')
@Controller('prospects')
export class ProspectsController {
  constructor(private readonly prospectsService: ProspectsService) {}

  @Get()
  @ApiOperation({ summary: 'List prospects with filters and pagination' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('status') status?: string,
    @Query('city') city?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.prospectsService.findAll({ status, city, search, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a prospect by ID' })
  findOne(@Param('id') id: string) {
    return this.prospectsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new prospect' })
  create(@Body() data: Record<string, any>) {
    return this.prospectsService.create(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a prospect' })
  update(@Param('id') id: string, @Body() data: Record<string, any>) {
    return this.prospectsService.update(id, data);
  }

  @Post(':id/generate-site')
  @ApiOperation({ summary: 'Trigger site generation for a prospect' })
  generateSite(@Param('id') id: string) {
    return this.prospectsService.triggerSiteGeneration(id);
  }

  @Post(':id/send-outreach')
  @ApiOperation({ summary: 'Trigger outreach email for a prospect' })
  sendOutreach(@Param('id') id: string) {
    return this.prospectsService.triggerOutreach(id);
  }
}
