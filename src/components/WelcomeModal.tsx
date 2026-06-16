import React, { useState } from 'react';
import { IcBox, IcLayout, IcSend, IcText, IcHelpCircle, IcUser, Fi } from './Icons';
import { useT } from '../lib/i18n';

interface Props { onClose: () => void }

const VERSION = '1.3.0';

type PageDef = { title: string; subtitle: string; icon: React.ReactNode };
type LangContent = {
  pages: PageDef[];
  welcome: { author: string; contact: string; version: string; desc: React.ReactNode };
  step1: { badge: string; desc: string; items: [string, string][]; tip: string };
  step2: { badge: string; desc: string; items: [string, string][] };
  step3: { badge: string; desc: string; items: [string, string][]; tip: string };
  step4: { badge: string; desc: React.ReactNode; items: [React.ReactNode, string][]; tip: string };
  prev: string; next: string; start: string; done: string;
};

const CONTENT: Record<string, LangContent> = {
  es: {
    pages: [
      { title: 'Discord Component Builder', subtitle: 'Herramienta de componentes V2', icon: <IcBox size={22} /> },
      { title: 'Paso 1: Agregar componentes',   subtitle: 'Panel izquierdo',             icon: <IcLayout size={22} /> },
      { title: 'Paso 2: Editar propiedades',    subtitle: 'Panel derecho',               icon: <IcText size={22} /> },
      { title: 'Paso 3: Preview en tiempo real',subtitle: 'Panel central',               icon: <IcHelpCircle size={22} /> },
      { title: 'Paso 4: Enviar el mensaje',     subtitle: 'Bot Token o Webhook',         icon: <IcSend size={22} /> },
    ],
    welcome: {
      author: 'Autor', contact: 'Contacto', version: 'Versión',
      desc: <>Crea mensajes con <strong style={{ color: '#dbdee1' }}>componentes V2 de Discord</strong> visualmente.<br />Diseña Containers, Secciones, Botones, Galerías y más — sin tocar código.<br />Envía usando tu <strong style={{ color: '#dbdee1' }}>Bot Token</strong> o un <strong style={{ color: '#dbdee1' }}>Webhook</strong>.</>,
    },
    step1: {
      badge: 'Panel izquierdo',
      desc: 'Desde aquí construyes la estructura del mensaje.',
      items: [
        ['Container', 'Bloque principal del mensaje V2. Puede tener color de acento lateral.'],
        ['Action Row', 'Fila de botones o un select menu. Máx. 5 botones O 1 select.'],
        ['Texto', 'Texto con markdown de Discord (# heading, **bold**, *italic*, emojis…).'],
        ['Section', 'Texto acompañado de un thumbnail o botón a la derecha.'],
        ['Gallery', 'Cuadrícula de hasta 10 imágenes.'],
        ['Divider', 'Separador horizontal con espaciado configurable.'],
      ],
      tip: 'Usa el "+" junto a un Container para agregar elementos dentro de él.',
    },
    step2: {
      badge: 'Panel derecho',
      desc: 'Selecciona cualquier nodo para editar sus propiedades aquí.',
      items: [
        ['Markdown', '# Heading, **bold**, *italic*, __underline__, ~~tachado~~, `código`, ||spoiler||.'],
        ['Emojis Unicode', ':campana: :fuego: :corazon: — más de 100 shortcodes incluidos.'],
        ['Emojis custom', '<:nombre:id> o <a:nombre:id> para animados.'],
        ['Menciones', '@usuario, @rol, @everyone — se renderizan como chips.'],
        ['Botones', 'Asigna un Custom ID (obligatorio, excepto tipo Link).'],
        ['Select menus', 'Tipos: texto, usuarios, roles, menciones o canales.'],
      ],
    },
    step3: {
      badge: 'Panel central',
      desc: 'Visualiza el mensaje tal como aparecerá en Discord, en tiempo real.',
      items: [
        ['Click para seleccionar', 'Haz clic en cualquier elemento del preview para seleccionarlo.'],
        ['Bot frame', 'El avatar y nombre del bot se cargan automáticamente con el token.'],
        ['Markdown live', 'Headings, bold, cursiva, emojis y shortcodes se renderizan al instante.'],
        ['Outline azul', 'El borde azul indica el componente actualmente seleccionado.'],
      ],
      tip: 'El estado se guarda en la URL — puedes copiar el link para compartirlo.',
    },
    step4: {
      badge: 'Envío',
      desc: <>Envía el mensaje usando <strong style={{ color: '#dbdee1' }}>Bot Token</strong> o <strong style={{ color: '#dbdee1' }}>Webhook</strong>.</>,
      items: [
        [<><Fi name="robot" style={{ marginRight: 4 }} />Bot Token</>, 'Token del bot + Channel ID. El bot publica el mensaje en el canal.'],
        [<><Fi name="link" style={{ marginRight: 4 }} />Webhook</>, 'Solo la URL del webhook. No necesitas un bot configurado.'],
        ['Pings ON/OFF', 'Controla si las menciones (@usuario, @rol) generan notificaciones.'],
        ['Exportar JSON', 'Descarga el JSON para usarlo directamente con la API de Discord.'],
        ['▶ Enviar', 'Valida los componentes automáticamente antes de enviar.'],
      ],
      tip: 'Los Action Rows no pueden mezclar botones y select menus — el builder lo valida antes de enviar.',
    },
    prev: '← Anterior', next: 'Siguiente →', start: 'Ver tutorial →', done: '¡Listo! ✓',
  },
  en: {
    pages: [
      { title: 'Discord Component Builder', subtitle: 'Components V2 tool',   icon: <IcBox size={22} /> },
      { title: 'Step 1: Add components',    subtitle: 'Left panel',            icon: <IcLayout size={22} /> },
      { title: 'Step 2: Edit properties',   subtitle: 'Right panel',           icon: <IcText size={22} /> },
      { title: 'Step 3: Live preview',      subtitle: 'Center panel',          icon: <IcHelpCircle size={22} /> },
      { title: 'Step 4: Send the message',  subtitle: 'Bot Token or Webhook',  icon: <IcSend size={22} /> },
    ],
    welcome: {
      author: 'Author', contact: 'Contact', version: 'Version',
      desc: <>Build messages with <strong style={{ color: '#dbdee1' }}>Discord Components V2</strong> visually.<br />Design Containers, Sections, Buttons, Galleries and more — no code needed.<br />Send using your <strong style={{ color: '#dbdee1' }}>Bot Token</strong> or a <strong style={{ color: '#dbdee1' }}>Webhook</strong>.</>,
    },
    step1: {
      badge: 'Left panel',
      desc: 'Build the message structure from here.',
      items: [
        ['Container', 'Main block of a V2 message. Can have a lateral accent color.'],
        ['Action Row', 'Row of buttons or a select menu. Max 5 buttons OR 1 select.'],
        ['Text', 'Text with Discord markdown (# heading, **bold**, *italic*, emojis…).'],
        ['Section', 'Text with a thumbnail or button accessory on the right.'],
        ['Gallery', 'Grid of up to 10 images.'],
        ['Divider', 'Horizontal separator with configurable spacing.'],
      ],
      tip: 'Use the "+" next to a Container to add elements inside it.',
    },
    step2: {
      badge: 'Right panel',
      desc: 'Select any node to edit its properties here.',
      items: [
        ['Markdown', '# Heading, **bold**, *italic*, __underline__, ~~strike~~, `code`, ||spoiler||.'],
        ['Unicode emojis', ':bell: :fire: :heart: — over 100 shortcodes included.'],
        ['Custom emojis', '<:name:id> or <a:name:id> for animated.'],
        ['Mentions', '@user, @role, @everyone — rendered as chips.'],
        ['Buttons', 'Assign a Custom ID (required, except for Link type).'],
        ['Select menus', 'Types: text, users, roles, mentions or channels.'],
      ],
    },
    step3: {
      badge: 'Center panel',
      desc: 'See the message exactly as it will appear in Discord, in real time.',
      items: [
        ['Click to select', 'Click any element in the preview to select it.'],
        ['Bot frame', 'Bot avatar and name are loaded automatically with the token.'],
        ['Live markdown', 'Headings, bold, italic, emojis and shortcodes render instantly.'],
        ['Blue outline', 'The blue border marks the currently selected component.'],
      ],
      tip: 'State is saved in the URL — copy the link to share your build.',
    },
    step4: {
      badge: 'Sending',
      desc: <>Send the message using <strong style={{ color: '#dbdee1' }}>Bot Token</strong> or <strong style={{ color: '#dbdee1' }}>Webhook</strong>.</>,
      items: [
        [<><Fi name="robot" style={{ marginRight: 4 }} />Bot Token</>, 'Bot token + Channel ID. The bot posts the message in the channel.'],
        [<><Fi name="link" style={{ marginRight: 4 }} />Webhook</>, 'Just the webhook URL. No bot setup required.'],
        ['Pings ON/OFF', 'Controls whether mentions (@user, @role) send notifications.'],
        ['Export JSON', 'Download the JSON to use it directly with the Discord API.'],
        ['▶ Send', 'Components are validated automatically before sending.'],
      ],
      tip: 'Action Rows cannot mix buttons and select menus — the builder validates this before sending.',
    },
    prev: '← Back', next: 'Next →', start: 'View tutorial →', done: 'Done! ✓',
  },
  pt: {
    pages: [
      { title: 'Discord Component Builder', subtitle: 'Ferramenta de componentes V2', icon: <IcBox size={22} /> },
      { title: 'Passo 1: Adicionar componentes', subtitle: 'Painel esquerdo',          icon: <IcLayout size={22} /> },
      { title: 'Passo 2: Editar propriedades',   subtitle: 'Painel direito',           icon: <IcText size={22} /> },
      { title: 'Passo 3: Preview em tempo real',  subtitle: 'Painel central',          icon: <IcHelpCircle size={22} /> },
      { title: 'Passo 4: Enviar a mensagem',      subtitle: 'Bot Token ou Webhook',    icon: <IcSend size={22} /> },
    ],
    welcome: {
      author: 'Autor', contact: 'Contato', version: 'Versão',
      desc: <>Crie mensagens com <strong style={{ color: '#dbdee1' }}>componentes V2 do Discord</strong> visualmente.<br />Projete Containers, Seções, Botões, Galerias e mais — sem tocar em código.<br />Envie usando seu <strong style={{ color: '#dbdee1' }}>Bot Token</strong> ou um <strong style={{ color: '#dbdee1' }}>Webhook</strong>.</>,
    },
    step1: {
      badge: 'Painel esquerdo',
      desc: 'Construa a estrutura da mensagem a partir daqui.',
      items: [
        ['Container', 'Bloco principal da mensagem V2. Pode ter cor de destaque lateral.'],
        ['Action Row', 'Linha de botões ou um select menu. Máx. 5 botões OU 1 select.'],
        ['Texto', 'Texto com markdown do Discord (# heading, **bold**, *italic*, emojis…).'],
        ['Section', 'Texto com um thumbnail ou botão acessório à direita.'],
        ['Gallery', 'Grade de até 10 imagens.'],
        ['Divider', 'Separador horizontal com espaçamento configurável.'],
      ],
      tip: 'Use o "+" ao lado de um Container para adicionar elementos dentro dele.',
    },
    step2: {
      badge: 'Painel direito',
      desc: 'Selecione qualquer nó para editar suas propriedades aqui.',
      items: [
        ['Markdown', '# Heading, **bold**, *italic*, __sublinhado__, ~~tachado~~, `código`, ||spoiler||.'],
        ['Emojis Unicode', ':sino: :fogo: :coração: — mais de 100 shortcodes incluídos.'],
        ['Emojis personalizados', '<:nome:id> ou <a:nome:id> para animados.'],
        ['Menções', '@usuário, @cargo, @everyone — renderizados como chips.'],
        ['Botões', 'Atribua um Custom ID (obrigatório, exceto tipo Link).'],
        ['Select menus', 'Tipos: texto, usuários, cargos, menções ou canais.'],
      ],
    },
    step3: {
      badge: 'Painel central',
      desc: 'Visualize a mensagem exatamente como aparecerá no Discord, em tempo real.',
      items: [
        ['Clique para selecionar', 'Clique em qualquer elemento do preview para selecioná-lo.'],
        ['Bot frame', 'O avatar e nome do bot são carregados automaticamente com o token.'],
        ['Markdown ao vivo', 'Headings, negrito, itálico, emojis e shortcodes renderizam na hora.'],
        ['Contorno azul', 'A borda azul indica o componente atualmente selecionado.'],
      ],
      tip: 'O estado é salvo na URL — copie o link para compartilhar seu build.',
    },
    step4: {
      badge: 'Envio',
      desc: <>Envie a mensagem usando <strong style={{ color: '#dbdee1' }}>Bot Token</strong> ou <strong style={{ color: '#dbdee1' }}>Webhook</strong>.</>,
      items: [
        [<><Fi name="robot" style={{ marginRight: 4 }} />Bot Token</>, 'Token do bot + Channel ID. O bot publica a mensagem no canal.'],
        [<><Fi name="link" style={{ marginRight: 4 }} />Webhook</>, 'Apenas a URL do webhook. Não precisa de bot configurado.'],
        ['Pings ON/OFF', 'Controla se as menções (@usuário, @cargo) geram notificações.'],
        ['Exportar JSON', 'Baixe o JSON para usá-lo diretamente com a API do Discord.'],
        ['▶ Enviar', 'Os componentes são validados automaticamente antes de enviar.'],
      ],
      tip: 'Action Rows não podem misturar botões e select menus — o builder valida isso antes de enviar.',
    },
    prev: '← Anterior', next: 'Próximo →', start: 'Ver tutorial →', done: 'Pronto! ✓',
  },
};

