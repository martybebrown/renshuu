export default async () => {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return new Response(JSON.stringify({ error: 'Azure not configured' }), { status: 500 });

  const r = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': key },
  });

  if (!r.ok) return new Response(JSON.stringify({ error: 'Token fetch failed' }), { status: r.status });

  const token = await r.text();
  return new Response(JSON.stringify({ token, region }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
