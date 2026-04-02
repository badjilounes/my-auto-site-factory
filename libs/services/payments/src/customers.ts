import Stripe from 'stripe';
import { getStripeClient } from './client';

export async function createCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>,
): Promise<Stripe.Customer> {
  const stripe = getStripeClient();
  return stripe.customers.create({
    email,
    name,
    metadata,
  });
}

export async function getCustomer(
  customerId: string,
): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
  const stripe = getStripeClient();
  return stripe.customers.retrieve(customerId);
}
