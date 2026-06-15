import React, { useState } from 'react';
import { TYPE_ICON, TYPE_LABEL } from '../lib/utils';
import { IcPlus, IcCopy, IcChevronUp, IcChevronDown, IcX, Fi } from './Icons';

const ADD_OPTS_17: { type: number; icon: React.ReactNode; label: string }[] = [
  { type: 10, icon: '¶', label: 'Texto' },
  { type: 14, icon: '─', label: 'Divider' },
  { type: 9,  icon: '▤', label: 'Section' },
  { type: 12, icon: '⊞', label: 'Gallery' },
  { type: 1,  icon: '▦', label: 'Action Row' },
];
const ADD_OPTS_1: { type: number; icon: React.ReactNode; label: string }[] = [
  { type: 2, icon: '⊙', label: 'Botón' },
  { type: 3, icon: '≡', label: 'Select texto' },
  { type: 6, icon: <Fi name="shield" />, label: 'Select roles' },
  { type: 5, icon: <Fi name="user" />, label: 'Select usuarios' },
  { type: 7, icon: <Fi name="comment" />, label: 'Select menciones' },
  { type: 8, icon: '#', label: 'Select canales' },
];

// Override emoji TYPE_ICON entries with Fi icons
const TYPE_ICON_JSX: Record<number, React.ReactNode> = {
  5:  <Fi name="user" />,
  6:  <Fi name="shield" />,
  7:  <Fi name="comment" />,
  11: <Fi name="picture" />,
  17: <Fi name="box" />,
};
const nodeIcon = (type: number): React.ReactNode =>
  TYPE_ICON_JSX[type] ?? TYPE_ICON[type] ?? '?';

interface Props {
  nodes: any[];
  selected: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onAddChild: (parentId: string, type: number) => void;
  onDuplicate: (id: string) => void;
}

function NodeRow({ node, depth, selected, onSelect, onRemove, onMove, onAddChild, onDuplicate }: {
  node: any; depth: number; selected: string | null;
  onSelect: (id: string) => void; onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void; onAddChild: (pid: string, type: number) => void;
  onDuplicate: (id: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const isSel = selected === node._id;
  const children: any[] = Array.isArray(node.components) ? node.components : [];
  const acc = node.accessory;
  const addOpts = node.type === 17 ? ADD_OPTS_17 : node.type === 1 ? ADD_OPTS_1 : [];
  const canAdd = addOpts.length > 0;

  const label = getLabel(node);

  return (
    <div>
      <div
        className={`tree-node${isSel ? ' selected' : ''}`}
        style={{ paddingLeft: 6 + depth * 12 }}
        onClick={() => { onSelect(node._id); setAddOpen(false); }}
      >
        <span className="tree-node-icon">{nodeIcon(node.type)}</span>
        <span className="tree-node-label">{label}</span>
        <span className="tree-actions">
          {canAdd && (
            <button className="btn-icon add-btn" title="Agregar hijo"
              onClick={e => { e.stopPropagation(); setAddOpen(o => !o); }}>
              <IcPlus size={12} />
            </button>
          )}
          <button className="btn-icon" title="Duplicar" style={{ color: '#a0c4ff' }}
            onClick={e => { e.stopPropagation(); onDuplicate(node._id); }}><IcCopy size={12} /></button>
          <button className="btn-icon" title="Subir" onClick={e => { e.stopPropagation(); onMove(node._id, -1); }}><IcChevronUp size={12} /></button>
          <button className="btn-icon" title="Bajar" onClick={e => { e.stopPropagation(); onMove(node._id, 1); }}><IcChevronDown size={12} /></button>
          <button className="btn-icon del-btn" title="Eliminar" onClick={e => { e.stopPropagation(); onRemove(node._id); }}><IcX size={12} /></button>
        </span>
      </div>

      {/* Add child menu */}
      {addOpen && (
        <div className="tree-add-menu" style={{ paddingLeft: 6 + (depth + 1) * 12 }}>
          {addOpts.map(opt => (
            <button key={opt.type} className="tree-add-opt"
              onClick={() => { onAddChild(node._id, opt.type); setAddOpen(false); }}>
              <span style={{ opacity: .7 }}>{opt.icon}</span> {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Children */}
      {children.length > 0 && (
        <div className="tree-children">
          {children.map((c: any) => (
            <NodeRow key={c._id} node={c} depth={depth + 1}
              selected={selected} onSelect={onSelect} onRemove={onRemove} onMove={onMove} onAddChild={onAddChild} onDuplicate={onDuplicate} />
          ))}
        </div>
      )}

      {/* Accessory */}
      {acc && (
        <div className="tree-children">
          <NodeRow node={acc} depth={depth + 1}
            selected={selected} onSelect={onSelect} onRemove={onRemove} onMove={onMove} onAddChild={onAddChild} onDuplicate={onDuplicate} />
        </div>
      )}
    </div>
  );
}

function getLabel(node: any): string {
  const base = TYPE_LABEL[node.type] ?? `Tipo ${node.type}`;
  if (node.type === 10 && node.content) return `${base}: ${node.content.slice(0, 22)}${node.content.length > 22 ? '…' : ''}`;
  if (node.type === 2  && node.label)   return `${base}: ${node.label}`;
  if (node.type === 11) return 'Thumbnail';
  return base;
}

export default function ComponentTree({ nodes, selected, onSelect, onRemove, onMove, onAddChild, onDuplicate }: Props) {
  if (!nodes.length) {
    return <div style={{ color: '#5c5f66', fontSize: 12, padding: '14px 10px', textAlign: 'center' }}>Sin componentes</div>;
  }
  return (
    <div>
      {nodes.map((n: any) => (
        <NodeRow key={n._id} node={n} depth={0}
          selected={selected} onSelect={onSelect} onRemove={onRemove} onMove={onMove} onAddChild={onAddChild} onDuplicate={onDuplicate} />
      ))}
    </div>
  );
}
