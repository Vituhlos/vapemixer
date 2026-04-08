import { Router } from 'express';
import db from '../db.js';
import { validateMix } from '../middleware/validate.js';
import { buildStockPlan, executeStockPlan } from '../services/mixing.js';

const router = Router();

const insertHistory = db.prepare(`
  INSERT INTO history (
    recipe_id, recipe_name, volume_ml, nicotine_mg, vg_ratio, pg_ratio,
    booster_strength, booster_ml, base_ml, flavor_ml, flavor_pct, flavor_name, note, stock_deducted, cost_czk,
    base_stock_id, booster_stock_id, flavor_stock_id, used_stock_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getHistoryById = db.prepare('SELECT * FROM history WHERE id = ?');
const getStockByType = db.prepare('SELECT * FROM stock WHERE type = ? ORDER BY created_at ASC, id ASC');
const getFlavorStockByName = db.prepare('SELECT * FROM stock WHERE type = \'prichut\' AND LOWER(name) = LOWER(?) ORDER BY created_at ASC, id ASC');
const getStockById = db.prepare('SELECT * FROM stock WHERE id = ?');
const updateStockAmount = db.prepare('UPDATE stock SET amount_ml = ? WHERE id = ?');

const runMix = db.transaction((payload) => {
  let cost_czk = null;
  let usedStockItems = [];

  if (payload.deduct_stock) {
    const plan = buildStockPlan({ payload, getStockById, getFlavorStockByName });
    const stockExecution = executeStockPlan({ plan, getStockByType, updateStockAmount });
    cost_czk = stockExecution.cost_czk;
    usedStockItems = stockExecution.usedStockItems;
  }

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
    payload.deduct_stock ? 1 : 0,
    cost_czk,
    payload.base_stock_id ?? null,
    payload.booster_stock_id ?? null,
    payload.flavor_stock_id ?? null,
    usedStockItems.length > 0 ? JSON.stringify(usedStockItems) : null,
  );

  const history = getHistoryById.get(result.lastInsertRowid);
  if (!payload.deduct_stock) return { history, stockUpdated: false };

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
