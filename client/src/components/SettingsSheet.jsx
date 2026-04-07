import { useState } from 'react';
import BottomSheet from './BottomSheet.jsx';
import GlassButton from './GlassButton.jsx';
import { PREF_DEFAULTS } from '../hooks/usePreferences.js';

const BASE_TYPES = [
  { value: 'MTL', label: 'MTL (50/50)' },
  { value: 'DL',  label: 'DL (70/30)' },
];

export default function SettingsSheet({ open, onClose, prefs, updatePref }) {
  const [saved, setSaved] = useState(false);

  function handleChange(key, raw, toNum = true) {
    const value = toNum ? (parseFloat(raw) || 0) : raw;
    updatePref(key, value);
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  }

  function handleReset() {
    Object.entries(PREF_DEFAULTS).forEach(([k, v]) => updatePref(k, v));
    setSaved(false);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Výchozí hodnoty">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Objem (ml)</span>
            <input
              className="app-input"
              style={{ padding: '10px 12px' }}
              type="number"
              min="1"
              value={prefs.defaultVolume}
              onChange={e => handleChange('defaultVolume', e.target.value)}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Nikotin (mg/ml)</span>
            <input
              className="app-input"
              style={{ padding: '10px 12px' }}
              type="number"
              min="0"
              step="0.5"
              value={prefs.defaultNicotine}
              onChange={e => handleChange('defaultNicotine', e.target.value)}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Booster (mg/ml)</span>
            <input
              className="app-input"
              style={{ padding: '10px 12px' }}
              type="number"
              min="1"
              value={prefs.defaultBoosterStrength}
              onChange={e => handleChange('defaultBoosterStrength', e.target.value)}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Příchuť (%)</span>
            <input
              className="app-input"
              style={{ padding: '10px 12px' }}
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={prefs.defaultFlavorPct}
              onChange={e => handleChange('defaultFlavorPct', e.target.value)}
            />
          </label>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Výchozí základna</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {BASE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleChange('defaultBaseType', value, false)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  background: prefs.defaultBaseType === value ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: prefs.defaultBaseType === value ? '#0C0C10' : 'var(--fg)',
                  transition: 'background 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </label>

        <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: 0 }}>
          Výchozí hodnoty se použijí při resetu kalkulátoru a při prvním spuštění.
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <GlassButton variant="primary" onClick={handleSave} className="flex-1 py-3">
            {saved ? 'Uloženo ✓' : 'Uložit'}
          </GlassButton>
          <GlassButton onClick={handleReset} className="py-3" style={{ minWidth: 90 }}>
            Resetovat
          </GlassButton>
        </div>
      </div>
    </BottomSheet>
  );
}
