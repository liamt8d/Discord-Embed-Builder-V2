import React, { useState } from 'react';
import { IcBox, IcLayout, IcSend, IcText, IcHelpCircle, IcUser, Fi } from './Icons';

interface Props { onClose: () => void }

const PAGES = [
  { id: 'welcome', title: 'Discord Component Builder', subtitle: 'Herramienta de componentes V2', icon: <IcBox size={22} /> },
  { id: 'step1',   title: 'Paso 1: Agregar componentes',  subtitle: 'Panel izquierdo',      icon: <IcLayout size={22} /> },
  { id: 'step2',   title: 'Paso 2: Editar propiedades',   subtitle: 'Panel derecho',        icon: <IcText size={22} /> },
  { id: 'step3',   title: 'Paso 3: Preview en tiempo real', subtitle: 'Panel central',      icon: <IcHelpCircle size={22} /> },
  { id: 'step4',   title: 'Paso 4: Enviar el mensaje',    subtitle: 'Bot Token o Webhook',  icon: <IcSend size={22} /> },
];

function WelcomePage() {
  return (
    <div className="tutorial-step">
      <div className="welcome-card">
        <div className="welcome-card-row">
          <div className="welcome-card-icon"><IcUser size={16} /></div>
          <div>
            <div className="welcome-card-label">Autor</div>
            <div className="welcome-card-value">Liam</div>
          </div>
        </div>
        <div className="welcome-card-row">
          <div className="welcome-card-icon"><Fi name="envelope" /></div>
          <div>
            <div className="welcome-card-label">Contacto</div>
            <div className="welcome-card-value" style={{ fontSize: 12 }}>contact@liamt.xyz</div>
          </div>
        </div>
        <div className="welcome-card-row">
          <div className="welcome-card-icon"><Fi name="bookmark" /></div>
          <div>
            <div className="welcome-card-label">Versión</div>
            <div className="welcome-card-value">1.1.1</div>
          </div>
        </div>
      </div>
      <p style={{ color: '#b5bac1', fontSize: 13, lineHeight: 1.6 }}>
        Crea mensajes con <strong style={{ color: '#dbdee1' }}>componentes V2 de Discord</strong> visualmente.<br />
        Diseña Containers, Secciones, Botones, Galerías y más — sin tocar código.<br />
        Envía usando tu <strong style={{ color: '#dbdee1' }}>Bot Token</strong> o un <strong style={{ color: '#dbdee1' }}>Webhook</strong>.
      </p>
    </div>
  );
}

function Step1() {
  return (
    <div className="tutorial-step">
      <div className="tutorial-step-badge"><IcBox size={12} /> Panel izquierdo</div>
      <div className="tutorial-step-desc">Desde aquí construyes la estructura del mensaje.</div>
      <div className="tutorial-step-list">
        {[
          ['Container', 'Bloque principal del mensaje V2. Puede tener color de acento lateral.'],
          ['Action Row', 'Fila de botones o un select menu. Máx. 5 botones O 1 select.'],
          ['Texto', 'Texto con markdown de Discord (# heading, **bold**, *italic*, emojis…).'],
          ['Section', 'Texto acompañado de un thumbnail o botón a la derecha.'],
          ['Gallery', 'Cuadrícula de hasta 10 imágenes.'],
          ['Divider', 'Separador horizontal con espaciado configurable.'],
        ].map(([n, d]) => (
          <div key={n} className="tutorial-step-item">
            <div className="tutorial-step-item-dot" />
            <span><strong style={{ color: '#dbdee1' }}>{n}</strong> — {d}</span>
          </div>
        ))}
      </div>
      <div className="tutorial-tip"><Fi name="bulb" /> Usa el <strong>"+"</strong> junto a un Container para agregar elementos dentro de él.</div>
    </div>
  );
}

