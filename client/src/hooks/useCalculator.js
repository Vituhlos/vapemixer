import { useState, useMemo, useEffect } from 'react';

const BASE_PRESETS = {
  MTL: { vg: 50, pg: 50 },
  DL:  { vg: 70, pg: 30 },
};

const STORAGE_KEY = 'calc-state';

function loadStored() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

export function useCalculator(initial = {}) {
  const stored = loadStored();
  const init = { ...stored, ...initial };

  const [volume, setVolume] = useState(init.volume ?? 60);
  const [nicotine, setNicotine] = useState(init.nicotine ?? 6);
  const [baseType, setBaseType] = useState(init.baseType ?? 'MTL');
  const [customVG, setCustomVG] = useState(init.customVG ?? 50);
  const [customPG, setCustomPG] = useState(init.customPG ?? 50);
  const [boosterStrength, setBoosterStrength] = useState(init.boosterStrength ?? 18);
  const [flavorPct, setFlavorPct] = useState(init.flavorPct ?? 17);
  const [flavorName, setFlavorName] = useState(init.flavorName ?? '');

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        volume, nicotine, baseType, customVG, customPG,
        boosterStrength, flavorPct, flavorName,
      }));
    } catch {}
  }, [volume, nicotine, baseType, customVG, customPG, boosterStrength, flavorPct, flavorName]);

  const vg = baseType === 'custom' ? customVG : BASE_PRESETS[baseType]?.vg ?? 50;
  const pg = baseType === 'custom' ? customPG : BASE_PRESETS[baseType]?.pg ?? 50;

  const result = useMemo(() => {
    const vol = parseFloat(volume) || 0;
    const nic = parseFloat(nicotine) || 0;
    const bStr = parseFloat(boosterStrength) || 18;
    const fPct = parseFloat(flavorPct) || 0;

    if (vol <= 0) return null;

    const flavorMl = (fPct / 100) * vol;
    const boosterMl = nic > 0 ? (nic * vol) / bStr : 0;
    const boosterBottles = Math.ceil(boosterMl / 10);
    const baseMl = vol - flavorMl - boosterMl;

    const warnings = [];
    if (baseMl < 0) warnings.push('Záporná báze — příliš mnoho boosteru nebo příchutě');
    if (nic > bStr) warnings.push(`Nikotin ${nic} mg překračuje sílu boosteru ${bStr} mg`);
    if (fPct < 5) warnings.push('Příliš malá příchuť — doporučeno min. 5%');
    if (fPct > 30) warnings.push('Příchuť přesahuje 30% — zkontroluj recept');

    return {
      flavorMl: Math.max(0, flavorMl),
      boosterMl: Math.max(0, boosterMl),
      boosterBottles,
      baseMl: Math.max(0, baseMl),
      resultVG: vg,
      resultPG: pg,
      warnings,
      isValid: baseMl >= 0 && warnings.length === 0,
    };
  }, [volume, nicotine, boosterStrength, flavorPct, vg, pg]);

  function loadRecipe(recipe) {
    setVolume(recipe.volume_ml);
    setNicotine(recipe.nicotine_mg);
    setBoosterStrength(recipe.booster_strength);
    setFlavorPct(recipe.flavor_pct);
    setFlavorName(recipe.flavor_name ?? '');
    if (recipe.vg_ratio === 50 && recipe.pg_ratio === 50) setBaseType('MTL');
    else if (recipe.vg_ratio === 70 && recipe.pg_ratio === 30) setBaseType('DL');
    else {
      setBaseType('custom');
      setCustomVG(recipe.vg_ratio);
      setCustomPG(recipe.pg_ratio);
    }
  }

  return {
    volume, setVolume,
    nicotine, setNicotine,
    baseType, setBaseType,
    customVG, setCustomVG,
    customPG, setCustomPG,
    boosterStrength, setBoosterStrength,
    flavorPct, setFlavorPct,
    flavorName, setFlavorName,
    vg, pg,
    result,
    loadRecipe,
  };
}
