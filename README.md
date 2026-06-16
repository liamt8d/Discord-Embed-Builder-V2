# Discord Component Builder

Visual builder for Discord **Components V2** and **Embeds**. Design containers, sections, buttons, embeds, galleries and more — then send them directly to a channel via Bot Token or Webhook.

**Live demo:** [embed-generator.urugordos.com](https://embed-generator.urugordos.com)

![Discord Component Builder screenshot](https://i.imgur.com/nopTtYP.png)

---

## Features

### Two builders in one

| Feature | Embed Builder | V2 Builder |
|---|---|---|
| Embeds (title, description, fields, image…) | ✅ | — |
| Link buttons (action rows) | ✅ | — |
| Components V2 (Container, Section, Gallery…) | — | ✅ |
| Action rows (buttons, selects) | — | ✅ |
| Bot Token / Webhook send | ✅ | ✅ |
| Live preview | ✅ | ✅ |

### Core features

- **Live preview** — Discord-accurate rendering in real time
- **Webhook & Bot Token** modes with auto-fetched bot avatar in preview
- **Webhook appearance** — configure username/avatar override per message
- **Edit existing messages** — paste a Message ID to restore and edit
- **Thread support** — send to any thread by ID
- **Multi-message** — send multiple messages in sequence (V2 builder)
- **State in URL** — share builds via link hash
- **Export JSON** — download the payload for direct API use
- **Export PNG** — export the preview as a PNG via print dialog

### Editor tools

- **Format toolbar** — bold, italic, underline, strikethrough, code, codeblock, spoiler, blockquote in every text field
- **Mention/Time/Emoji picker** — insert @everyone, @here, `<#channel>`, `<@&role>`, saved mentions, Discord timestamps (7 styles), and emojis with search
- **`<id:X>` server links** — `<id:browse>`, `<id:customize>`, `<id:guide>`, `<id:linked-roles>` render as Discord mention chips in preview
- **Import from Discord** — paste a Discord message JSON to load it into the editor
- **Templates** — save and load full builder states (persisted in localStorage)
- **Send history** — last 10 sent message IDs, copy or load directly
- **Saved webhooks** — favorite webhook URLs with quick-select
- **Diff view** — compare current state vs the original message when editing
- **Compact mode** — collapse all messages at once
- **Keyboard shortcuts** — `Ctrl+Enter` to send, `Ctrl+S` to export
- **Copy link** — copy shareable URL from the header

### Discord markdown supported

```
# Heading 1   ## Heading 2   ### Heading 3
**bold**  *italic*  __underline__  ~~strikethrough~~
`inline code`  ```code block```  ```ansi ANSI colors```
||spoiler||  > blockquote  >>> multiline blockquote  -# small text
:shortcode:  <:name:id>  <a:name:id>
<@userId>  <#channelId>  <@&roleId>  @everyone  @here
<t:unix>  <t:unix:R>  (all 7 Discord timestamp styles)
<id:browse>  <id:customize>  <id:guide>  <id:linked-roles>
```

---

## Tech stack

- [Astro](https://astro.build) — SSR framework, Cloudflare adapter
- [React](https://react.dev) — interactive islands (`client:only="react"`)
- [Cloudflare Pages](https://pages.cloudflare.com) — hosting & serverless API routes
- TypeScript, pnpm, Flaticon uicons

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

4. Click **Save and Deploy**.

> **No environment variables needed.** The bot token and webhook URL are stored in the user's browser (localStorage) and sent directly from the server-side API routes.

---

## Changelog

### v1.3.0 — 2026-06-15

- **Embed Builder** — New dedicated builder for embed messages: content, up to 10 embeds with all fields (title, description, author, footer, fields, image, thumbnail, color), link buttons, and webhook/bot modes
- **Auto webhook preview** — Pasting a webhook URL auto-fetches the bot's avatar and name for the preview
- **Webhook appearance modal** — Configure username and avatar_url overrides with a live preview of the bot header
- **Mention/Time/Emoji picker** — `@#🕐` button in the format toolbar: insert mentions, Discord timestamps (7 styles), and emojis with search
- **`<id:X>` server links** — `<id:browse>`, `<id:customize>`, `<id:guide>`, `<id:linked-roles>` render as mention chips in both builders
- **Send history** — Last 10 sent message IDs with copy and load-to-editor actions
- **Templates** — Save and load full builder states (persisted in localStorage)
- **Import from Discord** — Paste Discord message JSON to load it directly into the editor
- **Diff view** — Line-by-line colored diff comparing current state vs original when editing a message
- **Format toolbar** — Bold, italic, underline, strikethrough, code, codeblock, spoiler, quote in every text field
- **Link buttons in Embed Builder** — Add link button rows (type 2, style 5) to embed messages
- **PNG export** — Export the preview as a PNG via the browser print dialog
- **Compact mode** — Collapse all messages in the embed builder at once
- **Keyboard shortcuts** — `Ctrl+Enter` to send, `Ctrl+S` to export JSON
- **Saved webhooks** — Favorite webhook URLs with quick-select and active indicator
- **Copy link** — Copy the shareable URL from the header

### v1.2.0 — 2026-06-15

- **Multi-message** — Add multiple independent messages from the "Mensajes" tabs in the left panel. Enviar sends them all in sequence.
- **Message tabs** — Msg 1 / Msg 2 / … tabs with component count badge, green + to add and red ✕ to remove the active one.
- **Multi export** — When multiple messages exist, Export generates an array of JSON objects ready for the API.
- **Text character limit** — Validates total characters per message (Discord limit: 4000). Live counter in the header (grey / yellow / red).
- **Per-node counter** — Text editor shows X / 4000 with colored border when approaching or exceeding the limit.
- **Fix Error 50035** — Validates thumbnails without URL, gallery items without URL and empty text nodes before sending. Error message now shows the specific field Discord rejects.
- **Fix markdown in blockquotes** — `>>>` and `>` blocks now render full markdown (bullets, `-#`, headings, bold, etc.) in the preview.

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

### v1.0.0 — 2026-05-15

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
