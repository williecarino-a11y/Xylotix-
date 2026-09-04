import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/miimiid_test';

const { app } = await import('../server.js');
const supertest = (await import('supertest')).default;
const request = supertest(app);

test('application reports ready against a real MongoDB connection', async (t) => {
  t.after(async () => {
    await mongoose.disconnect();
  });

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  });

  assert.equal(mongoose.connection.readyState, 1);

  const response = await request.get('/api/health/ready');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'OK');
  assert.equal(response.body.services.database, 'connected');
});
