import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'site-generation' }),
    BullModule.registerQueue({ name: 'outreach' }),
  ],
  controllers: [ProspectsController],
  providers: [ProspectsService],
  exports: [ProspectsService],
})
export class ProspectsModule {}
