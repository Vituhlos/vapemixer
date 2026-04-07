import { useState, useEffect } from 'react';

export default function PWABanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true;
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (isIOS && !isStandalone && !dismissed) setShow(true);
  }, []);

  function dismiss() { localStorage.setItem('pwa-banner-dismissed', '1'); setShow(false); }
  if (!show) return null;

  return (
    <div style={{
      margin: '0 16px 8px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v13M7 7l5-5 5 5" /><path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
      </svg>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Přidat na plochu</p>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--fg-muted)', marginTop: 1 }}>
          Sdílet <span style={{ color: 'var(--fg)' }}>↑</span> → "Přidat na plochu"
        </p>
      </div>
      <button onClick={dismiss} style={{ background: 'none', border: 'none', color: 'var(--fg-muted)', fontSize: 16, padding: '4px 6px' }}>✕</button>
    </div>
  );
}
