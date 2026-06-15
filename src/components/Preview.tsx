import React, { createContext, useContext } from 'react';
import ReactDOM from 'react-dom';
import type { RootNode } from '../lib/types';
import { addToast } from './ToastSystem';

// ── Selection context ─────────────────────────────────────────────────────────

const Ctx = createContext<{ sel: string | null; pick: (id: string) => void }>({ sel: null, pick: () => {} });

// ── Discord Markdown renderer ─────────────────────────────────────────────────

const M_S  = { color: '#c9cdfb', background: 'rgba(88,101,242,.3)', borderRadius: 3, padding: '0 3px', cursor: 'default' } as const;
const ME_S = { color: '#f8a8c8', background: 'rgba(255,105,180,.18)', borderRadius: 3, padding: '0 3px', cursor: 'default' } as const;
const CO_S = { background: '#1e1f22', color: '#b9bec7', borderRadius: 3, padding: '0 5px', fontFamily: 'Consolas,"Courier New",monospace', fontSize: '0.875em' } as const;
const CB_S = { background: '#1e1f22', color: '#b9bec7', borderRadius: 4, padding: '10px 14px', fontFamily: 'Consolas,"Courier New",monospace', fontSize: 13, margin: '4px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all', display: 'block', overflowX: 'auto' } as const;
const EM_S  = { height: '1.3em', verticalAlign: 'text-bottom', display: 'inline-block' } as const;
const EMO_FONT = "'gg sans','Noto Sans','Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif";

// ── Unicode emoji shortcode map ───────────────────────────────────────────────
const EMOJIS: Record<string, string> = {
  // Emotions
  smile:'😄',grin:'😁',joy:'😂',rofl:'🤣',blush:'😊',wink:'😉',sweat_smile:'😅',
  heart_eyes:'😍',kissing_heart:'😘',yum:'😋',sunglasses:'😎',smirk:'😏',
  thinking:'🤔',nerd_face:'🤓',monocle:'🧐',flushed:'😳',unamused:'😒',
  sob:'😭',cry:'😢',angry:'😠',rage:'😡',skull:'💀',innocent:'😇',
  upside_down:'🙃',partying_face:'🥳',star_struck:'🤩',shushing_face:'🤫',
  zipper_mouth:'🤐',raised_eyebrow:'🤨',rolling_eyes:'🙄',pensive:'😔',
  confused:'😕',worried:'😟',fearful:'😨',scream:'😱',triumph:'😤',
  cold_sweat:'😰',hugs:'🤗',pleading_face:'🥺',melting_face:'🫠',
  // Hands
  thumbsup:'👍','+1':'👍',thumbsdown:'👎','-1':'👎',ok_hand:'👌',
  clap:'👏',raised_hands:'🙌',wave:'👋',v:'✌️',pray:'🙏',
  muscle:'💪',fist:'✊',handshake:'🤝',point_right:'👉',point_left:'👈',
  point_up:'☝️',point_down:'👇',crossed_fingers:'🤞',pinched_fingers:'🤌',
  // Hearts
  heart:'❤️',orange_heart:'🧡',yellow_heart:'💛',green_heart:'💚',
  blue_heart:'💙',purple_heart:'💜',black_heart:'🖤',broken_heart:'💔',
  sparkling_heart:'💖',two_hearts:'💕',revolving_hearts:'💞',heartpulse:'💗',
  heart_on_fire:'❤️‍🔥',mending_heart:'❤️‍🩹',
  // Nature / Weather
  sun:'☀️',sunny:'☀️',moon:'🌙',cloud:'☁️',rainbow:'🌈',
  snowflake:'❄️',lightning:'⚡',droplet:'💧',ocean:'🌊',fire:'🔥',
  // Animals
  cat:'🐱',dog:'🐶',fox_face:'🦊',wolf:'🐺',bear:'🐻',panda_face:'🐼',
  penguin:'🐧',bird:'🐦',frog:'🐸',snake:'🐍',dragon:'🐉',unicorn:'🦄',
  butterfly:'🦋',bee:'🐝',bug:'🐛',turtle:'🐢',octopus:'🐙',shark:'🦈',
  // Symbols & Objects
  star:'⭐',star2:'🌟',sparkles:'✨',dizzy:'💫',boom:'💥',tada:'🎉',
  balloon:'🎈',gift:'🎁',trophy:'🏆',crown:'👑',gem:'💎',
  moneybag:'💰',coin:'🪙',bell:'🔔',no_bell:'🔕',
  loudspeaker:'📢',mega:'📣',speech_balloon:'💬',thought_balloon:'💭',
  lock:'🔒',unlock:'🔓',key:'🔑',wrench:'🔧',gear:'⚙️',
  mag:'🔍',warning:'⚠️',no_entry:'⛔',x:'❌',
  white_check_mark:'✅',heavy_check_mark:'✔️',
  question:'❓',exclamation:'❗',information_source:'ℹ️',
  '100':'💯',infinity:'♾️',eyes:'👀',brain:'🧠',rocket:'🚀',airplane:'✈️',
  email:'📧',phone:'📱',computer:'💻',calendar:'📅',pencil:'✏️',
  link:'🔗',paperclip:'📎',scissors:'✂️',
  // Food
  pizza:'🍕',hamburger:'🍔',coffee:'☕',beer:'🍺',wine_glass:'🍷',
  // Spanish aliases (common in Spanish-speaking servers)
  campana:'🔔', fuego:'🔥', corazon:'❤️', estrella:'⭐',
  pulgar:'👍', celebracion:'🎉', corona:'👑', calavera:'💀',
  cohete:'🚀', avion:'✈️', llave:'🔑', engranaje:'⚙️',
  ojo:'👀', cerebro:'🧠', mariposa:'🦋', unicornio:'🦄',
};

