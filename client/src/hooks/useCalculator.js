import { useState, useMemo, useEffect } from 'react';
import { calculateMix, resolveBaseRatios } from '../lib/calc.js';

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

  const { vg, pg } = resolveBaseRatios(baseType, customVG, customPG);

  const result = useMemo(() => {
    return calculateMix({ volume, nicotine, boosterStrength, flavorPct, vg, pg });
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

  function loadHistory(entry) {
    setVolume(entry.volume_ml);
    setNicotine(entry.nicotine_mg);
    setBoosterStrength(entry.booster_strength);
    setFlavorPct(entry.flavor_pct);
    setFlavorName(entry.flavor_name ?? '');
    if (entry.vg_ratio === 50 && entry.pg_ratio === 50) setBaseType('MTL');
    else if (entry.vg_ratio === 70 && entry.pg_ratio === 30) setBaseType('DL');
    else {
      setBaseType('custom');
      setCustomVG(entry.vg_ratio);
      setCustomPG(entry.pg_ratio);
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
    loadHistory,
  };
}
