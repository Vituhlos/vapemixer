const STOCK_TYPE_MAP = {
  MTL: { base: 'baze_mtl', booster: 'booster_mtl' },
  DL: { base: 'baze_dl', booster: 'booster_dl' },
};

export function roundMl(value) {
  const normalized = Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
  return normalized <= 0.0005 ? 0 : normalized;
}

export function resolveBasePreset(vgRatio, pgRatio) {
  if (Number(vgRatio) === 50 && Number(pgRatio) === 50) return 'MTL';
  if (Number(vgRatio) === 70 && Number(pgRatio) === 30) return 'DL';
  return 'MTL';
}

export function buildStockPlan({ payload, getStockById, getFlavorStockByName }) {
  const baseType = payload.base_type || resolveBasePreset(payload.vg_ratio, payload.pg_ratio);
  const stockTypes = STOCK_TYPE_MAP[baseType] || STOCK_TYPE_MAP.MTL;
  const flavorName = payload.flavor_name?.trim() || null;
  const namedFlavorItems = flavorName ? getFlavorStockByName.all(flavorName) : [];
  const selectedBase = payload.base_stock_id ? getStockById.get(Number(payload.base_stock_id)) : null;
  const selectedBooster = payload.booster_stock_id ? getStockById.get(Number(payload.booster_stock_id)) : null;
  const selectedFlavor = payload.flavor_stock_id ? getStockById.get(Number(payload.flavor_stock_id)) : null;

  const flavorEntry = selectedFlavor
    ? { type: 'prichut', needed: Number(payload.flavor_ml), label: `Příchuť: ${selectedFlavor.name}`, items: [selectedFlavor], selectedId: selectedFlavor.id }
    : namedFlavorItems.length > 0
      ? { type: 'prichut', needed: Number(payload.flavor_ml), label: `Příchuť: ${flavorName}`, items: namedFlavorItems }
      : { type: 'prichut', needed: Number(payload.flavor_ml), label: 'Příchuť', items: null };

  return [
    { type: stockTypes.base, needed: Number(payload.base_ml), label: 'Báze', items: selectedBase ? [selectedBase] : null, selectedId: selectedBase?.id ?? null, part: 'base' },
    { type: stockTypes.booster, needed: Number(payload.booster_ml), label: 'Booster', items: selectedBooster ? [selectedBooster] : null, selectedId: selectedBooster?.id ?? null, part: 'booster' },
    { ...flavorEntry, part: 'flavor' },
  ];
}

export function executeStockPlan({ plan, getStockByType, updateStockAmount }) {
  let totalCost = 0;
  let hasCost = false;
  const usedStockItems = [];

  for (const entry of plan) {
    if (entry.needed <= 0.01) continue;
    const items = entry.items ?? getStockByType.all(entry.type);

    if (entry.selectedId && (items.length === 0 || items.some((item) => item.type !== entry.type))) {
      const error = new Error(`${entry.label}: vybraná položka neodpovídá očekávanému typu`);
      error.status = 400;
      throw error;
    }

    const available = items.reduce((sum, item) => sum + Number(item.amount_ml || 0), 0);
    if (available + 1e-9 < entry.needed) {
      const error = new Error(`${entry.label}: nedostatek na skladě`);
      error.status = 409;
      error.details = { type: entry.type, label: entry.label, needed: entry.needed, available };
      throw error;
    }

    let remaining = entry.needed;
    for (const item of items) {
      if (remaining <= 0) break;

      const currentAmount = Number(item.amount_ml || 0);
      const deduct = Math.min(currentAmount, remaining);
      if (deduct <= 0) continue;

      const nextAmount = roundMl(Math.max(0, currentAmount - deduct));
      updateStockAmount.run(nextAmount, item.id);

      const perMl = item.price_czk != null && Number(item.capacity_ml) > 0
        ? Number(item.price_czk) / Number(item.capacity_ml)
        : null;
      const deductedCost = perMl != null ? Math.round((deduct * perMl) * 100) / 100 : null;

      usedStockItems.push({
        stock_id: item.id,
        name: item.name,
        type: item.type,
        part: entry.part,
        deducted_ml: roundMl(deduct),
        before_ml: roundMl(currentAmount),
        after_ml: nextAmount,
        capacity_ml: item.capacity_ml != null ? Number(item.capacity_ml) : null,
        bottle_ml: item.bottle_ml != null ? Number(item.bottle_ml) : null,
        price_czk: item.price_czk != null ? Number(item.price_czk) : null,
        deducted_cost_czk: deductedCost,
      });

      if (deductedCost != null) {
        totalCost += deductedCost;
        hasCost = true;
      }

      remaining = roundMl(remaining - deduct);
    }
  }

  return {
    usedStockItems,
    cost_czk: hasCost ? Math.round(totalCost * 100) / 100 : null,
  };
}

export function parseUsedStockItems(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function summarizeUsedStockItems(items) {
  const partOrder = ['base', 'booster', 'flavor'];
  const labels = { base: 'Báze', booster: 'Booster', flavor: 'Příchuť' };
  const groups = new Map();

  for (const item of items) {
    const key = item.part || item.type || 'other';
    const existing = groups.get(key) ?? {
      key,
      label: labels[key] || key,
      total_ml: 0,
      total_cost_czk: 0,
      hasCost: false,
      items: [],
    };

    existing.total_ml += Number(item.deducted_ml || 0);
    if (item.deducted_cost_czk != null) {
      existing.total_cost_czk += Number(item.deducted_cost_czk);
      existing.hasCost = true;
    }
    existing.items.push(item);
    groups.set(key, existing);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      total_ml: roundMl(group.total_ml),
      total_cost_czk: group.hasCost ? Math.round(group.total_cost_czk * 100) / 100 : null,
    }))
    .sort((a, b) => partOrder.indexOf(a.key) - partOrder.indexOf(b.key));
}

