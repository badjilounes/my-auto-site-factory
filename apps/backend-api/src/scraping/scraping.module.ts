import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'scraping' })],
  controllers: [ScrapingController],
  providers: [ScrapingService],
  exports: [ScrapingService],
})
export class ScrapingModule {}
