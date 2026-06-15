import React from 'react';
import { Fi } from './Icons';

interface Props { onClose: () => void }

const CHANGELOG = [
  {
    version: '1.1.1',
    date: '2026-06-15',
    changes: [
      ['Botones interactivos', 'Los botones del preview ahora tienen hover, efecto de presión y cursor pointer.'],
      ['Select menus funcionales', 'Los select de texto muestran un dropdown real con las opciones definidas. Los de usuarios/roles/canales explican que son solo disponibles en Discord.'],
      ['Iconos UI (uicons)', 'Los emojis decorativos del UI fueron reemplazados por iconos de Flaticon uicons (solid rounded).'],
      ['Fix desbordamiento de texto', 'Texto largo sin espacios ya no rompe el ancho del container en el preview.'],
    ],
  },
  {
    version: '1.1.0',
    date: '2026-06-15',
    changes: [
      ['Webhook mejorado', 'Soporte completo de Components V2 via webhook (with_components=true, API v10).'],
      ['Thread ID', 'Envía mensajes directamente a hilos especificando el ID.'],
      ['Editar mensaje', 'Edita mensajes existentes del bot o del mismo webhook.'],
      ['Restaurar mensaje', 'Carga los componentes de un mensaje existente al editor.'],
      ['Preview webhook', 'El avatar y nombre del webhook aparecen en el preview al pegar la URL.'],
      ['SEO & OG', 'Meta tags y Open Graph para compartir el link en Discord/redes.'],
      ['UI más grande', 'Tamaño de fuente y paneles aumentados para mejor legibilidad.'],
    ],
  },
  {
    version: '1.0.0',
    date: '2026-06-15',
    changes: [
      ['Lanzamiento inicial', 'Primera versión pública del Discord Component Builder.'],
      ['Components V2', 'Container, Text, Section, Gallery, Divider, Action Row, Buttons y Selects.'],
      ['Bot Token', 'Envío de mensajes usando token de bot + Channel ID.'],
      ['Live preview', 'Renderizado en tiempo real del mensaje con estilo de Discord.'],
      ['Export JSON', 'Descarga el payload JSON para usar directamente con la API.'],
      ['URL state', 'El estado se guarda en el hash de la URL para compartir builds.'],
      ['Seguridad', 'Alerta al ingresar token o webhook URL por primera vez.'],
    ],
  },
];

export default function ChangelogModal({ onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div className="modal-header-icon" style={{ fontSize: 18 }}><Fi name="list" /></div>
          <div className="modal-header-text">
            <h2>Changelog</h2>
            <p>Historial de versiones</p>
          </div>
        </div>
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {CHANGELOG.map(({ version, date, changes }) => (
            <div key={version} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ background: '#5865f2', color: '#fff', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: 13 }}>
                  v{version}
                </span>
                <span style={{ color: '#4e5058', fontSize: 12 }}>{date}</span>
              </div>
              <div className="tutorial-step-list">
                {changes.map(([title, desc]) => (
                  <div key={title} className="tutorial-step-item">
                    <div className="tutorial-step-item-dot" />
                    <span><strong style={{ color: '#dbdee1' }}>{title}</strong> — {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="btn-primary" style={{ fontSize: 12, padding: '6px 16px' }} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
