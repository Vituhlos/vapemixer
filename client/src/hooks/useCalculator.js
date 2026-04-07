import { useState, useMemo, useEffect } from 'react';
import { calculateMix, resolveBaseRatios } from '../lib/calc.js';
import { PREF_DEFAULTS } from './usePreferences.js';

const STORAGE_KEY = 'calc-state';

function loadStored() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

export function useCalculator(prefs = {}) {
  const stored = loadStored();
  const defaults = { ...PREF_DEFAULTS, ...prefs };

  const [volume, setVolume] = useState(stored.volume ?? defaults.defaultVolume);
  const [nicotine, setNicotine] = useState(stored.nicotine ?? defaults.defaultNicotine);
  const [baseType, setBaseType] = useState(stored.baseType ?? defaults.defaultBaseType);
  const [customVG, setCustomVG] = useState(stored.customVG ?? 50);
  const [customPG, setCustomPG] = useState(stored.customPG ?? 50);
  const [boosterStrength, setBoosterStrength] = useState(stored.boosterStrength ?? defaults.defaultBoosterStrength);
  const [flavorPct, setFlavorPct] = useState(stored.flavorPct ?? defaults.defaultFlavorPct);
  const [flavorName, setFlavorName] = useState(stored.flavorName ?? '');

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

  function resetToDefaults() {
    setVolume(defaults.defaultVolume);
    setNicotine(defaults.defaultNicotine);
    setBaseType(defaults.defaultBaseType);
    setCustomVG(50);
    setCustomPG(50);
    setBoosterStrength(defaults.defaultBoosterStrength);
    setFlavorPct(defaults.defaultFlavorPct);
    setFlavorName('');
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
    resetToDefaults,
    defaults,
  };
}
