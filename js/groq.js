// /api/groq.js — Vercel serverless proxy for Groq API
// Keeps GROQ_API_KEY secret on the server, never exposed to client
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured in Vercel env vars' });
  }

  try {
    const { model, max_tokens, messages } = req.body;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        max_tokens: max_tokens || 512,
        messages: messages || []
      })
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return res.status(groqRes.status).json({ error: errText });
    }

    const data = await groqRes.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('[/api/groq] error:', err);
    return res.status(500).json({ error: err.message });
  }
}
