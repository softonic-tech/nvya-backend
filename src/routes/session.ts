import { Router } from 'express';
import { stripe } from '../config.js';

export const session = Router();

/** Lets the home site confirm a finished checkout without exposing customer details. */
session.get('/', async (req, res) => {
  const id = typeof req.query.session_id === 'string' ? req.query.session_id : '';
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) {
    res.status(400).json({ error: 'Invalid session.' });
    return;
  }

  try {
    const s = await stripe.checkout.sessions.retrieve(id);
    res.json({ paid: s.payment_status === 'paid', amountTotal: s.amount_total, currency: s.currency });
  } catch {
    res.status(404).json({ error: 'Session not found.' });
  }
});
