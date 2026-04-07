import { useState } from 'react';
import BottomSheet from './BottomSheet.jsx';
import GlassButton from './GlassButton.jsx';
import { parseOrderEmail } from '../lib/orderParser.js';

const TYPE_LABELS = {
  baze_mtl:    'Báze MTL',
  baze_dl:     'Báze DL',
  booster_mtl: 'Booster MTL',
  booster_dl:  'Booster DL',
  prichut:     'Příchuť',
};

export default function OrderImportSheet({ open, onClose, onImport }) {
  const [step, setStep] = useState('input');
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  function handleClose() {
    setStep('input');
    setText('');
    setItems([]);
    setError('');
    onClose();
  }

  function handleParse() {
    if (!text.trim()) return;
    const parsed = parseOrderEmail(text);
    if (parsed.length === 0) {
      setError('Nebyl rozpoznán žádný produkt. Zkuste zkopírovat celý e-mail včetně části „Objednané zboží".');
      return;
    }
    setError('');
    setItems(parsed);
    setStep('preview');
  }

  function toggleItem(idx) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
  }

  function changeType(idx, type) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, type } : item));
  }

  function changePrice(idx, raw) {
    const price_czk = raw === '' ? null : (parseFloat(raw.replace(',', '.')) || null);
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, price_czk } : item));
  }

  function handleConfirm() {
    onImport(items.filter(i => i.selected));
    handleClose();
  }

  const selectedCount = items.filter(i => i.selected).length;

  return (
    <BottomSheet open={open} onClose={handleClose} title="Import z objednávky">
      {step === 'input' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: 0 }}>
            Vložte text potvrzovacího e-mailu z objednávky. App rozpozná báze, boostery a příchutě a nabídne je k přidání do skladu.
          </p>
          <textarea
            className="app-input"
            style={{ padding: '10px 12px', height: 160, resize: 'none', fontSize: 13, lineHeight: 1.5 }}
            placeholder="Vložte text e-mailu…"
            value={text}
            onChange={e => { setText(e.target.value); setError(''); }}
          />
          {error && (
            <p style={{ fontSize: 13, color: 'var(--danger)', margin: 0 }}>{error}</p>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <GlassButton variant="primary" onClick={handleParse} className="flex-1" disabled={!text.trim()}>
              Rozpoznat produkty
            </GlassButton>
            <GlassButton onClick={handleClose}>Zrušit</GlassButton>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, color: 'var(--fg-muted)', margin: 0 }}>
            Rozpoznáno {items.length} {items.length === 1 ? 'produkt' : items.length < 5 ? 'produkty' : 'produktů'}. Zkontrolujte typy a vyberte co přidat.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
            {items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => toggleItem(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  background: item.selected ? 'var(--bg-elevated)' : 'transparent',
                  border: '1px solid ' + (item.selected ? 'var(--border)' : 'rgba(255,255,255,0.03)'),
                  opacity: item.selected ? 1 : 0.45,
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={() => toggleItem(idx)}
                  onClick={e => e.stopPropagation()}
                  style={{ flexShrink: 0, width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 13, fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    {item.amount_ml > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{item.amount_ml} ml</span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="cena"
                        value={item.price_czk ?? ''}
                        onChange={e => { e.stopPropagation(); changePrice(idx, e.target.value); }}
                        onClick={e => e.stopPropagation()}
                        disabled={!item.selected}
                        style={{
                          width: 64, padding: '3px 6px', fontSize: 11,
                          background: 'var(--bg-input)', border: '1px solid var(--border)',
                          borderRadius: 6, color: 'var(--fg)', outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>Kč</span>
                    </div>
                  </div>
                </div>
                <select
                  value={item.type}
                  onChange={e => { e.stopPropagation(); changeType(idx, e.target.value); }}
                  onClick={e => e.stopPropagation()}
                  disabled={!item.selected}
                  style={{
                    background: 'var(--bg-input)', border: '1px solid var(--border)',
                    borderRadius: 7, color: 'var(--fg)', fontSize: 11,
                    padding: '4px 6px', cursor: 'pointer', flexShrink: 0,
                    outline: 'none',
                  }}
                >
                  {Object.entries(TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <GlassButton
              variant="primary"
              onClick={handleConfirm}
              className="flex-1"
              disabled={selectedCount === 0}
            >
              Přidat {selectedCount > 0 ? `${selectedCount} ` : ''}do skladu
            </GlassButton>
            <GlassButton onClick={() => setStep('input')}>Zpět</GlassButton>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
