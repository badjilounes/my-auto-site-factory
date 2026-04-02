import { Injectable, Logger } from '@nestjs/common';
import {
  invoiceRepository,
  clientAccountRepository,
  generatedSiteRepository,
  prospectRepository,
  outreachEmailRepository,
  prisma,
} from '@my-auto-site-factory/core-database';
import { handleStripeWebhook } from '@my-auto-site-factory/services-payments';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  // ── Stripe ───────────────────────────────────────────────────────────────

  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const secret = process.env['STRIPE_WEBHOOK_SECRET'];
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');

    // Verify signature using the payments lib
    const event = handleStripeWebhook(rawBody, signature, secret);

    this.logger.log(`Stripe event: ${event.type} (${event.id})`);

    switch (event.type) {
      case 'invoice.paid': {
        const stripeInvoice = event.data.object as { id: string };
        const invoice = await invoiceRepository.findByStripeInvoiceId(stripeInvoice.id);
        if (invoice) {
          await invoiceRepository.markAsPaid(invoice.id);
          this.logger.log(`Invoice ${invoice.id} marked as paid`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as {
          id: string;
          customer: string;
          status: string;
          current_period_end: number;
        };
        const client = await clientAccountRepository.findByStripeCustomerId(
          subscription.customer,
        );
        if (client) {
          const statusMap: Record<string, string> = {
            active: 'ACTIVE',
            trialing: 'TRIAL',
            past_due: 'ACTIVE',
            canceled: 'CANCELLED',
            unpaid: 'EXPIRED',
          };
          const newStatus = statusMap[subscription.status] || 'ACTIVE';
          await clientAccountRepository.update(client.id, {
            subscriptionStatus: newStatus as 'ACTIVE' | 'TRIAL' | 'CANCELLED' | 'EXPIRED',
            stripeSubscriptionId: subscription.id,
            currentPeriodEndsAt: new Date(subscription.current_period_end * 1000),
          });
          this.logger.log(`Client ${client.id} subscription -> ${newStatus}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as {
          id: string;
          customer: string;
        };
        const client = await clientAccountRepository.findByStripeCustomerId(
          subscription.customer,
        );
        if (client) {
          await clientAccountRepository.update(client.id, {
            subscriptionStatus: 'CANCELLED',
          });
          this.logger.log(`Client ${client.id} subscription cancelled`);
        }
        break;
      }

      default:
        this.logger.log(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }

  // ── Vercel ───────────────────────────────────────────────────────────────

  async handleVercelWebhook(payload: Record<string, unknown>) {
    const type = payload['type'] as string;
    const deployment = payload['payload'] as Record<string, unknown> | undefined;

    if (!deployment) {
      this.logger.warn('Vercel webhook: no payload');
      return { received: true };
    }

    const projectId = (deployment['projectId'] ?? deployment['project']?.toString()) as string;
    const deploymentUrl = deployment['url'] as string | undefined;
    const state = deployment['state'] as string | undefined;

    this.logger.log(`Vercel event: ${type} project=${projectId} state=${state}`);

    // Find the GeneratedSite by vercelProjectId
    const site = await prisma.generatedSite.findFirst({
      where: { vercelProjectId: projectId },
    });

    if (!site) {
      this.logger.warn(`No site found for Vercel project ${projectId}`);
      return { received: true };
    }

    if (type === 'deployment.ready' || state === 'READY') {
      await generatedSiteRepository.updateDeploymentStatus(
        site.id,
        'DEPLOYED',
        deploymentUrl ? `https://${deploymentUrl}` : undefined,
      );
      await prospectRepository.updateStatus(site.prospectId, 'SITE_DEPLOYED');
      this.logger.log(`Site ${site.id} deployed → ${deploymentUrl}`);
    } else if (type === 'deployment.error' || state === 'ERROR') {
      await generatedSiteRepository.updateDeploymentStatus(site.id, 'FAILED');
      this.logger.warn(`Site ${site.id} deployment failed`);
    }

    return { received: true };
  }

  // ── Resend (email tracking) ──────────────────────────────────────────────

  async handleResendWebhook(payload: Record<string, unknown>) {
    const type = payload['type'] as string;
    const data = payload['data'] as Record<string, unknown> | undefined;

    if (!data) {
      this.logger.warn('Resend webhook: no data');
      return { received: true };
    }

    const emailId = data['email_id'] as string;
    this.logger.log(`Resend event: ${type} emailId=${emailId}`);

    if (!emailId) return { received: true };

    // Find outreach email by resendEmailId
    const email = await prisma.outreachEmail.findFirst({
      where: { resendEmailId: emailId },
    });

    if (!email) {
      this.logger.warn(`No outreach email found for resendEmailId ${emailId}`);
      return { received: true };
    }

    switch (type) {
      case 'email.delivered':
        await outreachEmailRepository.update(email.id, { status: 'DELIVERED' });
        break;
      case 'email.opened':
        await outreachEmailRepository.markOpened(email.id);
        break;
      case 'email.clicked':
        await outreachEmailRepository.markClicked(email.id);
        break;
      case 'email.bounced':
        await outreachEmailRepository.update(email.id, { status: 'BOUNCED' });
        break;
      case 'email.complained':
      case 'email.failed':
        await outreachEmailRepository.update(email.id, { status: 'FAILED' });
        break;
      default:
        this.logger.log(`Unhandled Resend event: ${type}`);
    }

    return { received: true };
  }
}
