// api/groq.js  — Vercel serverless function
// Proxies AI requests to Groq. GROQ_API_KEY is set in Vercel env vars — never exposed to browser.
export default async function handler(req, res) {
  // CORS headers for PWA same-origin calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: 'GROQ_API_KEY not configured in Vercel env vars' });

  try {
    const { model, max_tokens, messages, stream } = req.body || {};

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model:      model      || 'llama-3.3-70b-versatile',
        max_tokens: max_tokens || 512,
        messages:   messages   || [],
        stream:     false
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      return res.status(groqRes.status).json({ error: errText });
    }

    const data = await groqRes.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('[/api/groq]', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