// Module-level cache: emoji CDN URL per id+type → working URL or null (failed)
const _emojiCache = new Map<string, string | null>();

// Custom emoji from Discord CDN with fallback chain + session cache (no flicker on re-render)
function EmojiImg({ name, id, animated }: { name: string; id: string; animated?: boolean }) {
  const cacheKey = `${id}:${animated ? 'a' : 's'}`;
  const URLS = animated
    ? [
        `https://cdn.discordapp.com/emojis/${id}.gif?size=64&quality=lossless`,
        `https://cdn.discordapp.com/emojis/${id}.gif`,
        `https://cdn.discordapp.com/emojis/${id}.webp?animated=true&size=64`,
        `https://cdn.discordapp.com/emojis/${id}.png`,
      ]
    : [
        `https://cdn.discordapp.com/emojis/${id}.png`,
        `https://cdn.discordapp.com/emojis/${id}.webp`,
      ];

  // Lazy init from cache so re-mounts (e.g. on selection change) start at the known-good URL
  const [idx, setIdx] = React.useState<number>(() => {
    const cached = _emojiCache.get(cacheKey);
    if (cached === null) return URLS.length;        // previously failed → skip to fallback
    if (cached) {
      const i = URLS.indexOf(cached);
      return i >= 0 ? i : 0;                        // start from the URL that worked before
    }
    return 0;
  });

  if (idx >= URLS.length) {
    return <span style={{ background: '#2b2d31', borderRadius: 3, padding: '0 3px', fontSize: '0.85em', color: '#b5bac1' }}>:{name}:</span>;
  }
  return (
    <img
      key={cacheKey + idx}
      src={URLS[idx]}
      style={EM_S}
      alt={`:${name}:`}
      title={`:${name}: (${animated ? 'animado' : 'estático'})`}
      onLoad={() => { _emojiCache.set(cacheKey, URLS[idx]); }}
      onError={() => {
        const next = idx + 1;
        if (next >= URLS.length) _emojiCache.set(cacheKey, null);
        setIdx(next);
      }}
    />
  );
}

type IPat = { re: RegExp; fn: (full: string, g1: string, g2: string) => React.ReactNode; terminal?: boolean };

