import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = process.env.DB_PATH || '/app/data/vapemixer.db';
const SCHEMA_VERSION = 3;

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

const migrations = [
  {
    version: 1,
    up() {
      db.exec(`
        CREATE TABLE IF NOT EXISTS recipes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          flavor_name TEXT,
          volume_ml REAL NOT NULL,
          nicotine_mg REAL NOT NULL,
          vg_ratio INTEGER NOT NULL,
          pg_ratio INTEGER NOT NULL,
          booster_strength REAL NOT NULL DEFAULT 18,
          flavor_pct REAL NOT NULL,
          note TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS stock (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('baze_mtl','baze_dl','booster_mtl','booster_dl','prichut')),
          amount_ml REAL NOT NULL DEFAULT 0,
          capacity_ml REAL NOT NULL DEFAULT 100,
          note TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
          recipe_name TEXT,
          volume_ml REAL NOT NULL,
          nicotine_mg REAL NOT NULL,
          vg_ratio INTEGER NOT NULL,
          pg_ratio INTEGER NOT NULL,
          booster_strength REAL NOT NULL,
          booster_ml REAL NOT NULL,
          base_ml REAL NOT NULL,
          flavor_ml REAL NOT NULL,
          flavor_pct REAL NOT NULL,
          flavor_name TEXT,
          note TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);
    },
  },
  {
    version: 2,
    up() {
      db.exec(`ALTER TABLE history ADD COLUMN stock_deducted INTEGER NOT NULL DEFAULT 0;`);
    },
  },
  {
    version: 3,
    up() {
      db.exec(`
        ALTER TABLE recipes ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE recipes ADD COLUMN tags TEXT;
      `);
    },
  },
];

function getSchemaVersion() {
  const row = db.prepare(`SELECT value FROM app_meta WHERE key = 'schema_version'`).get();
  return row ? Number(row.value) || 0 : 0;
}

const setSchemaVersion = db.prepare(`
  INSERT INTO app_meta (key, value) VALUES ('schema_version', ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

db.transaction(() => {
  let currentVersion = getSchemaVersion();
  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;
    migration.up();
    setSchemaVersion.run(String(migration.version));
    currentVersion = migration.version;
  }
})();

if (getSchemaVersion() !== SCHEMA_VERSION) {
  setSchemaVersion.run(String(SCHEMA_VERSION));
}

// Seed data on first run
const recipeCount = db.prepare('SELECT COUNT(*) as c FROM recipes').get();
if (recipeCount.c === 0) {
  db.prepare(`
    INSERT INTO recipes (name, flavor_name, volume_ml, nicotine_mg, vg_ratio, pg_ratio, booster_strength, flavor_pct, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Cush Man 6mg MTL', 'Cush Man', 60, 6, 50, 50, 18, 17, 'Ukázkový recept');
}

const stockCount = db.prepare('SELECT COUNT(*) as c FROM stock').get();
if (stockCount.c === 0) {
  const insert = db.prepare(`
    INSERT INTO stock (name, type, amount_ml, capacity_ml) VALUES (?, ?, ?, ?)
  `);
  insert.run('Báze MTL 50/50', 'baze_mtl', 0, 500);
  insert.run('Báze DL 70/30', 'baze_dl', 0, 500);
  insert.run('Booster MTL 18mg', 'booster_mtl', 0, 100);
  insert.run('Booster DL 18mg', 'booster_dl', 0, 100);
}

export default db;
