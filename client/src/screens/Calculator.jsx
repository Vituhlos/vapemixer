import { useEffect, useState } from 'react';
import GlassButton from '../components/GlassButton.jsx';
import StatusStack from '../components/StatusStack.jsx';
import CalculatorParameterCard from '../components/calculator/CalculatorParameterCard.jsx';
import BaseSectionCard from '../components/calculator/BaseSectionCard.jsx';
import ResultSectionCard from '../components/calculator/ResultSectionCard.jsx';
import SaveRecipeCard from '../components/calculator/SaveRecipeCard.jsx';
import MixConfirmSheet from '../components/calculator/MixConfirmSheet.jsx';
import StockSourceCard from '../components/calculator/StockSourceCard.jsx';
import { api } from '../api.js';

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
  const [stockStatus, setStockStatus] = useState(null);
  const [mixSheet, setMixSheet] = useState(false);
  const [mixStatus, setMixStatus] = useState(null);
  const [flavorMode, setFlavorMode] = useState('pct');
  const [flavorMlInput, setFlavorMlInput] = useState('');
  const [nicMode, setNicMode] = useState('target');
  const [bottlesInput, setBottlesInput] = useState('1');
  const [selectedStock, setSelectedStock] = useState({
    baseStockId: '',
    boosterStockId: '',
    flavorStockId: '',
  });

  const fmt1 = (value) => (Math.round(value * 10) / 10).toFixed(1);

  useEffect(() => {
    api.getStock()
      .then((items) => {
        setStock(items);
        setStockStatus(null);
      })
      .catch((error) => setStockStatus({ type: 'error', text: error.message || 'Nepodařilo se načíst sklad' }));
  }, []);

  useEffect(() => {
    const matches = getStockMatches();
    if (!matches) return;

    setSelectedStock((current) => ({
      baseStockId: keepOrDefault(current.baseStockId, matches.base?.items),
      boosterStockId: keepOrDefault(current.boosterStockId, matches.booster?.items),
      flavorStockId: keepOrDefault(current.flavorStockId, matches.flavor?.items),
    }));
  }, [stock, baseType, flavorName, result?.baseMl, result?.boosterMl, result?.flavorMl]);

  useEffect(() => {
    if (flavorMode === 'ml') {
      const vol = parseFloat(volume) || 0;
      const pct = parseFloat(flavorPct) || 0;
      if (vol > 0) setFlavorMlInput(fmt1((pct / 100) * vol));
    }
  }, [volume]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (nicMode === 'bottles') {
      const vol = parseFloat(volume) || 0;
      const bottles = parseFloat(bottlesInput) || 0;
      const strength = parseFloat(boosterStrength) || 18;
      if (vol > 0) setNicotine(fmt1((bottles * 10 * strength) / vol));
    }
  }, [nicMode, bottlesInput, volume, boosterStrength]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleNicMode() {
    if (nicMode === 'target') {
      const vol = parseFloat(volume) || 0;
      const nic = parseFloat(nicotine) || 0;
      const strength = parseFloat(boosterStrength) || 18;
      const boosterMl = vol > 0 ? (nic * vol) / strength : 0;
      setBottlesInput(String(Math.max(1, Math.round(boosterMl / 10))));
      setNicMode('bottles');
    } else {
      setNicMode('target');
    }
  }

  function handleBottlesChange(value) {
    setBottlesInput(value);
    const vol = parseFloat(volume) || 0;
    const bottles = parseFloat(value) || 0;
    const strength = parseFloat(boosterStrength) || 18;
    if (vol > 0) setNicotine(fmt1((bottles * 10 * strength) / vol));
  }

  function getStockMatches() {
    if (!result) return null;
    const baseTypeKey = baseType === 'DL' ? 'baze_dl' : 'baze_mtl';
    const boosterKey = baseType === 'DL' ? 'booster_dl' : 'booster_mtl';
    const allPrichut = stock.filter((item) => item.type === 'prichut');
    const trimmedFlavorName = flavorName?.trim() || '';
    const namedFlavor = trimmedFlavorName
      ? allPrichut.filter((item) => item.name.toLowerCase() === trimmedFlavorName.toLowerCase())
      : [];
    const flavorItems = namedFlavor.length > 0 ? namedFlavor : allPrichut;
    const flavorLabel = namedFlavor.length > 0 ? `Příchuť: ${trimmedFlavorName}` : 'Příchuť';
    return {
      base: { items: stock.filter((item) => item.type === baseTypeKey), needed: result.baseMl, label: baseTypeKey === 'baze_mtl' ? 'Báze MTL' : 'Báze DL' },
      booster: { items: stock.filter((item) => item.type === boosterKey), needed: result.boosterMl, label: boosterKey === 'booster_mtl' ? 'Booster MTL' : 'Booster DL' },
      flavor: { items: flavorItems, needed: result.flavorMl, label: flavorLabel },
    };
  }

  function getStockWarnings() {
    const matches = getStockMatches();
    if (!matches || stock.length === 0) return [];

    const warnings = [];
    for (const [key, { items, needed, label }] of Object.entries(matches)) {
      if (items.length === 0) continue;
      const selectedItem = resolveSelectedItem(key, items, selectedStock);
      if (!selectedItem) {
        warnings.push(`${label}: vyber konkrétní položku skladu`);
        continue;
      }
      const total = Number(selectedItem.amount_ml || 0);
      if (total < needed) warnings.push(`${label}: ${selectedItem.name} má ${total.toFixed(1)} ml, potřebuješ ${needed.toFixed(1)} ml`);
    }
    return warnings;
  }

  function getCostWarnings() {
    const warnings = [];
    const matches = getStockMatches();
    if (!matches) return warnings;

    const selectedEntries = [
      { label: 'Báze', item: findSelectedById(matches.base?.items, selectedStock.baseStockId) },
      { label: 'Booster', item: findSelectedById(matches.booster?.items, selectedStock.boosterStockId) },
      { label: 'Příchuť', item: findSelectedById(matches.flavor?.items, selectedStock.flavorStockId) },
    ].filter(({ item }) => item);

    for (const { label, item } of selectedEntries) {
      const suspicious = getSuspiciousCostSignals(item);
      if (suspicious.length > 0) {
        warnings.push(`${label}: ${suspicious.join(', ')}`);
      }
    }

    return warnings;
  }

  function handleStockSelection(key, value) {
    setSelectedStock((current) => ({ ...current, [key]: value }));
  }

  function getEstimatedCost() {
    if (!result) return { total: null, incomplete: false, parts: [] };

    const matches = getStockMatches();
    if (!matches) return { total: null, incomplete: false, parts: [] };

    const entries = [
      { key: 'base', label: 'Báze', item: findSelectedById(matches.base?.items, selectedStock.baseStockId), needed: result.baseMl },
      { key: 'booster', label: 'Booster', item: findSelectedById(matches.booster?.items, selectedStock.boosterStockId), needed: result.boosterMl },
      { key: 'flavor', label: 'Příchuť', item: findSelectedById(matches.flavor?.items, selectedStock.flavorStockId), needed: result.flavorMl },
    ].filter(({ needed }) => needed > 0.01);

    if (entries.length === 0) return { total: 0, incomplete: false, parts: [] };

    let total = 0;
    let hasAnyPrice = false;
    let incomplete = false;
    const parts = [];

    for (const entry of entries) {
      if (!entry.item) {
        incomplete = true;
        parts.push({
          key: entry.key,
          label: entry.label,
          needed: Number(entry.needed),
          total: null,
          itemName: null,
        });
        continue;
      }
      if (entry.item.price_czk == null || Number(entry.item.capacity_ml) <= 0) {
        incomplete = true;
        parts.push({
          key: entry.key,
          label: entry.label,
          needed: Number(entry.needed),
          total: null,
          itemName: entry.item.name,
        });
        continue;
      }

      const partTotal = Number(entry.needed) * (Number(entry.item.price_czk) / Number(entry.item.capacity_ml));
      total += partTotal;
      hasAnyPrice = true;
      parts.push({
        key: entry.key,
        label: entry.label,
        needed: Number(entry.needed),
        total: Math.round(partTotal * 100) / 100,
        itemName: entry.item.name,
      });
    }

    return {
      total: hasAnyPrice ? Math.round(total * 100) / 100 : null,
      incomplete,
      parts,
    };
  }

  async function submitMix(deductStock, selectedStock = {}) {
    if (!result) return;
    try {
      const response = await api.createMix({
        volume_ml: parseFloat(volume),
        nicotine_mg: parseFloat(nicotine),
        vg_ratio: vg,
        pg_ratio: pg,
        base_type: baseType,
        booster_strength: parseFloat(boosterStrength),
        booster_ml: result.boosterMl,
        base_ml: result.baseMl,
        flavor_ml: result.flavorMl,
        flavor_pct: parseFloat(flavorPct),
        recipe_name: recipeName.trim() || null,
        flavor_name: flavorName || null,
        base_stock_id: selectedStock.baseStockId ?? null,
        booster_stock_id: selectedStock.boosterStockId ?? null,
        flavor_stock_id: selectedStock.flavorStockId ?? null,
        deduct_stock: deductStock,
      });

      if (response.stock) {
        setStock(response.stock);
        setStockStatus(null);
      }

      setMixStatus({
        type: 'success',
        text: deductStock ? 'Míchání zapsáno a sklad odečten' : 'Míchání zapsáno do historie',
      });
      setMixSheet(false);
      onStockChange?.();
      setTimeout(() => setMixStatus(null), 2500);
    } catch (error) {
      setMixStatus({ type: 'error', text: error.message || 'Nepodařilo se zapsat míchání' });
    }
  }

  async function handleSaveRecipe() {
    if (!recipeName.trim()) {
      setSaveStatus({ type: 'error', text: 'Zadej název receptu' });
      return;
    }

    try {
      await api.createRecipe({
        name: recipeName.trim(),
        flavor_name: flavorName || null,
        volume_ml: parseFloat(volume),
        nicotine_mg: parseFloat(nicotine),
        vg_ratio: vg,
        pg_ratio: pg,
        booster_strength: parseFloat(boosterStrength),
        flavor_pct: parseFloat(flavorPct),
      });
      setSaveStatus({ type: 'success', text: 'Recept uložen' });
      setRecipeName('');
      onSaved?.();
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      setSaveStatus({ type: 'error', text: error.message || 'Nepodařilo se uložit recept' });
    }
  }

  function selectAll(event) {
    const target = event.target;
    setTimeout(() => {
      try {
        target.setSelectionRange(0, target.value.length);
      } catch {}
    }, 0);
  }

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

  function handleFlavorMlChange(value) {
    setFlavorMlInput(value);
    const vol = parseFloat(volume) || 0;
    const ml = parseFloat(value) || 0;
    if (vol > 0) setFlavorPct(String((ml / vol) * 100));
  }

  function applyFlavorStockAmount() {
    const selectedFlavor = findSelectedById(matches?.flavor?.items, selectedStock.flavorStockId);
    if (!selectedFlavor) return;
    const amount = fmt1(Number(selectedFlavor.amount_ml || 0));
    setFlavorMode('ml');
    setFlavorMlInput(amount);
    handleFlavorMlChange(amount);
  }

  const presetBoosters = [18, 20];
  const isCustomBooster = !presetBoosters.includes(parseFloat(boosterStrength));
  const [customBoosterVisible, setCustomBoosterVisible] = useState(isCustomBooster);

  function selectBoosterPreset(value) {
    setBoosterStrength(value);
    setCustomBoosterVisible(false);
  }

  function handleReset() {
    calc.resetToDefaults();
    setRecipeName('');
    setFlavorMode('pct');
    setFlavorMlInput('');
    setNicMode('target');
    setBottlesInput('1');
    setCustomBoosterVisible(false);
    setMixStatus(null);
    setSaveStatus(null);
  }

  const stockWarnings = getStockWarnings();
  const costWarnings = getCostWarnings();
  const matches = getStockMatches();
  const estimatedCost = getEstimatedCost();
  const selectedFlavorItem = findSelectedById(matches?.flavor?.items, selectedStock.flavorStockId);
  const shakeFlavorHint = getShakeFlavorHint(selectedFlavorItem);

  return (
    <div className="flex flex-col gap-4 screen-enter">
      <WorkflowBanner />

      <SectionLead
        step="01"
        title="Co Chci Namíchat"
        text="Nastav cílový objem, nikotin, poměr báze a příchuť. Tahle část řeší samotný recept."
      />
      <CalculatorParameterCard
        volume={volume}
        setVolume={setVolume}
        flavorPct={flavorPct}
        setFlavorPct={setFlavorPct}
        flavorName={flavorName}
        setFlavorName={setFlavorName}
        nicotine={nicotine}
        setNicotine={setNicotine}
        boosterStrength={boosterStrength}
        setBoosterStrength={setBoosterStrength}
        flavorMode={flavorMode}
        flavorMlInput={flavorMlInput}
        toggleFlavorMode={toggleFlavorMode}
        handleFlavorMlChange={handleFlavorMlChange}
        nicMode={nicMode}
        bottlesInput={bottlesInput}
        toggleNicMode={toggleNicMode}
        handleBottlesChange={handleBottlesChange}
        customBoosterVisible={customBoosterVisible}
        setCustomBoosterVisible={setCustomBoosterVisible}
        selectBoosterPreset={selectBoosterPreset}
        handleReset={handleReset}
        shakeFlavorHint={shakeFlavorHint}
        applyFlavorStockAmount={applyFlavorStockAmount}
      />

      <BaseSectionCard
        baseType={baseType}
        setBaseType={setBaseType}
        customVG={customVG}
        setCustomVG={setCustomVG}
        customPG={customPG}
        setCustomPG={setCustomPG}
      />

      <SectionLead
        step="02"
        title="Z Čeho To Namíchám"
        text="Vyber konkrétní skladové položky, ze kterých se bude odečítat báze, booster a příchuť."
      />
      <StockSourceCard
        matches={matches}
        selectedStock={selectedStock}
        onSelect={handleStockSelection}
        fmt1={fmt1}
      />

      <SectionLead
        step="03"
        title="Cena A Záznam"
        text="Zkontroluj výsledek, cenu po složkách a případná varování. Pak recept ulož nebo zapiš do historie."
      />
      <ResultSectionCard
        result={result}
        nicMode={nicMode}
        nicotine={nicotine}
        vg={vg}
        pg={pg}
        fmt1={fmt1}
        stockWarnings={[...stockWarnings, ...costWarnings]}
        estimatedCost={estimatedCost}
      />

      <StatusStack items={[stockStatus, mixStatus]} compact />

      <SaveRecipeCard
        recipeName={recipeName}
        setRecipeName={setRecipeName}
        handleSaveRecipe={handleSaveRecipe}
        saveStatus={saveStatus}
        selectAll={selectAll}
      />

      <GlassButton
        variant="default"
        onClick={() => {
          setMixStatus(null);
          setMixSheet(true);
        }}
        disabled={!result || result.baseMl < 0}
        className="w-full py-3 text-base"
      >
        Zaznamenat míchání
      </GlassButton>

      <MixConfirmSheet
        open={mixSheet}
        onClose={() => setMixSheet(false)}
        matches={matches}
        selectedStock={selectedStock}
        fmt1={fmt1}
        mixStatus={mixStatus}
        submitMix={submitMix}
      />
    </div>
  );
}

