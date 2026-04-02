import Stripe from 'stripe';

export interface InvoiceItem {
  description: string;
  amount: number;
  quantity?: number;
}

export interface WebhookEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

export class StripeIntegration {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }

  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: metadata ?? {},
      });

      return customer;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to create Stripe customer for "${email}": ${message}`
      );
    }
  }

  async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to create subscription for customer "${customerId}": ${message}`
      );
    }
  }

  async createInvoice(
    customerId: string,
    items: InvoiceItem[]
  ): Promise<Stripe.Invoice> {
    try {
      // Create invoice items first
      for (const item of items) {
        await this.stripe.invoiceItems.create({
          customer: customerId,
          description: item.description,
          amount: item.amount,
          currency: 'usd',
          quantity: item.quantity ?? 1,
        });
      }

      // Create and finalize the invoice
      const invoice = await this.stripe.invoices.create({
        customer: customerId,
        auto_advance: true,
      });

      const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(
        invoice.id
      );

      return finalizedInvoice;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to create invoice for customer "${customerId}": ${message}`
      );
    }
  }

  async handleWebhook(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Promise<WebhookEvent> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        secret
      );

      return {
        type: event.type,
        data: {
          object: event.data.object as unknown as Record<string, unknown>,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to process Stripe webhook: ${message}`
      );
    }
  }
}

export function createStripeClient(
  secretKey: string
): StripeIntegration {
  return new StripeIntegration(secretKey);
}
