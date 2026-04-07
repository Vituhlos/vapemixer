import { useRef, useState, useEffect } from 'react';

const THRESHOLD = 72;
const CONFIRM_THRESHOLD = 160;
const UNDO_DELAY = 4000;

export default function SwipeToDelete({ children, onDelete, disabled = false }) {
  const [offset, setOffset] = useState(0);
  const [pending, setPending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const startX = useRef(null);
  const startY = useRef(null);
  const isSwipe = useRef(false);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    clearInterval(countdownRef.current);
  }, []);

  if (disabled) return <>{children}</>;

  function triggerDelete() {
    setOffset(0);
    setPending(true);
    setCountdown(4);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(countdownRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
    timerRef.current = setTimeout(() => {
      setPending(false);
      onDelete();
    }, UNDO_DELAY);
  }

  function undoDelete() {
    clearTimeout(timerRef.current);
    clearInterval(countdownRef.current);
    setPending(false);
    setCountdown(0);
  }

  function onTouchStart(e) {
    if (pending) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isSwipe.current = false;
  }

  function onTouchMove(e) {
    if (pending || startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (!isSwipe.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isSwipe.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isSwipe.current) return;
    if (dx > 0) { setOffset(0); return; }
    e.preventDefault();
    setOffset(Math.max(-220, dx));
  }

  function onTouchEnd() {
    if (pending || startX.current === null) return;
    startX.current = null;
    if (offset < -CONFIRM_THRESHOLD) {
      triggerDelete();
    } else if (offset < -THRESHOLD) {
      setOffset(-THRESHOLD);
    } else {
      setOffset(0);
    }
  }

  if (pending) {
    return (
      <div style={{
        borderRadius: 14,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Progress ring */}
          <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="10" cy="10" r="8" fill="none" stroke="var(--border)" strokeWidth="2" />
            <circle cx="10" cy="10" r="8" fill="none" stroke="var(--danger)" strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 8}`}
              strokeDashoffset={`${2 * Math.PI * 8 * (1 - countdown / 4)}`}
              style={{ transition: 'stroke-dashoffset 0.9s linear' }}
            />
          </svg>
          <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Smazáno</span>
        </div>
        <button
          onClick={undoDelete}
          style={{
            fontSize: 13, fontWeight: 600,
            color: 'var(--accent)',
            background: 'rgba(0,194,170,0.1)',
            border: '1px solid rgba(0,194,170,0.25)',
            borderRadius: 8, padding: '6px 14px',
          }}
        >
          Vrátit
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 14 }}>
      {/* Delete button behind */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: THRESHOLD + 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,69,58,0.15)',
        borderRadius: 14,
      }}>
        <button
          onClick={triggerDelete}
          style={{
            background: 'none', border: 'none',
            color: 'var(--danger)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '8px 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Smazat
        </button>
      </div>

      {/* Content */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: startX.current ? 'none' : 'transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
