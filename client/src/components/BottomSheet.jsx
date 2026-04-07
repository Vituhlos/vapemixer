import { useEffect } from 'react';

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.2s ease',
      }} />
      <div className="bottom-sheet" style={{
        position: 'fixed', left: 0, right: 0, zIndex: 51,
        maxWidth: 430, margin: '0 auto',
        padding: '20px 20px max(20px, env(safe-area-inset-bottom))',
        transform: open ? 'translateY(0)' : 'translateY(calc(100% + 24px))',
        transition: 'transform 0.3s cubic-bezier(0.32,0.72,0,1)',
      }}>
        <div style={{ width: 32, height: 3, borderRadius: 2, background: 'var(--border)', margin: '-8px auto 16px' }} />
        {title && <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, letterSpacing: '-0.2px' }}>{title}</p>}
        {children}
      </div>
    </>
  );
}