export default function WelcomeModal({ onClose }: Props) {
  const { lang } = useT();
  const c = CONTENT[lang] ?? CONTENT.es;
  const [page, setPage] = useState(0);
  const total = c.pages.length;
  const isLast = page === total - 1;
  const isFirst = page === 0;
  const info = c.pages[page];

  const body = [
    // Page 0: welcome
    <div className="tutorial-step">
      <div className="welcome-card">
        <div className="welcome-card-row">
          <div className="welcome-card-icon"><IcUser size={16} /></div>
          <div><div className="welcome-card-label">{c.welcome.author}</div><div className="welcome-card-value">Liam</div></div>
        </div>
        <div className="welcome-card-row">
          <div className="welcome-card-icon"><Fi name="envelope" /></div>
          <div><div className="welcome-card-label">{c.welcome.contact}</div><div className="welcome-card-value" style={{ fontSize: 12 }}>contact@liamt.xyz</div></div>
        </div>
        <div className="welcome-card-row">
          <div className="welcome-card-icon"><Fi name="bookmark" /></div>
          <div><div className="welcome-card-label">{c.welcome.version}</div><div className="welcome-card-value">{VERSION}</div></div>
        </div>
      </div>
      <p style={{ color: '#b5bac1', fontSize: 13, lineHeight: 1.6 }}>{c.welcome.desc}</p>
    </div>,
    // Page 1: step 1
    <div className="tutorial-step">
      <div className="tutorial-step-badge"><IcBox size={12} /> {c.step1.badge}</div>
      <div className="tutorial-step-desc">{c.step1.desc}</div>
      <div className="tutorial-step-list">
        {c.step1.items.map(([n, d]) => (
          <div key={n} className="tutorial-step-item">
            <div className="tutorial-step-item-dot" />
            <span><strong style={{ color: '#dbdee1' }}>{n}</strong> — {d}</span>
          </div>
        ))}
      </div>
      <div className="tutorial-tip"><Fi name="bulb" /> {c.step1.tip}</div>
    </div>,
    // Page 2: step 2
    <div className="tutorial-step">
      <div className="tutorial-step-badge"><IcText size={12} /> {c.step2.badge}</div>
      <div className="tutorial-step-desc">{c.step2.desc}</div>
      <div className="tutorial-step-list">
        {c.step2.items.map(([n, d]) => (
          <div key={n} className="tutorial-step-item">
            <div className="tutorial-step-item-dot" />
            <span><strong style={{ color: '#dbdee1' }}>{n}</strong> — {d}</span>
          </div>
        ))}
      </div>
    </div>,
    // Page 3: step 3
    <div className="tutorial-step">
      <div className="tutorial-step-badge"><IcHelpCircle size={12} /> {c.step3.badge}</div>
      <div className="tutorial-step-desc">{c.step3.desc}</div>
      <div className="tutorial-step-list">
        {c.step3.items.map(([n, d]) => (
          <div key={n} className="tutorial-step-item">
            <div className="tutorial-step-item-dot" />
            <span><strong style={{ color: '#dbdee1' }}>{n}</strong> — {d}</span>
          </div>
        ))}
      </div>
      <div className="tutorial-tip"><Fi name="bulb" /> {c.step3.tip}</div>
    </div>,
    // Page 4: step 4
    <div className="tutorial-step">
      <div className="tutorial-step-badge"><IcSend size={12} /> {c.step4.badge}</div>
      <div className="tutorial-step-desc">{c.step4.desc}</div>
      <div className="tutorial-step-list">
        {(c.step4.items as [React.ReactNode, string][]).map(([n, d], i) => (
          <div key={i} className="tutorial-step-item">
            <div className="tutorial-step-item-dot" />
            <span><strong style={{ color: '#dbdee1' }}>{n}</strong> — {d}</span>
          </div>
        ))}
      </div>
      <div className="tutorial-tip"><Fi name="triangle-warning" /> {c.step4.tip}</div>
    </div>,
  ];

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-header-icon">{info.icon}</div>
          <div className="modal-header-text">
            <h2>{info.title}</h2>
            <p>{info.subtitle}</p>
          </div>
        </div>
        <div className="modal-body">{body[page]}</div>
        <div className="modal-footer">
          <div className="modal-page-dots">
            {c.pages.map((_, i) => (
              <div key={i} className={`modal-page-dot ${i === page ? 'active' : ''}`}
                onClick={() => setPage(i)} style={{ cursor: 'pointer' }} />
            ))}
            <span style={{ fontSize: 11, color: '#80848e', marginLeft: 6 }}>{page + 1}/{total}</span>
          </div>
          {!isFirst && (
            <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setPage(p => p - 1)}>
              {c.prev}
            </button>
          )}
          {isLast ? (
            <button className="btn-primary" style={{ fontSize: 12, padding: '6px 16px' }} onClick={onClose}>{c.done}</button>
          ) : (
            <button className="btn-primary" style={{ fontSize: 12, padding: '6px 16px' }} onClick={() => setPage(p => p + 1)}>
              {isFirst ? c.start : c.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
