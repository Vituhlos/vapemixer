import { Router } from 'express';
import db from '../db.js';
import { validateMix } from '../middleware/validate.js';

const router = Router();

const STOCK_TYPE_MAP = {
  MTL: { base: 'baze_mtl', booster: 'booster_mtl' },
  DL: { base: 'baze_dl', booster: 'booster_dl' },
};

const insertHistory = db.prepare(`
  INSERT INTO history (
    recipe_id, recipe_name, volume_ml, nicotine_mg, vg_ratio, pg_ratio,
    booster_strength, booster_ml, base_ml, flavor_ml, flavor_pct, flavor_name, note, stock_deducted
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getHistoryById = db.prepare('SELECT * FROM history WHERE id = ?');
const getStockByType = db.prepare('SELECT * FROM stock WHERE type = ? ORDER BY created_at ASC, id ASC');
const getFlavorStockByName = db.prepare('SELECT * FROM stock WHERE type = \'prichut\' AND LOWER(name) = LOWER(?) ORDER BY created_at ASC, id ASC');
const updateStockAmount = db.prepare('UPDATE stock SET amount_ml = ? WHERE id = ?');

function resolveBasePreset(vgRatio, pgRatio) {
  if (Number(vgRatio) === 50 && Number(pgRatio) === 50) return 'MTL';
  if (Number(vgRatio) === 70 && Number(pgRatio) === 30) return 'DL';
  return 'MTL';
}

function collectStockPlan(baseType, payload) {
  const stockTypes = STOCK_TYPE_MAP[baseType] || STOCK_TYPE_MAP.MTL;
  const flavorName = payload.flavor_name?.trim() || null;
  const namedFlavorItems = flavorName ? getFlavorStockByName.all(flavorName) : [];
  const flavorEntry = namedFlavorItems.length > 0
    ? { type: 'prichut', needed: Number(payload.flavor_ml), label: `Příchuť: ${flavorName}`, items: namedFlavorItems }
    : { type: 'prichut', needed: Number(payload.flavor_ml), label: 'Příchuť', items: null };
  return [
    { type: stockTypes.base, needed: Number(payload.base_ml), label: 'Báze' },
    { type: stockTypes.booster, needed: Number(payload.booster_ml), label: 'Booster' },
    flavorEntry,
  ];
}

const runMix = db.transaction((payload) => {
  const result = insertHistory.run(
    payload.recipe_id ?? null,
    payload.recipe_name?.trim() || null,
    Number(payload.volume_ml),
    Number(payload.nicotine_mg),
    Number(payload.vg_ratio),
    Number(payload.pg_ratio),
    Number(payload.booster_strength),
    Number(payload.booster_ml),
    Number(payload.base_ml),
    Number(payload.flavor_ml),
    Number(payload.flavor_pct),
    payload.flavor_name?.trim() || null,
    payload.note?.trim() || null,
    payload.deduct_stock ? 1 : 0
  );

  const history = getHistoryById.get(result.lastInsertRowid);
  if (!payload.deduct_stock) {
    return { history, stockUpdated: false };
  }

  const baseType = payload.base_type || resolveBasePreset(payload.vg_ratio, payload.pg_ratio);
  const plan = collectStockPlan(baseType, payload);

  for (const entry of plan) {
    if (entry.needed <= 0.01) continue;
    const items = entry.items ?? getStockByType.all(entry.type);
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
      updateStockAmount.run(Math.max(0, currentAmount - deduct), item.id);
      remaining -= deduct;
    }
  }

  return {
    history,
    stockUpdated: true,
    stock: db.prepare('SELECT * FROM stock ORDER BY type, name').all(),
  };
});

router.post('/', validateMix, (req, res) => {
  try {
    const data = runMix(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || 'Nepodařilo se zapsat míchání',
      details: error.details || null,
    });
  }
});

export default router;