function Step2() {
  return (
    <div className="tutorial-step">
      <div className="tutorial-step-badge"><IcText size={12} /> Panel derecho</div>
      <div className="tutorial-step-desc">Selecciona cualquier nodo para editar sus propiedades aquí.</div>
      <div className="tutorial-step-list">
        {[
          ['Markdown', '# Heading, **bold**, *italic*, __underline__, ~~tachado~~, `código`, ||spoiler||.'],
          ['Emojis Unicode', ':campana: :fuego: :corazon: — más de 100 shortcodes incluidos.'],
          ['Emojis custom', '<:nombre:id> o <a:nombre:id> para animados.'],
          ['Menciones', '@usuario, @rol, @everyone — se renderizan como chips.'],
          ['Botones', 'Asigna un Custom ID (obligatorio, excepto tipo Link).'],
          ['Select menus', 'Tipos: texto, usuarios, roles, menciones o canales.'],
        ].map(([n, d]) => (
          <div key={n} className="tutorial-step-item">
            <div className="tutorial-step-item-dot" />
            <span><strong style={{ color: '#dbdee1' }}>{n}</strong> — {d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step3() {
  return (
    <div className="tutorial-step">
      <div className="tutorial-step-badge"><IcHelpCircle size={12} /> Panel central</div>
      <div className="tutorial-step-desc">Visualiza el mensaje tal como aparecerá en Discord, en tiempo real.</div>
      <div className="tutorial-step-list">
        {[
          ['Click para seleccionar', 'Haz clic en cualquier elemento del preview para seleccionarlo.'],
          ['Bot frame', 'El avatar y nombre del bot se cargan automáticamente con el token.'],
          ['Markdown live', 'Headings, bold, cursiva, emojis y shortcodes se renderizan al instante.'],
          ['Outline azul', 'El borde azul indica el componente actualmente seleccionado.'],
        ].map(([n, d]) => (
          <div key={n} className="tutorial-step-item">
            <div className="tutorial-step-item-dot" />
            <span><strong style={{ color: '#dbdee1' }}>{n}</strong> — {d}</span>
          </div>
        ))}
      </div>
      <div className="tutorial-tip"><Fi name="bulb" /> El estado se guarda en la URL — puedes copiar el link para compartirlo.</div>
    </div>
  );
}

function Step4() {
  return (
    <div className="tutorial-step">
      <div className="tutorial-step-badge"><IcSend size={12} /> Envío</div>
      <div className="tutorial-step-desc">Envía el mensaje usando <strong style={{ color: '#dbdee1' }}>Bot Token</strong> o <strong style={{ color: '#dbdee1' }}>Webhook</strong>.</div>
      <div className="tutorial-step-list">
        {([
          [<><Fi name="robot" style={{ marginRight: 4 }} />Bot Token</>, 'Token del bot + Channel ID. El bot publica el mensaje en el canal.'],
          [<><Fi name="link" style={{ marginRight: 4 }} />Webhook</>, 'Solo la URL del webhook. No necesitas un bot configurado.'],
          ['Pings ON/OFF', 'Controla si las menciones (@usuario, @rol) generan notificaciones.'],
          ['Exportar JSON', 'Descarga el JSON para usarlo directamente con la API de Discord.'],
          ['▶ Enviar', 'Valida los componentes automáticamente antes de enviar.'],
        ] as [React.ReactNode, string][]).map(([n, d], i) => (
          <div key={i} className="tutorial-step-item">
            <div className="tutorial-step-item-dot" />
            <span><strong style={{ color: '#dbdee1' }}>{n}</strong> — {d}</span>
          </div>
        ))}
      </div>
      <div className="tutorial-tip"><Fi name="triangle-warning" /> Los Action Rows no pueden mezclar botones y select menus — el builder lo valida antes de enviar.</div>
    </div>
  );
}

const PAGE_CONTENT = [<WelcomePage />, <Step1 />, <Step2 />, <Step3 />, <Step4 />];

export default function WelcomeModal({ onClose }: Props) {
  const [page, setPage] = useState(0);
  const total = PAGES.length;
  const isLast = page === total - 1;
  const isFirst = page === 0;
  const info = PAGES[page];

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
        <div className="modal-body">{PAGE_CONTENT[page]}</div>
        <div className="modal-footer">
          <div className="modal-page-dots">
            {PAGES.map((_, i) => (
              <div key={i} className={`modal-page-dot ${i === page ? 'active' : ''}`}
                onClick={() => setPage(i)} style={{ cursor: 'pointer' }} />
            ))}
            <span style={{ fontSize: 11, color: '#80848e', marginLeft: 6 }}>{page + 1}/{total}</span>
          </div>
          {!isFirst && (
            <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setPage(p => p - 1)}>
              ← Anterior
            </button>
          )}
          {isLast ? (
            <button className="btn-primary" style={{ fontSize: 12, padding: '6px 16px' }} onClick={onClose}>¡Listo! ✓</button>
          ) : (
            <button className="btn-primary" style={{ fontSize: 12, padding: '6px 16px' }} onClick={() => setPage(p => p + 1)}>
              {isFirst ? 'Ver tutorial →' : 'Siguiente →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
