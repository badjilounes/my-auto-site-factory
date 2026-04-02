import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScrapingService } from './scraping.service';

@ApiTags('Scraping')
@Controller('scraping')
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new scraping job' })
  start(
    @Body()
    data: {
      source: string;
      query: string;
      city?: string;
    },
  ) {
    return this.scrapingService.startJob(data);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List all scraping jobs' })
  listJobs() {
    return this.scrapingService.listJobs();
  }
}
