import { useState, useEffect, useRef } from 'react';
import GlassCard from '../components/GlassCard.jsx';
import GlassButton from '../components/GlassButton.jsx';
import GlassInput from '../components/GlassInput.jsx';
import BottomSheet from '../components/BottomSheet.jsx';
import { api } from '../api.js';

const BASE_TYPES = [
  { id: 'MTL', label: 'MTL 50/50' },
  { id: 'DL',  label: 'DL 70/30' },
  { id: 'custom', label: 'Vlastní' },
];

function AnimatedValue({ value }) {
  const [animate, setAnimate] = useState(false);
  const prevRef = useRef(value);
  useEffect(() => {
    if (prevRef.current !== value) {
      setAnimate(true);
      prevRef.current = value;
      const t = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(t);
    }
  }, [value]);
  return <span className={animate ? 'pulse-change inline-block' : 'inline-block'}>{value}</span>;
}

export default function Calculator({ calc, onSaved, onStockChange }) {
  const {
    volume, setVolume, nicotine, setNicotine,
    baseType, setBaseType, customVG, setCustomVG, customPG, setCustomPG,
    boosterStrength, setBoosterStrength, flavorPct, setFlavorPct,
    flavorName, setFlavorName, vg, pg, result,
  } = calc;

  const [recipeName, setRecipeName] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);
  const [stock, setStock] = useState([]);
  const [deductSheet, setDeductSheet] = useState(false);
  const [deductStatus, setDeductStatus] = useState(null);
  const [flavorMode, setFlavorMode] = useState('pct');
  const [flavorMlInput, setFlavorMlInput] = useState('');
  const [nicMode, setNicMode] = useState('target'); // 'target' | 'bottles'
  const [bottlesInput, setBottlesInput] = useState('1');

  useEffect(() => {
    api.getStock().then(setStock).catch(() => {});
  }, []);

  // When volume changes in ml mode, keep ml value in sync
  useEffect(() => {
    if (flavorMode === 'ml') {
      const vol = parseFloat(volume) || 0;
      const pct = parseFloat(flavorPct) || 0;
      if (vol > 0) setFlavorMlInput(fmt1((pct / 100) * vol));
    }
  }, [volume]); // eslint-disable-line react-hooks/exhaustive-deps

  // In bottles mode, recompute nicotine whenever bottles/volume/boosterStrength changes
  useEffect(() => {
    if (nicMode === 'bottles') {
      const vol = parseFloat(volume) || 0;
      const bottles = parseFloat(bottlesInput) || 0;
      const bStr = parseFloat(boosterStrength) || 18;
      if (vol > 0) setNicotine(fmt1((bottles * 10 * bStr) / vol));
    }
  }, [nicMode, bottlesInput, volume, boosterStrength]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleNicMode() {
    if (nicMode === 'target') {
      // Pre-fill bottles from current booster result
      const vol = parseFloat(volume) || 0;
      const nic = parseFloat(nicotine) || 0;
      const bStr = parseFloat(boosterStrength) || 18;
      const boosterMl = vol > 0 ? (nic * vol) / bStr : 0;
      setBottlesInput(String(Math.max(1, Math.round(boosterMl / 10))));
      setNicMode('bottles');
    } else {
      setNicMode('target');
    }
  }

  function handleBottlesChange(val) {
    setBottlesInput(val);
    const vol = parseFloat(volume) || 0;
    const bottles = parseFloat(val) || 0;
    const bStr = parseFloat(boosterStrength) || 18;
    if (vol > 0) setNicotine(fmt1((bottles * 10 * bStr) / vol));
  }

  function getStockMatches() {
    if (!result) return null;
    const baseTypeKey = baseType === 'DL' ? 'baze_dl' : 'baze_mtl';
    const boosterKey = baseType === 'DL' ? 'booster_dl' : 'booster_mtl';
    return {
      base: { items: stock.filter(s => s.type === baseTypeKey), needed: result.baseMl, label: baseTypeKey === 'baze_mtl' ? 'Báze MTL' : 'Báze DL' },
      booster: { items: stock.filter(s => s.type === boosterKey), needed: result.boosterMl, label: boosterKey === 'booster_mtl' ? 'Booster MTL' : 'Booster DL' },
      flavor: { items: stock.filter(s => s.type === 'prichut'), needed: result.flavorMl, label: 'Příchuť' },
    };
  }

  function getStockWarnings() {
    const matches = getStockMatches();
    if (!matches || stock.length === 0) return [];
    const warnings = [];
    for (const { items, needed, label } of Object.values(matches)) {
      if (items.length === 0) continue;
      const total = items.reduce((sum, i) => sum + i.amount_ml, 0);
      if (total < needed) warnings.push(`${label}: máš ${total.toFixed(1)} ml, potřebuješ ${needed.toFixed(1)} ml`);
    }
    return warnings;
  }

  async function handleLogMix() {
    if (!result) return;
    try {
      await api.createHistory({
        volume_ml: parseFloat(volume),
        nicotine_mg: parseFloat(nicotine),
        vg_ratio: vg, pg_ratio: pg,
        booster_strength: parseFloat(boosterStrength),
        booster_ml: result.boosterMl,
        base_ml: result.baseMl,
        flavor_ml: result.flavorMl,
        flavor_pct: parseFloat(flavorPct),
        flavor_name: flavorName || null,
      });
      const fresh = await api.getStock();
      setStock(fresh);
      setDeductSheet(true);
    } catch {}
  }

  async function handleDeduct() {
    const matches = getStockMatches();
    if (!matches) return;
    try {
      for (const { items, needed } of Object.values(matches)) {
        let remaining = needed;
        for (const item of items) {
          if (remaining <= 0) break;
          const deduct = Math.min(item.amount_ml, remaining);
          await api.updateStock(item.id, { ...item, amount_ml: Math.max(0, item.amount_ml - deduct) });
          remaining -= deduct;
        }
      }
      const fresh = await api.getStock();
      setStock(fresh);
      setDeductStatus('ok');
      onStockChange?.();
      setTimeout(() => { setDeductSheet(false); setDeductStatus(null); }, 1200);
    } catch {
      setDeductStatus('error');
    }
  }

  async function handleSaveRecipe() {
    if (!recipeName.trim()) { setSaveStatus('error'); return; }
    try {
      await api.createRecipe({
        name: recipeName.trim(), flavor_name: flavorName || null,
        volume_ml: parseFloat(volume), nicotine_mg: parseFloat(nicotine),
        vg_ratio: vg, pg_ratio: pg,
        booster_strength: parseFloat(boosterStrength),
        flavor_pct: parseFloat(flavorPct),
      });
      setSaveStatus('ok');
      setRecipeName('');
      onSaved?.();
      setTimeout(() => setSaveStatus(null), 2000);
    } catch { setSaveStatus('error'); }
  }

  const fmt1 = (v) => (Math.round(v * 10) / 10).toFixed(1);
  const selectAll = (e) => { const t = e.target; setTimeout(() => { try { t.setSelectionRange(0, t.value.length); } catch {} }, 0); };

  function toggleFlavorMode() {
    if (flavorMode === 'pct') {
      setFlavorMlInput(result ? fmt1(result.flavorMl) : '');
      setFlavorMode('ml');
    } else {
      const vol = parseFloat(volume) || 0;
      const ml = parseFloat(flavorMlInput) || 0;
      if (vol > 0) setFlavorPct(fmt1((ml / vol) * 100));
      setFlavorMode('pct');
    }
  }

  function handleFlavorMlChange(val) {
    setFlavorMlInput(val);
    const vol = parseFloat(volume) || 0;
    const ml = parseFloat(val) || 0;
    if (vol > 0) setFlavorPct(String((ml / vol) * 100));
  }

  const BOOSTER_PRESETS = [18, 20];
  const isCustomBooster = !BOOSTER_PRESETS.includes(parseFloat(boosterStrength));
  const [customBoosterVisible, setCustomBoosterVisible] = useState(isCustomBooster);

  function selectBoosterPreset(v) {
    setBoosterStrength(v);
    setCustomBoosterVisible(false);
  }

  function handleReset() {
    calc.setVolume(60); calc.setNicotine(6);
    calc.setBaseType('MTL'); calc.setBoosterStrength(18);
    calc.setFlavorPct(17); calc.setFlavorName('');
    setRecipeName(''); setFlavorMode('pct'); setFlavorMlInput('');
    setNicMode('target'); setBottlesInput('1');
    setCustomBoosterVisible(false);
  }

  const stockWarnings = getStockWarnings();
  const matches = getStockMatches();

  return (
    <div className="flex flex-col gap-4 screen-enter">
      {/* Inputs */}
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>Parametry</span>
          <button onClick={handleReset} style={{ fontSize: 11, color: 'var(--fg-subtle)', letterSpacing: 0.3, background: 'none', border: 'none', padding: '2px 4px' }}>
            ↺ reset
          </button>
        </div>

        {/* Objem + Příchuť */}
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
            {flavorMode === 'pct' ? (
              <GlassInput value={flavorPct} onChange={setFlavorPct} min={0} max={50} step={1} suffix="%" inputMode="decimal" />
            ) : (
              <GlassInput value={flavorMlInput} onChange={handleFlavorMlChange} min={0} step={0.5} suffix="ml" inputMode="decimal" />
            )}
          </div>
        </div>

        {/* Dělítko */}
        <div style={{ borderTop: '1px solid var(--border)', margin: '14px 0' }} />

        {/* Nikotin sekce */}
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

          {/* Síla boosteru */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--fg-subtle)', marginBottom: 8 }}>
              Síla boosteru
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {BOOSTER_PRESETS.map(v => (
                <button key={v} onClick={() => selectBoosterPreset(v)} style={{
                  padding: '8px 0', flex: 1, borderRadius: 8, fontSize: 14, fontWeight: 600,
                  background: !customBoosterVisible && parseFloat(boosterStrength) === v ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                  color: !customBoosterVisible && parseFloat(boosterStrength) === v ? '#0C0C10' : 'var(--fg-muted)',
                  border: '1px solid ' + (!customBoosterVisible && parseFloat(boosterStrength) === v ? 'var(--accent)' : 'var(--border)'),
                  transition: 'all 0.15s ease',
                }}>
                  {v} <span style={{ fontSize: 11, fontWeight: 400 }}>mg</span>
                </button>
              ))}
              <button onClick={() => setCustomBoosterVisible(v => !v)} style={{
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

          {/* Cílový nikotin */}
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

      {/* Báze */}
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
            <GlassInput label="VG %" value={customVG}
              onChange={(v) => { setCustomVG(Number(v)); setCustomPG(100 - Number(v)); }}
              min={0} max={100} step={5} inputMode="decimal" />
            <GlassInput label="PG %" value={customPG}
              onChange={(v) => { setCustomPG(Number(v)); setCustomVG(100 - Number(v)); }}
              min={0} max={100} step={5} inputMode="decimal" />
          </div>
        )}
      </GlassCard>

      {/* Výsledek */}
      {result && (
        <GlassCard>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)', display: 'block', marginBottom: 12 }}>Výsledek</span>
          <div className="grid grid-cols-2 gap-3">
            <ResultRow label="Báze" value={fmt1(result.baseMl)} unit="ml" danger={result.baseMl <= 0} />
            <ResultRow label="Booster" value={fmt1(result.boosterMl)} unit="ml" bottles={result.boosterBottles} />
            <ResultRow label="Příchuť" value={fmt1(result.flavorMl)} unit="ml" />
            {nicMode === 'bottles' ? (
              <ResultRow label="Výsledná síla" value={nicotine} unit="mg/ml" highlight />
            ) : (
              <ResultRow label="Poměr" value={`${vg}/${pg}`} unit="VG/PG" highlight />
            )}
          </div>

          {result.warnings.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.warnings.map((w, i) => (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 12,
                  background: 'rgba(255,69,58,0.08)', border: '1px solid rgba(255,69,58,0.2)',
                  color: 'var(--danger)',
                }}>
                  {w}
                </div>
              ))}
            </div>
          )}

          {stockWarnings.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stockWarnings.map((w, i) => (
                <div key={i} style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 12,
                  background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.2)',
                  color: 'var(--accent-warm)',
                }}>
                  {w}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}

      {/* Uložit recept */}
      <GlassCard>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)', display: 'block', marginBottom: 12 }}>Uložit recept</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="app-input"
            style={{ flex: 1 }}
            placeholder="Název receptu…"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveRecipe()}
            onFocus={selectAll}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
          />
          <GlassButton variant="primary" onClick={handleSaveRecipe} disabled={!recipeName.trim()}>
            Uložit
          </GlassButton>
        </div>
        {saveStatus === 'ok' && <p style={{ fontSize: 12, marginTop: 8, color: 'var(--success)' }}>Recept uložen</p>}
        {saveStatus === 'error' && <p style={{ fontSize: 12, marginTop: 8, color: 'var(--danger)' }}>Zadej název receptu</p>}
      </GlassCard>

      <GlassButton variant="default" onClick={handleLogMix} disabled={!result || result.baseMl < 0}
        className="w-full py-3 text-base">
        Zaznamenat míchání
      </GlassButton>

      {/* Odečíst ze skladu */}
      <BottomSheet open={deductSheet} onClose={() => setDeductSheet(false)} title="Odečíst ze skladu?">
        {matches && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.values(matches).map(({ items, needed, label }) => {
              if (needed < 0.01) return null;
              const total = items.reduce((s, i) => s + i.amount_ml, 0);
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
                    <p style={{ fontSize: 12, marginTop: 2, color: 'var(--fg-muted)', margin: 0 }}>
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

            {deductStatus === 'ok' && <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--success)', padding: '4px 0' }}>Sklad aktualizován</p>}
            {deductStatus === 'error' && <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--danger)', padding: '4px 0' }}>Chyba při aktualizaci</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <GlassButton variant="primary" onClick={handleDeduct} className="flex-1 py-3">Odečíst ze skladu</GlassButton>
              <GlassButton onClick={() => setDeductSheet(false)} className="px-5 py-3">Přeskočit</GlassButton>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function BottleIcons({ count }) {
  if (!count || count <= 0) return null;
  const show = Math.min(count, 5);
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 4 }}>
      {[...Array(show)].map((_, i) => (
        <svg key={i} width="9" height="16" viewBox="0 0 9 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2.5" y="0.5" width="4" height="2" rx="0.5" fill="var(--fg-subtle)" />
          <path d="M1.5 4C1 5 0.5 6 0.5 7.5V13.5C0.5 14.6 1.4 15.5 2.5 15.5H6.5C7.6 15.5 8.5 14.6 8.5 13.5V7.5C8.5 6 8 5 7.5 4H1.5Z"
            fill="var(--accent)" fillOpacity="0.25" stroke="var(--accent)" strokeOpacity="0.5" strokeWidth="0.8" />
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
