import { useState, useEffect } from 'react';

const PREFS_KEY = 'user-prefs';

export const PREF_DEFAULTS = {
  defaultVolume: 60,
  defaultNicotine: 6,
  defaultBaseType: 'MTL',
  defaultBoosterStrength: 18,
  defaultFlavorPct: 17,
};

function loadPrefs() {
  try {
    const s = localStorage.getItem(PREFS_KEY);
    return s ? { ...PREF_DEFAULTS, ...JSON.parse(s) } : { ...PREF_DEFAULTS };
  } catch { return { ...PREF_DEFAULTS }; }
}

export function usePreferences() {
  const [prefs, setPrefs] = useState(loadPrefs);

  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
  }, [prefs]);

  function updatePref(key, value) {
    setPrefs(p => ({ ...p, [key]: value }));
  }

  return { prefs, updatePref };
}
