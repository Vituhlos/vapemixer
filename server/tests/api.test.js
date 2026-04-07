import test from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'path';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DB_PATH = join(process.cwd(), 'tests', '.tmp', `vapemixer-test-${process.pid}.db`);

const { createApp } = await import('../app.js');

const app = createApp();

test('GET /api/recipes returns seeded recipe', async () => {
  const response = await request(app).get('/api/recipes');

  assert.equal(response.status, 200);
  assert.equal(Array.isArray(response.body), true);
  assert.equal(response.body.length > 0, true);
  assert.equal(response.body[0].name, 'Cush Man 6mg MTL');
});

test('POST /api/mix stores history entry without stock deduction', async () => {
  const payload = {
    recipe_name: 'API test mix',
    volume_ml: 30,
    nicotine_mg: 3,
    vg_ratio: 50,
    pg_ratio: 50,
    base_type: 'MTL',
    booster_strength: 18,
    booster_ml: 5,
    base_ml: 20.5,
    flavor_ml: 4.5,
    flavor_pct: 15,
    flavor_name: 'Test',
    deduct_stock: false,
  };

  const mixResponse = await request(app).post('/api/mix').send(payload);
  assert.equal(mixResponse.status, 201);
  assert.equal(mixResponse.body.stockUpdated, false);
  assert.equal(mixResponse.body.history.recipe_name, 'API test mix');

  const historyResponse = await request(app).get('/api/history');
  assert.equal(historyResponse.status, 200);
  assert.equal(historyResponse.body.some((item) => item.recipe_name === 'API test mix'), true);
});

test('DELETE /api/history clears all entries', async () => {
  const before = await request(app).get('/api/history');
  assert.equal(before.status, 200);
  assert.equal(before.body.length > 0, true);

  const deleteResponse = await request(app).delete('/api/history');
  assert.equal(deleteResponse.status, 204);

  const after = await request(app).get('/api/history');
  assert.equal(after.status, 200);
  assert.deepEqual(after.body, []);
});

test('invalid json gets structured 400 response', async () => {
  const response = await request(app)
    .post('/api/mix')
    .set('Content-Type', 'application/json')
    .send('{"broken": ');

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: 'Neplatné JSON tělo požadavku' });
});
