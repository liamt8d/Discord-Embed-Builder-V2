import { useState } from 'react';
import { useT } from '../lib/i18n';
import { addToast } from './ToastSystem';

export interface Template {
  id: string;
  name: string;
  state: unknown;
  ts: number;
}

const KEY = 'dcb_templates';

export function loadTemplates(): Template[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}
function saveTemplates(list: Template[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}

interface Props {
  currentState: unknown;
  onLoad: (state: unknown) => void;
  onClose: () => void;
}

const locales: Record<string, string> = { es: 'es', en: 'en', pt: 'pt-BR' };

export default function TemplatesModal({ currentState, onLoad, onClose }: Props) {
  const { t, lang } = useT();
  const [list, setList] = useState<Template[]>(loadTemplates);
  const [saveName, setSaveName] = useState('');
  const [showSave, setShowSave] = useState(false);

  const fmt = (ts: number) => {
    try { return new Date(ts).toLocaleDateString(locales[lang] ?? 'en', { month: 'short', day: 'numeric' }); } catch { return ''; }
  };

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    const next: Template[] = [{ id: (Date.now() + Math.random()).toString(36), name, state: currentState, ts: Date.now() }, ...list];
    setList(next); saveTemplates(next);
    setSaveName(''); setShowSave(false);
    addToast(t('tmpl_saved'), 'ok');
  };

  const handleLoad = (tmpl: Template) => {
    if (!confirm(t('tmpl_confirm_load'))) return;
    onLoad(tmpl.state);
    addToast(t('tmpl_loaded'), 'ok');
    onClose();
  };

  const handleDelete = (id: string) => {
    if (!confirm(t('tmpl_confirm_delete'))) return;
    const next = list.filter(t => t.id !== id);
    setList(next); saveTemplates(next);
    addToast(t('tmpl_deleted'), 'warn');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-text"><h2>{t('tmpl_title')}</h2></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: 12 }}>

          {/* Save form */}
          {showSave ? (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <input autoFocus value={saveName} onChange={e => setSaveName(e.target.value)}
                placeholder={t('tmpl_name_ph')}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSave(false); }}
                style={{ flex: 1, background: '#1e1f22', border: '1px solid #5865f2', borderRadius: 4, color: '#dbdee1', fontSize: 13, padding: '6px 9px', outline: 'none' }} />
              <button onClick={handleSave} disabled={!saveName.trim()}
                style={{ background: '#5865f2', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: 12, padding: '6px 14px', fontWeight: 700, opacity: saveName.trim() ? 1 : .5 }}>✓</button>
              <button onClick={() => setShowSave(false)}
                style={{ background: '#3f4147', border: 'none', borderRadius: 4, color: '#b5bac1', cursor: 'pointer', fontSize: 12, padding: '6px 10px' }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setShowSave(true)}
              style={{ width: '100%', marginBottom: 12, background: 'rgba(88,101,242,.1)', border: '1px dashed rgba(88,101,242,.4)', borderRadius: 5, color: '#8b94e5', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '7px 0' }}>
              ＋ {t('tmpl_save')}
            </button>
          )}

          {/* Template list */}
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {list.length === 0 ? (
              <div style={{ color: '#4e5058', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>{t('tmpl_empty')}</div>
            ) : (
              list.map(tmpl => (
                <div key={tmpl.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', marginBottom: 4, background: '#1e1f22', borderRadius: 5, border: '1px solid #2e2f35' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#dbdee1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tmpl.name}</div>
                    <div style={{ fontSize: 10, color: '#4e5058', marginTop: 2 }}>{fmt(tmpl.ts)}</div>
                  </div>
                  <button onClick={() => handleLoad(tmpl)}
                    style={{ background: '#2d3561', border: '1px solid rgba(88,101,242,.4)', borderRadius: 4, color: '#a5b4fc', cursor: 'pointer', fontSize: 12, padding: '4px 10px', fontWeight: 600 }}>
                    ↩ {t('tmpl_loaded').split(' ')[0]}
                  </button>
                  <button onClick={() => handleDelete(tmpl.id)}
                    style={{ background: 'none', border: 'none', color: '#4e5058', cursor: 'pointer', fontSize: 13, padding: '4px 6px', borderRadius: 4 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ed4245')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4e5058')}>
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" style={{ fontSize: 12 }} onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
