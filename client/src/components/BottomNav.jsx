const TABS = [
  { id: 'calculator', label: 'Mixer',   icon: MixerIcon },
  { id: 'recipes',    label: 'Recepty', icon: RecipesIcon },
  { id: 'stock',      label: 'Sklad',   icon: StockIcon },
  { id: 'history',    label: 'Historie',icon: HistoryIcon },
];

function MixerIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v4M12 3v6M16 3v4" />
      <path d="M5 10h14l-2 9H7L5 10z" />
      <path d="M9 14h6" />
    </svg>
  );
}
function RecipesIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}
function StockIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-4 0v2M8 7V5a2 2 0 0 0-4 0v2" />
      <path d="M12 12v5M9.5 14.5h5" />
    </svg>
  );
}
function HistoryIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export default function BottomNav({ active, onChange, badges = {} }) {
  return (
    <nav className="bottom-nav" style={{
      padding: '8px 8px',
      paddingBottom: `max(8px, env(safe-area-inset-bottom))`,
    }}>
      <div className="flex justify-around items-center">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          const hasBadge = badges[id];
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 12,
                minWidth: 56,
                color: isActive ? 'var(--accent)' : 'var(--fg-muted)',
                transition: 'color 0.15s ease',
                position: 'relative',
              }}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon active={isActive} />
                {hasBadge && (
                  <span style={{
                    position: 'absolute',
                    top: -1, right: -2,
                    width: 7, height: 7,
                    borderRadius: '50%',
                    background: 'var(--danger)',
                    border: '1.5px solid var(--bg)',
                  }} />
                )}
              </span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, letterSpacing: 0.2 }}>
                {label}
              </span>
              {isActive && (
                <span style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 16, height: 2,
                  borderRadius: 1,
                  background: 'var(--accent)',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
