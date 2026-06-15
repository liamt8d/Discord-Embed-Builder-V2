import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token, channelId, messageId, components, allowedMentions } = await request.json() as any;
    if (!token || !channelId || !messageId) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const body: any = { flags: 1 << 15, components };
    if (!allowedMentions) body.allowed_mentions = { parse: [] };
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bot ${token}` },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    let data: any = {};
    try { data = JSON.parse(raw); } catch { }
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.message ?? `Error ${res.status}` }), { status: res.status, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
