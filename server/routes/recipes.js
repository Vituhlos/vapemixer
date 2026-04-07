import { Router } from 'express';
import db from '../db.js';
import { validateRecipe } from '../middleware/validate.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM recipes ORDER BY is_favorite DESC, created_at DESC').all();
  res.json(rows);
});

router.post('/', validateRecipe, (req, res) => {
  const { name, flavor_name, volume_ml, nicotine_mg, vg_ratio, pg_ratio, booster_strength, flavor_pct, note, tags } = req.body;
  const result = db.prepare(`
    INSERT INTO recipes (name, flavor_name, volume_ml, nicotine_mg, vg_ratio, pg_ratio, booster_strength, flavor_pct, note, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(), flavor_name?.trim() || null,
    Number(volume_ml), Number(nicotine_mg), Number(vg_ratio), Number(pg_ratio),
    Number(booster_strength) ?? 18, Number(flavor_pct), note?.trim() || null,
    tags ? JSON.stringify(tags) : null
  );
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', validateRecipe, (req, res) => {
  const { name, flavor_name, volume_ml, nicotine_mg, vg_ratio, pg_ratio, booster_strength, flavor_pct, note, tags } = req.body;
  const existing = db.prepare('SELECT id FROM recipes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Recept nenalezen' });

  db.prepare(`
    UPDATE recipes SET name=?, flavor_name=?, volume_ml=?, nicotine_mg=?, vg_ratio=?, pg_ratio=?, booster_strength=?, flavor_pct=?, note=?, tags=?
    WHERE id=?
  `).run(
    name.trim(), flavor_name?.trim() || null,
    Number(volume_ml), Number(nicotine_mg), Number(vg_ratio), Number(pg_ratio),
    Number(booster_strength), Number(flavor_pct), note?.trim() || null,
    tags ? JSON.stringify(tags) : null,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.patch('/:id/favorite', (req, res) => {
  const existing = db.prepare('SELECT id, is_favorite FROM recipes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Recept nenalezen' });

  const newValue = existing.is_favorite ? 0 : 1;
  db.prepare('UPDATE recipes SET is_favorite = ? WHERE id = ?').run(newValue, req.params.id);
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
