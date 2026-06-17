import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const ct = (s: unknown) => new Response(JSON.stringify(s), { headers: { 'Content-Type': 'application/json' } });

  try {
    const body = await request.json() as {
      components: unknown[];
      channelId: string;
      token: string;
      allowedMentions: boolean;
      replyId?: string;
    };

    const { components, channelId, token, allowedMentions, replyId } = body;
    if (!token?.trim() || !channelId?.trim() || !components?.length) {
      return new Response(JSON.stringify({ error: 'Faltan: token, channelId o components.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const payload: Record<string, unknown> = { flags: 1 << 15, components };
    if (!allowedMentions) payload.allowed_mentions = { parse: [] };
    if (replyId?.trim()) payload.message_reference = { message_id: replyId.trim(), fail_if_not_exists: false };

    const res = await fetch(`https://discord.com/api/v10/channels/${channelId.trim()}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token.trim()}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DiscordComponentBuilder (local, 1.0)',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as Record<string, unknown>;
    if (!res.ok) {
      return new Response(JSON.stringify({ error: String(data.message || 'Error de Discord'), code: data.code, details: data.errors }), { status: res.status, headers: { 'Content-Type': 'application/json' } });
    }

    return ct({ ok: true, id: data.id });
  } catch (e) {
    return new Response(JSON.stringify({ error: `Error interno: ${e}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
