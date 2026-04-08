import test from 'node:test';
import assert from 'node:assert/strict';
import { parseOrderEmail } from './orderParser.js';

test('parses shake and vape with aroma volume as stock amount', () => {
  const input = [
    'Objednané zboží',
    'Příchuť Frutie Shake & Vape 10ml/60ml\t1 ks\t149 Kč\t149 Kč',
    'Doprava',
  ].join('\n');

  const items = parseOrderEmail(input);

  assert.equal(items.length, 1);
  assert.equal(items[0].type, 'prichut');
  assert.equal(items[0].amount_ml, 10);
  assert.equal(items[0].capacity_ml, 10);
  assert.equal(items[0].bottle_ml, 60);
  assert.equal(items[0].is_shake_and_vape, true);
  assert.match(items[0].note, /10 ml příchutě v 60 ml lahvičce/);
});

test('parses normal flavor volume from explicit objem field', () => {
  const input = [
    'Objednané zboží',
    'Příchuť Mango Ice (Objem: 10ml, Kolek: R)\t1 ks\t89 Kč\t89 Kč',
    'Doprava',
  ].join('\n');

  const items = parseOrderEmail(input);

  assert.equal(items.length, 1);
  assert.equal(items[0].amount_ml, 10);
  assert.equal(items[0].capacity_ml, 10);
  assert.equal(items[0].note, null);
});

test('parses shake and vape volume from the full order row, not only product name', () => {
  const input = [
    'Objednané zboží',
    'Cake Me Up - Lemon Short Cake Shake&Vape\tObjem: 10ml/60ml\t1 ks\t289 Kč\t289 Kč',
    'Doprava',
  ].join('\n');

  const items = parseOrderEmail(input);

  assert.equal(items.length, 1);
  assert.equal(items[0].amount_ml, 10);
  assert.equal(items[0].capacity_ml, 10);
  assert.equal(items[0].bottle_ml, 60);
  assert.equal(items[0].is_shake_and_vape, true);
  assert.match(items[0].note, /10 ml příchutě v 60 ml lahvičce/);
});

test('marks shake and vape without volume as needing manual input', () => {
  const input = [
    'Objednané zboží',
    'Cake Me Up - Lemon Short Cake Shake&Vape\t1 ks\t289 Kč\t289 Kč',
    'Doprava',
  ].join('\n');

  const items = parseOrderEmail(input);

  assert.equal(items.length, 1);
  assert.equal(items[0].type, 'prichut');
  assert.equal(items[0].amount_ml, 0);
  assert.equal(items[0].capacity_ml, 30);
  assert.equal(items[0].bottle_ml, null);
  assert.equal(items[0].is_shake_and_vape, true);
  assert.equal(items[0].needs_volume_input, true);
  assert.match(items[0].note, /neobsahuje objem/i);
});
