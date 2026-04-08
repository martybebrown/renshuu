export default async (req) => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return new Response(JSON.stringify({ error: 'No GitHub token configured' }), { status: 500 });

  const { action, id, content, description, file } = await req.json();
  const headers = { Authorization: `token ${token}`, 'Content-Type': 'application/json', Accept: 'application/vnd.github.v3+json' };

  let r;
  switch (action) {
    case 'list':
      r = await fetch('https://api.github.com/gists', { headers });
      break;
    case 'get':
      r = await fetch(`https://api.github.com/gists/${id}`, { headers });
      break;
    case 'update':
      r = await fetch(`https://api.github.com/gists/${id}`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ files: { [file]: { content } } }),
      });
      break;
    case 'create':
      r = await fetch('https://api.github.com/gists', {
        method: 'POST', headers,
        body: JSON.stringify({ description, public: false, files: { [file]: { content } } }),
      });
      break;
    default:
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  }

  const data = await r.json();
  return new Response(JSON.stringify(data), {
    status: r.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
