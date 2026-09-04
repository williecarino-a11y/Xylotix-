import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';

const { app } = await import('../server.js');
const supertest = (await import('supertest')).default;
const request = supertest(app);

test('liveness endpoint returns 200 without database dependency', async () => {
  const response = await request.get('/api/health/live');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'OK');
  assert.equal(response.body.message, 'Miimiid is alive.');
});

test('readiness endpoint reports degraded state when database is unavailable', async () => {
  const response = await request.get('/api/health/ready');
  assert.equal(response.status, 503);
  assert.equal(response.body.status, 'DEGRADED');
  assert.equal(response.body.services.database, 'connecting');
});

test('legacy health endpoint remains explicit about degraded database state', async () => {
  const response = await request.get('/api/health');
  assert.equal(response.status, 503);
  assert.equal(response.body.status, 'DEGRADED');
  assert.equal(response.body.services.database, 'connecting');
});

test('unknown API routes return a stable JSON 404 contract', async () => {
  const response = await request.get('/api/does-not-exist');
  assert.equal(response.status, 404);
  assert.equal(response.body.status, 'error');
  assert.equal(response.body.code, 'API_ROUTE_NOT_FOUND');
  assert.equal(response.body.message, 'API route not found.');
});

test('security headers are present on API responses', async () => {
  const response = await request.get('/api/health/live');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-frame-options'], 'SAMEORIGIN');
  assert.equal(response.headers['referrer-policy'], 'strict-origin-when-cross-origin');
  assert.equal(response.headers['permissions-policy'], 'camera=(), microphone=(), geolocation=()');
  assert.equal(response.headers['x-powered-by'], undefined);
});

test('public learning catalog route responds without authentication', async () => {
  const response = await request.get('/api/learn/courses');
  assert.ok([200, 500].includes(response.status));
  if (response.status === 200) {
    assert.ok(['success', 'empty'].includes(response.body.status));
    assert.ok(Array.isArray(response.body.data));
  }
});

test('public Fun Center games route responds without authentication', async () => {
  const response = await request.get('/api/fun-center/games');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'success');
  assert.ok(Array.isArray(response.body.data));
});

test('protected learning quiz route rejects unauthenticated requests', async () => {
  const response = await request.post('/api/learn/quiz/submit').send({
    lessonId: '507f1f77bcf86cd799439011',
    submittedAnswers: []
  });
  assert.equal(response.status, 401);
  assert.equal(response.body.code, 'AUTHENTICATION_REQUIRED');
});

test('protected Fun Center session route rejects unauthenticated requests', async () => {
  const response = await request.post('/api/fun-center/session').send({ gameId: 'not-used' });
  assert.equal(response.status, 401);
  assert.equal(response.body.message, 'Authentication required.');
});
