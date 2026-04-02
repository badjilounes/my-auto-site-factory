import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProspectsModule } from './prospects/prospects.module';
import { GeneratedSitesModule } from './generated-sites/generated-sites.module';
import { ClientsModule } from './clients/clients.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ScrapingModule } from './scraping/scraping.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
      },
    }),
    ProspectsModule,
    GeneratedSitesModule,
    ClientsModule,
    InvoicesModule,
    ScrapingModule,
    WebhooksModule,
  ],
})
export class AppModule {}