function WorkflowBanner() {
  const steps = [
    { id: '01', label: 'Recept' },
    { id: '02', label: 'Zdroje' },
    { id: '03', label: 'Cena a záznam' },
  ];

  return (
    <div className="panel-surface" style={{
      padding: '14px 14px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div className="section-kicker">Flow míchání</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            style={{
              flex: '1 1 120px',
              minWidth: 90,
              padding: '10px 12px',
              borderRadius: 12,
              background: index === 0
                ? 'linear-gradient(135deg, rgba(24,190,178,0.18), rgba(24,190,178,0.08))'
                : 'rgba(12,12,16,0.28)',
              border: '1px solid ' + (index === 0 ? 'rgba(24,190,178,0.24)' : 'rgba(255,255,255,0.06)'),
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              {step.id}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)', marginTop: 2 }}>
              {step.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionLead({ step, title, text }) {
  return (
    <div className="panel-surface" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px' }}>
      <div style={{
        width: 30,
        height: 30,
        borderRadius: 999,
        background: 'linear-gradient(135deg, rgba(24,190,178,0.22), rgba(24,190,178,0.08))',
        border: '1px solid rgba(24,190,178,0.28)',
        color: 'var(--accent)',
        fontSize: 11,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {step}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="section-kicker">Krok {step}</div>
        <p style={{ fontSize: 15, fontWeight: 700, margin: '4px 0 0' }}>{title}</p>
        <p style={{ fontSize: 12, color: 'var(--fg-muted)', margin: '4px 0 0', lineHeight: 1.5 }}>{text}</p>
      </div>
    </div>
  );
}

function keepOrDefault(current, items = []) {
  if (current && items.some((item) => String(item.id) === String(current))) return current;
  return items[0] ? String(items[0].id) : '';
}

function resolveSelectedItem(key, items, selectedStock) {
  const mapping = {
    base: selectedStock.baseStockId,
    booster: selectedStock.boosterStockId,
    flavor: selectedStock.flavorStockId,
  };
  const selectedId = mapping[key];
  if (!selectedId) return null;
  return items.find((item) => String(item.id) === String(selectedId)) ?? null;
}

function findSelectedById(items = [], selectedId) {
  if (!selectedId) return null;
  return items.find((item) => String(item.id) === String(selectedId)) ?? null;
}

function getShakeFlavorHint(item) {
  if (!item || item.type !== 'prichut') return null;

  const note = String(item.note || '').toLowerCase();
  const looksLikeShake = note.includes('shake') || note.includes('shortfill') || note.includes('mix&go') || note.includes('mix & go');
  const amount = Number(item.amount_ml || 0);
  const capacity = Number(item.capacity_ml || 0);

  if (!looksLikeShake || amount <= 0 || capacity <= 0) return null;

  return {
    amountMl: amount,
    label: `Použít celou příchuť ${amount.toFixed(1)} ml`,
  };
}

function getSuspiciousCostSignals(item) {
  const signals = [];
  const capacity = Number(item.capacity_ml || 0);
  const price = item.price_czk != null ? Number(item.price_czk) : null;
  const pricePerMl = price != null && capacity > 0 ? price / capacity : null;

  if (capacity <= 0) signals.push('kapacita je 0 ml');
  if (price != null && price < 0) signals.push('záporná cena');
  if (price == null) signals.push('chybí cena');
  if (pricePerMl != null) {
    if (item.type === 'prichut' && pricePerMl < 1) signals.push(`podezřele nízká cena ${pricePerMl.toFixed(2)} Kč/ml`);
    if (item.type === 'prichut' && pricePerMl > 80) signals.push(`podezřele vysoká cena ${pricePerMl.toFixed(2)} Kč/ml`);
    if (item.type !== 'prichut' && pricePerMl > 20) signals.push(`podezřele vysoká cena ${pricePerMl.toFixed(2)} Kč/ml`);
  }

  return signals;
}
