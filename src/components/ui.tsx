import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Visibility } from '../db';
import { IconGlobe, IconLock, IconUsers } from './Icons';
import { Leaf, Sprig } from './Decor';

export const VISIBILITY_INFO: Record<Visibility, { label: string; hint: string; Icon: typeof IconLock }> = {
  private: { label: 'Private', hint: 'Only on this device. Only you can see it.', Icon: IconLock },
  circle: { label: 'Circle', hint: 'Shared with people you choose, by a link you send.', Icon: IconUsers },
  community: { label: 'Community', hint: 'Shareable with your church or anyone with the link.', Icon: IconGlobe },
};

export function VisibilityBadge({ value }: { value: Visibility }) {
  const { label, Icon } = VISIBILITY_INFO[value];
  return (
    <span className={`badge vis-${value}`} title={VISIBILITY_INFO[value].hint}>
      <Icon size={13} /> {label}
    </span>
  );
}

export function VisibilityPicker({ value, onChange, options = ['private', 'circle', 'community'] }: { value: Visibility; onChange: (v: Visibility) => void; options?: Visibility[] }) {
  return (
    <fieldset className="vis-picker">
      <legend>Who can see this?</legend>
      <div className="vis-options">
        {options.map((v) => {
          const { label, hint, Icon } = VISIBILITY_INFO[v];
          return (
            <label key={v} className={`vis-option ${value === v ? 'on' : ''} vis-${v}`}>
              <input type="radio" name="visibility" value={v} checked={value === v} onChange={() => onChange(v)} />
              <Icon size={18} />
              <span>
                <strong>{label}</strong>
                <small>{hint}</small>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <Sprig width={92} className="page-sprig" />
      <div className="page-header-row">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-leaves">
        <Leaf size={22} color="var(--leaf-light)" rotate={-30} />
        <Leaf size={30} color="var(--leaf)" />
        <Leaf size={22} color="var(--leaf-light)" rotate={30} />
      </div>
      <h3>{title}</h3>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}

export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="btn ghost small" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Verse({ reference, text, compact }: { reference: string; text: string; compact?: boolean }) {
  return (
    <blockquote className={`verse ${compact ? 'compact' : ''}`}>
      <p>{text}</p>
      <cite>{reference} (NIV)</cite>
    </blockquote>
  );
}

const ToastCtx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div className="toast" role="status">
          <Leaf size={14} color="var(--leaf-light)" /> {msg}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/** The name this person goes by when sharing with others. */
export function useMyName(): string {
  return useLiveQuery(async () => ((await db.settings.get('name'))?.value as string) || '', [], '') || 'Me';
}
