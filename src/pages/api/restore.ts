import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { token, channelId, messageId } = await request.json() as any;
    if (!token || !channelId || !messageId) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
      headers: { 'Authorization': `Bot ${token}` },
    });
    const data = await res.json() as any;
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.message ?? `Error ${res.status}` }), { status: res.status, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ components: data.components ?? [], flags: data.flags }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
