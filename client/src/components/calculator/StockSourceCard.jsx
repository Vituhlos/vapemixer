import { useState } from 'react';
import GlassCard from '../GlassCard.jsx';

export default function StockSourceCard({ matches, selectedStock, onSelect, fmt1 }) {
  const [openKey, setOpenKey] = useState('');

  if (!matches) return null;

  const entries = [
    { key: 'baseStockId', entry: matches.base },
    { key: 'boosterStockId', entry: matches.booster },
    { key: 'flavorStockId', entry: matches.flavor },
  ].filter(({ entry }) => entry && entry.needed >= 0.01);

  if (entries.length === 0) return null;

  function toggle(key) {
    setOpenKey((current) => current === key ? '' : key);
  }

  function handlePick(key, value) {
    onSelect(key, value);
    setOpenKey('');
  }

  return (
    <GlassCard className="panel-surface">
      <div className="section-kicker">Zdroje</div>
      <p style={{ fontSize: 14, fontWeight: 700, margin: '6px 0 12px' }}>
        Konkrétní položky pro odečet skladu
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entries.map(({ key, entry }) => {
          const selectedId = selectedStock[key] ? String(selectedStock[key]) : '';
          const selectedItem = entry.items.find((item) => String(item.id) === selectedId) ?? null;
          const available = selectedItem ? Number(selectedItem.amount_ml || 0) : 0;
          const sufficient = selectedItem ? available >= entry.needed : false;
          const isOpen = openKey === key;

          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{entry.label}</span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  potřeba {fmt1(entry.needed)} ml
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggle(key)}
                style={{
                  width: '100%',
                  background: isOpen ? 'rgba(24,190,178,0.06)' : 'var(--bg-input)',
                  border: '1px solid ' + (isOpen ? 'var(--accent)' : 'var(--border)'),
                  borderRadius: 12,
                  color: 'var(--fg)',
                  fontSize: 13,
                  padding: '12px 12px',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  textAlign: 'left',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedItem ? formatStockOption(selectedItem) : 'Vyber položku skladu…'}
                </span>
                <span style={{ color: 'var(--fg-muted)', flexShrink: 0 }}>{isOpen ? '▴' : '▾'}</span>
              </button>

              {isOpen && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: 6,
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.03)',
                }}>
                  {entry.items.map((item) => {
                    const isSelected = String(item.id) === selectedId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handlePick(key, String(item.id))}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid ' + (isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.06)'),
                          background: isSelected ? 'rgba(24, 190, 178, 0.16)' : 'rgba(255,255,255,0.02)',
                          color: isSelected ? 'var(--fg)' : 'var(--fg-muted)',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</span>
                        <span className="mono" style={{ fontSize: 11 }}>
                          {fmt1(Number(item.amount_ml || 0))} / {fmt1(Number(item.capacity_ml || 0))} ml
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedItem ? (
                <p style={{ fontSize: 12, margin: 0, color: sufficient ? 'var(--success)' : 'var(--danger)' }}>
                  {selectedItem.name}: {fmt1(available)} ml dostupné
                </p>
              ) : (
                <p style={{ fontSize: 12, margin: 0, color: 'var(--danger)' }}>
                  Vyber konkrétní položku skladu.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function formatStockOption(item) {
  return `${item.name} (${Number(item.amount_ml || 0).toFixed(1)} / ${Number(item.capacity_ml || 0).toFixed(1)} ml)`;
}
