# NYVA SKIN — backend (Node.js / Express)

Backend for the NYVA SKIN website ([nvya-skin](https://github.com/softonic-tech/nvya-skin)). It creates Stripe Checkout Sessions from its own catalogue prices, confirms payments for the website, and receives Stripe webhooks.

| Endpoint | Called by | What it does |
| --- | --- | --- |
| `GET /health` | You / your host | Returns `{ "ok": true }` |
| `POST /checkout` | website | Body `{ "items": "gentle-cleanser:2,spf-50:1" }` → `{ "url": "https://checkout.stripe.com/..." }` |
| `GET /session?session_id=cs_...` | website | `{ paid, amountTotal, currency }` for the "Thank you" message |
| `POST /webhook` | Stripe | Verifies the signature and handles `checkout.session.completed` |

Only `HOME_URL` is allowed by CORS. Add your fulfilment (email, database, etc.) in `onOrderPaid` in `src/routes/webhook.ts`.

## Run locally

```bash
npm install
cp .env.example .env   # Stripe test key + HOME_URL=http://localhost:5173
npm run dev            # http://localhost:4000
```

Forward webhooks while testing with the Stripe CLI:

```bash
stripe listen --forward-to localhost:4000/webhook   # prints the whsec_... for STRIPE_WEBHOOK_SECRET
```

Test card: `4242 4242 4242 4242`, any future date, any CVC.

## Deploy to Vercel

1. Vercel → **Add New Project** → import this repo. Vercel detects the Express app in `src/index.ts`.
2. **Settings → Environment Variables**: everything in `.env.example` except `PORT`.
3. **Settings → Domains**: add e.g. `api.nyvaskin.com`.
4. Stripe Dashboard → Developers → **Webhooks** → add endpoint `https://api.nyvaskin.com/webhook` with events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Put its signing secret in `STRIPE_WEBHOOK_SECRET` and redeploy.

It also runs on any Node.js 20+ host (Render, Railway, VPS): build `npm install && npm run build`, start `npm start`.

## Prices

`src/catalog.ts` is the source of truth. Copy it unchanged to `src/catalog.ts` in the website whenever you change it.
