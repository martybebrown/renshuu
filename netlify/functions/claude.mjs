export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  let messages, system, max_tokens;
  try {
    ({ messages, system, max_tokens } = await req.json());
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
        model: 'claude-sonnet-4-5',
        max_tokens: max_tokens || 1000,
        system: system || '',
        messages,
      }),
    });
  } catch (e) {
    return json({ error: { message: `Upstream fetch failed: ${e.message}` } }, 502);
  }

  let data;
  try {
    data = await r.json();
  } catch {
    return json({ error: { message: `API error ${r.status}` } }, r.status);
  }

  return json(data, r.status);
};
