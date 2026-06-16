import { useMemo } from 'react';
import { useT } from '../lib/i18n';

interface Props {
  original: unknown;
  current: unknown;
  onClose: () => void;
}

interface DiffLine {
  type: 'same' | 'add' | 'del';
  text: string;
}

function diffLines(a: string, b: string): DiffLine[] {
  const la = a.split('\n');
  const lb = b.split('\n');
  const result: DiffLine[] = [];

  // Simple LCS-based diff (good enough for JSON comparison)
  const m = la.length, n = lb.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = la[i] === lb[j] ? dp[i+1][j+1] + 1 : Math.max(dp[i+1][j], dp[i][j+1]);

  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && la[i] === lb[j]) {
      result.push({ type: 'same', text: la[i] }); i++; j++;
    } else if (j < n && (i >= m || dp[i+1][j] >= dp[i][j+1])) {
      result.push({ type: 'add', text: lb[j] }); j++;
    } else {
      result.push({ type: 'del', text: la[i] }); i++;
    }
  }
  return result;
}

const BG: Record<DiffLine['type'], string> = {
  same: 'transparent', add: 'rgba(87,242,135,.08)', del: 'rgba(237,66,69,.08)',
};
const FG: Record<DiffLine['type'], string> = {
  same: '#72767d', add: '#57f287', del: '#ed4245',
};
const PFX: Record<DiffLine['type'], string> = { same: '  ', add: '+ ', del: '- ' };

export default function DiffModal({ original, current, onClose }: Props) {
  const { t } = useT();

  const { lines, hasChanges } = useMemo(() => {
    const a = JSON.stringify(original, null, 2);
    const b = JSON.stringify(current, null, 2);
    const ls = diffLines(a, b);
    return { lines: ls, hasChanges: ls.some(l => l.type !== 'same') };
  }, [original, current]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 680, maxHeight: 'calc(100vh - 60px)' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-text">
            <h2>{t('diff_title')}</h2>
            <p>{hasChanges ? `${lines.filter(l => l.type === 'add').length} adiciones · ${lines.filter(l => l.type === 'del').length} eliminaciones` : t('diff_no_changes')}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: 0, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
          {!hasChanges ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#72767d', fontSize: 13 }}>
              ✓ {t('diff_no_changes')}
            </div>
          ) : (
            <pre style={{ fontFamily: 'Consolas, monospace', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
              {lines.map((line, i) => (
                <div key={i} style={{
                  background: BG[line.type],
                  color: FG[line.type],
                  padding: '0 16px',
                  borderLeft: line.type === 'add' ? '3px solid #57f287' : line.type === 'del' ? '3px solid #ed4245' : '3px solid transparent',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                  <span style={{ opacity: .5, marginRight: 8, userSelect: 'none' }}>{PFX[line.type]}</span>
                  {line.text}
                </div>
              ))}
            </pre>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" style={{ fontSize: 12 }} onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
