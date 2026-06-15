import React, { useState, useEffect } from 'react';
import { IcCheck, IcX, IcAlertTriangle, IcInfo } from './Icons';

export type ToastKind = 'ok' | 'err' | 'warn' | 'info';

interface ToastItem { id: number; msg: string; kind: ToastKind }

let _id = 0;
const _listeners: Array<(t: ToastItem) => void> = [];

export function addToast(msg: string, kind: ToastKind = 'info') {
  const t: ToastItem = { id: _id++, msg, kind };
  _listeners.forEach(fn => fn(t));
}

const ICON: Record<ToastKind, React.ReactNode> = {
  ok:   <IcCheck size={15} />,
  err:  <IcX size={15} />,
  warn: <IcAlertTriangle size={15} />,
  info: <IcInfo size={15} />,
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (t: ToastItem) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500);
    };
    _listeners.push(handler);
    return () => {
      const i = _listeners.indexOf(handler);
      if (i >= 0) _listeners.splice(i, 1);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          <span className="toast-icon">{ICON[t.kind]}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
