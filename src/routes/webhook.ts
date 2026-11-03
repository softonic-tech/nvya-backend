import express, { Router } from 'express';
import type Stripe from 'stripe';
import { config, stripe } from '../config.js';

export const webhook = Router();

// Stripe signs the exact bytes it sent, so this route must receive the raw body, not parsed JSON.
webhook.post('/', express.raw({ type: '*/*' }), async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!config.stripeWebhookSecret || typeof signature !== 'string') {
    res.status(400).json({ error: 'Webhook not configured.' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, config.stripeWebhookSecret);
  } catch (error) {
    console.error('webhook signature verification failed', error);
    res.status(400).json({ error: 'Invalid signature.' });
    return;
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object;
    if (s.payment_status === 'paid') {
      try {
        const items = await stripe.checkout.sessions.listLineItems(s.id, { limit: 100 });
        await onOrderPaid({
          session: s.id,
          email: s.customer_details?.email ?? null,
          phone: s.customer_details?.phone ?? null,
          total: s.amount_total,
          currency: s.currency,
          shipping: s.collected_information?.shipping_details ?? null,
          items: items.data.map((i) => ({ name: i.description, quantity: i.quantity, amount: i.amount_total })),
        });
      } catch (error) {
        console.error('order fulfilment failed', error);
        res.status(500).json({ error: 'Fulfilment failed.' });
        return;
      }
    }
  }

  res.json({ received: true });
});

type PaidOrder = {
  session: string;
  email: string | null;
  phone: string | null;
  total: number | null;
  currency: string | null;
  shipping: Stripe.Checkout.Session.CollectedInformation.ShippingDetails | null;
  items: { name: string | null; quantity: number | null; amount: number }[];
};

/** Fulfilment hook: send to your email, database or order system here. Stripe retries if this throws. */
async function onOrderPaid(order: PaidOrder): Promise<void> {
  console.log('NYVA order paid', JSON.stringify(order));
}
