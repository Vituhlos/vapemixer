import { useRef, useState } from 'react';

const TRIGGER_DISTANCE = 64;

export default function PullToRefresh({ children, onRefresh }) {
  const [pullDist, setPullDist] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);
  const triggered = useRef(false);

  function onTouchStart(e) {
    const el = containerRef.current;
    if (!el || el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    triggered.current = false;
  }

  function onTouchMove(e) {
    if (startY.current === null || refreshing) return;
    const el = containerRef.current;
    if (el && el.scrollTop > 0) { startY.current = null; return; }

    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) return;
    e.preventDefault();
    setPullDist(Math.min(TRIGGER_DISTANCE * 1.5, dy * 0.5));
  }

  async function onTouchEnd() {
    if (startY.current === null) return;
    startY.current = null;

    if (pullDist >= TRIGGER_DISTANCE && !refreshing) {
      setRefreshing(true);
      setPullDist(TRIGGER_DISTANCE);
      try { await onRefresh(); } catch {}
      setRefreshing(false);
    }
    setPullDist(0);
  }

  const progress = Math.min(1, pullDist / TRIGGER_DISTANCE);
  const showIndicator = pullDist > 4 || refreshing;

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Pull indicator */}
      {showIndicator && (
        <div style={{
          height: refreshing ? TRIGGER_DISTANCE : pullDist,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: refreshing ? 'height 0.2s ease' : 'none',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.2)',
            borderTopColor: progress >= 1 ? 'rgba(48,209,88,0.9)' : 'rgba(255,255,255,0.6)',
            animation: refreshing ? 'spin 0.7s linear infinite' : 'none',
            transform: refreshing ? 'none' : `rotate(${progress * 270}deg)`,
            transition: refreshing ? 'none' : 'border-top-color 0.2s',
          }} />
        </div>
      )}

      <div
        ref={containerRef}
        className="scrollable"
        style={{ flex: 1, overflowY: 'auto' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
