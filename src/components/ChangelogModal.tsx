import React from 'react';
import { Fi } from './Icons';
import { useT } from '../lib/i18n';

interface Props { onClose: () => void }

type Entry = { version: string; date: string; changes: [string, string][] };

const CL: Record<string, Entry[]> = {
  es: [
    {
      version: '1.3.1', date: '2026-06-17',
      changes: [
        ['Responder mensaje', 'Campo "REPLY TO" en ambos builders: pegá el ID del mensaje a responder y el mensaje se envía como respuesta de Discord. Se oculta al editar.'],
        ['Export PNG real', 'El botón PNG ahora descarga directamente un archivo .png (2x) usando html2canvas — ya no abre la impresora/PDF.'],
        ['Alerta de credenciales persistente', 'La alerta de seguridad al escribir token/webhook ya no vuelve a aparecer al recargar la página (se guarda en localStorage).'],
        ['Icono de alerta corregido', 'El ícono de la ventana de alerta de credenciales ahora es amarillo en vez de azul.'],
        ['WelcomeModal multidioma', 'El tutorial de bienvenida ahora está traducido a ES/EN/PT y muestra la versión 1.3.0.'],
        ['Changelog multidioma', 'El historial de versiones ahora está disponible en ES/EN/PT.'],
        ['Embed Builder habilitado en V2', 'El botón "Embed normal" en el builder V2 ahora navega al Embed Builder en vez de mostrar "Próximamente".'],
        ['Preview del bot en Embed Builder', 'En modo Bot Token, el preview ahora carga automáticamente el avatar y nombre del bot desde el token.'],
      ],
    },
    {
      version: '1.3.0', date: '2026-06-15',
      changes: [
        ['Embed Builder (normal)', 'Nuevo builder dedicado para mensajes con embeds: content, hasta 10 embeds con todos los campos, link buttons, y webhook/bot mode.'],
        ['Webhook preview automático', 'Al pegar una webhook URL, el preview muestra automáticamente el avatar y nombre real del bot. Configurá overrides con la ventana de apariencia.'],
        ['Apariencia del webhook', 'Ventana para configurar username y avatar_url override del mensaje, con preview en vivo del bot.'],
        ['Picker de menciones/tiempo/emojis', 'Botón @#🕐 en la barra de formato: inserta menciones (@everyone, @here, canales, roles guardados), timestamps de Discord con 7 estilos, y emojis con búsqueda.'],
        ['<id:X> server links', 'Soporte completo de <id:browse>, <id:customize>, <id:guide> y <id:linked-roles> en el preview de ambos builders.'],
        ['Historial de envíos', 'Guarda los últimos 10 mensajes enviados con ID, modo y timestamp. Podés cargar el ID directo al editor.'],
        ['Templates', 'Guardá y cargá estados completos del builder. Persistidos en localStorage.'],
        ['Import desde Discord', 'Importá el JSON de un mensaje de Discord directamente al editor (content, embeds, components).'],
        ['Diff view', 'Compará el estado actual con el mensaje original al editar. Diff línea a línea con colores.'],
        ['Format toolbar', 'Barra de formato en todos los campos de texto: negrita, cursiva, subrayado, tachado, código, bloque de código, spoiler, cita.'],
        ['Link buttons en Embed Builder', 'Agregá filas de botones de link (type 2, style 5) a los mensajes del embed builder.'],
        ['Exportar PNG', 'Exporta el preview como PNG via ventana de impresión del navegador.'],
        ['Compact mode', 'Colapsa todos los mensajes del embed builder de una vez.'],
        ['Shortcuts', 'Ctrl+Enter para enviar, Ctrl+S para exportar JSON.'],
        ['Webhooks guardados', 'Manager de webhooks favoritos con nombre, selección rápida e indicador activo.'],
        ['Copy link', 'Copia el link con el estado actual al portapapeles desde el header.'],
      ],
    },
    {
      version: '1.2.0', date: '2026-06-15',
      changes: [
        ['Multi-mensaje', 'Agregá hasta N mensajes independientes desde las tabs "Mensajes" del panel izquierdo. El botón Enviar los manda todos en secuencia.'],
        ['Tabs de mensaje', 'Tabs Msg 1 / Msg 2 / … con indicador de componentes, botón + (verde) para agregar y ✕ (rojo) para eliminar el activo.'],
        ['Exportar múltiple', 'Cuando hay más de un mensaje, Exportar genera un array de JSON objects listos para la API.'],
        ['Límite de texto', 'Validación del total de caracteres por mensaje (límite Discord: 4000). Contador en tiempo real en el header (gris / amarillo / rojo).'],
        ['Contador por nodo', 'El editor de texto muestra X / 4000 con borde de color al acercarse o superar el límite.'],
        ['Fix Error 50035', 'Validación de thumbnails sin URL, gallery items sin URL y textos vacíos antes de enviar. El mensaje de error ahora muestra el campo específico que rechaza Discord.'],
        ['Fix markdown en blockquotes', 'Los bloques >>> y > ahora renderizan markdown completo (bullets, -#, headings, bold, etc.) en el preview.'],
      ],
    },
    {
      version: '1.1.1', date: '2026-06-15',
      changes: [
        ['Botones interactivos', 'Los botones del preview ahora tienen hover, efecto de presión y cursor pointer.'],
        ['Select menus funcionales', 'Los select de texto muestran un dropdown real con las opciones definidas. Los de usuarios/roles/canales explican que son solo disponibles en Discord.'],
        ['Iconos UI (uicons)', 'Los emojis decorativos del UI fueron reemplazados por iconos de Flaticon uicons (solid rounded).'],
        ['Fix desbordamiento de texto', 'Texto largo sin espacios ya no rompe el ancho del container en el preview.'],
      ],
    },
    {
      version: '1.1.0', date: '2026-06-15',
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
      version: '1.0.0', date: '2026-06-15',
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
  ],
  en: [
    {
      version: '1.3.1', date: '2026-06-17',
      changes: [
        ['Reply to message', '"REPLY TO" field in both builders: paste the target message ID and the message is sent as a Discord reply. Hidden when editing.'],
        ['Real PNG export', 'The PNG button now directly downloads a .png file (2x) using html2canvas — no more print dialog or PDF.'],
        ['Persistent credential warning', 'The security alert when entering a token/webhook no longer reappears after reloading the page (saved in localStorage).'],
        ['Warning icon color fixed', 'The credential warning modal icon is now yellow instead of blue.'],
        ['WelcomeModal multilingual', 'The welcome tutorial is now translated into ES/EN/PT and shows version 1.3.0.'],
        ['Changelog multilingual', 'The version history is now available in ES/EN/PT.'],
        ['Embed Builder enabled in V2', 'The "Normal Embed" button in the V2 builder now navigates to the Embed Builder instead of showing "Coming Soon".'],
        ['Bot preview in Embed Builder', 'In Bot Token mode, the preview now auto-loads the bot\'s avatar and name from the token.'],
      ],
    },
    {
      version: '1.3.0', date: '2026-06-15',
      changes: [
        ['Embed Builder (normal)', 'New dedicated builder for embed messages: content, up to 10 embeds with all fields, link buttons, and webhook/bot mode.'],
        ['Auto webhook preview', 'Pasting a webhook URL auto-fetches the real bot avatar and name. Configure overrides via the appearance modal.'],
        ['Webhook appearance', 'Modal to configure username and avatar_url override, with a live bot header preview.'],
        ['Mention/Time/Emoji picker', '@#🕐 button in the format toolbar: insert mentions (@everyone, @here, channels, saved roles), Discord timestamps (7 styles), and emojis with search.'],
        ['<id:X> server links', 'Full support for <id:browse>, <id:customize>, <id:guide> and <id:linked-roles> as mention chips in both builders.'],
        ['Send history', 'Saves the last 10 sent message IDs with mode and timestamp. Load the ID directly into the editor.'],
        ['Templates', 'Save and load full builder states. Persisted in localStorage.'],
        ['Import from Discord', 'Import Discord message JSON directly into the editor (content, embeds, components).'],
        ['Diff view', 'Compare current state vs original message when editing. Line-by-line colored diff.'],
        ['Format toolbar', 'Format toolbar in all text fields: bold, italic, underline, strikethrough, code, code block, spoiler, quote.'],
        ['Link buttons in Embed Builder', 'Add link button rows (type 2, style 5) to embed builder messages.'],
        ['Export PNG', 'Export the preview as PNG via the browser print dialog.'],
        ['Compact mode', 'Collapse all messages in the embed builder at once.'],
        ['Shortcuts', 'Ctrl+Enter to send, Ctrl+S to export JSON.'],
        ['Saved webhooks', 'Favorite webhook manager with name, quick-select and active indicator.'],
        ['Copy link', 'Copy the current state link to clipboard from the header.'],
      ],
    },
    {
      version: '1.2.0', date: '2026-06-15',
      changes: [
        ['Multi-message', 'Add multiple independent messages from the "Messages" tabs in the left panel. Send sends them all in sequence.'],
        ['Message tabs', 'Msg 1 / Msg 2 / … tabs with component badge, + (green) to add and ✕ (red) to remove the active one.'],
        ['Multi export', 'When multiple messages exist, Export generates a JSON array ready for the API.'],
        ['Text character limit', 'Validates total characters per message (Discord limit: 4000). Live counter in the header (grey / yellow / red).'],
        ['Per-node counter', 'Text editor shows X / 4000 with a colored border when approaching or exceeding the limit.'],
        ['Fix Error 50035', 'Validates thumbnails without URL, gallery items without URL and empty text nodes before sending. Error message shows the specific field Discord rejects.'],
        ['Fix markdown in blockquotes', '>>> and > blocks now render full markdown (bullets, -#, headings, bold, etc.) in the preview.'],
      ],
    },
    {
      version: '1.1.1', date: '2026-06-15',
      changes: [
        ['Interactive buttons', 'Preview buttons now have hover effect, press animation and pointer cursor.'],
        ['Functional select menus', 'Text selects show a real dropdown with defined options. User/role/channel selects explain Discord-only behavior.'],
        ['UI icons (uicons)', 'Decorative emojis replaced with Flaticon uicons solid-rounded icons.'],
        ['Text overflow fix', 'Long text without spaces no longer breaks the container width in the preview.'],
      ],
    },
    {
      version: '1.1.0', date: '2026-06-15',
      changes: [
        ['Improved webhook', 'Full Components V2 support via webhook (with_components=true, API v10).'],
        ['Thread ID', 'Send messages directly to threads by specifying the ID.'],
        ['Edit message', 'Edit existing messages from the bot or the same webhook.'],
        ['Restore message', 'Load an existing message\'s components into the editor.'],
        ['Webhook preview', 'Webhook avatar and name appear in the preview when you paste the URL.'],
        ['SEO & OG', 'Meta tags and Open Graph for sharing the link on Discord/social media.'],
        ['Larger UI', 'Increased font size and panel widths for better readability.'],
      ],
    },
    {
      version: '1.0.0', date: '2026-06-15',
      changes: [
        ['Initial release', 'First public version of the Discord Component Builder.'],
        ['Components V2', 'Container, Text, Section, Gallery, Divider, Action Row, Buttons and Selects.'],
        ['Bot Token', 'Send messages using a bot token + Channel ID.'],
        ['Live preview', 'Real-time message rendering in Discord style.'],
        ['Export JSON', 'Download the JSON payload for direct API use.'],
        ['URL state', 'State saved in the URL hash for shareable builds.'],
        ['Security', 'Alert when entering a token or webhook URL for the first time.'],
      ],
    },
  ],
  pt: [
    {
      version: '1.3.1', date: '2026-06-17',
      changes: [
        ['Responder mensagem', 'Campo "RESPONDER A" em ambos os builders: cole o ID da mensagem alvo e a mensagem é enviada como resposta do Discord. Oculto ao editar.'],
        ['Export PNG real', 'O botão PNG agora baixa diretamente um arquivo .png (2x) usando html2canvas — sem mais diálogo de impressão ou PDF.'],
        ['Alerta de credenciais persistente', 'O alerta de segurança ao inserir token/webhook não reaparece mais ao recarregar a página (salvo no localStorage).'],
        ['Ícone de alerta corrigido', 'O ícone da janela de alerta de credenciais agora é amarelo em vez de azul.'],
        ['WelcomeModal multilíngue', 'O tutorial de boas-vindas agora está traduzido para ES/EN/PT e mostra a versão 1.3.0.'],
        ['Changelog multilíngue', 'O histórico de versões agora está disponível em ES/EN/PT.'],
        ['Embed Builder habilitado no V2', 'O botão "Embed normal" no builder V2 agora navega para o Embed Builder em vez de mostrar "Em breve".'],
        ['Preview do bot no Embed Builder', 'No modo Bot Token, o preview agora carrega automaticamente o avatar e nome do bot a partir do token.'],
      ],
    },
    {
      version: '1.3.0', date: '2026-06-15',
      changes: [
        ['Embed Builder (normal)', 'Novo builder dedicado para mensagens com embeds: content, até 10 embeds com todos os campos, link buttons e modo webhook/bot.'],
        ['Preview de webhook automático', 'Ao colar uma URL de webhook, o preview busca automaticamente o avatar e nome reais do bot. Configure overrides na janela de aparência.'],
        ['Aparência do webhook', 'Janela para configurar o override de username e avatar_url, com preview ao vivo do cabeçalho do bot.'],
        ['Seletor de menções/tempo/emojis', 'Botão @#🕐 na barra de formato: insira menções (@everyone, @here, canais, cargos salvos), timestamps do Discord (7 estilos) e emojis com busca.'],
        ['<id:X> server links', 'Suporte completo a <id:browse>, <id:customize>, <id:guide> e <id:linked-roles> como chips de menção em ambos os builders.'],
        ['Histórico de envios', 'Salva os últimos 10 IDs de mensagens enviadas com modo e timestamp. Carregue o ID diretamente no editor.'],
        ['Templates', 'Salve e carregue estados completos do builder. Persistidos no localStorage.'],
        ['Importar do Discord', 'Importe o JSON de uma mensagem do Discord diretamente no editor (content, embeds, components).'],
        ['Diff view', 'Compare o estado atual com a mensagem original ao editar. Diff linha a linha com cores.'],
        ['Barra de formato', 'Barra de formato em todos os campos de texto: negrito, itálico, sublinhado, tachado, código, bloco de código, spoiler, citação.'],
        ['Link buttons no Embed Builder', 'Adicione fileiras de botões de link (type 2, style 5) às mensagens do embed builder.'],
        ['Exportar PNG', 'Exporte o preview como PNG via janela de impressão do navegador.'],
        ['Modo compacto', 'Recolha todas as mensagens do embed builder de uma vez.'],
        ['Atalhos', 'Ctrl+Enter para enviar, Ctrl+S para exportar JSON.'],
        ['Webhooks salvos', 'Gerenciador de webhooks favoritos com nome, seleção rápida e indicador ativo.'],
        ['Copiar link', 'Copie o link com o estado atual para a área de transferência a partir do cabeçalho.'],
      ],
    },
    {
      version: '1.2.0', date: '2026-06-15',
      changes: [
        ['Multi-mensagem', 'Adicione múltiplas mensagens independentes nas abas "Mensagens" do painel esquerdo. Enviar manda todas em sequência.'],
        ['Abas de mensagem', 'Abas Msg 1 / Msg 2 / … com badge de componentes, + (verde) para adicionar e ✕ (vermelho) para remover a ativa.'],
        ['Exportar múltiplo', 'Quando há mais de uma mensagem, Exportar gera um array JSON pronto para a API.'],
        ['Limite de texto', 'Validação do total de caracteres por mensagem (limite Discord: 4000). Contador em tempo real no cabeçalho (cinza / amarelo / vermelho).'],
        ['Contador por nó', 'O editor de texto mostra X / 4000 com borda colorida ao se aproximar ou superar o limite.'],
        ['Fix Erro 50035', 'Validação de thumbnails sem URL, itens de gallery sem URL e textos vazios antes de enviar. A mensagem de erro mostra o campo específico que o Discord rejeita.'],
        ['Fix markdown em blockquotes', 'Os blocos >>> e > agora renderizam markdown completo (bullets, -#, headings, negrito, etc.) no preview.'],
      ],
    },
    {
      version: '1.1.1', date: '2026-06-15',
      changes: [
        ['Botões interativos', 'Os botões do preview agora têm hover, efeito de pressão e cursor pointer.'],
        ['Select menus funcionais', 'Selects de texto mostram um dropdown real com as opções definidas. Os de usuários/cargos/canais explicam que são apenas disponíveis no Discord.'],
        ['Ícones UI (uicons)', 'Emojis decorativos da UI foram substituídos por ícones Flaticon uicons (solid rounded).'],
        ['Fix overflow de texto', 'Texto longo sem espaços não quebra mais a largura do container no preview.'],
      ],
    },
    {
      version: '1.1.0', date: '2026-06-15',
      changes: [
        ['Webhook melhorado', 'Suporte completo a Components V2 via webhook (with_components=true, API v10).'],
        ['Thread ID', 'Envie mensagens diretamente para threads especificando o ID.'],
        ['Editar mensagem', 'Edite mensagens existentes do bot ou do mesmo webhook.'],
        ['Restaurar mensagem', 'Carregue os componentes de uma mensagem existente no editor.'],
        ['Preview webhook', 'O avatar e nome do webhook aparecem no preview ao colar a URL.'],
        ['SEO & OG', 'Meta tags e Open Graph para compartilhar o link no Discord/redes sociais.'],
        ['UI maior', 'Tamanho de fonte e painéis aumentados para melhor legibilidade.'],
      ],
    },
    {
      version: '1.0.0', date: '2026-06-15',
      changes: [
        ['Lançamento inicial', 'Primeira versão pública do Discord Component Builder.'],
        ['Components V2', 'Container, Text, Section, Gallery, Divider, Action Row, Buttons e Selects.'],
        ['Bot Token', 'Envio de mensagens usando token de bot + Channel ID.'],
        ['Live preview', 'Renderização em tempo real da mensagem com estilo do Discord.'],
        ['Export JSON', 'Baixe o payload JSON para uso direto na API.'],
        ['URL state', 'O estado é salvo no hash da URL para compartilhar builds.'],
        ['Segurança', 'Alerta ao inserir token ou URL de webhook pela primeira vez.'],
      ],
    },
  ],
};

const HEADER: Record<string, string> = { es: 'Historial de versiones', en: 'Version history', pt: 'Histórico de versões' };

export default function ChangelogModal({ onClose }: Props) {
  const { lang } = useT();
  const changelog = CL[lang] ?? CL.es;
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div className="modal-header-icon" style={{ fontSize: 18 }}><Fi name="list" /></div>
          <div className="modal-header-text">
            <h2>Changelog</h2>
            <p>{HEADER[lang] ?? HEADER.es}</p>
          </div>
        </div>
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {changelog.map(({ version, date, changes }) => (
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
            {lang === 'en' ? 'Close' : lang === 'pt' ? 'Fechar' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
