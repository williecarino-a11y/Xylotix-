import assert from 'node:assert/strict';
import test from 'node:test';

const mongoose = (await import('mongoose')).default;
const Course = (await import('../models/Course.js')).default;
const Module = (await import('../models/Module.js')).default;
const Lesson = (await import('../models/Lesson.js')).default;
const Quiz = (await import('../models/Quiz.js')).default;
const UserProgress = (await import('../models/UserProgress.js')).default;
const learningService = (await import('../services/learningService.js')).default;

const courseId = new mongoose.Types.ObjectId();
const moduleId = new mongoose.Types.ObjectId();
const lessonId = new mongoose.Types.ObjectId();
const userId = new mongoose.Types.ObjectId();

const course = {
  _id: courseId,
  title: 'Money Basics',
  description: 'Learn the fundamentals.',
  longDescription: 'A practical introduction.',
  published: true,
  toObject() { return { _id: this._id, title: this.title, description: this.description, longDescription: this.longDescription, published: this.published }; }
};
const moduleDoc = {
  _id: moduleId,
  courseId,
  title: 'Budgeting',
  description: 'Plan your money.',
  order: 1,
  toObject() { return { _id: this._id, courseId: this.courseId, title: this.title, description: this.description, order: this.order }; }
};
const lesson = {
  _id: lessonId,
  moduleId,
  title: 'Needs and Wants',
  description: 'Separate essentials from extras.',
  published: true,
  contentBlocks: [],
  toObject() { return { _id: this._id, moduleId: this.moduleId, title: this.title, description: this.description, published: this.published, contentBlocks: this.contentBlocks }; }
};
const quiz = {
  _id: new mongoose.Types.ObjectId(),
  lessonId,
  order: 1,
  questionType: 'multiple-choice',
  question: 'Which is usually a need?',
  options: ['Rent', 'Video game'],
  correctAnswer: 0,
  published: true,
  points: 10,
  toObject() { return { ...this }; }
};

function queryResult(items) {
  return { sort: async () => items };
}

Course.find = () => queryResult([course]);
Course.findOne = async filter => filter._id?.toString() === courseId.toString() ? course : null;
Module.find = () => queryResult([moduleDoc]);
Lesson.findOne = async () => lesson;
Lesson.findById = async () => lesson;
Lesson.find = () => queryResult([lesson]);
Quiz.find = () => queryResult([quiz]);

let progressRecord;
UserProgress.findOneAndUpdate = async (filter, update) => {
  progressRecord = { ...filter, ...update };
  return progressRecord;
};


test('quiz responses never expose the correct answer', () => {
  const safe = learningService.sanitizeQuiz(quiz);
  assert.equal(safe.question, quiz.question);
  assert.deepEqual(safe.options, quiz.options);
  assert.equal(Object.hasOwn(safe, 'correctAnswer'), false);
});

test('quiz submission scores the server-side correct answer', async () => {
  const result = await learningService.submitQuizAnswers(lessonId, [0]);
  assert.equal(result.totalQuestions, 1);
  assert.equal(result.correctAnswers, 1);
  assert.equal(result.score, 100);
  assert.equal(result.passed, true);
  assert.equal(result.results[0].correct, true);
});

test('incorrect quiz answers do not leak the correct answer', async () => {
  const result = await learningService.submitQuizAnswers(lessonId, [1]);
  assert.equal(result.correctAnswers, 0);
  assert.equal(result.score, 0);
  assert.equal(result.passed, false);
  assert.equal(Object.hasOwn(result.results[0], 'correctAnswer'), false);
});

test('lesson completion persists the quiz result for the authenticated user', async () => {
  const result = await learningService.recordLessonProgress(userId, lessonId, [0]);
  assert.equal(result.success, true);
  assert.equal(result.quizResult.score, 100);
  assert.equal(progressRecord.userId.toString(), userId.toString());
  assert.equal(progressRecord.lessonId.toString(), lessonId.toString());
  assert.equal(progressRecord.completed, true);
  assert.equal(progressRecord.quizScore, 100);
});