const IPATS: IPat[] = [
  // inline code (terminal)
  { re: /`([^`\n]+)`/g,              fn: (_, c) => <code style={CO_S}>{c}</code>, terminal: true },
  // spoiler
  { re: /\|\|([^|]+)\|\|/g,          fn: (_, t) => <span style={{ background: '#111', color: 'transparent', borderRadius: 3, padding: '0 3px', userSelect: 'none' }} title={t}>▒▒▒</span>, terminal: true },
  // bold+italic, bold, underline, italic, strikethrough
  { re: /\*\*\*([^*\n]+)\*\*\*/g,    fn: (_, t) => <strong><em>{t}</em></strong> },
  { re: /\*\*([^*\n]+)\*\*/g,        fn: (_, t) => <strong>{t}</strong> },
  { re: /__([^_\n]+)__/g,            fn: (_, t) => <u>{t}</u> },
  { re: /\*([^*\n]+)\*/g,            fn: (_, t) => <em>{t}</em> },
  { re: /_([^_\n]+)_/g,              fn: (_, t) => <em>{t}</em> },
  { re: /~~([^~\n]+)~~/g,            fn: (_, t) => <span style={{ textDecoration: 'line-through', opacity: .65 }}>{t}</span> },
  // Discord CDN custom emojis  <a:name:id>  <:name:id>
  { re: /<a:([^:>]+):(\d+)>/g,       fn: (_, name, id) => <EmojiImg name={name} id={id} animated />, terminal: true },
  { re: /<:([^:>]+):(\d+)>/g,        fn: (_, name, id) => <EmojiImg name={name} id={id} />, terminal: true },
  // Unicode shortcodes  :bell:  :campana:  etc.
  { re: /:([a-zA-Z0-9_+\-]+):/g,     fn: (_, name) => {
      const emoji = EMOJIS[name.toLowerCase()];
      if (emoji) return <span style={{ fontFamily: EMO_FONT }}>{emoji}</span>;
      return <span style={{ opacity: .55, fontSize: '.85em' }}>:{name}:</span>;
    }, terminal: true },
  // Discord snowflake mentions
  { re: /<@!?(\d+)>/g,               fn: () => <span style={M_S}>@usuario</span>, terminal: true },
  { re: /<#(\d+)>/g,                  fn: () => <span style={M_S}>#canal</span>, terminal: true },
  { re: /<@&(\d+)>/g,                 fn: () => <span style={M_S}>@rol</span>, terminal: true },
  // plain-text @everyone / @here
  { re: /@(everyone|here)\b/g,        fn: (_, w) => <span style={ME_S}>@{w}</span>, terminal: true },
  // plain-text @palabra → chip
  { re: /@([a-zA-Z0-9_.]{1,32})\b/g,  fn: (_, w) => <span style={M_S}>@{w}</span>, terminal: true },
  // links
  { re: /(https?:\/\/[^\s<>)"]+)/g,   fn: (_, u) => <a href={u} target="_blank" rel="noreferrer" style={{ color: '#00aafc', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>{u}</a>, terminal: true },
];

let _k = 0;
function applyInline(text: string, pats: IPat[]): React.ReactNode[] {
  if (!text) return [];
  if (!pats.length) return [text];
  const { re, fn, terminal } = pats[0];
  const rest = pats.slice(1);
  const fresh = new RegExp(re.source, 'g');
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = fresh.exec(text)) !== null) {
    if (m.index > last) out.push(...applyInline(text.slice(last, m.index), rest));
    // pass ALL captured groups to fn; for non-terminal, recurse the first group
    const g1 = terminal ? (m[1] ?? '') : (applyInline(m[1] ?? '', rest) as any);
    const g2 = m[2] ?? '';
    out.push(<React.Fragment key={_k++}>{fn(m[0], g1, g2)}</React.Fragment>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(...applyInline(text.slice(last), rest));
  return out;
}

function renderInline(text: string): React.ReactNode {
  return <>{applyInline(text, IPATS)}</>;
}

function renderMarkdown(raw: string): React.ReactNode {
  if (!raw) return <span style={{ color: '#5c5f66', fontStyle: 'italic' }}>Texto vacío</span>;
  const lines = raw.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      blocks.push(<pre key={_k++} style={CB_S}>{codeLines.join('\n')}</pre>);
      i++;
      continue;
    }

    // -# subtext (Discord small footer text)
    if (line.startsWith('-# ')) {
      blocks.push(<div key={_k++} style={{ fontSize: 12, color: '#80848e', lineHeight: 1.375, fontFamily: EMO_FONT, margin: '1px 0' }}>{renderInline(line.slice(3))}</div>);
    // headings
    } else if (line.startsWith('### ')) {
      blocks.push(<div key={_k++} style={{ fontSize: 15, fontWeight: 700, color: '#f2f3f5', margin: '6px 0 2px', lineHeight: 1.2, fontFamily: EMO_FONT }}>{renderInline(line.slice(4))}</div>);
    } else if (line.startsWith('## ')) {
      blocks.push(<div key={_k++} style={{ fontSize: 20, fontWeight: 700, color: '#f2f3f5', margin: '10px 0 4px', lineHeight: 1.2, fontFamily: EMO_FONT }}>{renderInline(line.slice(3))}</div>);
    } else if (line.startsWith('# ')) {
      blocks.push(<div key={_k++} style={{ fontSize: 24, fontWeight: 700, color: '#f2f3f5', margin: '12px 0 4px', lineHeight: 1.2, fontFamily: EMO_FONT }}>{renderInline(line.slice(2))}</div>);
    // blockquote
    } else if (line.startsWith('> ')) {
      blocks.push(
        <div key={_k++} style={{ borderLeft: '4px solid #4e5058', paddingLeft: 10, color: '#dbdee1', margin: '2px 0', lineHeight: 1.375, fontFamily: EMO_FONT }}>
          {renderInline(line.slice(2))}
        </div>
      );
    // bullet list
    } else if (/^[-*] /.test(line)) {
      blocks.push(
        <div key={_k++} style={{ display: 'flex', gap: 6, lineHeight: 1.375, paddingLeft: 4, fontFamily: EMO_FONT }}>
          <span style={{ color: '#b5bac1', flexShrink: 0 }}>•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    // empty line → spacer
    } else if (line === '') {
      blocks.push(<div key={_k++} style={{ height: 6 }} />);
    } else {
      blocks.push(<div key={_k++} style={{ lineHeight: 1.375, color: '#dbdee1', fontFamily: EMO_FONT }}>{renderInline(line)}</div>);
    }
    i++;
  }
  return <>{blocks}</>;
}

// ── Selectable wrapper ────────────────────────────────────────────────────────

function Sel({ node, children, block }: { node: any; children: React.ReactNode; block?: boolean }) {
  const { sel, pick } = useContext(Ctx);
  const isSel = sel === node._id;
  return (
    <div
      className={`preview-sel${isSel ? ' preview-sel-active' : ''}`}
      style={block ? undefined : { display: 'contents' }}
      onClick={e => { e.stopPropagation(); pick(node._id); }}
    >
      {children}
    </div>
  );
}

// ── Leaf renderers ────────────────────────────────────────────────────────────

function PText({ node }: { node: any }) {
  return (
    <Sel node={node} block>
      <div style={{ padding: '4px 14px' }}>{renderMarkdown(node.content ?? '')}</div>
    </Sel>
  );
}

function PDivider({ node }: { node: any }) {
  return (
    <Sel node={node} block>
      <div style={{ margin: node.spacing === 2 ? '8px 14px' : '2px 14px', height: node.divider === false ? 6 : 0, borderTop: node.divider === false ? 'none' : '1px solid #3f4147' }} />
    </Sel>
  );
}

const BTN_BG: Record<number, string>    = { 1: '#5865f2', 2: '#4e5058', 3: '#2d7d46', 4: '#c0392b', 5: '#4e5058' };
const BTN_HOV: Record<number, string>   = { 1: '#4752c4', 2: '#6d6f78', 3: '#248045', 4: '#a12d21', 5: '#6d6f78' };
const BTN_ACT: Record<number, string>   = { 1: '#3c45a5', 2: '#404249', 3: '#1a6334', 4: '#8a2418', 5: '#404249' };

function PButton({ node }: { node: any }) {
  const [hov, setHov] = React.useState(false);
  const [act, setAct] = React.useState(false);
  const bg = act ? (BTN_ACT[node.style] ?? '#3c3d42') : hov ? (BTN_HOV[node.style] ?? '#5c5f66') : (BTN_BG[node.style] ?? '#4e5058');
  return (
    <Sel node={node} block>
      <div
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 16px', borderRadius: 4, background: bg, color: '#fff', fontSize: 14, fontWeight: 500, opacity: node.disabled ? .4 : 1, cursor: node.disabled ? 'not-allowed' : 'pointer', transform: act ? 'scale(0.95)' : 'scale(1)', transition: 'background 80ms, transform 60ms', userSelect: 'none' }}
        onMouseEnter={() => { if (!node.disabled) setHov(true); }}
        onMouseLeave={() => { setHov(false); setAct(false); }}
        onMouseDown={() => { if (!node.disabled) setAct(true); }}
        onMouseUp={() => setAct(false)}
      >
        {node.emoji && <span>{node.emoji.name}</span>}
        {node.label || 'Button'}
      </div>
    </Sel>
  );
}

const SEL_DEFAULTS: Record<number, string> = {
  3: 'Seleccionar…', 5: 'Seleccionar usuarios…',
  6: 'Seleccionar roles…', 7: 'Seleccionar usuarios o roles…', 8: 'Seleccionar canales…',
};
const SEL_BADGE: Record<number, string> = { 5: '👤', 6: '🎭', 7: '💬', 8: '#' };
const SEL_LABEL: Record<number, string> = { 5: 'Usuarios', 6: 'Roles', 7: 'Usuarios o roles', 8: 'Canales' };

function SelectDropdown({ anchorRef, open, onClose, isText, opts, selected, onToggle, badge, node }: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  open: boolean; onClose: () => void;
  isText: boolean; opts: Array<{ label: string; value: string; description?: string }>;
  selected: string[]; onToggle: (v: string) => void;
  badge?: string; node: any;
}) {
  const [rect, setRect] = React.useState<DOMRect | null>(null);

  React.useLayoutEffect(() => {
    if (open && anchorRef.current) setRect(anchorRef.current.getBoundingClientRect());
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (anchorRef.current && anchorRef.current.contains(e.target as Node)) return;
      onClose();
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (!open || !rect) return null;

  const dropStyle: React.CSSProperties = {
    position: 'fixed',
    top: rect.bottom,
    left: rect.left,
    width: rect.width,
    background: '#111214',
    border: '1px solid #5865f2',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    zIndex: 9999,
    maxHeight: 200,
    overflowY: 'auto',
  };

  return ReactDOM.createPortal(
    <div style={dropStyle}>
      {isText && opts.length > 0 && opts.map((opt, i) => {
        const isSel = selected.includes(opt.value);
        return (
          <div
            key={i}
            onClick={e => { e.stopPropagation(); onToggle(opt.value); }}
            style={{ padding: '10px 12px', cursor: 'pointer', background: isSel ? 'rgba(88,101,242,.25)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
            onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isSel ? 'rgba(88,101,242,.25)' : 'transparent'; }}
          >
            <div>
              <div style={{ color: '#dbdee1', fontSize: 14, fontWeight: isSel ? 600 : 400 }}>{opt.label}</div>
              {opt.description && <div style={{ color: '#80848e', fontSize: 12, marginTop: 2 }}>{opt.description}</div>}
            </div>
            {isSel && <span style={{ color: '#5865f2', fontSize: 13, fontWeight: 700 }}>✓</span>}
          </div>
        );
      })}
      {isText && opts.length === 0 && (
        <div style={{ padding: '12px', textAlign: 'center', color: '#80848e', fontSize: 13 }}>
          Sin opciones — añade opciones en el panel derecho
        </div>
      )}
      {!isText && (
        <div style={{ padding: '12px', color: '#80848e', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          {badge && <span style={{ fontSize: 16 }}>{badge}</span>}
          <span>Selección de <strong style={{ color: '#b5bac1' }}>{SEL_LABEL[node.type]}</strong> — solo disponible en Discord</span>
        </div>
      )}
    </div>,
    document.body
  );
}

function PSelectMenu({ node }: { node: any }) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>([]);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const isText = node.type === 3;
  const opts: Array<{ label: string; value: string; description?: string }> = isText ? (node.options ?? []) : [];
  const badge = SEL_BADGE[node.type];
  const placeholder = node.placeholder || SEL_DEFAULTS[node.type] || 'Seleccionar…';
  const displayLabel = selected.length ? selected.join(', ') : placeholder;

  const toggle = (value: string) => {
    setSelected(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  return (
    <Sel node={node} block>
      <div style={{ position: 'relative', width: '100%' }}>
        <div
          ref={triggerRef}
          style={{ background: open ? '#111214' : '#1e1f22', border: `1px solid ${open ? '#5865f2' : '#3f4147'}`, borderRadius: 4, padding: '9px 12px', color: selected.length ? '#dbdee1' : '#b5bac1', fontSize: 14, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'border-color 80ms, background 80ms', boxSizing: 'border-box' }}
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {badge && <span style={{ fontSize: 13, flexShrink: 0 }}>{badge}</span>}
            {displayLabel}
          </span>
          <span style={{ opacity: .6, flexShrink: 0, transition: 'transform 120ms', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
        </div>
        <SelectDropdown
          anchorRef={triggerRef}
          open={open} onClose={() => setOpen(false)}
          isText={isText} opts={opts}
          selected={selected} onToggle={toggle}
          badge={badge} node={node}
        />
      </div>
    </Sel>
  );
}

function PActionRow({ node }: { node: any }) {
  return (
    <Sel node={node} block>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '6px 14px' }}>
        {(node.components ?? []).map((c: any, i: number) =>
          c.type === 2 ? <PButton key={i} node={c} /> : <PSelectMenu key={i} node={c} />
        )}
        {!(node.components?.length) && <span style={{ color: '#5c5f66', fontSize: 12, fontStyle: 'italic' }}>Action Row vacío</span>}
      </div>
    </Sel>
  );
}

function PThumbnail({ node }: { node: any }) {
  const [err, setErr] = React.useState(false);
  const url = node.media?.url;
  React.useEffect(() => { setErr(false); }, [url]);
  const ph = (label: string) => (
    <div style={{ width: 80, height: 80, borderRadius: 4, background: '#1e1f22', border: '1px dashed #3f4147', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#5c5f66', gap: 3 }}>
      {label === 'error' ? <>⚠<br/>Error</> : 'Sin URL'}
    </div>
  );
  if (!url) return ph('empty');
  if (err)  return ph('error');
  return (
    <img src={url}
      style={{ width: 80, height: 80, borderRadius: 4, objectFit: 'cover', display: 'block' }}
      alt={node.description ?? ''}
      onError={() => { setErr(true); addToast('No se pudo cargar la imagen del thumbnail', 'warn'); }}
    />
  );
}

function PSection({ node }: { node: any }) {
  const text = node.components?.[0];
  const acc = node.accessory;
  return (
    <Sel node={node} block>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 14px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {text ? renderMarkdown(text.content ?? '') : <span style={{ color: '#5c5f66', fontStyle: 'italic', fontSize: 12 }}>Texto vacío</span>}
        </div>
        {acc && (
          <div style={{ flexShrink: 0 }}>
            {acc.type === 11 ? <PThumbnail node={acc} /> : acc.type === 2 ? <PButton node={acc} /> : null}
          </div>
        )}
      </div>
    </Sel>
  );
}

function GalleryImg({ item, idx }: { item: any; idx: number }) {
  const [err, setErr] = React.useState(false);
  React.useEffect(() => { setErr(false); }, [item.media?.url]);
  const baseStyle: React.CSSProperties = { width: '100%', aspectRatio: '16/9', borderRadius: 4 };
  if (!item.media?.url || err) {
    return (
      <div style={{ ...baseStyle, background: '#1e1f22', border: '1px dashed #3f4147', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#5c5f66', gap: 2 }}>
        {err ? <>⚠<br/>Error img {idx + 1}</> : 'Sin URL'}
      </div>
    );
  }
  return (
    <img src={item.media.url}
      style={{ ...baseStyle, objectFit: 'cover' }}
      alt={item.description ?? ''}
      onError={() => { setErr(true); addToast(`Imagen ${idx + 1} de la galería no se pudo cargar`, 'warn'); }}
    />
  );
}

function PGallery({ node }: { node: any }) {
  const items: any[] = node.items ?? [];
  const n = items.length;
  const cols = n <= 1 ? '1fr' : n <= 2 ? '1fr 1fr' : '1fr 1fr 1fr';
  return (
    <Sel node={node} block>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 3, padding: '6px 14px' }}>
        {items.map((it: any, i: number) => <GalleryImg key={i} item={it} idx={i} />)}
      </div>
    </Sel>
  );
}

function PContainerChild({ node }: { node: any }) {
  switch (node.type) {
    case 10: return <PText node={node} />;
    case 14: return <PDivider node={node} />;
    case 9:  return <PSection node={node} />;
    case 12: return <PGallery node={node} />;
    case 1:  return <PActionRow node={node} />;
    default: return null;
  }
}

function PContainer({ node }: { node: any }) {
  const { sel } = useContext(Ctx);
  const accent = node.accent_color != null ? '#' + node.accent_color.toString(16).padStart(6, '0') : undefined;
  const isSel = sel === node._id;
  const bC = isSel ? '#5865f2' : '#3f4147';
  const bW = isSel ? 2 : 1;
  return (
    <Sel node={node} block>
      <div style={{
        borderRadius: 8,
        borderTop:    `${bW}px solid ${bC}`,
        borderRight:  `${bW}px solid ${bC}`,
        borderBottom: `${bW}px solid ${bC}`,
        borderLeft:   accent ? `4px solid ${accent}` : `${bW}px solid ${bC}`,
        background: '#2b2d31',
        marginBottom: 4,
        filter: node.spoiler ? 'blur(5px)' : undefined,
        overflow: 'hidden',
      }}>
        {(node.components ?? []).map((c: any, i: number) => <PContainerChild key={i} node={c} />)}
        {!(node.components?.length) && (
          <div style={{ padding: '16px 14px', color: '#5c5f66', fontSize: 12, fontStyle: 'italic', textAlign: 'center' }}>Container vacío — agrega elementos con el "+"</div>
        )}
      </div>
    </Sel>
  );
}

// ── Bot message frame ─────────────────────────────────────────────────────────

export interface BotInfo { username: string; avatar: string | null }

// ── Root ──────────────────────────────────────────────────────────────────────

interface Props {
  nodes: RootNode[];
  selected: string | null;
  onSelect: (id: string) => void;
  botInfo?: BotInfo | null;
}

export default function Preview({ nodes, selected, onSelect, botInfo }: Props) {
  const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  return (
    <Ctx.Provider value={{ sel: selected, pick: onSelect }}>
      <div className="preview-wrapper">
        {/* Discord message frame */}
        <div style={{ display: 'flex', gap: 16, padding: '4px 0 16px' }}>
          {/* Avatar */}
          <div style={{ flexShrink: 0, paddingTop: 2 }}>
            {botInfo?.avatar
              ? <img src={botInfo.avatar} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} alt="" />
              : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#5865f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 17 }}>
                  {botInfo?.username?.[0]?.toUpperCase() ?? 'B'}
                </div>
            }
          </div>
          {/* Body */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{botInfo?.username ?? 'Bot'}</span>
              <span style={{ background: '#5865f2', color: '#fff', borderRadius: 3, padding: '0 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px' }}>BOT</span>
              <span style={{ color: '#80848e', fontSize: 12 }}>Hoy a las {now}</span>
            </div>
            {/* Components */}
            {nodes.length === 0 && (
              <div style={{ color: '#5c5f66', fontSize: 14, fontStyle: 'italic', marginTop: 8 }}>
                Agrega un Container o Action Row para comenzar…
              </div>
            )}
            {(nodes as any[]).map((n: any, i: number) => {
              if (n.type === 17) return <PContainer key={i} node={n} />;
              if (n.type === 1)  return <PActionRow key={i} node={n} />;
              if (n.type === 10) return (
                <Sel key={i} node={n} block>
                  <div style={{ padding: '2px 0', fontFamily: EMO_FONT }}>{renderMarkdown(n.content ?? '')}</div>
                </Sel>
              );
              if (n.type === 14) return <PDivider key={i} node={n} />;
              if (n.type === 9)  return <PSection key={i} node={n} />;
              if (n.type === 12) return <PGallery key={i} node={n} />;
              return null;
            })}
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
