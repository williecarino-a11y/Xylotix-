const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const Quiz = require('../models/Quiz');
const MissedQuestion = require('../models/MissedQuestion');
const learningService = require('../services/learningService');
const translationService = require('../services/translationService');

const REVIEW_BATCH = 10;

function fail(res, status, code, message) {
  return res.status(status).json({ status: 'error', code, message });
}

function isCorrectAnswer(quiz, submitted) {
  if (submitted === undefined || submitted === null || submitted === '') return false;
  const given = Number(submitted);
  if (quiz.questionType === 'calculate') {
    const expected = Number(quiz.correctAnswer);
    return Number.isFinite(given) && Number.isFinite(expected) && given === expected;
  }
  return Number.isInteger(given) && given === Number(quiz.correctAnswer);
}

module.exports = function createReviewRoutes({ requireAuth }) {
  const router = express.Router();

  const answerLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      fail(res, 429, 'REVIEW_RATE_LIMITED', 'You are going too fast. Please wait a moment.')
  });

  /* How many questions are waiting (for the Home row) */
  router.get('/summary', requireAuth, async (req, res) => {
    try {
      const missed = await MissedQuestion.find({ userId: req.authUser._id }).select('quizId');
      const ids = missed.map(function (m) { return m.quizId; });
      const count = ids.length
        ? await Quiz.countDocuments({ _id: { $in: ids }, published: true })
        : 0;
      return res.status(200).json({ status: 'success', data: { count } });
    } catch (error) {
      console.error('Review summary error:', error);
      return fail(res, 500, 'REVIEW_SUMMARY_FAILED', 'Unable to load your review list.');
    }
  });

  /* The next batch of questions to practise */
  router.get('/', requireAuth, async (req, res) => {
    try {
      const userId = req.authUser._id;
      const language = translationService.normalizeLanguage(
        typeof req.query.language === 'string' ? req.query.language : 'en'
      );

      const missed = await MissedQuestion.find({ userId })
        .sort({ lastMissedAt: 1 })
        .limit(REVIEW_BATCH);

      const ids = missed.map(function (m) { return m.quizId; });
      const quizzes = await Quiz.find({ _id: { $in: ids }, published: true });
      const byId = new Map(quizzes.map(function (q) { return [q._id.toString(), q]; }));

      // Remove entries whose question no longer exists
      const orphans = missed
        .filter(function (m) { return !byId.has(m.quizId.toString()); })
        .map(function (m) { return m._id; });
      if (orphans.length) {
        await MissedQuestion.deleteMany({ _id: { $in: orphans } });
      }

      let questions = missed
        .map(function (m) { return byId.get(m.quizId.toString()); })
        .filter(Boolean)
        .map(function (q) { return learningService.sanitizeQuiz(q); });

      if (language !== 'en') {
        questions = await Promise.all(
          questions.map(function (quiz) {
            return translationService.translateQuiz({ quiz, targetLanguage: language });
          })
        );
      }

      return res.status(200).json({ status: 'success', data: { questions } });
    } catch (error) {
      console.error('Review load error:', error);
      return fail(res, 500, 'REVIEW_LOAD_FAILED', 'Unable to load your review questions.');
    }
  });

  /* Check one answer */
  router.post('/answer', requireAuth, answerLimiter, async (req, res) => {
    try {
      const userId = req.authUser._id;
      const body = req.body || {};

      if (!mongoose.Types.ObjectId.isValid(body.quizId)) {
        return fail(res, 400, 'INVALID_QUIZ_ID', 'Invalid question.');
      }

      const missed = await MissedQuestion.findOne({ userId, quizId: body.quizId });
      if (!missed) {
        return fail(res, 404, 'NOT_IN_REVIEW', 'This question is not in your review list.');
      }

      const quiz = await Quiz.findById(body.quizId);
      if (!quiz) {
        await MissedQuestion.deleteOne({ _id: missed._id });
        return fail(res, 404, 'QUESTION_NOT_FOUND', 'This question is no longer available.');
      }

      const correct = isCorrectAnswer(quiz, body.answer);

      if (correct) {
        await MissedQuestion.deleteOne({ _id: missed._id });
      } else {
        missed.missCount = (missed.missCount || 1) + 1;
        missed.lastMissedAt = new Date();
        await missed.save();
      }

      return res.status(200).json({
        status: 'success',
        data: { correct, correctAnswer: quiz.correctAnswer }
      });
    } catch (error) {
      console.error('Review answer error:', error);
      return fail(res, 500, 'REVIEW_ANSWER_FAILED', 'Unable to check your answer.');
    }
  });

  return router;
};
