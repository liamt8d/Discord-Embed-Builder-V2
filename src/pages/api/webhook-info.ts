import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { webhookUrl } = await request.json() as any;

    if (!webhookUrl || !webhookUrl.match(/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/.+/)) {
      return new Response(JSON.stringify({ error: 'URL inválida' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const res = await fetch(webhookUrl, { method: 'GET' });
    const data = await res.json() as any;

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.message ?? 'Error' }), { status: res.status, headers: { 'Content-Type': 'application/json' } });
    }

    const avatar = data.avatar
      ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
      : null;

    return new Response(JSON.stringify({ username: data.name, avatar }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
