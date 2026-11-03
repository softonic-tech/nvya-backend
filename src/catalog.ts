// Keep this file identical in nvya-backend and nvya-skin (src/catalog.ts in both).
// The backend copy is authoritative: Stripe is always charged from these prices.

export const CURRENCY = 'aud';
export const MAX_QUANTITY = 10;

export type Product = {
  id: string;
  name: string;
  category: string;
  /** Price in cents. */
  price: number;
};

export const products: Product[] = [
  { id: 'gentle-cleanser', name: 'NYVA Gentle Cleanser', category: 'Cleansers', price: 3900 },
  { id: 'cleansing-balm', name: 'NYVA Cleansing Balm', category: 'Cleansers', price: 4500 },
  { id: 'hydrating-essence', name: 'NYVA Hydrating Essence', category: 'Essence', price: 4900 },
  { id: 'hyaluronic-serum', name: 'NYVA Hyaluronic Serum', category: 'Serums', price: 5900 },
  { id: 'vitamin-c-serum', name: 'NYVA Vitamin C Serum', category: 'Serums', price: 6900 },
  { id: 'peptide-serum', name: 'NYVA Peptide Serum', category: 'Serums', price: 6900 },
  { id: 'niacinamide-serum', name: 'NYVA Niacinamide Serum', category: 'Serums', price: 5500 },
  { id: 'retinal-serum', name: 'NYVA Retinal Serum', category: 'Serums', price: 7400 },
  { id: 'brightening-serum', name: 'NYVA Brightening Serum', category: 'Serums', price: 6500 },
  { id: 'barrier-serum', name: 'NYVA Barrier Serum', category: 'Serums', price: 5900 },
  { id: 'daily-moisturiser', name: 'NYVA Daily Moisturiser', category: 'Moisturisers', price: 5500 },
  { id: 'barrier-cream', name: 'NYVA Barrier Cream', category: 'Moisturisers', price: 5900 },
  { id: 'renewal-cream', name: 'NYVA Renewal Cream', category: 'Moisturisers', price: 6500 },
  { id: 'eye-cream', name: 'NYVA Eye Cream', category: 'Eye care', price: 4900 },
  { id: 'overnight-treatment', name: 'NYVA Overnight Treatment', category: 'Treatments', price: 6500 },
  { id: 'exfoliating-treatment', name: 'NYVA Exfoliating Treatment', category: 'Treatments', price: 5500 },
  { id: 'clarifying-treatment', name: 'NYVA Clarifying Treatment', category: 'Treatments', price: 5500 },
  { id: 'hydrating-mask', name: 'NYVA Hydrating Mask', category: 'Masks', price: 4500 },
  { id: 'facial-oil', name: 'NYVA Facial Oil', category: 'Facial oils', price: 5900 },
  { id: 'spf-50', name: 'NYVA SPF 50+', category: 'Sun care', price: 4200 },
];

export type Cart = Record<string, number>;
export type CartLine = { product: Product; quantity: number };

export function findProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: CURRENCY.toUpperCase() }).format(cents / 100);
}

/** Serialises a cart for the `items` query parameter, e.g. `gentle-cleanser:2,spf-50:1`. */
export function encodeCart(cart: Cart): string {
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => `${id}:${qty}`)
    .join(',');
}

/** Parses the `items` query parameter, dropping unknown products and clamping quantities. */
export function decodeCart(value: string | null | undefined): CartLine[] {
  if (!value) return [];
  const merged = new Map<string, number>();
  for (const part of value.split(',')) {
    const [id, rawQty] = part.split(':');
    const qty = Number.parseInt(rawQty ?? '', 10);
    if (!findProduct(id) || !Number.isFinite(qty) || qty < 1) continue;
    merged.set(id, Math.min(MAX_QUANTITY, (merged.get(id) ?? 0) + qty));
  }
  return [...merged].map(([id, quantity]) => ({ product: findProduct(id)!, quantity }));
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
}
