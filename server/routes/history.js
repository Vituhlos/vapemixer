import { Router } from 'express';
import db from '../db.js';
import { validateHistory } from '../middleware/validate.js';

const router = Router();

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

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM history WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
