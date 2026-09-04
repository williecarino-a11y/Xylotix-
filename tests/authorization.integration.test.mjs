import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'test';

const mongoose = (await import('mongoose')).default;
const authRoutes = await import('../routes/authRoutes.js');
const learningService = await import('../services/learningService.js');
const aiTutorService = await import('../services/aiTutorService.js');

const userId = new mongoose.Types.ObjectId();
const otherUserId = new mongoose.Types.ObjectId();
const user = {
  _id: userId,
  email: 'authorization@example.com',
  firstName: 'Auth',
  lastName: 'Test',
  emailVerified: true,
  accountVerified: true
};

const originalGetAuthenticatedUser = authRoutes.getAuthenticatedUser;
const originalProgress = learningService.getCourseProgress;
const originalDashboard = learningService.getUserDashboardStats;
const originalChat = aiTutorService.chat;

// The route modules destructure getAuthenticatedUser during import, so install the
// authenticated test principal before importing the application.
authRoutes.getAuthenticatedUser = async () => user;
learningService.getCourseProgress = async () => ({ completedLessons: 2 });
learningService.getUserDashboardStats = async userIdArg => ({ userId: userIdArg });
aiTutorService.chat = async () => ({ answer: 'Test tutor response.' });

const { app } = await import('../server.js');
const supertest = (await import('supertest')).default;
const request = supertest(app);

try {
  test('learning progress denies access to another user', async () => {
    const response = await request
      .get(`/api/learn/courses/${new mongoose.Types.ObjectId()}/progress/${otherUserId}`);
    assert.equal(response.status, 403);
    assert.equal(response.body.code, 'FORBIDDEN_USER_RESOURCE');
  });

  test('dashboard denies access to another user', async () => {
    const response = await request.get(`/api/learn/dashboard/${otherUserId}`);
    assert.equal(response.status, 403);
    assert.equal(response.body.code, 'FORBIDDEN_USER_RESOURCE');
  });

  test('learning progress rejects malformed user IDs', async () => {
    const response = await request
      .get(`/api/learn/courses/${new mongoose.Types.ObjectId()}/progress/not-an-object-id`);
    assert.equal(response.status, 400);
    assert.equal(response.body.code, 'INVALID_USER_ID');
  });

  test('dashboard accepts only the authenticated user ID', async () => {
    const response = await request.get(`/api/learn/dashboard/${userId}`);
    assert.equal(response.status, 200);
    assert.equal(response.body.data.userId, userId.toString());
  });

  test('AI Tutor is behind authentication', async () => {
    authRoutes.getAuthenticatedUser = async () => null;
    const response = await request.post('/api/ai-tutor/chat').send({ message: 'Explain budgeting.' });
    assert.equal(response.status, 401);
    assert.equal(response.body.code, 'AI_TUTOR_AUTH_REQUIRED');
    authRoutes.getAuthenticatedUser = async () => user;
  });

  test('AI Tutor rejects an empty message through its service contract', async () => {
    aiTutorService.chat = async () => {
      const error = new Error('message required');
      error.code = 'AI_TUTOR_INVALID_MESSAGE';
      throw error;
    };
    const response = await request.post('/api/ai-tutor/chat').send({ message: '' });
    assert.equal(response.status, 400);
    assert.equal(response.body.code, 'AI_TUTOR_INVALID_MESSAGE');
    aiTutorService.chat = originalChat;
  });
} finally {
  authRoutes.getAuthenticatedUser = originalGetAuthenticatedUser;
  learningService.getCourseProgress = originalProgress;
  learningService.getUserDashboardStats = originalDashboard;
  aiTutorService.chat = originalChat;
}
