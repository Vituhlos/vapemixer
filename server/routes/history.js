import { Router } from 'express';
import db from '../db.js';
import { validateHistory } from '../middleware/validate.js';
import { parseUsedStockItems, resolveBasePreset, roundMl, summarizeUsedStockItems } from '../services/mixing.js';

const router = Router();

const STOCK_TYPE_MAP = {
  MTL: { base: 'baze_mtl', booster: 'booster_mtl' },
  DL:  { base: 'baze_dl',  booster: 'booster_dl' },
};

const getFirstStockByType = db.prepare('SELECT * FROM stock WHERE type = ? ORDER BY created_at ASC, id ASC LIMIT 1');
const getFlavorStockByName = db.prepare('SELECT * FROM stock WHERE type = \'prichut\' AND LOWER(name) = LOWER(?) ORDER BY created_at ASC, id ASC LIMIT 1');
const setStockAmount = db.prepare('UPDATE stock SET amount_ml = ? WHERE id = ?');
const markNotDeducted = db.prepare('UPDATE history SET stock_deducted = 0 WHERE id = ?');
const getStockById = db.prepare('SELECT * FROM stock WHERE id = ?');

function addToStock(item, amount) {
  const nextAmount = Math.min(Number(item.capacity_ml || 0), roundMl(Number(item.amount_ml || 0) + Number(amount || 0)));
  setStockAmount.run(nextAmount, item.id);
}

const revertMixTransaction = db.transaction((entry) => {
  const basePreset = resolveBasePreset(entry.vg_ratio, entry.pg_ratio);
  const stockTypes = STOCK_TYPE_MAP[basePreset];

  if (entry.base_ml > 0) {
    const item = entry.base_stock_id
      ? getStockById.get(entry.base_stock_id)
      : getFirstStockByType.get(stockTypes.base);
    if (item) addToStock(item, entry.base_ml);
  }
  if (entry.booster_ml > 0) {
    const item = entry.booster_stock_id
      ? getStockById.get(entry.booster_stock_id)
      : getFirstStockByType.get(stockTypes.booster);
    if (item) addToStock(item, entry.booster_ml);
  }
  if (entry.flavor_ml > 0) {
    const flavorName = entry.flavor_name?.trim() || null;
    const item = entry.flavor_stock_id
      ? getStockById.get(entry.flavor_stock_id)
      : flavorName
        ? getFlavorStockByName.get(flavorName) ?? getFirstStockByType.get('prichut')
        : getFirstStockByType.get('prichut');
    if (item) addToStock(item, entry.flavor_ml);
  }

  markNotDeducted.run(entry.id);
  return db.prepare('SELECT * FROM stock ORDER BY type, name').all();
});

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM history ORDER BY created_at DESC').all()
    .map((row) => ({
      ...row,
      used_stock_items: parseUsedStockItems(row.used_stock_json),
      used_stock_summary: summarizeUsedStockItems(parseUsedStockItems(row.used_stock_json)),
    }));
  res.json(rows);
});

router.post('/', validateHistory, (req, res) => {
  const {
    recipe_id, recipe_name, volume_ml, nicotine_mg, vg_ratio, pg_ratio,
    booster_strength, booster_ml, base_ml, flavor_ml, flavor_pct, flavor_name, note
  } = req.body;
  const result = db.prepare(`
    INSERT INTO history (recipe_id, recipe_name, volume_ml, nicotine_mg, vg_ratio, pg_ratio,
      booster_strength, booster_ml, base_ml, flavor_ml, flavor_pct, flavor_name, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    recipe_id ?? null, recipe_name?.trim() || null,
    Number(volume_ml), Number(nicotine_mg), Number(vg_ratio), Number(pg_ratio),
    Number(booster_strength), Number(booster_ml), Number(base_ml),
    Number(flavor_ml), Number(flavor_pct), flavor_name?.trim() || null, note?.trim() || null
  );
  const row = db.prepare('SELECT * FROM history WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM history').run();
  res.status(204).end();
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM history WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

router.post('/:id/revert', (req, res) => {
  const entry = db.prepare('SELECT * FROM history WHERE id = ?').get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Záznam nenalezen' });
  if (!entry.stock_deducted) return res.status(409).json({ error: 'Sklad nebyl odečten nebo byl již vrácen' });

  try {
    const stock = revertMixTransaction(entry);
    res.json({ stock });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Vrácení odečtu se nezdařilo' });
  }
});

export default router;
