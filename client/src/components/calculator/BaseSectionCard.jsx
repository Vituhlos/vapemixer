import GlassCard from '../GlassCard.jsx';
import GlassInput from '../GlassInput.jsx';

const BASE_TYPES = [
  { id: 'MTL', label: 'MTL 50/50' },
  { id: 'DL', label: 'DL 70/30' },
  { id: 'custom', label: 'Vlastní' },
];

export default function BaseSectionCard({ baseType, setBaseType, customVG, setCustomVG, customPG, setCustomPG }) {
  return (
    <GlassCard>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)', display: 'block', marginBottom: 12 }}>Báze</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {BASE_TYPES.map(({ id, label }) => (
          <button key={id} onClick={() => setBaseType(id)} style={{
            flex: 1, padding: '8px 4px', fontSize: 13, borderRadius: 10,
            background: baseType === id ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
            color: baseType === id ? '#0C0C10' : 'var(--fg-muted)',
            border: '1px solid ' + (baseType === id ? 'var(--accent)' : 'var(--border)'),
            fontWeight: baseType === id ? 700 : 400,
            transition: 'all 0.15s ease',
          }}>
            {label}
          </button>
        ))}
      </div>
      {baseType === 'custom' && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <GlassInput label="VG %" value={customVG} onChange={(value) => { setCustomVG(Number(value)); setCustomPG(100 - Number(value)); }} min={0} max={100} step={5} inputMode="decimal" />
          <GlassInput label="PG %" value={customPG} onChange={(value) => { setCustomPG(Number(value)); setCustomVG(100 - Number(value)); }} min={0} max={100} step={5} inputMode="decimal" />
        </div>
      )}
    </GlassCard>
  );
}
