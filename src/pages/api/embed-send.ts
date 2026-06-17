import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const json = (s: unknown, status = 200) =>
    new Response(JSON.stringify(s), { status, headers: { 'Content-Type': 'application/json' } });

  try {
    const body = await request.json() as {
      content?: string; embeds: unknown[];
      channelId: string; token: string;
      messageId?: string; threadId?: string; replyId?: string;
      username?: string; avatar_url?: string;
    };
    const { content, embeds, channelId, token, messageId, threadId, replyId, username, avatar_url } = body;

    if (!token?.trim() || !channelId?.trim()) {
      return json({ error: 'Faltan: token o channelId.' }, 400);
    }

    const payload: Record<string, unknown> = { embeds };
    if (content?.trim()) payload.content = content;
    if (username?.trim()) payload.username = username;
    if (avatar_url?.trim()) payload.avatar_url = avatar_url;
    if (replyId?.trim() && !messageId) payload.message_reference = { message_id: replyId.trim(), fail_if_not_exists: false };

    let url = messageId
      ? `https://discord.com/api/v10/channels/${channelId.trim()}/messages/${messageId}`
      : `https://discord.com/api/v10/channels/${channelId.trim()}/messages`;
    if (threadId?.trim() && !messageId) url += `?thread_id=${threadId.trim()}`;

    const res = await fetch(url, {
      method: messageId ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bot ${token.trim()}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DiscordComponentBuilder (local, 1.0)',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as Record<string, unknown>;
    if (!res.ok) {
      return json({ error: String(data.message ?? 'Error de Discord'), code: data.code, errors: data.errors }, res.status);
    }
    return json({ ok: true, id: data.id });
  } catch (e) {
    return json({ error: `Error interno: ${e}` }, 500);
  }
};
