import { useState, useEffect, useCallback, useRef } from 'react';
import type { BuilderState, RootNode } from '../lib/types';
import {
  uid, encodeState, decodeState,
  updateNodeById, removeNodeById, moveNode, findNodeById, addIds, serialize,
  newText, newDivider, newSection, newGallery,
  newButton, newSelectMenu,
  newUserSelect, newRoleSelect, newMentionSelect, newChannelSelect,
  newActionRow, newContainer, SEL_TYPES,
} from '../lib/utils';
import ComponentTree from './ComponentTree';
import Preview, { type BotInfo } from './Preview';
import PropertyEditor from './PropertyEditor';
import ToastContainer, { addToast } from './ToastSystem';
import WelcomeModal from './WelcomeModal';
import {
  IcSend, IcTrash, IcDownload, IcBell, IcBellOff,
  IcBox, IcGrid, IcText, IcLayout, IcImages, IcMinus,
  IcHelpCircle, IcEmbed, IcClock, IcAlertTriangle,
} from './Icons';

// ── defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_STATE: BuilderState = { nodes: [], allowedMentions: false };

type SendMode = 'bot' | 'webhook';

function loadState(): BuilderState {
  try {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const s = decodeState(hash) as BuilderState | null;
      if (s?.nodes) return { ...s, allowedMentions: (s as any).allowedMentions ?? false, nodes: addIds(s.nodes as any[]) as RootNode[] };
    }
  } catch { /* ignore */ }
  return DEFAULT_STATE;
}

function loadConfig() {
  try {
    return {
      token:      localStorage.getItem('dcb_token')   || '',
      channelId:  localStorage.getItem('dcb_channel') || '',
      webhookUrl: localStorage.getItem('dcb_webhook') || '',
      sendMode:   (localStorage.getItem('dcb_mode') as SendMode) || 'bot',
    };
  } catch {
    return { token: '', channelId: '', webhookUrl: '', sendMode: 'bot' as SendMode };
  }
}

const CHILD_FACTORIES: Record<number, () => any> = {
  10: newText, 14: newDivider, 9: newSection, 12: newGallery,
  1: newActionRow, 2: newButton, 3: newSelectMenu,
  5: newUserSelect, 6: newRoleSelect, 7: newMentionSelect, 8: newChannelSelect,
};

// ── Validate before sending ────────────────────────────────────────────────────

function validateNodes(nodes: any[]): string[] {
  const errors: string[] = [];
  function check(node: any) {
    if (node.type === 1) {
      const comps: any[] = node.components ?? [];
      if (!comps.length) { errors.push('Hay un Action Row vacío — agrega al menos 1 botón o select menu.'); return; }
      const btns = comps.filter(c => c.type === 2).length;
      const sels = comps.filter(c => SEL_TYPES.includes(c.type)).length;
      if (btns > 0 && sels > 0) errors.push('Un Action Row no puede tener botones Y select menu al mismo tiempo.');
      if (sels > 1) errors.push('Un Action Row solo puede tener 1 select menu.');
      if (btns > 5) errors.push('Un Action Row puede tener máximo 5 botones.');
      comps.filter(c => c.type === 3).forEach(sm => {
        if (!sm.options?.length) errors.push(`Select Menu de texto necesita al menos 1 opción (ID: ${sm.custom_id || '?'}).`);
      });
      comps.filter(c => c.type === 2 && c.style !== 5).forEach(b => {
        if (!b.custom_id?.trim()) errors.push(`Botón "${b.label || '?'}" necesita un Custom ID.`);
      });
    }
    if (Array.isArray(node.components)) node.components.forEach(check);
  }
  nodes.forEach(check);
  return [...new Set(errors)];
}

// ── component ─────────────────────────────────────────────────────────────────

