const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { plan } = req.body; 
  // Usa los nombres exactos que pusiste en Vercel
  const priceId = plan === 'yearly' ? process.env.YEARLYSTRIPE_PRICE_ID : process.env.MONTHLYSTRIPE_PRICE_ID;

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
