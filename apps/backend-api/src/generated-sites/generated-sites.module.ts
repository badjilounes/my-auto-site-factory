import { Module } from '@nestjs/common';
import { GeneratedSitesController } from './generated-sites.controller';
import { GeneratedSitesService } from './generated-sites.service';

@Module({
  controllers: [GeneratedSitesController],
  providers: [GeneratedSitesService],
  exports: [GeneratedSitesService],
})
export class GeneratedSitesModule {}
