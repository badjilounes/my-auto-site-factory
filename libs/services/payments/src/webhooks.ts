import Stripe from 'stripe';
import { getStripeClient } from './client';

export function handleStripeWebhook(
  payload: string | Buffer,
  signature: string,
  secret: string,
): Stripe.Event {
  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
