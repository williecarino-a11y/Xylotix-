const express = require('express');
const mongoose = require('mongoose');

const { getAuthenticatedUser } = require('./authRoutes');

const router = express.Router();

const learningService =
  require('../services/learningService');

const {
  getFunCenterActivities
} = require('../scripts/learningData/funCenter');

/*
 * requireAuth
 *
 * Attaches the authenticated user to req.authUser and rejects
 * unauthenticated requests. Every route below that touches a
 * specific user's progress/dashboard uses req.authUser._id instead
 * of trusting a :userId param or body field, which previously let
 * any caller read or write any other user's learning progress.
 */
async function requireAuth(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }

    req.authUser = user;
    return next();
  } catch (error) {
    console.error('Learning auth check error:', error);

    return res.status(500).json({
      status: 'error',
      message: 'Unable to verify authentication.'
    });
  }
}

/**
 * GET /api/learn/courses
 *
 * Get all published courses.
 */
router.get('/courses', async (req, res) => {
  try {
    const language =
      typeof req.query.language === 'string'
        ? req.query.language
        : 'en';

    const courses =
      await learningService.getAllCourses(
        language
      );

    if (!courses.length) {
      return res.status(200).json({
        status: 'empty',
        message: 'No courses available yet.',
        data: []
      });
    }

    return res.status(200).json({
      status: 'success',
      data: courses
    });
  } catch (error) {
    console.error(
      'Get courses error:',
      error
    );

    return res.status(500).json({
      status: 'error',
      message: 'Unable to load courses.'
    });
  }
});


/**
 * GET /api/learn/courses/:courseId/progress/:userId
 *
 * Get a user's progress for a specific course.
 */
router.get(
  '/courses/:courseId/progress/:userId',
  requireAuth,
  async (req, res) => {
    try {
      const {
        courseId,
        userId
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          courseId
        )
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid course ID.'
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid user ID.'
        });
      }

      if (userId !== req.authUser._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'You may only view your own progress.'
        });
      }

      const progress =
        await learningService.getCourseProgress(
          courseId,
          userId
        );

      return res.status(200).json({
        status: 'success',
        data: progress
      });

    } catch (error) {
      console.error(
        'Get course progress error:',
        error
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to load course progress.'
      });
    }
  }
);



/**
 * GET /api/learn/courses/:courseId
 *
 * Get complete course tree:
 * Course -> Modules -> Lessons -> Quizzes
 */
router.get(
  '/courses/:courseId',
  async (req, res) => {
    try {
      const { courseId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          courseId
        )
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid course ID.'
        });
      }

      const language =
        typeof req.query.language === 'string'
          ? req.query.language
          : 'en';

      const courseData =
        await learningService.getCourseDetails(
          courseId,
          language
        );

      return res.status(200).json({
        status: 'success',
        data: courseData
      });
    } catch (error) {
      console.error(
        'Get course details error:',
        error
      );

      if (
        error.message ===
        'Course not found'
      ) {
        return res.status(404).json({
          status: 'error',
          message: 'Course not found.'
        });
      }

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to load course details.'
      });
    }
  }
);


/**
 * GET /api/learn/lessons/:lessonId
 *
 * Get lesson content and quizzes.
 */
router.get(
  '/lessons/:lessonId',
  async (req, res) => {
    try {
      const { lessonId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          lessonId
        )
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid lesson ID.'
        });
      }

      const language =
        typeof req.query.language === 'string'
          ? req.query.language
          : 'en';

      const lessonData =
        await learningService.getLessonWithQuiz(
          lessonId,
          language
        );

      return res.status(200).json({
        status: 'success',
        data: lessonData
      });
    } catch (error) {
      console.error(
        'Get lesson error:',
        error
      );

      if (
        error.message ===
        'Lesson not found'
      ) {
        return res.status(404).json({
          status: 'error',
          message: 'Lesson not found.'
        });
      }

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to load lesson.'
      });
    }
  }
);


/**
 * POST /api/learn/quiz/submit
 *
 * Validate quiz answers.
 *
 * Body:
 * {
 *   lessonId: "...",
 *   submittedAnswers: [0, 2, 1]
 * }
 */
router.post(
  '/quiz/submit',
  async (req, res) => {
    try {
      const {
        lessonId,
        submittedAnswers
      } = req.body;

      if (!lessonId) {
        return res.status(400).json({
          status: 'error',
          message: 'Lesson ID is required.'
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          lessonId
        )
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid lesson ID.'
        });
      }

      if (
        !Array.isArray(submittedAnswers)
      ) {
        return res.status(400).json({
          status: 'error',
          message:
            'submittedAnswers must be an array.'
        });
      }

      const result =
        await learningService.submitQuizAnswers(
          lessonId,
          submittedAnswers
        );

      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error(
        'Quiz submission error:',
        error
      );

      if (
        error.message ===
        'Lesson not found'
      ) {
        return res.status(404).json({
          status: 'error',
          message: 'Lesson not found.'
        });
      }

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to validate quiz answers.'
      });
    }
  }
);


/**
 * POST /api/learn/lessons/:lessonId/complete
 *
 * Complete a lesson and save quiz score.
 */
router.post(
  '/lessons/:lessonId/complete',
  requireAuth,
  async (req, res) => {
    try {
      const { lessonId } = req.params;

      const {
        submittedAnswers
      } = req.body;

      const userId = req.authUser._id.toString();

      if (
        !mongoose.Types.ObjectId.isValid(
          lessonId
        )
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid lesson ID.'
        });
      }

      if (
        submittedAnswers !== undefined &&
        !Array.isArray(submittedAnswers)
      ) {
        return res.status(400).json({
          status: 'error',
          message:
            'submittedAnswers must be an array.'
        });
      }

      const result =
        await learningService.recordLessonProgress(
          userId,
          lessonId,
          submittedAnswers || []
        );

      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error(
        'Record lesson progress error:',
        error
      );

      if (
        error.message ===
        'Lesson not found'
      ) {
        return res.status(404).json({
          status: 'error',
          message: 'Lesson not found.'
        });
      }

      return res.status(500).json({
        status: 'error',
        message:
          'Failed to record lesson progress.'
      });
    }
  }
);


/**
 * GET /api/learn/dashboard/:userId
 *
 * Get learning statistics.
 */
router.get(
  '/dashboard/:userId',
  requireAuth,
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid user ID.'
        });
      }

      if (userId !== req.authUser._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'You may only view your own dashboard.'
        });
      }

      const stats =
        await learningService
          .getUserDashboardStats(userId);

      return res.status(200).json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      console.error(
        'Get dashboard stats error:',
        error
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to load dashboard stats.'
      });
    }
  }
);



/**
 * GET /api/learn/fun-center
 *
 * Get genuinely implemented Fun Center activities.
 *
 * Activity content is supplied by the Fun Center data source.
 * The frontend is responsible only for rendering and state.
 */
router.get('/fun-center', async (req, res) => {
  try {
    const activities = getFunCenterActivities();

    return res.status(200).json({
      status: 'success',
      data: activities
    });
  } catch (error) {
    console.error(
      'Fun Center loading error:',
      error
    );

    return res.status(500).json({
      status: 'error',
      message: 'Unable to load Fun Center activities.'
    });
  }
});


module.exports = router;
