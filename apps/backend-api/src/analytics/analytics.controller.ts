import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  @Get('dashboard')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Statistiques du dashboard (admin)' })
  getDashboardStats() {
    return this.service.getDashboardStats();
  }
}
