const express = require('express');
const mongoose = require('mongoose');

const { getAuthenticatedUser } = require('./authRoutes');
const learningService = require('../services/learningService');
const { getFunCenterActivities } = require('../scripts/learningData/funCenter');

const router = express.Router();

async function requireAuth(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required.'
      });
    }

    req.authUser = user;
    return next();
  } catch (error) {
    console.error('Learning auth check error:', error);
    return res.status(500).json({
      status: 'error',
      code: 'AUTH_CHECK_FAILED',
      message: 'Unable to verify authentication.'
    });
  }
}

function requireOwnUserId(req, res, next) {
  const userId = req.params.userId;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_USER_ID',
      message: 'Invalid user ID.'
    });
  }

  if (userId !== req.authUser._id.toString()) {
    return res.status(403).json({
      status: 'error',
      code: 'FORBIDDEN_USER_RESOURCE',
      message: 'You may only access your own learning data.'
    });
  }

  return next();
}

/* Public catalog metadata is allowed, but all user-specific learning data is protected. */
router.get('/courses', async (req, res) => {
  try {
    const language = typeof req.query.language === 'string' ? req.query.language : 'en';
    const courses = await learningService.getAllCourses(language);

    return res.status(200).json({
      status: courses.length ? 'success' : 'empty',
      message: courses.length ? undefined : 'No courses available yet.',
      data: courses
    });
  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({
      status: 'error',
      code: 'COURSES_LOAD_FAILED',
      message: 'Unable to load courses.'
    });
  }
});

router.get('/courses/:courseId/progress/:userId', requireAuth, requireOwnUserId, async (req, res) => {
  try {
    const { courseId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_COURSE_ID',
        message: 'Invalid course ID.'
      });
    }

    const progress = await learningService.getCourseProgress(courseId, userId);
    return res.status(200).json({ status: 'success', data: progress });
  } catch (error) {
    console.error('Get course progress error:', error);
    return res.status(500).json({
      status: 'error',
      code: 'COURSE_PROGRESS_LOAD_FAILED',
      message: 'Unable to load course progress.'
    });
  }
});

router.get('/courses/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_COURSE_ID',
        message: 'Invalid course ID.'
      });
    }

    const language = typeof req.query.language === 'string' ? req.query.language : 'en';
    const courseData = await learningService.getCourseDetails(courseId, language);

    return res.status(200).json({ status: 'success', data: courseData });
  } catch (error) {
    console.error('Get course details error:', error);

    if (error.message === 'Course not found') {
      return res.status(404).json({
        status: 'error',
        code: 'COURSE_NOT_FOUND',
        message: 'Course not found.'
      });
    }

    return res.status(500).json({
      status: 'error',
      code: 'COURSE_LOAD_FAILED',
      message: 'Unable to load course details.'
    });
  }
});

router.get('/lessons/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_LESSON_ID',
        message: 'Invalid lesson ID.'
      });
    }

    const language = typeof req.query.language === 'string' ? req.query.language : 'en';
    const lessonData = await learningService.getLessonWithQuiz(lessonId, language);

    return res.status(200).json({ status: 'success', data: lessonData });
  } catch (error) {
    console.error('Get lesson error:', error);

    if (error.message === 'Lesson not found') {
      return res.status(404).json({
        status: 'error',
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson not found.'
      });
    }

    return res.status(500).json({
      status: 'error',
      code: 'LESSON_LOAD_FAILED',
      message: 'Unable to load lesson.'
    });
  }
});

router.post('/quiz/submit', requireAuth, async (req, res) => {
  try {
    const { lessonId, submittedAnswers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_LESSON_ID',
        message: 'Invalid lesson ID.'
      });
    }

    if (!Array.isArray(submittedAnswers)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_QUIZ_ANSWERS',
        message: 'submittedAnswers must be an array.'
      });
    }

    const result = await learningService.submitQuizAnswers(lessonId, submittedAnswers);
    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Quiz submission error:', error);

    if (error.message === 'Lesson not found') {
      return res.status(404).json({
        status: 'error',
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson not found.'
      });
    }

    return res.status(500).json({
      status: 'error',
      code: 'QUIZ_VALIDATION_FAILED',
      message: 'Unable to validate quiz answers.'
    });
  }
});

router.post('/lessons/:lessonId/complete', requireAuth, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { submittedAnswers } = req.body;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_LESSON_ID',
        message: 'Invalid lesson ID.'
      });
    }

    if (submittedAnswers !== undefined && !Array.isArray(submittedAnswers)) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_QUIZ_ANSWERS',
        message: 'submittedAnswers must be an array.'
      });
    }

    const result = await learningService.recordLessonProgress(
      req.authUser._id.toString(),
      lessonId,
      submittedAnswers || []
    );

    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('Record lesson progress error:', error);

    if (error.message === 'Lesson not found') {
      return res.status(404).json({
        status: 'error',
        code: 'LESSON_NOT_FOUND',
        message: 'Lesson not found.'
      });
    }

    return res.status(500).json({
      status: 'error',
      code: 'LESSON_PROGRESS_SAVE_FAILED',
      message: 'Failed to record lesson progress.'
    });
  }
});

router.get('/dashboard/:userId', requireAuth, requireOwnUserId, async (req, res) => {
  try {
    const stats = await learningService.getUserDashboardStats(
      req.authUser._id.toString()
    );

    return res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({
      status: 'error',
      code: 'DASHBOARD_LOAD_FAILED',
      message: 'Unable to load dashboard stats.'
    });
  }
});

router.get('/fun-center', requireAuth, async (req, res) => {
  try {
    const activities = getFunCenterActivities();
    return res.status(200).json({ status: 'success', data: activities });
  } catch (error) {
    console.error('Fun Center loading error:', error);
    return res.status(500).json({
      status: 'error',
      code: 'FUN_CENTER_LOAD_FAILED',
      message: 'Unable to load Fun Center activities.'
    });
  }
});

module.exports = router;
