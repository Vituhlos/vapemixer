export function validateRecipe(req, res, next) {
  const { name, volume_ml, nicotine_mg, vg_ratio, pg_ratio, booster_strength, flavor_pct } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) errors.push('name je povinný');
  if (volume_ml == null || isNaN(Number(volume_ml)) || Number(volume_ml) <= 0) errors.push('volume_ml musí být > 0');
  if (nicotine_mg == null || isNaN(Number(nicotine_mg)) || Number(nicotine_mg) < 0) errors.push('nicotine_mg musí být >= 0');
  if (vg_ratio == null || isNaN(Number(vg_ratio)) || Number(vg_ratio) < 0 || Number(vg_ratio) > 100) errors.push('vg_ratio musí být 0–100');
  if (pg_ratio == null || isNaN(Number(pg_ratio)) || Number(pg_ratio) < 0 || Number(pg_ratio) > 100) errors.push('pg_ratio musí být 0–100');
  if (booster_strength == null || isNaN(Number(booster_strength)) || Number(booster_strength) <= 0) errors.push('booster_strength musí být > 0');
  if (flavor_pct == null || isNaN(Number(flavor_pct)) || Number(flavor_pct) < 0 || Number(flavor_pct) > 100) errors.push('flavor_pct musí být 0–100');

  if (errors.length) return res.status(400).json({ errors });
  next();
}

const VALID_TYPES = ['baze_mtl', 'baze_dl', 'booster_mtl', 'booster_dl', 'prichut'];

export function validateStock(req, res, next) {
  const { name, type, amount_ml, capacity_ml, bottle_ml } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) errors.push('name je povinný');
  if (!type || !VALID_TYPES.includes(type)) errors.push(`type musí být jeden z: ${VALID_TYPES.join(', ')}`);
  if (amount_ml != null && (isNaN(Number(amount_ml)) || Number(amount_ml) < 0)) errors.push('amount_ml musí být >= 0');
  if (capacity_ml != null && (isNaN(Number(capacity_ml)) || Number(capacity_ml) <= 0)) errors.push('capacity_ml musí být > 0');
  if (bottle_ml != null && (isNaN(Number(bottle_ml)) || Number(bottle_ml) < 0)) errors.push('bottle_ml musí být >= 0');

  if (errors.length) return res.status(400).json({ errors });
  next();
}

export function validateHistory(req, res, next) {
  const { volume_ml, nicotine_mg, vg_ratio, pg_ratio, booster_strength, booster_ml, base_ml, flavor_ml, flavor_pct } = req.body;
  const errors = [];

  const num = (v, name, min = 0) => {
    if (v == null || isNaN(Number(v)) || Number(v) < min) errors.push(`${name} musí být číslo >= ${min}`);
  };
  num(volume_ml, 'volume_ml', 0.1);
  num(nicotine_mg, 'nicotine_mg');
  num(vg_ratio, 'vg_ratio');
  num(pg_ratio, 'pg_ratio');
  num(booster_strength, 'booster_strength', 0.1);
  num(booster_ml, 'booster_ml');
  num(base_ml, 'base_ml');
  num(flavor_ml, 'flavor_ml');
  num(flavor_pct, 'flavor_pct');

  if (errors.length) return res.status(400).json({ errors });
  next();
}

export function validateMix(req, res, next) {
  const {
    base_type, deduct_stock, recipe_id, recipe_name, flavor_name, note,
    volume_ml, nicotine_mg, vg_ratio, pg_ratio, booster_strength,
    booster_ml, base_ml, flavor_ml, flavor_pct,
    base_stock_id, booster_stock_id, flavor_stock_id,
  } = req.body;
  const errors = [];

  const num = (v, name, min = 0) => {
    if (v == null || isNaN(Number(v)) || Number(v) < min) errors.push(`${name} musí být číslo >= ${min}`);
  };

  if (base_type != null && !['MTL', 'DL', 'custom'].includes(base_type)) errors.push('base_type musí být MTL, DL nebo custom');
  if (deduct_stock != null && typeof deduct_stock !== 'boolean') errors.push('deduct_stock musí být boolean');
  if (recipe_id != null && (isNaN(Number(recipe_id)) || Number(recipe_id) < 1)) errors.push('recipe_id musí být kladné číslo');
  if (base_stock_id != null && (isNaN(Number(base_stock_id)) || Number(base_stock_id) < 1)) errors.push('base_stock_id musí být kladné číslo');
  if (booster_stock_id != null && (isNaN(Number(booster_stock_id)) || Number(booster_stock_id) < 1)) errors.push('booster_stock_id musí být kladné číslo');
  if (flavor_stock_id != null && (isNaN(Number(flavor_stock_id)) || Number(flavor_stock_id) < 1)) errors.push('flavor_stock_id musí být kladné číslo');
  if (recipe_name != null && typeof recipe_name !== 'string') errors.push('recipe_name musí být text');
  if (flavor_name != null && typeof flavor_name !== 'string') errors.push('flavor_name musí být text');
  if (note != null && typeof note !== 'string') errors.push('note musí být text');

  num(volume_ml, 'volume_ml', 0.1);
  num(nicotine_mg, 'nicotine_mg');
  num(vg_ratio, 'vg_ratio');
  num(pg_ratio, 'pg_ratio');
  num(booster_strength, 'booster_strength', 0.1);
  num(booster_ml, 'booster_ml');
  num(base_ml, 'base_ml');
  num(flavor_ml, 'flavor_ml');
  num(flavor_pct, 'flavor_pct');

  if (!isNaN(Number(vg_ratio)) && !isNaN(Number(pg_ratio)) && (Number(vg_ratio) + Number(pg_ratio) !== 100)) {
    errors.push('vg_ratio a pg_ratio musí dohromady dát 100');
  }

  if (errors.length) return res.status(400).json({ errors });
  next();
}
