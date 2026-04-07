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
  const { name, type, amount_ml, capacity_ml } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || !name.trim()) errors.push('name je povinný');
  if (!type || !VALID_TYPES.includes(type)) errors.push(`type musí být jeden z: ${VALID_TYPES.join(', ')}`);
  if (amount_ml != null && (isNaN(Number(amount_ml)) || Number(amount_ml) < 0)) errors.push('amount_ml musí být >= 0');
  if (capacity_ml != null && (isNaN(Number(capacity_ml)) || Number(capacity_ml) <= 0)) errors.push('capacity_ml musí být > 0');

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
