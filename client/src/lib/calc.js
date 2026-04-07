export const BASE_PRESETS = {
  MTL: { vg: 50, pg: 50 },
  DL: { vg: 70, pg: 30 },
};

export function resolveBaseRatios(baseType, customVG, customPG) {
  if (baseType === 'custom') {
    return {
      vg: Number(customVG) || 0,
      pg: Number(customPG) || 0,
    };
  }

  return BASE_PRESETS[baseType] || BASE_PRESETS.MTL;
}

export function calculateMix({ volume, nicotine, boosterStrength, flavorPct, vg, pg }) {
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
    resultVG: Number(vg) || 0,
    resultPG: Number(pg) || 0,
    warnings,
    isValid: baseMl >= 0 && warnings.length === 0,
  };
}
