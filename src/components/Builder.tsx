import { useState, useEffect, useCallback, useRef } from 'react';
import { I18nProvider, LangSwitch, useT, type TKey } from '../lib/i18n';
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
import WebhookManager from './WebhookManager';
import WelcomeModal from './WelcomeModal';
import ChangelogModal from './ChangelogModal';
import SendHistoryModal, { recordSend } from './SendHistoryModal';
import TemplatesModal from './TemplatesModal';
import ImportModal, { type ImportedPayload } from './ImportModal';
import DiffModal from './DiffModal';
import WebhookAppearanceModal from './WebhookAppearanceModal';
import {
  IcSend, IcTrash, IcDownload, IcBell, IcBellOff,
  IcBox, IcGrid, IcText, IcLayout, IcImages, IcMinus,
  IcHelpCircle, IcEmbed, IcClock, IcAlertTriangle, Fi,
} from './Icons';

// ── defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_STATE: BuilderState = { messages: [[]], allowedMentions: false };

type SendMode = 'bot' | 'webhook';

function loadState(): BuilderState {
  try {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const s = decodeState(hash) as any | null;
      if (!s) return DEFAULT_STATE;
      const am = s.allowedMentions ?? false;
      // new format: messages[][]
      if (Array.isArray(s.messages)) {
        return { messages: s.messages.map((m: any[]) => addIds(m) as RootNode[]), allowedMentions: am };
      }
      // old format: nodes[]
      if (Array.isArray(s.nodes)) {
        return { messages: [addIds(s.nodes) as RootNode[]], allowedMentions: am };
      }
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

export const TEXT_TOTAL_LIMIT = 4000;

function countTextChars(nodes: any[]): number {
  let total = 0;
  function walk(node: any) {
    if (node.type === 10) total += (node.content ?? '').length;
    if (Array.isArray(node.components)) node.components.forEach(walk);
    if (node.accessory) walk(node.accessory);
  }
  nodes.forEach(walk);
  return total;
}

type TFn = (key: TKey, ...args: (string | number)[]) => string;

function validateNodes(nodes: any[], t: TFn): string[] {
  const errors: string[] = [];
  const totalChars = countTextChars(nodes);
  if (totalChars > TEXT_TOTAL_LIMIT) {
    errors.push(t('val_total_chars', totalChars, TEXT_TOTAL_LIMIT));
  }
  function check(node: any) {
    if (node.type === 10) {
      if (!node.content?.trim()) errors.push(t('val_empty_text'));
      else if ((node.content ?? '').length > TEXT_TOTAL_LIMIT) errors.push(t('val_text_too_long', (node.content ?? '').length, TEXT_TOTAL_LIMIT));
    }
    if (node.type === 11 && !node.media?.url?.trim()) {
      errors.push(t('val_thumb_no_url'));
    }
    if (node.type === 12) {
      (node.items ?? []).forEach((item: any, idx: number) => {
        if (!item.media?.url?.trim()) errors.push(t('val_gallery_no_url', idx + 1));
      });
    }
    if (node.type === 1) {
      const comps: any[] = node.components ?? [];
      if (!comps.length) { errors.push(t('val_row_empty')); return; }
      const btns = comps.filter(c => c.type === 2).length;
      const sels = comps.filter(c => SEL_TYPES.includes(c.type)).length;
      if (btns > 0 && sels > 0) errors.push(t('val_row_conflict'));
      if (sels > 1) errors.push(t('val_row_one_sel'));
      if (btns > 5) errors.push(t('val_row_max_btns'));
      comps.filter(c => c.type === 3).forEach(sm => {
        if (!sm.options?.length) errors.push(t('val_sel_no_opts', sm.custom_id || '?'));
        if (!sm.custom_id?.trim()) errors.push(t('val_sel_no_id'));
      });
      comps.filter(c => SEL_TYPES.includes(c.type) && c.type !== 3).forEach(s => {
        if (!s.custom_id?.trim()) errors.push(t('val_dyn_sel_no_id'));
      });
      comps.filter(c => c.type === 2 && c.style !== 5).forEach(b => {
        if (!b.custom_id?.trim()) errors.push(t('val_btn_no_id', b.label || '?'));
      });
      comps.filter(c => c.type === 2 && c.style === 5).forEach(b => {
        if (!b.url?.trim()) errors.push(t('val_btn_link_no_url', b.label || '?'));
      });
    }
    if (Array.isArray(node.components)) node.components.forEach(check);
    if (node.accessory) check(node.accessory);
  }
  nodes.forEach(check);
  return [...new Set(errors)];
}

// ── component ─────────────────────────────────────────────────────────────────

export default function Builder() {
  return <I18nProvider><BuilderCore /></I18nProvider>;
}

function BuilderCore() {
  const { t } = useT();
  const [state, setState]       = useState<BuilderState>(DEFAULT_STATE);
  const [activeMsg, setActiveMsg] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [token, setToken]       = useState('');
  const [channelId, setChannelId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [sendMode, setSendMode] = useState<SendMode>('bot');
  const [threadId, setThreadId]   = useState('');
  const [messageId, setMessageId] = useState('');
  const [botInfo, setBotInfo]   = useState<BotInfo | null>(null);
  const [status, setStatus]     = useState<{ msg: string; kind: 'ok' | 'err' | 'info' } | null>(null);
  const [sending, setSending]   = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<'token' | 'webhook' | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [whAppearanceOpen, setWhAppearanceOpen] = useState(false);
  const [whName, setWhName] = useState('');
  const [whAvatar, setWhAvatar] = useState('');
  const diffSnapshotRef = useRef<unknown>(null);
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
    try {
      const warned = JSON.parse(localStorage.getItem('dcb_security_warned') || '[]');
      warnedRef.current = new Set(warned);
    } catch {}
  }, []);

  // sync hash
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.history.replaceState(null, '', '#' + encodeState(state));
  }, [state]);

  // diff snapshot: capture state when messageId is first set
  const prevMsgIdRef = useRef('');
  useEffect(() => {
    if (messageId && messageId !== prevMsgIdRef.current) {
      diffSnapshotRef.current = JSON.parse(JSON.stringify(state.messages.map(m => ({ flags: 1 << 15, components: serialize(m as any[]) }))));
    }
    if (!messageId) diffSnapshotRef.current = null;
    prevMsgIdRef.current = messageId;
  }, [messageId]);

  // keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
        return;
      }
      if (e.key === 's') { e.preventDefault(); handleExport(); }
      if (e.key === 'Enter') { e.preventDefault(); handleSend(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sending, state, sendMode, token, channelId, webhookUrl, threadId, messageId]);

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

  // clamp activeMsg if messages shrink
  const safeMsgIdx = Math.min(activeMsg, Math.max(0, state.messages.length - 1));
  const activeNodes: RootNode[] = state.messages[safeMsgIdx] ?? [];

  const updateNodes = useCallback((nodes: RootNode[]) =>
    setState(s => {
      const msgs = [...s.messages];
      const idx = Math.min(activeMsg, Math.max(0, msgs.length - 1));
      msgs[idx] = nodes;
      return { ...s, messages: msgs };
    }), [activeMsg]);

  const addMessage = () => {
    setState(s => ({ ...s, messages: [...s.messages, []] }));
    setActiveMsg(state.messages.length); // next index
    setSelected(null);
    addToast(t('toast_msg_added'), 'info');
  };

  const removeMessage = (idx: number) => {
    if (state.messages.length <= 1) { addToast(t('err_min_msg'), 'warn'); return; }
    if (!window.confirm(t('confirm_del_msg', idx + 1))) return;
    setState(s => {
      const msgs = s.messages.filter((_, i) => i !== idx);
      return { ...s, messages: msgs };
    });
    setActiveMsg(prev => Math.min(prev, state.messages.length - 2));
    setSelected(null);
    addToast(t('toast_msg_removed', idx + 1), 'warn');
  };

  // ── credential security warning ────────────────────────────────────────────

  const handleCredentialFocus = (type: 'token' | 'webhook') => {
    const isEmpty = type === 'token' ? !token : !webhookUrl;
    if (isEmpty && !warnedRef.current.has(type)) {
      warnedRef.current.add(type);
      try { localStorage.setItem('dcb_security_warned', JSON.stringify([...warnedRef.current])); } catch {}
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
    updateNodes(removeNodeById(activeNodes as any[], id) as RootNode[]);
    if (selected === id) setSelected(null);
    addToast(t('toast_removed'), 'warn');
  };

  const handleMove = (id: string, dir: -1 | 1) =>
    updateNodes(moveNode(activeNodes as any[], id, dir) as RootNode[]);

  const handleChange = (patch: any) => {
    if (!selected) return;
    updateNodes(updateNodeById(activeNodes as any[], selected, (n: any) => ({ ...n, ...patch })) as RootNode[]);
  };

  const handleAddChild = useCallback((parentId: string, type: number) => {
    const factory = CHILD_FACTORIES[type];
    if (!factory) return;
    const child = factory();
    const newNodes = updateNodeById(activeNodes as any[], parentId, (n: any) => {
      if (!Array.isArray(n.components)) return n;
      return { ...n, components: [...n.components, child] };
    }) as RootNode[];
    updateNodes(newNodes);
    setSelected(child._id);
  }, [activeNodes, updateNodes]);

  const handleDuplicate = useCallback((id: string) => {
    const node = findNodeById(activeNodes as any[], id);
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
    const newNodes = insertAfter(activeNodes as any[]) ?? [...(activeNodes as any[]), cloned];
    updateNodes(newNodes as RootNode[]);
    setSelected(cloned._id);
    addToast(t('toast_duplicated'), 'info');
  }, [activeNodes, updateNodes]);

  const addRoot = (node: any, label?: string) => {
    updateNodes([...activeNodes, node]);
    setSelected(node._id);
    if (label) addToast(t('toast_added', label), 'info');
  };

  // ── helpers ─────────────────────────────────────────────────────────────────

  const parseMessageId = (v: string) => {
    const m = v.match(/\/(\d+)$/);
    return m ? m[1] : v.trim();
  };

  const buildWebhookUrl = (base: string, extra?: Record<string, string>) => {
    const u = new URL(base);
    if (u.pathname.startsWith('/api/webhooks/')) {
      u.pathname = '/api/v10/webhooks/' + u.pathname.slice('/api/webhooks/'.length);
    }
    u.searchParams.set('wait', 'true');
    u.searchParams.set('with_components', 'true');
    if (threadId) u.searchParams.set('thread_id', threadId);
    if (extra) Object.entries(extra).forEach(([k, val]) => u.searchParams.set(k, val));
    return u;
  };

  // ── restore ─────────────────────────────────────────────────────────────────

  const handleRestore = async () => {
    const mid = parseMessageId(messageId);
    if (!mid) { addToast(t('err_no_msg_id'), 'err'); return; }
    setSending(true); setStatus({ msg: '…', kind: 'info' });
    try {
      let components: any[];
      if (sendMode === 'webhook') {
        const u = buildWebhookUrl(webhookUrl);
        const pathParts = u.pathname.split('/');
        const basePath = pathParts.slice(0, pathParts.length).join('/');
        const restoreUrl = new URL(`${u.origin}${basePath}/messages/${mid}`);
        if (threadId) restoreUrl.searchParams.set('thread_id', threadId);
        const res = await fetch(restoreUrl.toString());
        if (!res.ok) { const d = await res.json() as any; throw new Error(d.message ?? `Error ${res.status}`); }
        const data = await res.json() as any;
        components = data.components ?? [];
      } else {
        const ch = threadId || channelId;
        const res = await fetch('/api/restore', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, channelId: ch, messageId: mid }),
        });
        const data = await res.json() as any;
        if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
        components = data.components ?? [];
      }
      if (!components.length) { addToast(t('err_no_components'), 'warn'); return; }
      updateNodes(addIds(components) as RootNode[]);
      setStatus({ msg: `✓ ${t('toast_restored')}`, kind: 'ok' });
      addToast(t('toast_restored'), 'ok');
    } catch (e: any) {
      const msg = `Error al restaurar: ${e.message ?? e}`;
      setStatus({ msg, kind: 'err' }); addToast(msg, 'err');
    } finally { setSending(false); }
  };

  // ── edit ────────────────────────────────────────────────────────────────────

  const handleEdit = async () => {
    const mid = parseMessageId(messageId);
    if (!mid) { addToast(t('err_no_msg_id'), 'err'); return; }
    if (!activeNodes.length) { addToast(t('err_no_components'), 'err'); return; }
    const errs = validateNodes(activeNodes as any[], t);
    if (errs.length) { addToast(errs[0], 'err'); return; }
    if (sendMode === 'webhook' && hasDynamicSelects(activeNodes as any[])) {
      addToast(t('err_dynamic_sel'), 'err'); return;
    }
    setSending(true); setStatus({ msg: '…', kind: 'info' });
    try {
      let res: Response;
      if (sendMode === 'webhook') {
        const u = buildWebhookUrl(webhookUrl);
        const pathParts = u.pathname.split('/');
        const editUrl = new URL(`${u.origin}${pathParts.join('/')}/messages/${mid}`);
        editUrl.searchParams.set('wait', 'true');
        editUrl.searchParams.set('with_components', 'true');
        if (threadId) editUrl.searchParams.set('thread_id', threadId);
        const body: any = { flags: 1 << 15, components: serialize(activeNodes) };
        if (!state.allowedMentions) body.allowed_mentions = { parse: [] };
        res = await fetch(editUrl.toString(), {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        const ch = threadId || channelId;
        res = await fetch('/api/edit', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, channelId: ch, messageId: mid, components: serialize(activeNodes), allowedMentions: state.allowedMentions }),
        });
      }
      const data = await res.json() as any;
      if (!res.ok) {
        const errText = data.message ?? data.error ?? 'Error de Discord';
        const errCode = data.code ? ` (code: ${data.code})` : '';
        let fieldHint = '';
        if (data.errors) {
          const flat = JSON.stringify(data.errors);
          const m = flat.match(/"message":"([^"]+)"/);
          if (m) fieldHint = ` — ${m[1]}`;
        }
        const msg = `Error ${res.status}: ${errText}${errCode}${fieldHint}`;
        setStatus({ msg, kind: 'err' }); addToast(msg, 'err');
      } else {
        setStatus({ msg: `✓ ${t('toast_edited')} (ID: ${data.id})`, kind: 'ok' });
        addToast(t('toast_edited'), 'ok');
      }
    } catch (e: any) {
      const msg = `Error: ${e.message ?? e}`;
      setStatus({ msg, kind: 'err' }); addToast(msg, 'err');
    } finally { setSending(false); }
  };

  // ── send ────────────────────────────────────────────────────────────────────

  const hasDynamicSelects = (nodes: any[]): boolean => {
    const dynTypes = [5, 6, 7, 8];
    const scan = (n: any): boolean => {
      if (dynTypes.includes(n.type)) return true;
      if (Array.isArray(n.components)) return n.components.some(scan);
      return false;
    };
    return nodes.some(scan);
  };

  const handleSend = async () => {
    // validate all messages
    for (let i = 0; i < state.messages.length; i++) {
      const nodes = state.messages[i];
      if (!nodes.length) {
        const msg = t('err_empty_msg', i + 1);
        setStatus({ msg: `⚠ ${msg}`, kind: 'err' }); addToast(msg, 'err'); return;
      }
      const errs = validateNodes(nodes as any[], t);
      if (errs.length) {
        const msg = state.messages.length > 1 ? `Msg ${i + 1}: ${errs[0]}` : errs[0];
        setStatus({ msg: `⚠ ${msg}`, kind: 'err' }); addToast(msg, 'err'); return;
      }
      if (sendMode === 'webhook' && hasDynamicSelects(nodes as any[])) {
        const msg = state.messages.length > 1 ? `Msg ${i + 1}: ${t('err_dynamic_sel')}` : t('err_dynamic_sel');
        setStatus({ msg: `⚠ ${msg}`, kind: 'err' }); addToast(msg, 'err'); return;
      }
    }

    if (sendMode === 'bot') {
      if (!token || !channelId) {
        setStatus({ msg: t('err_empty_token'), kind: 'err' });
        addToast(t('err_empty_token'), 'err'); return;
      }
    } else {
      if (!webhookUrl) {
        setStatus({ msg: t('err_empty_webhook'), kind: 'err' });
        addToast(t('err_empty_webhook'), 'err'); return;
      }
      if (!webhookUrl.includes('discord.com/api/webhooks/') && !webhookUrl.includes('discordapp.com/api/webhooks/')) {
        setStatus({ msg: t('err_invalid_webhook'), kind: 'err' });
        addToast(t('err_invalid_webhook'), 'err'); return;
      }
    }

    setSending(true);
    const total = state.messages.length;
    const sentIds: string[] = [];

    try {
      for (let i = 0; i < state.messages.length; i++) {
        const nodes = state.messages[i];
        setStatus({ msg: `Enviando${total > 1 ? ` Msg ${i + 1}/${total}` : ''}…`, kind: 'info' });
        let res: Response;

        if (sendMode === 'webhook') {
          const parsedUrl = buildWebhookUrl(webhookUrl);
          const discordBody: any = { flags: 1 << 15, components: serialize(nodes) };
          if (whName.trim()) discordBody.username = whName.trim();
          if (whAvatar.trim()) discordBody.avatar_url = whAvatar.trim();
          if (!state.allowedMentions) discordBody.allowed_mentions = { parse: [] };
          res = await fetch(parsedUrl.toString(), {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordBody),
          });
        } else {
          res = await fetch('/api/send', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ components: serialize(nodes), channelId: threadId || channelId, token, allowedMentions: state.allowedMentions }),
          });
        }

        const data = await res.json() as any;
        if (!res.ok) {
          const errText = data.message ?? data.error ?? 'Error de Discord';
          const errCode = data.code ? ` (code: ${data.code})` : '';
          let fieldHint = '';
          if (data.errors) {
            const flat = JSON.stringify(data.errors);
            const m = flat.match(/"message":"([^"]+)"/);
            if (m) fieldHint = ` — ${m[1]}`;
          }
          const msg = `${total > 1 ? `Msg ${i + 1}: ` : ''}Error ${res.status}: ${errText}${errCode}${fieldHint}`;
          setStatus({ msg, kind: 'err' }); addToast(msg, 'err');
          return;
        }
        sentIds.push(data.id);
      }

      const okMsg = total > 1
        ? `✓ ${t('toast_sent_multi', total)} (IDs: ${sentIds.join(', ')})`
        : `✓ ${t('toast_sent')} (ID: ${sentIds[0]})`;
      setStatus({ msg: okMsg, kind: 'ok' });
      addToast(total > 1 ? t('toast_sent_multi', total) : t('toast_sent'), 'ok');
      sentIds.forEach(id => recordSend({ id: id + Date.now(), msgId: id, mode: sendMode }));
    } catch (e) {
      const msg = `Error de red: ${e}`;
      setStatus({ msg, kind: 'err' }); addToast(msg, 'err');
    } finally { setSending(false); }
  };

  // ── misc ────────────────────────────────────────────────────────────────────

  const handleClear = () => {
    const label = state.messages.length > 1 ? t('confirm_clear_msg', safeMsgIdx + 1) : t('confirm_clear_one');
    if (!window.confirm(label)) return;
    updateNodes([]); setSelected(null);
    addToast(t('toast_cleared'), 'warn');
  };

  const handleExport = () => {
    const payload = state.messages.length > 1
      ? state.messages.map(m => ({ flags: 1 << 15, components: serialize(m) }))
      : { flags: 1 << 15, components: serialize(activeNodes) };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = state.messages.length > 1 ? 'messages.json' : 'message.json'; a.click();
    URL.revokeObjectURL(url);
    addToast(t('toast_exported'), 'ok');
  };

  const handleImport = (payload: ImportedPayload) => {
    // V2 import: accept either exported V2 JSON or a raw embed-style message JSON
    // Try to read components[] from V2 export format
    const src = Array.isArray(payload.components) ? payload.components : null;
    if (src && src.length > 0) {
      setState(s => {
        const msgs = [...s.messages];
        msgs[safeMsgIdx] = addIds(src) as RootNode[];
        return { ...s, messages: msgs };
      });
      addToast(t('import_ok'), 'ok');
    } else {
      addToast(t('import_err'), 'err');
    }
  };

  const previewRef = useRef<HTMLElement>(null);

  const handleExportPng = () => {
    const el = previewRef.current;
    if (!el) return;
    const w = window.open('', '_blank', 'width=860,height=700');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview</title>
<link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.6.0/uicons-solid-rounded/css/uicons-solid-rounded.css"/>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#313338;padding:24px;font-family:'Segoe UI','Noto Sans',sans-serif;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}</style></head>
<body id="print-preview">${el.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
    addToast(t('export_png'), 'info');
  };

  const handlePingsToggle = () => {
    setState(s => ({ ...s, allowedMentions: !s.allowedMentions }));
    addToast(state.allowedMentions ? t('toast_pings_off') : t('toast_pings_on'), 'info');
  };

  const selectedNode = selected ? findNodeById(activeNodes as any[], selected) : null;

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div id="root">
      {/* ── Toasts ── */}
      <ToastContainer />

      {/* ── Welcome modal ── */}
      {welcomeOpen && <WelcomeModal onClose={() => setWelcomeOpen(false)} />}
      {changelogOpen && <ChangelogModal onClose={() => setChangelogOpen(false)} />}
      {historyOpen && <SendHistoryModal onClose={() => setHistoryOpen(false)} onLoadId={id => setMessageId(id)} />}
      {templatesOpen && <TemplatesModal currentState={state} onLoad={s => setState(s as BuilderState)} onClose={() => setTemplatesOpen(false)} />}
      {importOpen && <ImportModal onImport={handleImport} onClose={() => setImportOpen(false)} />}
      {whAppearanceOpen && <WebhookAppearanceModal webhookUrl={webhookUrl} overrideName={whName} overrideAvatar={whAvatar} onSave={(n, a) => { setWhName(n); setWhAvatar(a); }} onClose={() => setWhAppearanceOpen(false)} />}
      {diffOpen && <DiffModal original={diffSnapshotRef.current} current={state.messages.map(m => ({ flags: 1 << 15, components: serialize(m as any[]) }))} onClose={() => setDiffOpen(false)} />}

      {/* ── Security warning ── */}
      {securityWarning && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: 420 }}>
            <div className="modal-header" style={{ borderBottomColor: 'rgba(252,196,25,.18)' }}>
              <div className="modal-header-icon" style={{ background: 'rgba(252,196,25,.12)', color: '#fcc419' }}>
                <IcAlertTriangle size={22} />
              </div>
              <div className="modal-header-text">
                <h2 style={{ color: '#fcc419' }}>{t('security_title')}</h2>
                <p>{securityWarning === 'token' ? t('security_label_token') : t('security_label_webhook')}</p>
              </div>
            </div>
            <div className="modal-body">
              <div className="tutorial-step">
                <div className="tutorial-step-desc">
                  {securityWarning === 'token' ? t('security_desc_token') : t('security_desc_webhook')}
                </div>
                <div className="security-tip">
                  <Fi name="lock" /> {t('security_local')}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => {
                if (securityWarning) warnedRef.current.delete(securityWarning);
                setSecurityWarning(null);
                (document.activeElement as HTMLElement)?.blur();
              }}>
                {t('cancel')}
              </button>
              <button
                style={{ background: '#b7950b', color: '#fff', fontSize: 12, padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setSecurityWarning(null)}>
                {t('security_confirm')}
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
                <h2>{t('cs_title')}</h2>
                <p>{t('cs_sub')}</p>
              </div>
            </div>
            <div className="modal-body">
              <div className="tutorial-step">
                <div className="tutorial-step-desc">
                  {t('cs_desc')}
                </div>
                <div className="tutorial-tip">
                  <Fi name="hammer" /> {t('cs_tip')}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" style={{ fontSize: 12, padding: '6px 16px' }} onClick={() => setComingSoonOpen(false)}>
                {t('cs_ok')}
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

        <button className="btn-secondary" title={t('embed_normal_btn')} onClick={() => window.location.href = '/embed'}>
          <IcEmbed size={13} /> {t('embed_normal_btn')}
        </button>
        <LangSwitch />
        <button className="btn-secondary" title={t('copy_link')} onClick={() => { navigator.clipboard.writeText(window.location.href); addToast(t('copy_link_ok'), 'ok'); }} style={{ padding: '6px 10px', fontSize: 13 }}>
          <Fi name="link" />
        </button>
        <button className="btn-secondary" title={t('import_title')} onClick={() => setImportOpen(true)} style={{ padding: '6px 10px', fontSize: 13 }}>
          <Fi name="upload" />
        </button>
        <button className="btn-secondary" title={t('tmpl_title')} onClick={() => setTemplatesOpen(true)} style={{ padding: '6px 10px', fontSize: 13 }}>
          <Fi name="bookmark" />
        </button>
        <button className="btn-secondary" title={t('hist_title')} onClick={() => setHistoryOpen(true)} style={{ padding: '6px 10px', fontSize: 13 }}>
          <Fi name="clock" />
        </button>
        <button className="btn-secondary" title="Changelog" onClick={() => setChangelogOpen(true)} style={{ padding: '6px 10px', fontSize: 13 }}>
          <Fi name="list" />
        </button>
        <button className="btn-secondary" title="Help / Ayuda" onClick={() => setWelcomeOpen(true)} style={{ padding: '6px 10px' }}>
          <IcHelpCircle size={14} />
        </button>
        <button className={`btn-toggle ${state.allowedMentions ? 'on' : 'off'}`}
          onClick={handlePingsToggle}>
          {state.allowedMentions ? <><IcBell size={13} /> {t('pings_on')}</> : <><IcBellOff size={13} /> {t('pings_off')}</>}
        </button>
        <button className="btn-secondary" onClick={handleExportPng} title={t('export_png')} style={{ padding: '6px 10px' }}>
          <Fi name="picture" />
        </button>
        <button className="btn-secondary" onClick={handleExport} title={t('export_btn')}>
          <IcDownload size={13} /> {t('export_btn')}
        </button>
        <button className="btn-danger" onClick={handleClear} title={t('clear_btn')}>
          <IcTrash size={13} /> {t('clear_btn')}
        </button>
        {(() => {
          const total = countTextChars(activeNodes as any[]);
          const over = total > TEXT_TOTAL_LIMIT;
          const warn = !over && total > TEXT_TOTAL_LIMIT * 0.85;
          return (
            <span title={t('char_counter_title', safeMsgIdx + 1, TEXT_TOTAL_LIMIT)} style={{
              fontSize: 11, color: over ? '#ed4245' : warn ? '#fcc419' : '#5c5f66',
              fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
            }}>
              {state.messages.length > 1 && <span style={{ opacity: .6 }}>M{safeMsgIdx + 1} </span>}
              {total} / {TEXT_TOTAL_LIMIT}
            </span>
          );
        })()}
        <button className="btn-success btn-send" onClick={handleSend} disabled={sending}>
          {sending ? t('sending_btn') : <><IcSend size={13} /> {t('send_btn')}</>}
        </button>
      </header>

      <div className="app-body">
        {/* ── LEFT ── */}
        <aside className="panel-left">
          <div className="config-bar">
            {/* Send mode toggle */}
            <div className="send-mode-toggle">
              <button className={`mode-btn ${sendMode === 'bot' ? 'active' : ''}`} onClick={() => handleSendMode('bot')}>
                <Fi name="robot" style={{ marginRight: 5 }} /> {t('bot_token_mode')}
              </button>
              <button className={`mode-btn ${sendMode === 'webhook' ? 'active' : ''}`} onClick={() => handleSendMode('webhook')}>
                <Fi name="link" style={{ marginRight: 5 }} /> {t('webhook_mode')}
              </button>
            </div>

            {sendMode === 'bot' ? (
              <>
                <div className="field">
                  <label>{t('bot_token_label')}</label>
                  <input type="password" value={token}
                    onFocus={() => handleCredentialFocus('token')}
                    onChange={e => handleToken(e.target.value)}
                    placeholder="Bot token..." />
                </div>
                <div className="field">
                  <label>{t('channel_id')}</label>
                  <input value={channelId} onChange={e => handleChannel(e.target.value)} placeholder="1234567890..." />
                </div>
              </>
            ) : (
              <div className="field">
                <label>{t('webhook_url')}</label>
                <input type="password" value={webhookUrl}
                  onFocus={() => handleCredentialFocus('webhook')}
                  onChange={e => handleWebhook(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..." />
                <WebhookManager currentUrl={webhookUrl} onSelect={url => handleWebhook(url)} />
                <button onClick={() => setWhAppearanceOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(88,101,242,.08)', border: '1px solid rgba(88,101,242,.2)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', width: '100%', textAlign: 'left', marginTop: 4 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: '#5865f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, overflow: 'hidden' }}>
                    {(whAvatar || botInfo?.avatar)
                      ? <img src={whAvatar || botInfo?.avatar || ''} style={{ width: 28, height: 28, objectFit: 'cover' }} alt="" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      : (whName || botInfo?.username || 'W')[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#dbdee1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{whName || botInfo?.username || 'Webhook'}</div>
                    <div style={{ fontSize: 10, color: '#72767d' }}>{t('wh_appearance_btn')} →</div>
                  </div>
                </button>
              </div>
            )}

            {/* Thread ID + Message ID */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="field" style={{ flex: 1, minWidth: 0 }}>
                <label style={{ fontSize: 11 }}>{t('thread_id')} <span style={{ color: '#4e5058', fontWeight: 400 }}>· {t('optional')}</span></label>
                <input value={threadId} onChange={e => setThreadId(e.target.value.trim())} placeholder={t('thread_placeholder')} />
              </div>
              <div className="field" style={{ flex: 1, minWidth: 0 }}>
                <label style={{ fontSize: 11 }}>{t('message_id')} <span style={{ color: '#4e5058', fontWeight: 400 }}>· {t('edit_hint')}</span></label>
                <input value={messageId} onChange={e => setMessageId(e.target.value.trim())} placeholder={t('msg_placeholder')} />
              </div>
            </div>
            {messageId && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={handleRestore} disabled={sending}>
                  {t('restore_btn')}
                </button>
                <button className="btn-secondary" style={{ flex: 1, fontSize: 12, color: '#57f287', borderColor: 'rgba(87,242,135,.4)' }} onClick={handleEdit} disabled={sending}>
                  {t('edit_btn')}
                </button>
              </div>
            )}
            {!!(messageId && diffSnapshotRef.current != null) && (
              <button onClick={() => setDiffOpen(true)} style={{ background: 'rgba(255,220,0,.06)', border: '1px solid rgba(255,220,0,.2)', borderRadius: 4, color: '#fcc419', cursor: 'pointer', fontSize: 11, fontWeight: 600, padding: '4px 10px', width: '100%' }}>
                ⚡ {t('diff_title')}
              </button>
            )}
          </div>

          <div className="toolbar">
            <span className="toolbar-label">{t('add_to_root')}</span>
            <button className="btn-secondary" onClick={() => addRoot(newContainer(), 'Container')} title="Container"><Fi name="box" /> {t('comp_container')}</button>
            <button className="btn-secondary" onClick={() => addRoot(newActionRow(), 'Action Row')} title="Action Row"><IcGrid size={12} /> {t('comp_row')}</button>
            <button className="btn-secondary" onClick={() => addRoot(newText(), t('comp_text'))} title={t('comp_text')}><IcText size={12} /> {t('comp_text')}</button>
            <button className="btn-secondary" onClick={() => addRoot(newSection(), 'Section')} title="Section"><IcLayout size={12} /> {t('comp_section')}</button>
            <button className="btn-secondary" onClick={() => addRoot(newGallery(), 'Gallery')} title="Gallery"><IcImages size={12} /> {t('comp_gallery')}</button>
            <button className="btn-secondary" onClick={() => addRoot(newDivider(), 'Divider')} title="Divider"><IcMinus size={12} /> {t('comp_divider')}</button>
          </div>

          {/* Message tabs */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #1e1f22', background: '#2b2d31' }}>
            <span style={{ fontSize: 10, color: '#4e5058', fontWeight: 700, textTransform: 'uppercase', padding: '0 8px', letterSpacing: '.05em', flexShrink: 0 }}>{t('messages_label')}</span>
            <div style={{ display: 'flex', flex: 1, gap: 2, overflow: 'auto', padding: '4px 4px 0' }}>
              {state.messages.map((m, i) => (
                <button key={i}
                  onClick={() => { setActiveMsg(i); setSelected(null); }}
                  style={{
                    padding: '4px 12px', fontSize: 11, borderRadius: '4px 4px 0 0', border: 'none', cursor: 'pointer', fontWeight: 600,
                    background: i === safeMsgIdx ? '#313338' : 'rgba(255,255,255,.04)',
                    color: i === safeMsgIdx ? '#dbdee1' : '#72767d',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                  {`Msg ${i + 1}`}
                  {m.length > 0 && <span style={{ marginLeft: 5, fontSize: 9, opacity: .6 }}>{m.length}</span>}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 2, padding: '0 4px', flexShrink: 0 }}>
              <button onClick={addMessage} title={t('add_message_btn')}
                style={{ padding: '4px 9px', fontSize: 14, border: 'none', cursor: 'pointer', background: 'transparent', color: '#57f287', fontWeight: 700, lineHeight: 1 }}>
                +
              </button>
              {state.messages.length > 1 && (
                <button onClick={() => removeMessage(safeMsgIdx)} title={`Eliminar Msg ${safeMsgIdx + 1}`}
                  style={{ padding: '4px 7px', fontSize: 11, border: 'none', cursor: 'pointer', background: 'transparent', color: '#ed4245', fontWeight: 700 }}>
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="panel-header" style={{ marginTop: 0 }}>{t('panel_tree', safeMsgIdx + 1)}</div>
          {sendMode === 'webhook' && activeNodes.some((n: any) => n.type === 1 || n.components?.some((c: any) => c.type === 1)) && (
            <div style={{ margin: '0 6px 4px', padding: '7px 10px', background: 'rgba(255,200,0,.07)', border: '1px solid rgba(255,200,0,.25)', borderRadius: 6, fontSize: 11.5, color: '#fcc419', lineHeight: 1.5 }}>
              <Fi name="triangle-warning" style={{ marginRight: 5 }} />
              {t('row_webhook_warn')}
            </div>
          )}
          <div className="panel-body">
            <ComponentTree
              nodes={activeNodes as any[]}
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
        <main ref={previewRef} className="panel-center">
          <Preview nodes={activeNodes} selected={selected} onSelect={setSelected} botInfo={sendMode==='webhook'&&(whName||whAvatar)?{username:whName||botInfo?.username||'Webhook',avatar:whAvatar||botInfo?.avatar||null}:botInfo} />
        </main>

        {/* ── RIGHT ── */}
        <aside className="panel-right">
          <div className="panel-header">{t('panel_props')}</div>
          <div className="panel-body">
            <PropertyEditor node={selectedNode} onChange={handleChange} />
          </div>
        </aside>
      </div>

      {/* Status bar */}
      <div className="status-bar">
        <span className={`msg ${status?.kind ?? ''}`}>{status?.msg ?? t('status_ready')}</span>
        <small style={{ background: sendMode === 'webhook' ? 'rgba(88,101,242,.15)' : 'transparent', padding: '1px 6px', borderRadius: 4 }}>
          {sendMode === 'bot' ? <><Fi name="robot" style={{ marginRight: 4 }} /> Bot</> : <><Fi name="link" style={{ marginRight: 4 }} /> Webhook</>}
        </small>
        <small>{t('status_msg', safeMsgIdx + 1, state.messages.length, activeNodes.length)}</small>
        <small>{state.allowedMentions ? <><IcBell size={11} /> {t('pings_on')}</> : <><IcBellOff size={11} /> {t('pings_off')}</>}</small>
      </div>
    </div>
  );
}
