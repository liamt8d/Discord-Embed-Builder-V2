import { useState } from 'react';
import { useT } from '../lib/i18n';
import MentionTimePicker from './MentionTimePicker';

interface Props {
  targetRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
}

interface FmtAction {
  label: string;
  titleKey: string;
  wrap?: [string, string];
}

const ACTIONS: FmtAction[] = [
  { label: 'B', titleKey: 'fmt_bold',      wrap: ['**', '**'] },
  { label: 'I', titleKey: 'fmt_italic',    wrap: ['*', '*'] },
  { label: 'U', titleKey: 'fmt_underline', wrap: ['__', '__'] },
  { label: 'S', titleKey: 'fmt_strike',    wrap: ['~~', '~~'] },
  { label: '`', titleKey: 'fmt_code',      wrap: ['`', '`'] },
  { label: '```', titleKey: 'fmt_codeblock', wrap: ['```\n', '\n```'] },
  { label: '||', titleKey: 'fmt_spoiler',  wrap: ['||', '||'] },
  { label: '>', titleKey: 'fmt_quote',     wrap: ['> ', ''] },
];

const BTN: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer', borderRadius: 3,
  padding: '2px 6px', fontSize: 11, fontWeight: 700, lineHeight: 1.4,
  color: '#72767d', fontFamily: 'Consolas, monospace',
  transition: 'background .1s, color .1s',
};

export default function FormatToolbar({ targetRef, onChange }: Props) {
  const { t } = useT();
  const [pickerOpen, setPickerOpen] = useState(false);

  const apply = (action: FmtAction) => {
    const el = targetRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end   = el.selectionEnd ?? 0;
    const val   = el.value;
    const sel   = val.slice(start, end);

    if (!action.wrap) return;
    const [pre, post] = action.wrap;
    const newVal = val.slice(0, start) + pre + sel + post + val.slice(end);
    const newStart = start + pre.length;
    const newEnd   = newStart + sel.length;

    onChange(newVal);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newStart, newEnd);
    });
  };

  const insertText = (text: string) => {
    const el = targetRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end   = el.selectionEnd ?? start;
    const val   = el.value;
    const newVal = val.slice(0, start) + text + val.slice(end);
    const newCursor = start + text.length;
    onChange(newVal);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newCursor, newCursor);
    });
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 1, marginBottom: 4, background: '#1a1b1e', borderRadius: 4, padding: '2px 3px' }}>
        {ACTIONS.map(a => (
          <button
            key={a.titleKey}
            type="button"
            title={t(a.titleKey as any)}
            style={BTN}
            onMouseEnter={e => { e.currentTarget.style.background = '#2e2f35'; e.currentTarget.style.color = '#dbdee1'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#72767d'; }}
            onClick={() => apply(a)}
          >
            {a.label}
          </button>
        ))}
        <div style={{ width: 1, background: '#383a40', margin: '2px 3px' }} />
        <button
          type="button"
          title={t('picker_mentions')}
          style={{ ...BTN, fontSize: 12, fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2e2f35'; e.currentTarget.style.color = '#c9cdfb'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#72767d'; }}
          onClick={() => setPickerOpen(true)}
        >
          @#🕐
        </button>
      </div>
      {pickerOpen && <MentionTimePicker onInsert={insertText} onClose={() => setPickerOpen(false)} />}
    </>
  );
}
