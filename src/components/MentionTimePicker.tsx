import { useState, useMemo } from 'react';
import { useT } from '../lib/i18n';

interface Props {
  onInsert: (text: string) => void;
  onClose: () => void;
}

type Tab = 'mentions' | 'time' | 'emojis';

// ── Timestamp styles ──────────────────────────────────────────────────────────

function fmtTime(d: Date, style: string): string {
  const loc = 'en-US';
  const diff = (Date.now() - d.getTime()) / 1000;
  const abs = Math.abs(diff);
  switch (style) {
    case 't': return d.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit' });
    case 'T': return d.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    case 'f': return d.toLocaleString(loc, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    case 'F': return d.toLocaleString(loc, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    case 'd': return d.toLocaleDateString(loc, { month: 'numeric', day: 'numeric', year: 'numeric' });
    case 'D': return d.toLocaleDateString(loc, { month: 'long', day: 'numeric', year: 'numeric' });
    case 'R': {
      if (abs < 60) return diff > 0 ? `${Math.round(abs)} seconds ago` : `in ${Math.round(abs)} seconds`;
      if (abs < 3600) return diff > 0 ? `${Math.round(abs/60)} minutes ago` : `in ${Math.round(abs/60)} minutes`;
      if (abs < 86400) return diff > 0 ? `${Math.round(abs/3600)} hours ago` : `in ${Math.round(abs/3600)} hours`;
      return diff > 0 ? `${Math.round(abs/86400)} days ago` : `in ${Math.round(abs/86400)} days`;
    }
    default: return '';
  }
}

const TS_STYLES = [
  { key: 't', label: 'Short Time' },
  { key: 'T', label: 'Long Time' },
  { key: 'f', label: 'Short Date/Time' },
  { key: 'F', label: 'Long Date/Time' },
  { key: 'd', label: 'Short Date' },
  { key: 'D', label: 'Long Date' },
  { key: 'R', label: 'Relative' },
];

// ── Emoji grid ────────────────────────────────────────────────────────────────

const EMOJI_CATS: { label: string; emojis: string[] }[] = [
  { label: '😀 Caras', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'] },
  { label: '👋 Gestos', emojis: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁','👅','👄'] },
  { label: '❤️ Corazones', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','🫀','❤️‍🔥','❤️‍🩹'] },
  { label: '🐶 Animales', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🦁','🐯','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🦟','🦗','🕷','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🐓','🦃','🦤','🦚','🦜','🦢','🕊','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿','🦔'] },
  { label: '🍕 Comida', emojis: ['🍕','🍔','🌮','🌯','🥙','🥗','🍣','🍱','🍜','🍝','🍛','🍲','🥘','🍿','🧆','🥚','🍳','🥓','🥩','🍗','🍖','🌭','🥪','🥨','🧀','🥞','🧇','🍞','🥐','🥖','🫓','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍡','🍧','🍨','🍦','🍣','🍤','🍙','🍚','🍘','🍥','🥮','🍢','🧁','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍏','🍐','🍑','🍒','🍓','🫐','🥝','🍅','🫒','🥥','🥑','🍆','🥔','🥕','🌽','🌶','🫑','🥒','🥬','🥦','🧄','🧅','🍄','🥜','🫘','☕','🍵','🧉','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧃','🥤','🧋','🍶'] },
  { label: '🎮 Objetos', emojis: ['💻','🖥','🖨','⌨️','🖱','🖲','💾','💿','📀','📱','☎️','📞','📟','📠','📺','📻','🎙','🎚','🎛','🧭','⏱','⏲','⏰','🕰','⌚','⏳','📡','🔋','🔌','💡','🔦','🕯','💈','🧱','🔍','🔎','🔏','🔐','🔑','🗝','🔨','🪓','⛏','⚒','🛠','🗡','⚔️','🔫','🪃','🏹','🛡','🪚','🔧','🪛','🔩','⚙️','🗜','🔗','⛓','🧲','🪜','🪝','🧰','🧲','💊','🩺','🩻','🩹','🩼','💉','🩸','🔬','🔭','📊','📈','📉','🗂','📋','📌','📍','✂️','🖊','🖋','✒️','🖌','🖍','📝','✏️','🔎','🔍','📚','📖','📰','📓','📔','📒','📕','📗','📘','📙','🎮','🕹','🎲','🎯','🎳','🎰','🎳','🏆','🥇','🥈','🥉','🏅','🎖','🎗','🎟','🎫','🎉','🎊','🎀','🎁','🎈','🎆','🎇','🧨','✨','🎃','🎄','🎋','🎍','🎎','🎏','🎐','🎑','🧧','🎠','🎡','🎢','💝','🎑'] },
  { label: '🌍 Naturaleza', emojis: ['🌍','🌎','🌏','🌐','🗺','🏔','⛰','🌋','🗻','🏕','🏖','🏜','🏝','🏞','🏟','🏛','🏗','🏘','🏙','🏚','🏠','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙','🌃','🌌','🌉','🌁','🌈','🌊','⛲','🗼','🗽','🗿','🏰','🏯','🕌','🛕','⛪','🕍','☀️','🌤','⛅','🌥','☁️','🌦','🌧','⛈','🌩','🌨','❄️','☃️','⛄','🌬','💨','💧','💦','🌊','🔥','🌿','🍀','🌱','🌲','🌳','🌴','🌵','🎍','🎋','🍃','🍂','🍁','🌾','🌺','🌸','🌼','🌻','🌹','🥀','🌷','🌱','🌿','☘','🪴','🍄','🌰','🐚','🪸','💐'] },
  { label: '⭐ Símbolos', emojis: ['⭐','🌟','💫','✨','⚡','💥','🔥','❄️','🌊','✅','❌','⚠️','🚫','💯','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔘','🔲','🔳','▪️','▫️','◾','◽','◼️','◻️','⬛','⬜','🔱','⚜️','🔰','♻️','✔️','🔅','🔆','📶','📳','📴','📵','📱','💹','❎','🆗','🆙','🆒','🆕','🆓','🔟','🆔','🅰','🅱','🆎','🅾','🆑','🅱','🅰','🆘','⛔','📛','🚷','🚯','🚳','🚱','🔞','📵','🔕','🔇','🅿️','🈳','🈴','🈵','🈹','🈲','🉐','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉑','💟','☑️','🔃','🔄','🔙','🔚','🔛','🔜','🔝','🛐','⚛️','🕉','✡️','☸️','☯️','✝️','☦️','🛕','🕌','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚕️','♾','♻️','⚜️','🔱','📛','🔰','⭕','✅','☑️','✔️','❎','❌','❓','❔','❕','❗','〰️','💱','💲','⚕️','🔰','⚜️','⭐','🌟','💫','✨','🎵','🎶','🎼','🎹','🥁','🪘','🎷','🎺','🎸','🪕','🎻','🎤','🎧','🎙'] },
];

// ── Saved mentions (localStorage) ─────────────────────────────────────────────

const STORE_KEY = 'dcb_mentions';
interface SavedMention { id: string; name: string; type: 'channel' | 'role' }

function loadMentions(): SavedMention[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]'); } catch { return []; }
}
function saveMentions(list: SavedMention[]) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch {}
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MentionTimePicker({ onInsert, onClose }: Props) {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>('mentions');
  const [mentions, setMentions] = useState<SavedMention[]>(loadMentions);
  const [addType, setAddType] = useState<'channel' | 'role'>('channel');
  const [addId, setAddId] = useState('');
  const [addName, setAddName] = useState('');
  const [emojiSearch, setEmojiSearch] = useState('');

  const now = new Date();
  const [date, setDate] = useState(() => now.toISOString().slice(0, 10));
  const [time, setTime] = useState(() => now.toTimeString().slice(0, 5));
  const dt = useMemo(() => { try { return new Date(`${date}T${time}:00`); } catch { return new Date(); } }, [date, time]);
  const unix = Math.floor(dt.getTime() / 1000);

  const addMention = () => {
    if (!addId.trim()) return;
    const entry: SavedMention = { id: addId.trim(), name: addName.trim() || addId.trim(), type: addType };
    const next = [entry, ...mentions.filter(m => !(m.id === entry.id && m.type === entry.type))].slice(0, 30);
    setMentions(next); saveMentions(next);
    setAddId(''); setAddName('');
  };

  const removeMention = (idx: number) => {
    const next = mentions.filter((_, i) => i !== idx);
    setMentions(next); saveMentions(next);
  };

  const insert = (text: string) => { onInsert(text); onClose(); };

  const filteredEmojis = emojiSearch.trim()
    ? EMOJI_CATS.flatMap(c => c.emojis.filter(e => e.includes(emojiSearch)))
    : null;

  const TAB_BTN = (id: Tab, label: string) => (
    <button key={id} onClick={() => setTab(id)} style={{
      padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
      background: tab === id ? '#5865f2' : 'transparent',
      color: tab === id ? '#fff' : '#72767d',
      borderRadius: 4, transition: 'all .15s',
    }}>{label}</button>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 440, maxHeight: 'calc(100vh - 60px)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', gap: 4, padding: '2px 0' }}>
            {TAB_BTN('mentions', t('picker_mentions'))}
            {TAB_BTN('time', t('picker_time'))}
            {TAB_BTN('emojis', t('picker_emojis'))}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ── MENTIONS TAB ── */}
        {tab === 'mentions' && (
          <div className="modal-body" style={{ padding: 14, overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
            {/* Quick inserts — Roles */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#72767d', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>ROLES</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['@everyone', '@here'].map(r => (
                  <button key={r} onClick={() => insert(r)} style={{ padding: '4px 10px', background: '#2b2d31', border: '1px solid #383a40', borderRadius: 4, color: '#c9cdfb', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick inserts — Server links */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#72767d', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>CHANNELS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { id: '<id:browse>',        icon: 'fi-sr-search',  label: 'Browse Channels' },
                  { id: '<id:customize>',     icon: 'fi-sr-list',    label: 'Channels & Roles' },
                  { id: '<id:guide>',         icon: 'fi-sr-diploma', label: 'Server Guide' },
                  { id: '<id:linked-roles>',  icon: 'fi-sr-link',    label: 'Linked Roles' },
                ].map(ch => (
                  <button key={ch.id} onClick={() => insert(ch.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: '#2b2d31', border: '1px solid #383a40', borderRadius: 4, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#5865f2')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#383a40')}>
                    <i className={`fi ${ch.icon}`} style={{ color: '#72767d', fontSize: 13, width: 16, textAlign: 'center' }} />
                    <span style={{ color: '#dbdee1', fontSize: 12, fontWeight: 500, flex: 1 }}>{ch.label}</span>
                    <span style={{ color: '#4e5058', fontSize: 10, fontFamily: 'Consolas, monospace' }}>{ch.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Saved list */}
            {mentions.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                {(['channel', 'role'] as const).map(type => {
                  const list = mentions.filter(m => m.type === type);
                  if (!list.length) return null;
                  return (
                    <div key={type} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#72767d', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {type === 'channel' ? '# CANALES' : '@ ROLES'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {list.map((m, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#2b2d31', borderRadius: 4, padding: '4px 8px' }}>
                            <span style={{ color: '#5865f2', fontWeight: 600, fontSize: 13, flex: 1, cursor: 'pointer' }}
                              onClick={() => insert(type === 'channel' ? `<#${m.id}>` : `<@&${m.id}>`)}>
                              {type === 'channel' ? (
                                <><span style={{ color: '#72767d' }}># </span>{m.name}</>
                              ) : (
                                <><span style={{ color: '#72767d' }}>@</span>{m.name}</>
                              )}
                            </span>
                            <span style={{ fontSize: 10, color: '#4e5058' }}>{m.id}</span>
                            <button onClick={() => removeMention(mentions.indexOf(m))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4e5058', fontSize: 12, padding: '0 2px', lineHeight: 1 }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add new */}
            <div style={{ background: '#2b2d31', borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#72767d', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>{t('picker_add')}</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {(['channel', 'role'] as const).map(tp => (
                  <button key={tp} onClick={() => setAddType(tp)} style={{
                    padding: '3px 10px', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, borderRadius: 4,
                    background: addType === tp ? '#5865f2' : '#383a40', color: addType === tp ? '#fff' : '#72767d',
                  }}>
                    {tp === 'channel' ? '# Canal' : '@ Rol'}
                  </button>
                ))}
              </div>
              <input value={addId} onChange={e => setAddId(e.target.value)} placeholder="ID (ej: 1234567890)" style={{ width: '100%', marginBottom: 6 }} />
              <input value={addName} onChange={e => setAddName(e.target.value)} placeholder={t('picker_name_ph')}
                onKeyDown={e => e.key === 'Enter' && addMention()} style={{ width: '100%', marginBottom: 6 }} />
              <button className="btn-primary" style={{ fontSize: 12, width: '100%' }} disabled={!addId.trim()} onClick={addMention}>
                {t('picker_save_mention')}
              </button>
            </div>
          </div>
        )}

        {/* ── TIME TAB ── */}
        {tab === 'time' && (
          <div className="modal-body" style={{ padding: 14, overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#b5bac1', marginBottom: 4 }}>{t('picker_date')}</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: '#b5bac1', marginBottom: 4 }}>{t('picker_time_label')}</div>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ width: '100%' }} />
              <div style={{ fontSize: 10, color: '#4e5058', marginTop: 4 }}>Unix: {unix}</div>
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: '#72767d', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>STYLE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {TS_STYLES.map(s => (
                <button key={s.key} onClick={() => insert(`<t:${unix}:${s.key}>`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#2b2d31', border: '1px solid transparent', borderRadius: 6, cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#5865f2')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                  <span style={{ fontSize: 14, color: '#00b0f4', minWidth: 190, fontWeight: 500 }}>
                    <span style={{ marginRight: 6, opacity: .5 }}>🕐</span>
                    {fmtTime(dt, s.key)}
                  </span>
                  <span style={{ fontSize: 11, color: '#4e5058', flex: 1, textAlign: 'right' }}>{s.label}</span>
                  <span style={{ fontSize: 10, color: '#72767d', fontFamily: 'Consolas, monospace' }}>{`<t:…:${s.key}>`}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── EMOJIS TAB ── */}
        {tab === 'emojis' && (
          <div className="modal-body" style={{ padding: 14, overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
            <input value={emojiSearch} onChange={e => setEmojiSearch(e.target.value)}
              placeholder={t('picker_emoji_search')} style={{ width: '100%', marginBottom: 10 }} autoFocus />
            {filteredEmojis ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {filteredEmojis.map((em, i) => (
                  <button key={i} onClick={() => insert(em)} title={em}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: '3px', borderRadius: 4, lineHeight: 1 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#383a40')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    {em}
                  </button>
                ))}
              </div>
            ) : (
              EMOJI_CATS.map(cat => (
                <div key={cat.label} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#72767d', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{cat.label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {cat.emojis.map((em, i) => (
                      <button key={i} onClick={() => insert(em)} title={em}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: '3px', borderRadius: 4, lineHeight: 1 }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#383a40')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
