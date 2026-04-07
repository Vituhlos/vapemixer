import BottomSheet from '../BottomSheet.jsx';
import GlassButton from '../GlassButton.jsx';
import StatusMessage from '../StatusMessage.jsx';

export default function MixConfirmSheet({ open, onClose, matches, fmt1, mixStatus, submitMix }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Zaznamenat míchání">
      {matches && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.values(matches).map(({ items, needed, label }) => {
            if (needed < 0.01) return null;
            const total = items.reduce((sum, item) => sum + item.amount_ml, 0);
            const sufficient = total >= needed;
            return (
              <div key={label} style={{
                padding: '12px 16px', borderRadius: 12,
                background: 'var(--bg-elevated)',
                border: '1px solid ' + (sufficient ? 'rgba(50,215,75,0.25)' : 'rgba(255,69,58,0.25)'),
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0 }}>
                    {items.length > 0 ? `${total.toFixed(1)} ml dostupné` : 'žádná položka ve skladu'}
                  </p>
                </div>
                <span className="mono" style={{
                  fontSize: 14, fontWeight: 600,
                  color: sufficient ? 'var(--success)' : 'var(--danger)',
                }}>
                  −{fmt1(needed)} ml
                </span>
              </div>
            );
          })}

          <StatusMessage status={mixStatus} compact />

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <GlassButton variant="primary" onClick={() => submitMix(true)} className="flex-1 py-3">
              Zapsat a odečíst
            </GlassButton>
            <GlassButton onClick={() => submitMix(false)} className="flex-1 py-3">
              Jen zapsat
            </GlassButton>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
