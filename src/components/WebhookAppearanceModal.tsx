import { useState, useEffect } from 'react';
import { useT } from '../lib/i18n';

interface FetchedInfo { username: string; avatar: string | null }

interface Props {
  webhookUrl: string;
  overrideName: string;
  overrideAvatar: string;
  onSave: (name: string, avatar: string) => void;
  onClose: () => void;
}

export default function WebhookAppearanceModal({ webhookUrl, overrideName, overrideAvatar, onSave, onClose }: Props) {
  const { t } = useT();
  const [fetched, setFetched] = useState<FetchedInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(overrideName);
  const [avatar, setAvatar] = useState(overrideAvatar);

  useEffect(() => {
    if (!webhookUrl.includes('/api/webhooks/')) return;
    setLoading(true);
    fetch('/api/webhook-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl }),
    })
      .then(r => r.ok ? r.json() : null)
      .then((d: FetchedInfo | null) => { if (d) setFetched(d); })
      .finally(() => setLoading(false));
  }, [webhookUrl]);

  const displayName = name.trim() || fetched?.username || 'Webhook';
  const displayAvatar = avatar.trim() || fetched?.avatar || null;

  const save = () => { onSave(name.trim(), avatar.trim()); onClose(); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-text">
            <h2>{t('wh_appearance_title')}</h2>
            <p>{t('wh_appearance_sub')}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: 16 }}>
          {/* Live preview */}
          <div style={{ background: '#313338', borderRadius: 8, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: '#5865f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 17 }}>
              {displayAvatar
                ? <img src={displayAvatar} style={{ width: 40, height: 40, objectFit: 'cover' }} alt="" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                : displayName[0]?.toUpperCase() ?? 'W'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{displayName}</span>
                <span style={{ background: '#5865f2', color: '#fff', borderRadius: 3, padding: '0 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px' }}>BOT</span>
                <span style={{ color: '#80848e', fontSize: 12 }}>Hoy a las 00:00</span>
              </div>
              <div style={{ color: '#dbdee1', fontSize: 14 }}>
                {t('wh_appearance_preview_msg')}
              </div>
            </div>
          </div>

          {/* Fetched info section */}
          {loading && <p style={{ fontSize: 12, color: '#72767d', marginBottom: 12 }}>⏳ {t('wh_appearance_loading')}</p>}
          {fetched && !loading && (
            <div style={{ background: 'rgba(88,101,242,.08)', border: '1px solid rgba(88,101,242,.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: '#b5bac1', display: 'flex', alignItems: 'center', gap: 10 }}>
              {fetched.avatar
                ? <img src={fetched.avatar} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#5865f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>{fetched.username[0]}</div>
              }
              <span>
                <strong style={{ color: '#dbdee1' }}>{fetched.username}</strong>
                <span style={{ opacity: .6, marginLeft: 6 }}>— {t('wh_appearance_real')}</span>
              </span>
              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#5865f2', fontSize: 11, fontWeight: 600 }}
                onClick={() => { setName(''); setAvatar(''); }}>
                {t('wh_appearance_use_real')}
              </button>
            </div>
          )}
          {!fetched && !loading && webhookUrl && (
            <div style={{ background: 'rgba(237,66,69,.08)', border: '1px solid rgba(237,66,69,.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 12, color: '#ed4245' }}>
              ⚠ {t('wh_appearance_no_url')}
            </div>
          )}

          {/* Override fields */}
          <div className="field" style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11 }}>{t('eb_username')} <span style={{ color: '#4e5058', fontWeight: 400 }}>({t('optional')})</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder={fetched?.username ?? 'Webhook'} />
          </div>
          <div className="field">
            <label style={{ fontSize: 11 }}>{t('eb_avatar')} <span style={{ color: '#4e5058', fontWeight: 400 }}>({t('optional')})</span></label>
            <input value={avatar} onChange={e => setAvatar(e.target.value)} placeholder={fetched?.avatar ?? 'https://...'} />
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn-secondary" style={{ fontSize: 12 }} onClick={onClose}>{t('cancel')}</button>
          <button className="btn-primary" style={{ fontSize: 12 }} onClick={save}>{t('wh_appearance_save')}</button>
        </div>
      </div>
    </div>
  );
}
