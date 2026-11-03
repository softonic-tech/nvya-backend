import { Router } from 'express';
import type Stripe from 'stripe';
import { CURRENCY, decodeCart, encodeCart } from '../catalog.js';
import { config, stripe } from '../config.js';

export const checkout = Router();

function shippingOptions(): Stripe.Checkout.SessionCreateParams.ShippingOption[] | undefined {
  if (config.shippingFlatCents <= 0) return undefined;
  return [{
    shipping_rate_data: {
      type: 'fixed_amount',
      display_name: 'Standard shipping',
      fixed_amount: { amount: config.shippingFlatCents, currency: CURRENCY },
    },
  }];
}

checkout.post('/', async (req, res) => {
  const items: unknown = req.body?.items;
  const lines = decodeCart(typeof items === 'string' ? items : '');
  if (lines.length === 0) {
    res.status(400).json({ error: 'Your bag is empty.' });
    return;
  }

  try {
    const cart = encodeCart(Object.fromEntries(lines.map((l) => [l.product.id, l.quantity])));
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lines.map(({ product, quantity }) => ({
        quantity,
        price_data: {
          currency: CURRENCY,
          unit_amount: product.price,
          product_data: { name: product.name, description: product.category, metadata: { product_id: product.id } },
        },
      })),
      shipping_address_collection: { allowed_countries: config.shippingCountries },
      shipping_options: shippingOptions(),
      phone_number_collection: { enabled: true },
      metadata: { cart },
      success_url: `${config.homeUrl}/?order=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.homeUrl}/?checkout=cancelled`,
    });

    if (!session.url) {
      res.status(502).json({ error: 'Could not start checkout.' });
      return;
    }
    res.json({ url: session.url });
  } catch (error) {
    console.error('checkout failed', error);
    res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
});
