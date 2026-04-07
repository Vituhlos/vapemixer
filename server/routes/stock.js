import { Router } from 'express';
import db from '../db.js';
import { validateStock } from '../middleware/validate.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM stock ORDER BY type, name').all();
  res.json(rows);
});

router.post('/', validateStock, (req, res) => {
  const { name, type, amount_ml, capacity_ml, note } = req.body;
  const result = db.prepare(`
    INSERT INTO stock (name, type, amount_ml, capacity_ml, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(name.trim(), type, Number(amount_ml) ?? 0, Number(capacity_ml) ?? 100, note?.trim() || null);
  const row = db.prepare('SELECT * FROM stock WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', validateStock, (req, res) => {
  const { name, type, amount_ml, capacity_ml, note } = req.body;
  const existing = db.prepare('SELECT id FROM stock WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Položka nenalezena' });

  db.prepare(`
    UPDATE stock SET name=?, type=?, amount_ml=?, capacity_ml=?, note=?
    WHERE id=?
  `).run(name.trim(), type, Number(amount_ml), Number(capacity_ml), note?.trim() || null, req.params.id);
  const row = db.prepare('SELECT * FROM stock WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM stock WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
