import Stripe from 'stripe';
import { getStripeClient } from './client';

export async function createSubscription(
  customerId: string,
  priceId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
}

export async function cancelSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();
  return stripe.subscriptions.cancel(subscriptionId);
}

export async function getSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient();
  return stripe.subscriptions.retrieve(subscriptionId);
}
