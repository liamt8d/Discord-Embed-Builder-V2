import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { webhookUrl, components, allowedMentions } = await request.json() as any;

    if (
      !webhookUrl ||
      typeof webhookUrl !== 'string' ||
      !webhookUrl.match(/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/.+/)
    ) {
      return new Response(JSON.stringify({ error: 'URL de webhook inválida.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!components || !Array.isArray(components) || components.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay componentes para enviar.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: any = { flags: 1 << 15, components };
    if (!allowedMentions) body.allowed_mentions = { parse: [] };

    const res = await fetch(`${webhookUrl}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.status === 204) {
      return new Response(JSON.stringify({ id: 'webhook' }), { headers: { 'Content-Type': 'application/json' } });
    }

    const raw = await res.text();
    let data: any = {};
    try { data = JSON.parse(raw); } catch { /* non-json */ }

    if (!res.ok) {
      const errMsg = data.message
        ? `${data.message}${data.code ? ` (code: ${data.code})` : ''}`
        : `Error ${res.status}: ${raw.slice(0, 200)}`;
      return new Response(JSON.stringify({ error: errMsg }), {
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
