# Discord Component Builder

Visual builder for Discord **Components V2** messages. Design containers, sections, buttons, galleries and more — then send them directly to a channel via Bot Token or Webhook.

**Live demo:** [embed-generator.urugordos.com](https://embed-generator.urugordos.com) 

![Discord Component Builder screenshot](https://i.imgur.com/nopTtYP.png) 

---

## Features

- 📦 **Container** — accent color, spoiler
- ▦ **Action Row** — up to 5 buttons or 1 select menu
- ¶ **Text** — full Discord markdown (headings, bold, italic, emojis, mentions…)
- ▤ **Section** — text + thumbnail or button accessory
- ⊞ **Gallery** — up to 10 images in a grid
- ─ **Divider** — horizontal separator
- 🔗 **Webhook** or **Bot Token** send modes
- 🔴 Live preview with Discord-accurate rendering
- 💾 State saved in URL hash — share your build with a link
- 📥 Export to JSON for direct API use

## Tech stack

- [Astro](https://astro.build) (SSR, Cloudflare adapter)
- [React](https://react.dev) (interactive islands)
- [Cloudflare Pages](https://pages.cloudflare.com) (hosting)
- TypeScript, pnpm

---

## Local development

Requires **Node.js 18+** and **pnpm**.

```bash
git clone https://github.com/liamt8d/Discord-Embed-Builder.git
cd Discord-Embed-Builder
pnpm install
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321).

## Build

```bash
pnpm build
```

Output goes to `dist/`.

---

## Deploy to Cloudflare Pages

1. Push the repo to GitHub.
2. Go to [Cloudflare Pages](https://pages.cloudflare.com) → **Create a project** → **Connect to Git**.
3. Select the repo and set:
   | Setting | Value |
   |---|---|
   | Framework preset | Astro |
   | Build command | `pnpm run build` |
   | Build output directory | `dist` |
4. Click **Save and Deploy**. Done.

> **No environment variables needed.** The bot token and webhook URL are stored in the user's browser (localStorage) and sent directly to Discord from the server-side API routes.

---

## Usage

1. **Add components** using the left panel toolbar.
2. **Edit properties** in the right panel (select a node in the tree or click it in the preview).
3. **Preview** updates in real time in the center panel.
4. **Send** — enter your Bot Token + Channel ID (or a Webhook URL), then click ▶ Enviar.

### Discord markdown supported

```
# Heading 1   ## Heading 2   ### Heading 3
**bold**  *italic*  __underline__  ~~strikethrough~~
`inline code`  ```code block```
||spoiler||  > blockquote  -# small text
:shortcode:  <:name:id>  <a:name:id>  @mention  #channel
```

---

## Changelog

### v1.1.1 — 2026-06-15
- **Interactive buttons** — Hover, press effect and pointer cursor on Action Row buttons in preview
- **Functional select menus** — Text selects show a real dropdown with defined options; user/role/channel selects show a tooltip explaining Discord-only behavior
- **UI icons (uicons)** — Decorative emojis replaced with Flaticon uicons solid-rounded icons
- **Text overflow fix** — Long text without spaces no longer breaks the container width in preview

### v1.1.0 — 2026-06-15
- **Webhook improved** — Full Components V2 support (`with_components=true`, API v10)
- **Thread ID** — Send messages directly to threads
- **Edit message** — Edit existing messages sent by the bot or the same webhook
- **Restore message** — Load an existing message's components into the editor
- **Webhook preview** — Webhook avatar and name shown in the live preview
- **SEO & Open Graph** — Link preview when sharing on Discord/social media
- **Larger UI** — Increased font size and panel widths for better readability
- **Changelog modal** — Version history accessible from the header

### v1.0.0 — 2026-06-15
- Initial release
- Components V2: Container, Text, Section, Gallery, Divider, Action Row, Buttons, Selects
- Bot Token send mode with live preview
- Export to JSON
- State saved in URL hash for shareable builds
- Toast notifications and welcome/tutorial modal
- Security warning when entering credentials

---

## License

[MIT](LICENSE) © 2026 Liam
