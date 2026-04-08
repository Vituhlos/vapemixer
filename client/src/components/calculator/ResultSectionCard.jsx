import { useEffect, useRef, useState } from 'react';
import GlassCard from '../GlassCard.jsx';
import StatusStack from '../StatusStack.jsx';

function AnimatedValue({ value }) {
  const [animate, setAnimate] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setAnimate(true);
      prevRef.current = value;
      const timeout = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return <span className={animate ? 'pulse-change inline-block' : 'inline-block'}>{value}</span>;
}

function BottleIcons({ count }) {
  if (!count || count <= 0) return null;
  const show = Math.min(count, 5);
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
      {[...Array(show)].map((_, index) => (
        <svg key={index} width="9" height="16" viewBox="0 0 9 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2.5" y="0.5" width="4" height="2" rx="0.5" fill="var(--fg-subtle)" />
          <path d="M1.5 4C1 5 0.5 6 0.5 7.5V13.5C0.5 14.6 1.4 15.5 2.5 15.5H6.5C7.6 15.5 8.5 14.6 8.5 13.5V7.5C8.5 6 8 5 7.5 4H1.5Z" fill="var(--accent)" fillOpacity="0.25" stroke="var(--accent)" strokeOpacity="0.5" strokeWidth="0.8" />
          <rect x="2" y="8" width="5" height="1.5" rx="0.5" fill="var(--accent)" fillOpacity="0.5" />
        </svg>
      ))}
      {count > 5 && <span style={{ fontSize: 10, color: 'var(--fg-muted)', marginLeft: 1 }}>+{count - 5}</span>}
      <span style={{ fontSize: 10, color: 'var(--fg-subtle)', marginLeft: 2 }}>{count}× 10ml</span>
    </span>
  );
}

function ResultRow({ label, value, unit, bottles, highlight, danger }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>{label}</span>
      <span className="mono" style={{
        fontSize: 20, fontWeight: 600, lineHeight: 1.2,
        color: danger ? 'var(--danger)' : highlight ? 'var(--accent)' : 'var(--fg)',
      }}>
        <AnimatedValue value={value} />
        <span style={{ fontSize: 13, marginLeft: 4, fontWeight: 400, color: 'var(--fg-muted)' }}>{unit}</span>
      </span>
      {bottles !== undefined && <BottleIcons count={bottles} />}
    </div>
  );
}

export default function ResultSectionCard({ result, nicMode, nicotine, vg, pg, fmt1, stockWarnings, estimatedCost }) {
  if (!result) return null;

  const warnings = [
    ...result.warnings.map((text) => ({ type: 'error', text })),
    ...stockWarnings.map((text) => ({ type: 'warning', text })),
  ];

  if (estimatedCost?.incomplete) {
    warnings.push({ type: 'warning', text: 'Cena míchání je jen orientační nebo neúplná, některé položky nemají cenu.' });
  }

  return (
    <GlassCard className="panel-surface">
      <div className="section-kicker">Výsledek</div>
      <p style={{ fontSize: 14, fontWeight: 700, margin: '6px 0 12px' }}>Finální rozpad směsi a odhad ceny</p>
      <div className="grid grid-cols-2 gap-3">
        <ResultRow label="Báze" value={fmt1(result.baseMl)} unit="ml" danger={result.baseMl <= 0} />
        <ResultRow label="Booster" value={fmt1(result.boosterMl)} unit="ml" bottles={result.boosterBottles} />
        <ResultRow label="Příchuť" value={fmt1(result.flavorMl)} unit="ml" />
        {nicMode === 'bottles'
          ? <ResultRow label="Výsledná síla" value={nicotine} unit="mg/ml" highlight />
          : <ResultRow label="Poměr" value={`${vg}/${pg}`} unit="VG/PG" highlight />}
      </div>

      {estimatedCost?.total != null && (
        <div style={{
          marginTop: 12,
          padding: '10px 12px',
          borderRadius: 10,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>
            Odhad Ceny
          </span>
          <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
            ~{estimatedCost.total.toFixed(2)} Kč
          </span>
        </div>
      )}

      {estimatedCost?.parts?.length > 0 && (
        <div style={{
          marginTop: 8,
          padding: '8px 10px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {estimatedCost.parts.map((part) => (
            <div
              key={part.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                fontSize: 12,
              }}
            >
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ color: 'var(--fg)' }}>
                  {part.label}
                </span>
                <span style={{ color: 'var(--fg-subtle)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {part.itemName ? `${part.itemName} • ${fmt1(part.needed)} ml` : `${fmt1(part.needed)} ml`}
                </span>
              </div>
              <span className="mono" style={{ color: part.total != null ? 'var(--fg)' : 'var(--fg-subtle)', flexShrink: 0 }}>
                {part.total != null ? `~${part.total.toFixed(2)} Kč` : 'bez ceny'}
              </span>
            </div>
          ))}
        </div>
      )}

      <StatusStack items={warnings} compact className="mt-3" />
    </GlassCard>
  );
}
