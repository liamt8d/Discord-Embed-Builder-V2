import { useState } from 'react';
import { useT } from '../lib/i18n';
import { addToast } from './ToastSystem';

// ── Types & storage ───────────────────────────────────────────────────────────

export interface SavedWebhook { id: string; name: string; url: string }

const KEY = 'dcb_webhooks';

const loadHooks = (): SavedWebhook[] => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
};
const persistHooks = (h: SavedWebhook[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(h)); } catch {}
};

// ── Shared hook for external use (e.g. to read count in header) ──────────────

export const getSavedWebhooks = loadHooks;

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  currentUrl: string;
  onSelect: (url: string) => void;
}

const ROW: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 4 };
const BTN_BASE: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
  borderRadius: 4, lineHeight: 1,
};
const INPUT_S: React.CSSProperties = {
  flex: 1, background: '#1e1f22', border: '1px solid #5865f2',
  borderRadius: 4, color: '#dbdee1', fontSize: 12,
  padding: '5px 8px', outline: 'none',
};

export default function WebhookManager({ currentUrl, onSelect }: Props) {
  const { t } = useT();
  const [hooks, setHooks] = useState<SavedWebhook[]>(loadHooks);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');

  const update = (next: SavedWebhook[]) => { setHooks(next); persistHooks(next); };

  const handleSave = () => {
    const name = addName.trim();
    if (!name || !currentUrl.trim()) return;
    // Replace existing entry with same URL, otherwise append
    const next = [...hooks.filter(h => h.url !== currentUrl),
      { id: (Date.now() + Math.random()).toString(36), name, url: currentUrl }];
    update(next);
    setAddName(''); setShowAdd(false);
    addToast(t('wm_saved'), 'ok');
  };

  const handleDelete = (id: string) => {
    const next = hooks.filter(h => h.id !== id);
    update(next);
    addToast(t('wm_deleted'), 'warn');
  };

  const isValidWebhook = currentUrl.includes('/api/webhooks/') ||
    currentUrl.includes('discord.com/api/webhooks/') ||
    currentUrl.includes('discordapp.com/api/webhooks/');

  return (
    <div style={{ marginTop: 6 }}>

      {/* Saved list */}
      {hooks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
          {hooks.map(h => {
            const active = h.url === currentUrl;
            // Show last segment of webhook URL as hint
            const hint = (() => {
              try { const parts = new URL(h.url).pathname.split('/'); return parts[parts.length - 1]?.slice(0, 12); } catch { return ''; }
            })();
            return (
              <div key={h.id} style={ROW}>
                <button
                  onClick={() => onSelect(h.url)}
                  style={{
                    ...BTN_BASE, flex: 1, textAlign: 'left',
                    padding: '5px 8px', overflow: 'hidden',
                    background: active ? 'rgba(88,101,242,.14)' : '#1e1f22',
                    border: `1px solid ${active ? 'rgba(88,101,242,.45)' : '#2e2f35'}`,
                    color: '#b5bac1',
                  }}
                >
                  <span style={{ color: active ? '#a5b4fc' : '#dbdee1', fontWeight: 700, marginRight: 6, fontSize: 12 }}>
                    {h.name}
                  </span>
                  {hint && (
                    <span style={{ color: '#4e5058', fontSize: 10, fontFamily: 'monospace' }}>
                      …{hint}
                    </span>
                  )}
                  {active && (
                    <span style={{ marginLeft: 6, fontSize: 9, background: 'rgba(88,101,242,.35)', color: '#a5b4fc', borderRadius: 3, padding: '1px 4px', fontWeight: 700 }}>
                      ACTIVO
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(h.id)}
                  title="Eliminar"
                  style={{ ...BTN_BASE, color: '#4e5058', padding: '4px 6px' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ed4245')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#4e5058')}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add form / button */}
      {showAdd ? (
        <div style={ROW}>
          <input
            value={addName}
            onChange={e => setAddName(e.target.value)}
            placeholder={t('wm_name_placeholder')}
            autoFocus
            style={INPUT_S}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') { setShowAdd(false); setAddName(''); }
            }}
          />
          <button
            onClick={handleSave}
            disabled={!addName.trim()}
            style={{ ...BTN_BASE, background: '#2d7d46', color: '#fff', padding: '5px 10px', fontWeight: 700, opacity: addName.trim() ? 1 : .45 }}
          >
            ✓
          </button>
          <button
            onClick={() => { setShowAdd(false); setAddName(''); }}
            style={{ ...BTN_BASE, background: '#3f4147', color: '#b5bac1', padding: '5px 8px' }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => isValidWebhook && setShowAdd(true)}
          style={{
            width: '100%', background: 'none',
            border: `1px dashed ${isValidWebhook ? '#2e2f35' : '#1e1f22'}`,
            borderRadius: 4, color: isValidWebhook ? '#4e5058' : '#2e2f35',
            cursor: isValidWebhook ? 'pointer' : 'default',
            fontSize: 11, padding: '4px 0', transition: 'border-color .15s, color .15s',
          }}
          onMouseEnter={e => { if (isValidWebhook) { e.currentTarget.style.borderColor = '#5865f2'; e.currentTarget.style.color = '#8b94e5'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = isValidWebhook ? '#2e2f35' : '#1e1f22'; e.currentTarget.style.color = isValidWebhook ? '#4e5058' : '#2e2f35'; }}
        >
          {isValidWebhook ? `＋ ${t('wm_save_current')}` : t('wm_empty')}
        </button>
      )}
    </div>
  );
}
