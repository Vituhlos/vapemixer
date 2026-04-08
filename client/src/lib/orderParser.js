const SKIP_KEYWORDS = [
  'lahvičk', 'otvírák', 'uzávěr', 'prázdná', 'prázdné',
  'baterie', 'cívk', 'coil', 'clearomizer', 'cartridge',
  'náhradní', 'náustek', 'drip tip', 'nabíječ', 'krabičk',
  'pouzdro', 'starter kit', 'pod kit', 'mod kit',
];

// If name contains resistance spec it's hardware (coil/cartridge)
const HARDWARE_PATTERN = /\(odpor:/i;

const BOOSTER_KEYWORDS = ['booster', 'nikotin shot', 'nic shot', ' shot '];
const BASE_KEYWORDS = ['báze', 'base mix', 'základna', 'base vg', 'base pg'];
const SHAKE_VAPE_PATTERN = /shake\s*&\s*vape|shake and vape|shortfill|snv|mix\s*&\s*go|mix and go|mixgo/i;

function shouldSkip(rawName) {
  if (HARDWARE_PATTERN.test(rawName)) return true;
  const lower = rawName.toLowerCase();
  return SKIP_KEYWORDS.some(kw => lower.includes(kw));
}

function detectType(name) {
  const lower = name.toLowerCase();
  // Explicit "Příchuť" prefix is a reliable flavor signal
  if (/^p[rř][íi]chu/i.test(lower)) return 'prichut';
  if (BOOSTER_KEYWORDS.some(kw => lower.includes(kw))) {
    const isDL = /70.30|80.20|30.70|20.80/.test(lower);
    return isDL ? 'booster_dl' : 'booster_mtl';
  }
  if (BASE_KEYWORDS.some(kw => lower.includes(kw))) {
    const isDL = /70.30|80.20/.test(lower);
    return isDL ? 'baze_dl' : 'baze_mtl';
  }
  return 'prichut';
}

// Returns the first positive price (Kč) found in columns — usually the per-unit price
function extractPrice(cols) {
  for (const col of cols) {
    const match = col.match(/^(\d[\d\s]*)\s*Kč$/i);
    if (match) {
      const price = parseFloat(match[1].replace(/\s/g, ''));
      if (price > 0) return price;
    }
  }
  return null;
}

function extractMl(name) {
  // "(Objem: 10ml, ...)" — explicit volume spec from product title
  const objem = name.match(/\(objem:\s*(\d+)\s*ml/i);
  if (objem) return parseInt(objem[1]);
  // "5x10ml" or "5 x 10 ml" → 50
  const multi = name.match(/(\d+)\s*[xX×]\s*(\d+)\s*ml/);
  if (multi) return parseInt(multi[1]) * parseInt(multi[2]);
  // "500ml" or "500 ml"
  const single = name.match(/(\d+)\s*ml/);
  if (single) return parseInt(single[1]);
  return 0;
}

function extractAllMlValues(name) {
  return [...name.matchAll(/(\d+)\s*ml/gi)]
    .map((match) => parseInt(match[1], 10))
    .filter((value) => value > 0);
}

function detectShakeAndVape(text) {
  if (!SHAKE_VAPE_PATTERN.test(text)) return null;

  const values = extractAllMlValues(text);
  if (values.length === 0) return null;

  const bottle_ml = Math.max(...values);
  const flavor_ml = Math.min(...values);

  if (!bottle_ml || bottle_ml === flavor_ml) return null;

  return { bottle_ml, flavor_ml };
}

function detectShakeAndVapeWithoutVolume(text) {
  return SHAKE_VAPE_PATTERN.test(text) && extractAllMlValues(text).length === 0;
}

function cleanProductName(raw) {
  return raw
    .replace(/\s*\(kód:[^)]*\)/gi, '')       // (Kód: SN-DIY5097)
    .replace(/\s*\(objem:[^)]*\)/gi, '')      // (Objem: 10ml, Kolek: R)
    .replace(/\s*\(kolek:[^)]*\)/gi, '')      // (Kolek: R) if separate
    .replace(/\s*\(odpor:[^)]*\)/gi, '')      // (Odpor: 1,2ohm)
    .replace(/\s*\(barva:[^)]*\)/gi, '')      // (Barva: ...)
    .replace(/\s*\(varianta:[^)]*\)/gi, '')   // (Varianta: ...)
    .replace(/\s*-\s*(síla nikotinu|velikost|varianta|obsah|barva)\b.*/i, '')
    .trim();
}

// Table section triggers — matches both common Czech e-shop formats
const TABLE_START = /produkty\b|objednan[^.]*zbo[žz][íi]|seznam.*zbo[žz][íi]/i;
const TABLE_END   = /^(doprava|platba[\s(]|celkov)/i;
const SKIP_LINE   = /kusů|cena za kus|cena celkem|slevov|kupon|uplatnění bod/i;

export function parseOrderEmail(text) {
  const lines = text.split('\n');
  const items = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (TABLE_START.test(trimmed)) { inTable = true; continue; }
    if (!inTable) continue;
    if (TABLE_END.test(trimmed))   { inTable = false; continue; }
    if (!trimmed || SKIP_LINE.test(trimmed)) continue;

    // Extract product name from tab-separated columns
    const cols = line.split(/\t+/).map(c => c.trim()).filter(Boolean);
    const rawName = cols.find(c =>
      c.length > 3 &&
      !/^\d+\s*(ks)?$/i.test(c) &&
      !/\d+\s*Kč/i.test(c) &&
      !/^-?\d/.test(c)
    );
    if (!rawName) continue;

    if (shouldSkip(rawName)) continue;

    const scanText = cols.join(' ');
    const shakeInfo = detectShakeAndVape(scanText);
    const shakeWithoutVolume = !shakeInfo && detectShakeAndVapeWithoutVolume(scanText);
    const amount_ml = shakeInfo ? shakeInfo.flavor_ml : extractMl(scanText);
    const cleanName = cleanProductName(rawName);
    if (!cleanName || cleanName.length < 3) continue;

    const type = detectType(cleanName);
    const capacity_ml = shakeInfo
      ? shakeInfo.flavor_ml
      : amount_ml > 0 ? amount_ml : (type === 'prichut' ? 30 : 500);
    const price_czk = extractPrice(cols) ?? null;
    const note = shakeInfo
      ? `Shake & Vape: ${shakeInfo.flavor_ml} ml příchutě v ${shakeInfo.bottle_ml} ml lahvičce`
      : shakeWithoutVolume
        ? 'Shake & Vape / shortfill rozpoznán, ale e-mail neobsahuje objem. Doplňte ručně množství aromatu a kapacitu.'
      : null;

    items.push({
      name: cleanName,
      type,
      amount_ml,
      capacity_ml,
      bottle_ml: shakeInfo?.bottle_ml ?? null,
      price_czk,
      note,
      is_shake_and_vape: Boolean(shakeInfo || shakeWithoutVolume),
      needs_volume_input: Boolean(shakeWithoutVolume),
      selected: true,
    });
  }

  return items;
}
