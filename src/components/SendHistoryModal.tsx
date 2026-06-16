import { useState } from 'react';
import { useT } from '../lib/i18n';
import { addToast } from './ToastSystem';

export interface HistoryEntry {
  id: string;
  msgId: string;
  channel?: string;
  mode: 'bot' | 'webhook';
  ts: number;
}

const KEY = 'dcb_history';
const MAX = 10;

export function recordSend(entry: Omit<HistoryEntry, 'ts'>) {
  try {
    const list: HistoryEntry[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    list.unshift({ ...entry, ts: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {}
}

export function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

interface Props {
  onClose: () => void;
  onLoadId?: (msgId: string) => void;
}

const locales: Record<string, string> = { es: 'es', en: 'en', pt: 'pt-BR' };

export default function SendHistoryModal({ onClose, onLoadId }: Props) {
  const { t, lang } = useT();
  const [list, setList] = useState<HistoryEntry[]>(loadHistory);

  const clearAll = () => {
    localStorage.removeItem(KEY);
    setList([]);
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => addToast(t('hist_id_copied'), 'ok'));
  };

  const fmt = (ts: number) => {
    try {
      return new Date(ts).toLocaleString(locales[lang] ?? 'en', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return ''; }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-text">
            <h2>{t('hist_title')}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ maxHeight: 400, overflowY: 'auto', padding: 12 }}>
          {list.length === 0 ? (
            <div style={{ color: '#4e5058', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>{t('hist_empty')}</div>
          ) : (
            list.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 4, background: '#1e1f22', borderRadius: 5, border: '1px solid #2e2f35' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, background: e.mode === 'bot' ? '#3f51b5' : '#2d6a4f', color: '#fff', borderRadius: 3, padding: '1px 5px', fontWeight: 700 }}>
                      {e.mode === 'bot' ? 'BOT' : 'WH'}
                    </span>
                    <code style={{ fontSize: 12, color: '#a5b4fc', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{e.msgId}</code>
                  </div>
                  <span style={{ fontSize: 11, color: '#4e5058' }}>{fmt(e.ts)}</span>
                </div>
                <button title={t('hist_copy_id')} onClick={() => copyId(e.msgId)}
                  style={{ background: '#2e2f35', border: 'none', borderRadius: 4, color: '#b5bac1', cursor: 'pointer', fontSize: 11, padding: '4px 8px' }}>
                  ID
                </button>
                {onLoadId && (
                  <button title={t('hist_load')} onClick={() => { onLoadId(e.msgId); onClose(); }}
                    style={{ background: '#3f4147', border: 'none', borderRadius: 4, color: '#b5bac1', cursor: 'pointer', fontSize: 11, padding: '4px 8px' }}>
                    ↩
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        {list.length > 0 && (
          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button className="btn-danger" style={{ fontSize: 12 }} onClick={clearAll}>{t('hist_clear')}</button>
            <button className="btn-secondary" style={{ fontSize: 12 }} onClick={onClose}>OK</button>
          </div>
        )}
      </div>
    </div>
  );
}
