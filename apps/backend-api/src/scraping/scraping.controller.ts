import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ScrapingJobCreateSchema } from '@my-auto-site-factory/core-types';
import { ScrapingService } from './scraping.service';
import { Roles } from '../auth';
import { ZodValidationPipe } from '../common';

@ApiTags('scraping')
@ApiBearerAuth()
@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Post('start')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Start a new scraping job' })
  start(
    @Body(new ZodValidationPipe(ScrapingJobCreateSchema))
    data: Record<string, unknown>,
  ) {
    return this.scrapingService.startJob(data as any);
  }

  @Get('jobs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all scraping jobs' })
  listJobs(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.scrapingService.listJobs({ status, page, limit });
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get a scraping job by ID' })
  findOne(@Param('id') id: string) {
    return this.scrapingService.findOne(id);
  }
}
