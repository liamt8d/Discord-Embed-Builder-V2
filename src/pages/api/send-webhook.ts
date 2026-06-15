import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { webhookUrl, components, allowedMentions } = await request.json() as any;

    if (
      !webhookUrl ||
      typeof webhookUrl !== 'string' ||
      !webhookUrl.match(/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/.+/)
    ) {
      return new Response(JSON.stringify({ error: 'URL de webhook inválida. Debe ser https://discord.com/api/webhooks/...' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!components || !Array.isArray(components) || components.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay componentes para enviar.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // zero-width space — invisible in Discord, required by webhook endpoint for Components V2
    const body: any = { flags: 1 << 15, components, content: '​' };
    if (!allowedMentions) body.allowed_mentions = { parse: [] };

    const res = await fetch(`${webhookUrl}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.status === 204) {
      return new Response(JSON.stringify({ id: 'webhook' }), { headers: { 'Content-Type': 'application/json' } });
    }

    const data = await res.json().catch(() => ({})) as any;

    if (!res.ok) {
      const errMsg = data.message
        ? `${data.message}${data.code ? ` (code: ${data.code})` : ''}`
        : `Error ${res.status} de Discord`;
      return new Response(JSON.stringify({ error: errMsg, discord: data }), {
        status: res.status, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
