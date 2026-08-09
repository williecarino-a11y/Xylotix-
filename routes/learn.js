const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const UserProgress = require('../models/UserProgress');

// Get all courses with categories
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find({});
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single course by ID with its lessons
router.get('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get or initialize user progress for a course
router.get('/progress/:courseId', async (req, res) => {
    try {
        const userId = 'default_user';
        let progress = await UserProgress.findOne({ userId, courseId: req.params.courseId });
        
        if (!progress) {
            progress = await UserProgress.create({
                userId,
                courseId: req.params.courseId,
                completedLessons: [],
                currentLessonIndex: 0,
                progressPercentage: 0
            });
        }
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update progress when a lesson is completed
router.post('/progress/complete', async (req, res) => {
    try {
        const { courseId, lessonId } = req.body;
        const userId = 'default_user';

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ error: 'Course not found' });

        let progress = await UserProgress.findOne({ userId, courseId });
        if (!progress) {
            progress = new UserProgress({ userId, courseId, completedLessons: [] });
        }

        if (!progress.completedLessons.includes(lessonId)) {
            progress.completedLessons.push(lessonId);
        }

        // Calculate real percentage
        const totalLessons = course.lessons.length;
        progress.progressPercentage = Math.round((progress.completedLessons.length / totalLessons) * 100);
        
        // Find next lesson index
        const currentIdx = course.lessons.findIndex(l => l._id.toString() === lessonId);
        if (currentIdx !== -1 && currentIdx + 1 < totalLessons) {
            progress.currentLessonIndex = currentIdx + 1;
        }

        await progress.save();
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
