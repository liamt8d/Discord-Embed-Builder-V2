import { useState } from 'react';
import { useT } from '../lib/i18n';
import { addToast } from './ToastSystem';

interface Props {
  onImport: (payload: ImportedPayload) => void;
  onClose: () => void;
}

export interface ImportedPayload {
  content?: string;
  embeds?: unknown[];
  username?: string;
  avatar_url?: string;
  components?: unknown[];
}

function parsePayload(raw: string): ImportedPayload | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    // Accept top-level or wrapped in messages[0]
    const src = Array.isArray(parsed.messages) ? parsed.messages[0] : parsed;
    if (typeof src !== 'object') return null;
    const result: ImportedPayload = {};
    if (typeof src.content === 'string') result.content = src.content;
    if (Array.isArray(src.embeds)) result.embeds = src.embeds;
    if (typeof src.username === 'string') result.username = src.username;
    if (typeof src.avatar_url === 'string') result.avatar_url = src.avatar_url;
    if (Array.isArray(src.components)) result.components = src.components;
    return result;
  } catch { return null; }
}

export default function ImportModal({ onImport, onClose }: Props) {
  const { t } = useT();
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');

  const handleImport = () => {
    const payload = parsePayload(raw.trim());
    if (!payload) { setError(t('import_err')); return; }
    setError('');
    onImport(payload);
    addToast(t('import_ok'), 'ok');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-text"><h2>{t('import_title')}</h2></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: 14 }}>
          <p style={{ fontSize: 12, color: '#72767d', marginBottom: 10, lineHeight: 1.5 }}>{t('import_hint')}</p>
          <textarea
            value={raw}
            onChange={e => { setRaw(e.target.value); setError(''); }}
            placeholder={t('import_json_ph')}
            rows={12}
            autoFocus
            style={{ width: '100%', background: '#1e1f22', border: `1px solid ${error ? '#ed4245' : '#383a40'}`, borderRadius: 5, color: '#dbdee1', fontSize: 12, padding: '8px 10px', outline: 'none', resize: 'vertical', fontFamily: 'Consolas, monospace', boxSizing: 'border-box' }}
            onKeyDown={e => { if (e.key === 'Escape') onClose(); if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleImport(); }}
          />
          {error && <p style={{ color: '#ed4245', fontSize: 12, marginTop: 6 }}>⚠ {error}</p>}
        </div>
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn-secondary" style={{ fontSize: 12 }} onClick={onClose}>{t('cancel')}</button>
          <button className="btn-primary" style={{ fontSize: 12 }} disabled={!raw.trim()} onClick={handleImport}>{t('import_btn')}</button>
        </div>
      </div>
    </div>
  );
}
