export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  let messages, system, max_tokens, model;
  try {
    ({ messages, system, max_tokens, model } = await req.json());
  } catch {
    return json({ error: { message: 'Invalid request body' } }, 400);
  }

  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-5',
        max_tokens: max_tokens || 1000,
        system: system || '',
        messages,
        // Stream so bytes start flowing within ~1-2s. A synchronous Netlify
        // function is killed at 10s of wall-clock time; an actively streaming
        // response keeps the connection alive for the full generation, so long
        // completions no longer surface as a gateway 504.
        stream: true,
      }),
    });
  } catch (e) {
    return json({ error: { message: `Upstream fetch failed: ${e.message}` } }, 502);
  }

  // Errors (auth, rate limit, 529 overloaded) come back before the stream as a
  // normal JSON body with an error status — propagate them as-is so the client
  // can show the message and keep its 529 retry behaviour.
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    let body;
    try { body = JSON.parse(text); } catch { body = { error: { message: text || `API error ${r.status}` } }; }
    return json(body, r.status);
  }

  // Pipe the Anthropic SSE stream straight through to the browser.
  return new Response(r.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
};