export default function Builder() {
  const [state, setState]       = useState<BuilderState>(DEFAULT_STATE);
  const [selected, setSelected] = useState<string | null>(null);
  const [token, setToken]       = useState('');
  const [channelId, setChannelId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [sendMode, setSendMode] = useState<SendMode>('bot');
  const [botInfo, setBotInfo]   = useState<BotInfo | null>(null);
  const [status, setStatus]     = useState<{ msg: string; kind: 'ok' | 'err' | 'info' } | null>(null);
  const [sending, setSending]   = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<'token' | 'webhook' | null>(null);
  const warnedRef = useRef(new Set<string>());

  // hydrate on mount
  useEffect(() => {
    setState(loadState());
    const cfg = loadConfig();
    setToken(cfg.token);
    setChannelId(cfg.channelId);
    setWebhookUrl(cfg.webhookUrl);
    setSendMode(cfg.sendMode);
    setWelcomeOpen(true);
  }, []);

  // sync hash
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.history.replaceState(null, '', '#' + encodeState(state));
  }, [state]);

  // fetch bot info when token changes (debounced)
  useEffect(() => {
    if (sendMode !== 'bot') return;
    if (!token || token.length < 20) { setBotInfo(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/bot-info?token=${encodeURIComponent(token)}`);
        if (res.ok) setBotInfo(await res.json() as BotInfo);
        else setBotInfo(null);
      } catch { setBotInfo(null); }
    }, 800);
    return () => clearTimeout(t);
  }, [token, sendMode]);

  // fetch webhook info when webhookUrl changes (debounced)
  useEffect(() => {
    if (sendMode !== 'webhook') { return; }
    if (!webhookUrl || !webhookUrl.includes('/api/webhooks/')) { setBotInfo(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/webhook-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ webhookUrl }),
        });
        if (res.ok) setBotInfo(await res.json() as BotInfo);
        else setBotInfo(null);
      } catch { setBotInfo(null); }
    }, 800);
    return () => clearTimeout(t);
  }, [webhookUrl, sendMode]);

  const updateNodes = useCallback((nodes: RootNode[]) => setState(s => ({ ...s, nodes })), []);

  // ── credential security warning ────────────────────────────────────────────

  const handleCredentialFocus = (type: 'token' | 'webhook') => {
    const isEmpty = type === 'token' ? !token : !webhookUrl;
    if (isEmpty && !warnedRef.current.has(type)) {
      warnedRef.current.add(type);
      setSecurityWarning(type);
    }
  };

  // ── config helpers ─────────────────────────────────────────────────────────

  const handleToken = (v: string) => {
    setToken(v);
    try { localStorage.setItem('dcb_token', v); } catch { /* ignore */ }
  };
  const handleChannel = (v: string) => {
    setChannelId(v);
    try { localStorage.setItem('dcb_channel', v); } catch { /* ignore */ }
  };
  const handleWebhook = (v: string) => {
    setWebhookUrl(v);
    try { localStorage.setItem('dcb_webhook', v); } catch { /* ignore */ }
  };
  const handleSendMode = (m: SendMode) => {
    setSendMode(m);
    try { localStorage.setItem('dcb_mode', m); } catch { /* ignore */ }
  };

  // ── tree ops ────────────────────────────────────────────────────────────────

  const handleRemove = (id: string) => {
    updateNodes(removeNodeById(state.nodes as any[], id) as RootNode[]);
    if (selected === id) setSelected(null);
    addToast('Componente eliminado', 'warn');
  };

  const handleMove = (id: string, dir: -1 | 1) =>
    updateNodes(moveNode(state.nodes as any[], id, dir) as RootNode[]);

  const handleChange = (patch: any) => {
    if (!selected) return;
    updateNodes(updateNodeById(state.nodes as any[], selected, (n: any) => ({ ...n, ...patch })) as RootNode[]);
  };

  const handleAddChild = useCallback((parentId: string, type: number) => {
    const factory = CHILD_FACTORIES[type];
    if (!factory) return;
    const child = factory();
    const newNodes = updateNodeById(state.nodes as any[], parentId, (n: any) => {
      if (!Array.isArray(n.components)) return n;
      return { ...n, components: [...n.components, child] };
    }) as RootNode[];
    updateNodes(newNodes);
    setSelected(child._id);
  }, [state.nodes, updateNodes]);

  const handleDuplicate = useCallback((id: string) => {
    const node = findNodeById(state.nodes as any[], id);
    if (!node) return;
    function deepClone(n: any): any {
      const clone = { ...n, _id: Math.random().toString(36).slice(2, 9) };
      if (Array.isArray(n.components)) clone.components = n.components.map(deepClone);
      if (n.accessory) clone.accessory = deepClone(n.accessory);
      if (Array.isArray(n.items)) clone.items = [...n.items];
      if (Array.isArray(n.options)) clone.options = [...n.options];
      return clone;
    }
    const cloned = deepClone(node);
    function insertAfter(nodes: any[]): any[] | null {
      const idx = nodes.findIndex((n: any) => n._id === id);
      if (idx !== -1) { const next = [...nodes]; next.splice(idx + 1, 0, cloned); return next; }
      for (let i = 0; i < nodes.length; i++) {
        if (Array.isArray(nodes[i].components)) {
          const inner = insertAfter(nodes[i].components);
          if (inner) return nodes.map((n: any, j: number) => j === i ? { ...n, components: inner } : n);
        }
      }
      return null;
    }
    const newNodes = insertAfter(state.nodes as any[]) ?? [...(state.nodes as any[]), cloned];
    updateNodes(newNodes as RootNode[]);
    setSelected(cloned._id);
    addToast('Componente duplicado', 'info');
  }, [state.nodes, updateNodes]);

  const addRoot = (node: any, label?: string) => {
    updateNodes([...state.nodes, node]);
    setSelected(node._id);
    if (label) addToast(`${label} agregado`, 'info');
  };

  // ── send ────────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!state.nodes.length) {
      setStatus({ msg: 'Agrega al menos un componente.', kind: 'err' });
      addToast('Agrega al menos un componente', 'err'); return;
    }
    const errs = validateNodes(state.nodes as any[]);
    if (errs.length) {
      setStatus({ msg: `⚠ ${errs[0]}`, kind: 'err' });
      addToast(errs[0], 'err'); return;
    }

    if (sendMode === 'bot') {
      if (!token || !channelId) {
        setStatus({ msg: 'Falta el token o el channel ID.', kind: 'err' });
        addToast('Falta el token o el channel ID', 'err'); return;
      }
    } else {
      if (!webhookUrl) {
        setStatus({ msg: 'Falta la URL del webhook.', kind: 'err' });
        addToast('Falta la URL del webhook', 'err'); return;
      }
      if (!webhookUrl.includes('discord.com/api/webhooks/') && !webhookUrl.includes('discordapp.com/api/webhooks/')) {
        setStatus({ msg: 'URL de webhook inválida.', kind: 'err' });
        addToast('URL de webhook inválida', 'err'); return;
      }
    }

    setSending(true);
    setStatus({ msg: 'Enviando…', kind: 'info' });

    try {
      let res: Response;

      if (sendMode === 'webhook') {
        // send directly from browser — Discord webhooks support CORS
        const discordBody: any = { flags: 1 << 15, components: serialize(state.nodes) };
        res = await fetch(`${webhookUrl}?wait=true`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordBody),
        });
      } else {
        res = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ components: serialize(state.nodes), channelId, token, allowedMentions: state.allowedMentions }),
        });
      }

      const data = await res.json() as any;
      if (!res.ok) {
        const errText = data.message ?? data.error ?? 'Error de Discord';
        const errCode = data.code ? ` (code: ${data.code})` : '';
        const msg = `Error ${res.status}: ${errText}${errCode}`;
        setStatus({ msg, kind: 'err' }); addToast(msg, 'err');
      } else {
        setStatus({ msg: `✓ Enviado (ID: ${data.id})`, kind: 'ok' });
        addToast('Mensaje enviado correctamente', 'ok');
      }
    } catch (e) {
      const msg = `Error de red: ${e}`;
      setStatus({ msg, kind: 'err' }); addToast(msg, 'err');
    } finally { setSending(false); }
  };

  // ── misc ────────────────────────────────────────────────────────────────────

  const handleClear = () => {
    if (!window.confirm('¿Eliminar todos los componentes?')) return;
    updateNodes([]); setSelected(null);
    addToast('Builder limpiado', 'warn');
  };

  const handleExport = () => {
    const json = JSON.stringify({ flags: 1 << 15, components: serialize(state.nodes) }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'message.json'; a.click();
    URL.revokeObjectURL(url);
    addToast('JSON exportado', 'ok');
  };

  const handlePingsToggle = () => {
    setState(s => ({ ...s, allowedMentions: !s.allowedMentions }));
    addToast(state.allowedMentions ? 'Pings desactivados' : 'Pings activados', 'info');
  };

  const selectedNode = selected ? findNodeById(state.nodes as any[], selected) : null;

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div id="root">
      {/* ── Toasts ── */}
      <ToastContainer />

      {/* ── Welcome modal ── */}
      {welcomeOpen && <WelcomeModal onClose={() => setWelcomeOpen(false)} />}

      {/* ── Security warning ── */}
      {securityWarning && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: 420 }}>
            <div className="modal-header" style={{ borderBottomColor: 'rgba(252,196,25,.18)' }}>
              <div className="modal-header-icon" style={{ background: 'rgba(252,196,25,.12)', color: '#fcc419' }}>
                <IcAlertTriangle size={22} />
              </div>
              <div className="modal-header-text">
                <h2 style={{ color: '#fcc419' }}>¿Realmente quieres hacer esto?</h2>
                <p>{securityWarning === 'token' ? 'Token de bot de Discord' : 'URL de Webhook de Discord'}</p>
              </div>
            </div>
            <div className="modal-body">
              <div className="tutorial-step">
                <div className="tutorial-step-desc">
                  {securityWarning === 'token' ? (
                    <>Estás a punto de ingresar el <strong style={{ color: '#dbdee1' }}>token de tu bot</strong>. Esta credencial permite <strong style={{ color: '#fcc419' }}>controlar el bot completamente</strong>. Nunca compartas tu token con nadie.</>
                  ) : (
                    <>Estás a punto de ingresar una <strong style={{ color: '#dbdee1' }}>URL de webhook</strong>. Esta URL permite <strong style={{ color: '#fcc419' }}>publicar mensajes en el canal vinculado</strong> sin autenticación adicional.</>
                  )}
                </div>
                <div className="security-tip">
                  🔒 Tu credencial se guarda <strong>localmente en tu navegador</strong> (localStorage) y se envía directamente a Discord — nunca a servidores externos. Esta app corre en local.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => {
                // Cancelar: cerrar, quitar del set (para que vuelva a aparecer), y desenfocar el input
                if (securityWarning) warnedRef.current.delete(securityWarning);
                setSecurityWarning(null);
                (document.activeElement as HTMLElement)?.blur();
              }}>
                Cancelar
              </button>
              <button
                style={{ background: '#b7950b', color: '#fff', fontSize: 12, padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setSecurityWarning(null)}>
                Sí, continuar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Coming soon modal ── */}
      {comingSoonOpen && (
        <div className="modal-overlay" onClick={() => setComingSoonOpen(false)}>
          <div className="modal" style={{ width: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-icon"><IcClock size={22} /></div>
              <div className="modal-header-text">
                <h2>Próximamente</h2>
                <p>Embeds normales de Discord</p>
              </div>
            </div>
            <div className="modal-body">
              <div className="tutorial-step">
                <div className="tutorial-step-desc">
                  El soporte para <strong style={{ color: '#dbdee1' }}>embeds normales</strong> (tipo 0, con campos, imagen, footer, author…) está en desarrollo.
                </div>
                <div className="tutorial-tip">
                  🔨 Por ahora usa <strong>Components V2</strong> (Containers, Secciones, Galerías, etc.) que ofrecen mucho más control visual.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" style={{ fontSize: 12, padding: '6px 16px' }} onClick={() => setComingSoonOpen(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="app-header">
        <span style={{ color: '#5865f2', display: 'flex', alignItems: 'center' }}><IcBox size={18} /></span>
        <h1>Discord Component Builder</h1>

        {botInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#b5bac1' }}>
            {botInfo.avatar
              ? <img src={botInfo.avatar} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} alt="" />
              : <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#5865f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>{botInfo.username[0]}</div>
            }
            <span style={{ color: '#dbdee1' }}>{botInfo.username}</span>
            <span style={{ background: '#5865f2', color: '#fff', borderRadius: 3, padding: '0 4px', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>BOT</span>
          </div>
        )}

        <div className="spacer" />

        <button className="btn-secondary btn-coming-soon" title="Embeds normales — próximamente" onClick={() => setComingSoonOpen(true)}>
          <IcEmbed size={13} /> Embed normal
          <span className="badge-soon">Pronto</span>
        </button>
        <button className="btn-secondary" title="Ver tutorial / info" onClick={() => setWelcomeOpen(true)} style={{ padding: '6px 10px' }}>
          <IcHelpCircle size={14} />
        </button>
        <button className={`btn-toggle ${state.allowedMentions ? 'on' : 'off'}`}
          title={state.allowedMentions ? 'Pings ON — clic para desactivar' : 'Pings OFF — clic para activar'}
          onClick={handlePingsToggle}>
          {state.allowedMentions ? <><IcBell size={13} /> Pings ON</> : <><IcBellOff size={13} /> Pings OFF</>}
        </button>
        <button className="btn-secondary" onClick={handleExport} title="Exportar JSON">
          <IcDownload size={13} /> Exportar
        </button>
        <button className="btn-danger" onClick={handleClear} title="Limpiar todo">
          <IcTrash size={13} /> Limpiar
        </button>
        <button className="btn-success btn-send" onClick={handleSend} disabled={sending}>
          {sending ? 'Enviando…' : <><IcSend size={13} /> Enviar</>}
        </button>
      </header>

      <div className="app-body">
        {/* ── LEFT ── */}
        <aside className="panel-left">
          <div className="config-bar">
            {/* Send mode toggle */}
            <div className="send-mode-toggle">
              <button className={`mode-btn ${sendMode === 'bot' ? 'active' : ''}`} onClick={() => handleSendMode('bot')}>
                🤖 Bot Token
              </button>
              <button className={`mode-btn ${sendMode === 'webhook' ? 'active' : ''}`} onClick={() => handleSendMode('webhook')}>
                🔗 Webhook
              </button>
            </div>

            {sendMode === 'bot' ? (
              <>
                <div className="field">
                  <label>Bot Token</label>
                  <input type="password" value={token}
                    onFocus={() => handleCredentialFocus('token')}
                    onChange={e => handleToken(e.target.value)}
                    placeholder="Bot token..." />
                </div>
                <div className="field">
                  <label>Channel ID</label>
                  <input value={channelId} onChange={e => handleChannel(e.target.value)} placeholder="1234567890..." />
                </div>
              </>
            ) : (
              <div className="field">
                <label>Webhook URL</label>
                <input type="password" value={webhookUrl}
                  onFocus={() => handleCredentialFocus('webhook')}
                  onChange={e => handleWebhook(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..." />
                <small style={{ marginTop: 2, color: '#f5c400' }}>
                  ⚠️ Components V2 solo funciona con webhooks creados por una aplicación (bot), no con webhooks normales del servidor.
                </small>
              </div>
            )}
          </div>

          <div className="toolbar">
            <span className="toolbar-label">Agregar al root</span>
            <button className="btn-secondary" onClick={() => addRoot(newContainer(), 'Container')} title="Container">📦 Container</button>
            <button className="btn-secondary" onClick={() => addRoot(newActionRow(), 'Action Row')} title="Action Row"><IcGrid size={12} /> Row</button>
            <button className="btn-secondary" onClick={() => addRoot(newText(), 'Texto')} title="Texto"><IcText size={12} /> Texto</button>
            <button className="btn-secondary" onClick={() => addRoot(newSection(), 'Section')} title="Section"><IcLayout size={12} /> Section</button>
            <button className="btn-secondary" onClick={() => addRoot(newGallery(), 'Gallery')} title="Gallery"><IcImages size={12} /> Gallery</button>
            <button className="btn-secondary" onClick={() => addRoot(newDivider(), 'Divider')} title="Divider"><IcMinus size={12} /> Divider</button>
          </div>

          <div className="panel-header">Árbol de componentes</div>
          <div className="panel-body">
            <ComponentTree
              nodes={state.nodes as any[]}
              selected={selected}
              onSelect={setSelected}
              onRemove={handleRemove}
              onMove={handleMove}
              onAddChild={handleAddChild}
              onDuplicate={handleDuplicate}
            />
          </div>
        </aside>

        {/* ── CENTER ── */}
        <main className="panel-center">
          <Preview nodes={state.nodes} selected={selected} onSelect={setSelected} botInfo={botInfo} />
        </main>

        {/* ── RIGHT ── */}
        <aside className="panel-right">
          <div className="panel-header">Propiedades</div>
          <div className="panel-body">
            <PropertyEditor node={selectedNode} onChange={handleChange} />
          </div>
        </aside>
      </div>

      {/* Status bar */}
      <div className="status-bar">
        <span className={`msg ${status?.kind ?? ''}`}>{status?.msg ?? 'Listo'}</span>
        <small style={{ background: sendMode === 'webhook' ? 'rgba(88,101,242,.15)' : 'transparent', padding: '1px 6px', borderRadius: 4 }}>
          {sendMode === 'bot' ? '🤖 Bot' : '🔗 Webhook'}
        </small>
        <small>{state.nodes.length} componente(s)</small>
        <small>{state.allowedMentions ? <><IcBell size={11} /> Pings ON</> : <><IcBellOff size={11} /> Pings OFF</>}</small>
      </div>
    </div>
  );
}
