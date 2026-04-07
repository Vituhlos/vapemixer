const TABS = [
  { id: 'calculator', label: 'Mixer',    icon: MixerIcon },
  { id: 'recipes',    label: 'Recepty',  icon: RecipesIcon },
  { id: 'stock',      label: 'Sklad',    icon: StockIcon },
  { id: 'history',    label: 'Historie', icon: HistoryIcon },
];

export default function SideNav({ active, onChange, badges = {}, onSettings }) {
  return (
    <nav style={{
      width: 200, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      padding: '0 10px 16px',
      borderRight: '1px solid var(--border)',
      background: 'var(--bg-elevated)',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '18px 8px 16px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 10,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0C0C10" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v4M12 3v6M16 3v4" />
            <path d="M5 10h14l-2 9H7L5 10z" />
            <path d="M9 14h6" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', lineHeight: 1.1 }}>VapeMixer</div>
          <div style={{ fontSize: 10, color: 'var(--fg-muted)' }}>DIY e-liquid</div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                border: 'none', cursor: 'pointer',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--fg-muted)',
                width: '100%', textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Icon active={isActive} />
              <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }}>{label}</span>
              {badges[id] && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--danger)', marginLeft: 'auto', flexShrink: 0,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Settings */}
      <button
        onClick={onSettings}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 12px', borderRadius: 10,
          border: 'none', cursor: 'pointer',
          background: 'transparent', color: 'var(--fg-muted)',
          width: '100%', transition: 'background 0.15s',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <span style={{ fontSize: 14 }}>Nastavení</span>
      </button>
    </nav>
  );
}

function MixerIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v4M12 3v6M16 3v4" />
      <path d="M5 10h14l-2 9H7L5 10z" />
      <path d="M9 14h6" />
    </svg>
  );
}
function RecipesIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}
function StockIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" />
      <path d="M12 12v5M9.5 14.5h5" />
    </svg>
  );
}
function HistoryIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
