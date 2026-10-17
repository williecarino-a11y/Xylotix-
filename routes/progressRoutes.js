const express = require('express');
const crypto = require('crypto');

const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const UserProgress = require('../models/UserProgress');
const learningService = require('../services/learningService');

function validTimezone(value) {
  if (typeof value !== 'string' || !value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch (error) {
    return false;
  }
}

function dateKeyIn(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}

function longestRun(keys) {
  const sorted = Array.from(new Set(keys)).sort();
  let best = 0;
  let run = 0;
  let previous = null;
  sorted.forEach(function (key) {
    const time = Date.parse(key + 'T00:00:00Z');
    run = previous !== null && time - previous === 86400000 ? run + 1 : 1;
    if (run > best) best = run;
    previous = time;
  });
  return best;
}

function certificateId(userId, courseId) {
  return 'MM-' + crypto.createHash('sha256').update(userId + ':' + courseId).digest('hex').slice(0, 10).toUpperCase();
}

module.exports = function createProgressRoutes({ requireAuth }) {
  const router = express.Router();

  router.get('/', requireAuth, async function (req, res) {
    try {
      const userId = req.authUser._id;
      const userIdText = userId.toString();
      const tz = validTimezone(req.query.tz) ? req.query.tz : 'UTC';

      const [courses, progress] = await Promise.all([
        Course.find({ published: true }).sort({ order: 1 }).select('_id title'),
        UserProgress.find({ userId, completed: true }).sort({ completedAt: 1 })
      ]);

      const modules = await Module.find({ courseId: { $in: courses.map(function (c) { return c._id; }) } })
        .select('_id courseId');
      const moduleToCourse = new Map(modules.map(function (m) { return [m._id.toString(), m.courseId.toString()]; }));

      const lessons = await Lesson.find({
        moduleId: { $in: modules.map(function (m) { return m._id; }) },
        published: true
      }).select('_id moduleId');

      const lessonToCourse = new Map();
      lessons.forEach(function (lesson) {
        const courseId = moduleToCourse.get(lesson.moduleId.toString());
        if (courseId) lessonToCourse.set(lesson._id.toString(), courseId);
      });

      const stats = new Map(courses.map(function (c) { return [c._id.toString(), { total: 0, done: 0, lastAt: null }]; }));
      lessonToCourse.forEach(function (courseId) { stats.get(courseId).total += 1; });
      progress.forEach(function (p) {
        const courseId = lessonToCourse.get(p.lessonId.toString());
        if (!courseId) return;
        const s = stats.get(courseId);
        s.done += 1;
        if (p.completedAt && (!s.lastAt || p.completedAt > s.lastAt)) s.lastAt = p.completedAt;
      });

      const courseList = courses.map(function (c) {
        const s = stats.get(c._id.toString());
        const completed = s.total > 0 && s.done >= s.total;
        return {
          id: c._id.toString(),
          title: c.title,
          total: s.total,
          done: Math.min(s.done, s.total),
          percent: s.total > 0 ? Math.round((Math.min(s.done, s.total) / s.total) * 100) : 0,
          completed,
          completedAt: completed && s.lastAt ? s.lastAt : null,
          certificateId: completed ? certificateId(userIdText, c._id.toString()) : null
        };
      });

      const scored = progress.filter(function (p) { return p.quizScore !== null && p.quizScore !== undefined; });
      const averageQuizScore = scored.length
        ? Math.round(scored.reduce(function (t, p) { return t + p.quizScore; }, 0) / scored.length)
        : 0;

      const dayKeys = progress
        .filter(function (p) { return p.completedAt; })
        .map(function (p) { return dateKeyIn(p.completedAt, tz); });

      const today = dateKeyIn(new Date(), tz);
      const cutoff = dateKeyIn(new Date(Date.now() - 100 * 86400000), tz);

      return res.status(200).json({
        status: 'success',
        data: {
          today,
          totals: {
            lessonsCompleted: progress.length,
            averageQuizScore,
            streak: learningService.calculateStreak(progress),
            bestStreak: longestRun(dayKeys),
            coursesCompleted: courseList.filter(function (c) { return c.completed; }).length
          },
          activeDays: Array.from(new Set(dayKeys)).filter(function (k) { return k >= cutoff; }),
          quizScores: scored.slice(-20).map(function (p) { return p.quizScore; }),
          courses: courseList
        }
      });
    } catch (error) {
      console.error('Progress overview error:', error);
      return res.status(500).json({ status: 'error', code: 'PROGRESS_LOAD_FAILED', message: 'Unable to load your progress.' });
    }
  });

  return router;
};
