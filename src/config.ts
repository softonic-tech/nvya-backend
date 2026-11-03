import Stripe from 'stripe';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const trimSlash = (url: string) => url.replace(/\/+$/, '');

export const config = {
  port: Number.parseInt(process.env.PORT || '4000', 10),
  stripeSecretKey: required('STRIPE_SECRET_KEY'),
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() || '',
  homeUrl: trimSlash(required('HOME_URL')),
  shippingCountries: (process.env.SHIPPING_COUNTRIES || 'AU')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean) as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
  shippingFlatCents: Number.parseInt(process.env.SHIPPING_FLAT_CENTS || '0', 10) || 0,
};

export const stripe = new Stripe(config.stripeSecretKey);
