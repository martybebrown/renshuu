export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { messages, system, max_tokens } = await req.json();

  const r = await fetch('https://api.anthropic.com/v1/messages', {
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

  const data = await r.json();
  return new Response(JSON.stringify(data), {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
