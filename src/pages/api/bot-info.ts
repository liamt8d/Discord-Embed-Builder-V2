import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const token = new URL(request.url).searchParams.get('token')?.trim();
  if (!token) return new Response(JSON.stringify({ error: 'No token' }), { status: 400 });

  try {
    const res = await fetch('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bot ${token}`, 'User-Agent': 'DiscordComponentBuilder (local, 1.0)' },
    });
    if (!res.ok) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: res.status });
    const d = await res.json() as { id: string; username: string; avatar: string | null; global_name?: string | null };
    return new Response(JSON.stringify({
      id: d.id,
      username: d.global_name || d.username,
      avatar: d.avatar ? `https://cdn.discordapp.com/avatars/${d.id}/${d.avatar}.png?size=80` : null,
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Error de red' }), { status: 500 });
  }
};
