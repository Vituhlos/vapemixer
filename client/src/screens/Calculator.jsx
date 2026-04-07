import { useEffect, useState } from 'react';
import GlassButton from '../components/GlassButton.jsx';
import StatusStack from '../components/StatusStack.jsx';
import CalculatorParameterCard from '../components/calculator/CalculatorParameterCard.jsx';
import BaseSectionCard from '../components/calculator/BaseSectionCard.jsx';
import ResultSectionCard from '../components/calculator/ResultSectionCard.jsx';
import SaveRecipeCard from '../components/calculator/SaveRecipeCard.jsx';
import MixConfirmSheet from '../components/calculator/MixConfirmSheet.jsx';
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
    for (const { items, needed, label } of Object.values(matches)) {
      if (items.length === 0) continue;
      const total = items.reduce((sum, item) => sum + item.amount_ml, 0);
      if (total < needed) warnings.push(`${label}: máš ${total.toFixed(1)} ml, potřebuješ ${needed.toFixed(1)} ml`);
    }
    return warnings;
  }

  async function submitMix(deductStock) {
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
  const matches = getStockMatches();

  return (
    <div className="flex flex-col gap-4 screen-enter">
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
      />

      <BaseSectionCard
        baseType={baseType}
        setBaseType={setBaseType}
        customVG={customVG}
        setCustomVG={setCustomVG}
        customPG={customPG}
        setCustomPG={setCustomPG}
      />

      <ResultSectionCard result={result} nicMode={nicMode} nicotine={nicotine} vg={vg} pg={pg} fmt1={fmt1} stockWarnings={stockWarnings} />

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

      <MixConfirmSheet open={mixSheet} onClose={() => setMixSheet(false)} matches={matches} fmt1={fmt1} mixStatus={mixStatus} submitMix={submitMix} />
    </div>
  );
}
