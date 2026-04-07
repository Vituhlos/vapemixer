import { Router } from 'express';
import db from '../db.js';
import { validateHistory } from '../middleware/validate.js';

const router = Router();

const STOCK_TYPE_MAP = {
  MTL: { base: 'baze_mtl', booster: 'booster_mtl' },
  DL:  { base: 'baze_dl',  booster: 'booster_dl' },
};

function resolveBasePreset(vgRatio, pgRatio) {
  if (Number(vgRatio) === 50 && Number(pgRatio) === 50) return 'MTL';
  if (Number(vgRatio) === 70 && Number(pgRatio) === 30) return 'DL';
  return 'MTL';
}

const getFirstStockByType = db.prepare('SELECT * FROM stock WHERE type = ? ORDER BY created_at ASC, id ASC LIMIT 1');
const getFlavorStockByName = db.prepare('SELECT * FROM stock WHERE type = \'prichut\' AND LOWER(name) = LOWER(?) ORDER BY created_at ASC, id ASC LIMIT 1');
const addToStock = db.prepare('UPDATE stock SET amount_ml = MIN(amount_ml + ?, capacity_ml) WHERE id = ?');
const markNotDeducted = db.prepare('UPDATE history SET stock_deducted = 0 WHERE id = ?');

const revertMixTransaction = db.transaction((entry) => {
  const basePreset = resolveBasePreset(entry.vg_ratio, entry.pg_ratio);
  const stockTypes = STOCK_TYPE_MAP[basePreset];

  if (entry.base_ml > 0) {
    const item = getFirstStockByType.get(stockTypes.base);
    if (item) addToStock.run(entry.base_ml, item.id);
  }
  if (entry.booster_ml > 0) {
    const item = getFirstStockByType.get(stockTypes.booster);
    if (item) addToStock.run(entry.booster_ml, item.id);
  }
  if (entry.flavor_ml > 0) {
    const flavorName = entry.flavor_name?.trim() || null;
    const item = flavorName
      ? getFlavorStockByName.get(flavorName) ?? getFirstStockByType.get('prichut')
      : getFirstStockByType.get('prichut');
    if (item) addToStock.run(entry.flavor_ml, item.id);
  }

  markNotDeducted.run(entry.id);
  return db.prepare('SELECT * FROM stock ORDER BY type, name').all();
});

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM history ORDER BY created_at DESC').all();
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
