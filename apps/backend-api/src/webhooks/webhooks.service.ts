import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  async handleStripeWebhook(payload: Record<string, any>, signature: string) {
    const eventType = payload.type;
    this.logger.log(`Received Stripe webhook: ${eventType}`);

    switch (eventType) {
      case 'invoice.paid': {
        const stripeInvoiceId = payload.data?.object?.id;
        if (stripeInvoiceId) {
          await prisma.invoice.updateMany({
            where: { stripeInvoiceId },
            data: { status: 'PAID', paidAt: new Date() },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        this.logger.log('Subscription updated event received');
        break;
      }

      case 'customer.subscription.deleted': {
        this.logger.log('Subscription deleted event received');
        break;
      }

      default:
        this.logger.warn(`Unhandled Stripe event type: ${eventType}`);
    }

    return { received: true };
  }

  async handleVercelWebhook(payload: Record<string, any>) {
    const deploymentUrl = payload.url;
    const projectId = payload.projectId;
    const state = payload.state;

    this.logger.log(
      `Received Vercel webhook: project=${projectId}, state=${state}`,
    );

    if (projectId && state === 'READY') {
      await prisma.generatedSite.updateMany({
        where: { vercelProjectId: projectId },
        data: {
          deploymentStatus: 'DEPLOYED',
          vercelUrl: deploymentUrl ? `https://${deploymentUrl}` : undefined,
        },
      });

      const site = await prisma.generatedSite.findFirst({
        where: { vercelProjectId: projectId },
      });

      if (site) {
        await prisma.prospect.update({
          where: { id: site.prospectId },
          data: { status: 'SITE_DEPLOYED' },
        });
      }
    }

    if (projectId && state === 'ERROR') {
      await prisma.generatedSite.updateMany({
        where: { vercelProjectId: projectId },
        data: { deploymentStatus: 'FAILED' },
      });
    }

    return { received: true };
  }
}
