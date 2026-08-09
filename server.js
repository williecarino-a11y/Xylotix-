const express = require('express');
const path = require('path');
const app = express();
const mongoose = require('mongoose');

// Import Models
const Course = require('./models/Course');
const UserProgress = require('./models/UserProgress');
const communityRoutes = require('./routes/community');
const marketplaceRoutes = require('./routes/marketplace');

mongoose.connect('mongodb+srv://williecarino23_db_user:Williecarino09035884124@expense-tracker0.xoeajf4.mongodb.net/xylotix?appName=xylotix')
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/community', communityRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// API Routes - Get all courses from MongoDB
app.get('/api/learn/courses', async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

const { verifyToken } = require('./middleware/auth');
app.get('/api/learn/courses/:courseId/lessons/:lessonId', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Safely find lesson by matching string IDs or Mongoose IDs
    const lesson = course.lessons.id(req.params.lessonId) || 
                   course.lessons.find(l => l._id.toString() === req.params.lessonId);

    if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });

    res.status(200).json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error loading lesson', error: err.message });
  }
});

// API Routes - Save real lesson progress
app.post('/api/learn/progress', async (req, res) => {
    try {
        const { userId, courseId, lessonId } = req.body;
        
        let progress = await UserProgress.findOne({ userId, courseId });
        if (!progress) {
            progress = new UserProgress({ userId, courseId, completedLessons: [] });
        }

        if (!progress.completedLessons.includes(lessonId)) {
            progress.completedLessons.push(lessonId);
        }

        // Calculate progress percentage based on total course lessons
        const course = await Course.findById(courseId);
        if (course && course.lessons.length > 0) {
            progress.progressPercentage = Math.round((progress.completedLessons.length / course.lessons.length) * 100);
        }

        await progress.save();
        res.json({ success: true, message: 'Progress saved successfully', progress });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Xylotix server running on port ${PORT}`);
});
