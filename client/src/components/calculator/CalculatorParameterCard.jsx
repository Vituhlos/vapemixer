import GlassCard from '../GlassCard.jsx';
import GlassInput from '../GlassInput.jsx';

const BOOSTER_PRESETS = [18, 20];

export default function CalculatorParameterCard({
  volume,
  setVolume,
  flavorPct,
  setFlavorPct,
  flavorName,
  setFlavorName,
  nicotine,
  setNicotine,
  boosterStrength,
  setBoosterStrength,
  flavorMode,
  flavorMlInput,
  toggleFlavorMode,
  handleFlavorMlChange,
  nicMode,
  bottlesInput,
  toggleNicMode,
  handleBottlesChange,
  customBoosterVisible,
  setCustomBoosterVisible,
  selectBoosterPreset,
  handleReset,
}) {
  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Parametry</span>
        <button onClick={handleReset} style={{ fontSize: 11, color: 'var(--fg-subtle)', letterSpacing: 0.3, background: 'none', border: 'none', padding: '2px 4px' }}>
          ↺ reset
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <GlassInput label="Objem" value={volume} onChange={setVolume} min={1} step={5} suffix="ml" inputMode="decimal" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Příchuť</span>
            <button onClick={toggleFlavorMode} style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 0.4,
              color: 'var(--fg-muted)', background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px',
            }}>
              {flavorMode === 'pct' ? '% → ml' : 'ml → %'}
            </button>
          </div>
          {flavorMode === 'pct'
            ? <GlassInput value={flavorPct} onChange={setFlavorPct} min={0} max={50} step={1} suffix="%" inputMode="decimal" />
            : <GlassInput value={flavorMlInput} onChange={handleFlavorMlChange} min={0} step={0.5} suffix="ml" inputMode="decimal" />}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Nikotin</span>
          <button onClick={toggleNicMode} style={{
            fontSize: 10, fontWeight: 600, letterSpacing: 0.4,
            color: 'var(--fg-muted)', background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px',
          }}>
            {nicMode === 'target' ? 'zadat lahvičky' : 'zadat mg/ml'}
          </button>
        </div>

        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--fg-subtle)', marginBottom: 8 }}>
            Síla boosteru
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            {BOOSTER_PRESETS.map((value) => (
              <button key={value} onClick={() => selectBoosterPreset(value)} style={{
                padding: '8px 0', flex: 1, borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: !customBoosterVisible && parseFloat(boosterStrength) === value ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                color: !customBoosterVisible && parseFloat(boosterStrength) === value ? '#0C0C10' : 'var(--fg-muted)',
                border: '1px solid ' + (!customBoosterVisible && parseFloat(boosterStrength) === value ? 'var(--accent)' : 'var(--border)'),
                transition: 'all 0.15s ease',
              }}>
                {value} <span style={{ fontSize: 11, fontWeight: 400 }}>mg</span>
              </button>
            ))}
            <button onClick={() => setCustomBoosterVisible((visible) => !visible)} style={{
              padding: '8px 14px', borderRadius: 8, fontSize: 12,
              background: customBoosterVisible ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
              color: customBoosterVisible ? 'var(--fg)' : 'var(--fg-muted)',
              border: '1px solid ' + (customBoosterVisible ? 'var(--fg-muted)' : 'var(--border)'),
              transition: 'all 0.15s ease',
            }}>
              vlastní
            </button>
          </div>
          {customBoosterVisible && (
            <div style={{ marginTop: 8 }}>
              <GlassInput value={boosterStrength} onChange={setBoosterStrength} min={1} step={1} suffix="mg/ml" inputMode="decimal" />
            </div>
          )}
        </div>

        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--fg-subtle)', marginBottom: 8 }}>
            {nicMode === 'target' ? 'V hotovém liquidu' : 'Počet lahviček'}
          </p>
          {nicMode === 'target' ? (
            <GlassInput value={nicotine} onChange={setNicotine} min={0} step={1} suffix="mg/ml" inputMode="decimal" />
          ) : (
            <div>
              <GlassInput value={bottlesInput} onChange={handleBottlesChange} min={0} step={1} suffix="× 10ml" inputMode="decimal" />
              <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6, marginBottom: 0 }}>
                = <span className="mono" style={{ fontWeight: 700 }}>{nicotine}</span> mg/ml v hotovém liquidu
              </p>
            </div>
          )}
        </div>
      </div>

      <GlassInput label="Název příchutě" value={flavorName} onChange={setFlavorName} placeholder="volitelné" className="mt-3" />
    </GlassCard>
  );
}
