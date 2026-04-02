import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GeneratedSitesService } from './generated-sites.service';

@ApiTags('generated-sites')
@ApiBearerAuth()
@Controller('generated-sites')
export class GeneratedSitesController {
  constructor(private readonly service: GeneratedSitesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les sites générés' })
  findAll(
    @Query('deploymentStatus') deploymentStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      deploymentStatus,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un site généré' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get('prospect/:prospectId')
  @ApiOperation({ summary: 'Site généré par prospect ID' })
  findByProspectId(@Param('prospectId') prospectId: string) {
    return this.service.findByProspectId(prospectId);
  }
}
