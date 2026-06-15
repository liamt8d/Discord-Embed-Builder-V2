import type { RootNode } from './types';

export const uid = () => Math.random().toString(36).slice(2, 9);

// ── State URL encoding ────────────────────────────────────────────────────────

export function encodeState(state: unknown): string {
  try {
    return btoa(encodeURIComponent(JSON.stringify(state)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch { return ''; }
}

export function decodeState(encoded: string): unknown {
  try {
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64 + '='.repeat((4 - b64.length % 4) % 4);
    return JSON.parse(decodeURIComponent(atob(pad)));
  } catch { return null; }
}

// ── Tree operations ───────────────────────────────────────────────────────────

export function updateNodeById(nodes: any[], id: string, updater: (n: any) => any): any[] {
  return nodes.map(n => {
    if (n._id === id) return updater(n);
    const next = { ...n };
    if (Array.isArray(n.components)) next.components = updateNodeById(n.components, id, updater);
    if (n.accessory?._id === id) next.accessory = updater(n.accessory);
    else if (n.accessory?.components) {
      const inner = updateNodeById([n.accessory], id, updater);
      next.accessory = inner[0];
    }
    return next;
  });
}

export function removeNodeById(nodes: any[], id: string): any[] {
  return nodes
    .filter(n => n._id !== id)
    .map(n => {
      const next = { ...n };
      if (Array.isArray(n.components)) next.components = removeNodeById(n.components, id);
      if (n.accessory?._id === id) next.accessory = undefined;
      return next;
    });
}

export function moveNode(nodes: any[], id: string, dir: -1 | 1): any[] {
  const idx = nodes.findIndex(n => n._id === id);
  if (idx !== -1) {
    const ni = idx + dir;
    if (ni < 0 || ni >= nodes.length) return nodes;
    const a = [...nodes];
    [a[idx], a[ni]] = [a[ni], a[idx]];
    return a;
  }
  return nodes.map(n => {
    const next = { ...n };
    if (Array.isArray(n.components)) next.components = moveNode(n.components, id, dir);
    return next;
  });
}

export function findNodeById(nodes: any[], id: string): any | null {
  for (const n of nodes) {
    if (n._id === id) return n;
    if (Array.isArray(n.components)) { const f = findNodeById(n.components, id); if (f) return f; }
    if (n.accessory) { const f = findNodeById([n.accessory], id); if (f) return f; }
  }
  return null;
}

export function addIds(nodes: any[]): any[] {
  return nodes.map(n => {
    const node: any = { ...n, _id: n._id || uid() };
    if (Array.isArray(node.components)) node.components = addIds(node.components);
    if (node.accessory) node.accessory = { ...node.accessory, _id: node.accessory._id || uid() };
    return node;
  });
}

// ── Serialization (remove _id before sending to Discord) ─────────────────────

// Fields that are optional in Discord API — empty strings must be omitted
const OPTIONAL_STR_FIELDS = new Set(['placeholder', 'description', 'url', 'emoji']);

export function serialize(nodes: RootNode[]): unknown[] {
  return JSON.parse(JSON.stringify(nodes, (k, v) => {
    if (k === '_id' || k === 'id') return undefined; // strip internal + discord-assigned ids
    if (v === null || v === undefined) return undefined;
    if (v === '' && OPTIONAL_STR_FIELDS.has(k)) return undefined;
    return v;
  }));
}

// ── Labels / icons ────────────────────────────────────────────────────────────

export const TYPE_LABEL: Record<number, string> = {
  1: 'Action Row', 2: 'Button', 3: 'Select (texto)',
  5: 'Select (usuarios)', 6: 'Select (roles)',
  7: 'Select (menciones)', 8: 'Select (canales)',
  9: 'Section', 10: 'Text', 11: 'Thumbnail',
  12: 'Gallery', 14: 'Divider', 17: 'Container',
};

export const TYPE_ICON: Record<number, string> = {
  1: '▦', 2: '⊙', 3: '≡', 5: '👤', 6: '🎭',
  7: '💬', 8: '#', 9: '▤', 10: '¶',
  11: '🖼', 12: '⊞', 14: '─', 17: '📦',
};

export const BUTTON_STYLE_NAMES: Record<number, string> = {
  1: 'Primary', 2: 'Secondary', 3: 'Success', 4: 'Danger', 5: 'Link',
};

export const BUTTON_STYLE_COLORS: Record<number, string> = {
  1: '#5865F2', 2: '#4e5058', 3: '#2d7d46', 4: '#c0392b', 5: '#4e5058',
};

// ── New node factories ────────────────────────────────────────────────────────

export const newText         = (): any => ({ _id: uid(), type: 10, content: '' });
export const newDivider      = (): any => ({ _id: uid(), type: 14, divider: true, spacing: 1 });
export const newSection      = (): any => ({ _id: uid(), type: 9, components: [newText()] });
export const newGallery      = (): any => ({ _id: uid(), type: 12, items: [{ media: { url: '' }, spoiler: false }] });
export const newButton       = (): any => ({ _id: uid(), type: 2, style: 1, label: 'Button', custom_id: `btn_${uid()}` });
export const newSelectMenu   = (): any => ({ _id: uid(), type: 3, custom_id: `sel_${uid()}`, placeholder: '', options: [] });
export const newUserSelect   = (): any => ({ _id: uid(), type: 5, custom_id: `sel_${uid()}`, placeholder: '' });
export const newRoleSelect   = (): any => ({ _id: uid(), type: 6, custom_id: `sel_${uid()}`, placeholder: '' });
export const newMentionSelect= (): any => ({ _id: uid(), type: 7, custom_id: `sel_${uid()}`, placeholder: '' });
export const newChannelSelect= (): any => ({ _id: uid(), type: 8, custom_id: `sel_${uid()}`, placeholder: '' });
export const newActionRow    = (): any => ({ _id: uid(), type: 1, components: [] });
export const newContainer    = (): any => ({ _id: uid(), type: 17, accent_color: null, spoiler: false, components: [] });

export const SEL_TYPES = [3, 5, 6, 7, 8];
