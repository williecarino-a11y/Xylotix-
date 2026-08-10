const express = require('express');
const router = express.Router();
const learningService = require('../services/learningService');

// GET: All Courses
router.get('/courses', async (req, res) => {
  try {
    const courses = await learningService.getAllCourses();
    if (!courses.length) {
      return res.status(200).json({ status: 'empty', message: 'No courses available yet.', data: [] });
    }
    res.status(200).json({ status: 'success', data: courses });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Unable to load courses. Try again.', error: error.message });
  }
});

// GET: Single Course with Modules and Lessons Tree
router.get('/courses/:courseId', async (req, res) => {
  try {
    const courseData = await learningService.getCourseDetails(req.params.courseId);
    res.status(200).json({ status: 'success', data: courseData });
  } catch (error) {
    res.status(404).json({ status: 'error', message: 'Course not found.', error: error.message });
  }
});

// GET: Lesson Content and Quiz
router.get('/lessons/:lessonId', async (req, res) => {
  try {
    const lessonData = await learningService.getLessonWithQuiz(req.params.lessonId);
    res.status(200).json({ status: 'success', data: lessonData });
  } catch (error) {
    res.status(404).json({ status: 'error', message: 'Lesson not found.', error: error.message });
  }
});

// POST: Complete Lesson & Submit Quiz Answers (Triggers automatic updates)
router.post('/lessons/:lessonId/complete', async (req, res) => {
  try {
    const { userId, submittedAnswers } = req.body;
    if (!userId) return res.status(400).json({ status: 'error', message: 'User ID is required.' });

    const result = await learningService.recordLessonProgress(userId, req.params.lessonId, submittedAnswers);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to record lesson progress.', error: error.message });
  }
});

// GET: Derived Dashboard Statistics
router.get('/dashboard/:userId', async (req, res) => {
  try {
    const stats = await learningService.getUserDashboardStats(req.params.userId);
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Unable to load dashboard stats.', error: error.message });
  }
});

module.exports = router;
