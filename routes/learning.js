const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const UserProgress = require('../models/UserProgress');
const { verifyToken } = require('../middleware/auth'); // Existing Xylotix auth

// 1. Get all courses/categories
router.get('/courses', verifyToken, async (req, res) => {
  try {
    const courses = await Course.find({});
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching courses', error: error.message });
  }
});

// 2. Get lessons for a specific course
router.get('/courses/:courseId/lessons', verifyToken, async (req, res) => {
  try {
    const lessons = await Lesson.find({ courseId: req.params.courseId }).sort({ lessonNumber: 1 });
    res.status(200).json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching lessons', error: error.message });
  }
});

// 3. Get single lesson content
router.get('/lessons/:lessonId', verifyToken, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching lesson', error: error.message });
  }
});

// 4. Submit Quiz & Complete Lesson (Persists real progress)
router.post('/lessons/:lessonId/complete', verifyToken, async (req, res) => {
  try {
    const { answerIndex } = req.body;
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

    let isCorrect = true;
    if (lesson.quiz && lesson.quiz.correctAnswerIndex !== undefined) {
      isCorrect = (lesson.quiz.correctAnswerIndex === answerIndex);
    }

    // Find or initialize user progress record
    let progress = await UserProgress.findOne({ userId: req.user.id });
    if (!progress) {
      progress = new UserProgress({ userId: req.user.id, completedLessons: [] });
    }

    // Check if lesson is already completed
    const alreadyCompleted = progress.completedLessons.includes(lesson._id);
    if (!alreadyCompleted) {
      progress.completedLessons.push(lesson._id);
      progress.learningPoints += 50; // Reward points
      if (isCorrect) progress.knowledgeScore = Math.min(100, progress.knowledgeScore + 5);
    }

    progress.lastActiveDate = Date.now();
    await progress.save();

    res.status(200).json({
      success: true,
      correct: isCorrect,
      data: progress,
      message: 'Lesson progress updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating progress', error: error.message });
  }
});

module.exports = router;
