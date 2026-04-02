import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GeneratedSitesService } from './generated-sites.service';

@ApiTags('Generated Sites')
@Controller('generated-sites')
export class GeneratedSitesController {
  constructor(private readonly generatedSitesService: GeneratedSitesService) {}

  @Get()
  @ApiOperation({ summary: 'List all generated sites' })
  findAll() {
    return this.generatedSitesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a generated site by ID' })
  findOne(@Param('id') id: string) {
    return this.generatedSitesService.findOne(id);
  }

  @Get('prospect/:prospectId')
  @ApiOperation({ summary: 'Get generated site by prospect ID' })
  findByProspect(@Param('prospectId') prospectId: string) {
    return this.generatedSitesService.findByProspectId(prospectId);
  }
}
