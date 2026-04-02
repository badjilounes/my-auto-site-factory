import Stripe from 'stripe';
import { getStripeClient } from './client';

export interface InvoiceItem {
  description: string;
  amount: number;
}

export async function createInvoice(
  customerId: string,
  items: InvoiceItem[],
): Promise<Stripe.Invoice> {
  const stripe = getStripeClient();

  // Create invoice items first
  for (const item of items) {
    await stripe.invoiceItems.create({
      customer: customerId,
      description: item.description,
      amount: item.amount,
      currency: 'eur',
    });
  }

  // Create and finalize the invoice
  const invoice = await stripe.invoices.create({
    customer: customerId,
    auto_advance: true,
  });

  return invoice;
}

export async function getInvoice(
  invoiceId: string,
): Promise<Stripe.Invoice> {
  const stripe = getStripeClient();
  return stripe.invoices.retrieve(invoiceId);
}

export async function listInvoices(
  customerId: string,
): Promise<Stripe.ApiList<Stripe.Invoice>> {
  const stripe = getStripeClient();
  return stripe.invoices.list({
    customer: customerId,
  });
}
