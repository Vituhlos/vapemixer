import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMix, resolveBaseRatios } from './calc.js';

test('calculateMix returns expected values for standard recipe', () => {
  const result = calculateMix({
    volume: 60,
    nicotine: 6,
    boosterStrength: 18,
    flavorPct: 17,
    vg: 50,
    pg: 50,
  });

  assert.ok(result);
  assert.ok(Math.abs(result.flavorMl - 10.2) < 1e-9);
  assert.equal(result.boosterMl, 20);
  assert.ok(Math.abs(result.baseMl - 29.8) < 1e-9);
  assert.equal(result.boosterBottles, 2);
  assert.deepEqual(result.warnings, []);
});

test('calculateMix warns on impossible recipe', () => {
  const result = calculateMix({
    volume: 30,
    nicotine: 20,
    boosterStrength: 18,
    flavorPct: 30,
    vg: 70,
    pg: 30,
  });

  assert.ok(result);
  assert.equal(result.baseMl, 0);
  assert.ok(result.warnings.some((warning) => warning.includes('Záporná báze')));
  assert.ok(result.warnings.some((warning) => warning.includes('překračuje sílu boosteru')));
});

test('resolveBaseRatios uses presets and custom values', () => {
  assert.deepEqual(resolveBaseRatios('MTL', 10, 90), { vg: 50, pg: 50 });
  assert.deepEqual(resolveBaseRatios('DL', 10, 90), { vg: 70, pg: 30 });
  assert.deepEqual(resolveBaseRatios('custom', 80, 20), { vg: 80, pg: 20 });
});
