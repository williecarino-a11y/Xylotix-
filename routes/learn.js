const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const UserProgress = require('../models/UserProgress');

// 1. Get all courses & categories
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({}, 'title category description');
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get specific course details with modules and lessons
router.get('/courses/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get user's learning progress dashboard stats
router.get('/progress/:userId', async (req, res) => {
  try {
    const progressList = await UserProgress.find({ userId: req.params.userId }).populate('courseId');
    res.json({ success: true, progressList });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Complete a lesson & update progress
router.post('/progress/complete', async (req, res) => {
  try {
    const { userId, courseId, lessonId } = req.body;
    
    let progress = await UserProgress.findOne({ userId, courseId });
    if (!progress) {
      progress = new UserProgress({ userId, courseId, completedLessons: [] });
    }

    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
    }
    progress.currentLessonId = lessonId;
    progress.lastAccessed = Date.now();

    // Calculate percentage based on total course lessons (simplified logic)
    const course = await Course.findById(courseId);
    let totalLessons = 0;
    course.modules.forEach(m => totalLessons += m.lessons.length);
    
    progress.progressPercentage = Math.round((progress.completedLessons.length / totalLessons) * 100);
    if (progress.progressPercentage >= 100) progress.isCompleted = true;

    await progress.save();
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Submit & Validate Quiz Answer
router.post('/quiz/submit', async (req, res) => {
  try {
    const { courseId, lessonId, selectedOptionIndex } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    let foundLesson = null;
    for (const mod of course.modules) {
      const lesson = mod.lessons.id(lessonId);
      if (lesson) {
        foundLesson = lesson;
        break;
      }
    }

    if (!foundLesson) return res.status(404).json({ success: false, error: 'Lesson not found' });

    const isCorrect = foundLesson.quiz.correctAnswerIndex === Number(selectedOptionIndex);
    res.json({ success: true, isCorrect });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
