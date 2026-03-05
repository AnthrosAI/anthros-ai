/**
 * AnthrosAI — api/checkout.js
 * Vercel Serverless Function: Stripe Checkout Session
 * Reads STRIPE_SECRET_KEY, MONTHLYSTRIPE_PRICE_ID, YEARLYSTRIPE_PRICE_ID from env
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS headers for safety
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan } = req.body;
  if (!plan) return res.status(400).json({ error: 'Missing plan' });

  const priceId = plan === 'yearly'
    ? process.env.YEARLYSTRIPE_PRICE_ID
    : process.env.MONTHLYSTRIPE_PRICE_ID;

  if (!priceId) return res.status(500).json({ error: 'Price ID not configured' });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
      billing_address_collection: 'auto',
      customer_email: req.body.email || undefined,
      metadata: { plan },
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
}
