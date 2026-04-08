import BottomSheet from '../BottomSheet.jsx';
import GlassButton from '../GlassButton.jsx';
import StatusMessage from '../StatusMessage.jsx';

export default function MixConfirmSheet({ open, onClose, matches, selectedStock, fmt1, mixStatus, submitMix }) {
  const entries = [
    { key: 'baseStockId', entry: matches?.base },
    { key: 'boosterStockId', entry: matches?.booster },
    { key: 'flavorStockId', entry: matches?.flavor },
  ].filter(({ entry }) => entry && entry.needed >= 0.01);

  const missingSelection = entries.some(({ key, entry }) => !findSelectedItem(entry.items, selectedStock[key]));

  return (
    <BottomSheet open={open} onClose={onClose} title="Zaznamenat míchání">
      {matches && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map(({ key, entry }) => {
            const selectedItem = findSelectedItem(entry.items, selectedStock[key]);
            const available = selectedItem ? Number(selectedItem.amount_ml || 0) : 0;
            const sufficient = selectedItem ? available >= entry.needed : false;

            return (
              <div
                key={entry.label}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'var(--bg-elevated)',
                  border: '1px solid ' + (sufficient ? 'rgba(50,215,75,0.25)' : 'rgba(255,69,58,0.25)'),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{entry.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0 }}>
                      {selectedItem ? selectedItem.name : 'není vybraná položka'}
                    </p>
                  </div>
                  <span
                    className="mono"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: sufficient ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    −{fmt1(entry.needed)} ml
                  </span>
                </div>

                <p style={{ fontSize: 12, color: sufficient ? 'var(--success)' : 'var(--danger)', margin: 0 }}>
                  {selectedItem
                    ? `${fmt1(available)} ml dostupné ve vybrané položce`
                    : 'Vrať se do kalkulačky a vyber položku skladu.'}
                </p>
              </div>
            );
          })}

          <StatusMessage status={mixStatus} compact />

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <GlassButton
              variant="primary"
              onClick={() => submitMix(true, selectedStock)}
              className="flex-1 py-3"
              disabled={missingSelection}
            >
              Zapsat a odečíst
            </GlassButton>
            <GlassButton onClick={() => submitMix(false, selectedStock)} className="flex-1 py-3">
              Jen zapsat
            </GlassButton>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

function findSelectedItem(items = [], selectedId) {
  if (!selectedId) return null;
  return items.find((item) => String(item.id) === String(selectedId)) ?? null;
}
